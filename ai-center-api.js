/**
 * 一念知機｜AI 總控中心 v3：D1 管理員後台 + 調度/健康/統計
 * 部署位置：ezgocpu / ai-center-api
 * Cloudflare Secrets：AI_CENTER_ADMIN_KEY, GEMINI_A_API_KEY, GEMINI_B_API_KEY, GROQ_API_KEY, AI_GATEWAY_KEY, OPENAI_API_KEY
 * D1 binding：DB -> divinationhub-main
 *
 * 安全範圍：公開頁面不接受任意 AI 提示詞；八字與塔羅各自由工具 Worker 驗證額度；易經目前僅管理員測試，驗證管理員身分後透過 Service Binding 呼叫。
 * D1 只新增 ai_center_* 專屬資料表，不刪改現有八字、塔羅、會員資料表。
 */
const AI_CHANNELS = {gemini_a:'A',gemini_b:'B',qwen:'C',groq:'D',openai:'E'};
const TRACE_FORMAT = /^AI-\d{8}-\d{4}-[A-F0-9]{6}$/;
function makeTrace(){
 const now=new Date(Date.now()+8*3600000).toISOString();const salt=[...crypto.getRandomValues(new Uint8Array(3))].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
 return 'AI-'+now.slice(0,10).replace(/-/g,'')+'-'+now.slice(11,16).replace(':','')+'-'+salt;
}
const PROVIDERS = ['gemini_a','gemini_b','qwen','groq','openai'];
const PAID_MAX_BUDGET_NANO_USD=4000000000; // 單一預付 5 美元測試期，保留 1 美元安全緩衝
const PAID_RESERVATION_NANO_USD=30000000; // 每一筆付費呼叫先保留 0.03 美元額度（保守估算）
const OPENAI_MODEL='gpt-6-luna';
const OPENAI_URL='https://api.openai.com/v1/responses';
const DEFAULT_GOOGLE_MODEL='gemini-3.1-flash-lite';
const DEFAULT_GROQ_MODEL='openai/gpt-oss-120b';
const DEFAULT_QWEN_MODEL='@cf/qwen/qwen3-30b-a3b-fp8';
const QWEN_GATEWAY='https://divination-ai-test.faith05391111.workers.dev';
const GROQ_URL='https://api.groq.com/openai/v1/chat/completions';
const TEST_PROMPT='這是「一念知機」占卜網站後端 AI 通道的管理員連線測試，不是真實占卜，也沒有任何個人資料。請勿進行複雜分析、不要編造資料，也不要提供其他解釋。請只用臺灣繁體中文，簡短回答：「收到，連線成功。」以便確認模型能正常處理中文請求，並將內容回傳給測試頁面。謝謝。';
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:JSON_HEADERS});
const safe=(v,max=240)=>String(v||'').replace(/AIza[\w-]+/g,'[REDACTED]').replace(/gsk_[\w-]+/g,'[REDACTED]').replace(/sk-[A-Za-z0-9_-]{12,}/g,'[REDACTED]').replace(/[\r\n\t]+/g,' ').slice(0,max);
const int=(v,def,min,max)=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=min&&n<=max?n:def};
const dayTW=(date=new Date())=>new Date(date.getTime()+8*60*60*1000).toISOString().slice(0,10);
let initialized=null;

const defaults=()=>({
 version:3,gemini_a_percent:50,
 allocation_mode:'ratio',priority_order:['gemini_a','gemini_b','qwen','groq','openai'],
 primary_weights:{gemini_a:50,gemini_b:50,qwen:0,groq:0,openai:0},
 primary_allocation_started_at:null,
 enabled:{gemini_a:true,gemini_b:true,qwen:true,groq:true,openai:false},
 backup_order:['qwen','groq'],
 failure_threshold:3,cooldown_minutes:10,
 daily_provider_caps:{gemini_a:null,gemini_b:null,qwen:null,groq:null,openai:10},
 // 額度只是下一階段預備設定。正式會員限額仍由現行各工具 Worker 控制。
 tool_quotas:{bazi:{visitor:null,free:4,paid:null},tarot:{visitor:null,free:null,paid:null},yijing:{visitor:null,free:null,paid:null},qimen:{visitor:null,free:null,paid:null}}
});
async function initDB(env){
 if(!env.DB||typeof env.DB.prepare!=='function')throw new Error('DB_BINDING_MISSING');
 if(!initialized){initialized=(async()=>{
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS ai_center_settings (id INTEGER PRIMARY KEY CHECK(id=1), data_json TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ai_center_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, at_iso TEXT NOT NULL, day_tw TEXT NOT NULL, provider TEXT NOT NULL, mode TEXT NOT NULL, stage TEXT NOT NULL, ok INTEGER NOT NULL, duration_ms INTEGER NOT NULL, total_tokens INTEGER, error_code TEXT, error_detail TEXT);
CREATE INDEX IF NOT EXISTS idx_ai_center_attempts_day ON ai_center_attempts(day_tw, provider, mode);
CREATE INDEX IF NOT EXISTS idx_ai_center_attempts_time ON ai_center_attempts(at_iso);
CREATE TABLE IF NOT EXISTS ai_center_attempt_reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, day_tw TEXT NOT NULL, provider TEXT NOT NULL, created_at_ms INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ai_center_reservations_day ON ai_center_attempt_reservations(day_tw,provider);
CREATE TABLE IF NOT EXISTS ai_center_traces (trace_id TEXT PRIMARY KEY, at_iso TEXT NOT NULL, tool TEXT NOT NULL, owner_hash TEXT NOT NULL, status TEXT NOT NULL, channel_code TEXT, summary_code TEXT, attempts_json TEXT NOT NULL DEFAULT '[]', skipped_json TEXT NOT NULL DEFAULT '[]');
CREATE INDEX IF NOT EXISTS idx_ai_center_traces_at ON ai_center_traces(at_iso);
CREATE TABLE IF NOT EXISTS ai_center_feedback (trace_id TEXT PRIMARY KEY, at_iso TEXT NOT NULL, day_tw TEXT NOT NULL, owner_hash TEXT NOT NULL, section TEXT NOT NULL, category TEXT NOT NULL, comment TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ai_center_feedback_at ON ai_center_feedback(at_iso);
CREATE TABLE IF NOT EXISTS ai_center_health (provider TEXT PRIMARY KEY, consecutive_failures INTEGER NOT NULL DEFAULT 0, disabled_until_ms INTEGER NOT NULL DEFAULT 0, last_error_code TEXT, last_error_at TEXT, last_success_at TEXT);
CREATE TABLE IF NOT EXISTS ai_center_admin_sessions (token_digest TEXT PRIMARY KEY, expires_at_ms INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ai_center_admin_sessions_exp ON ai_center_admin_sessions(expires_at_ms);
CREATE TABLE IF NOT EXISTS ai_center_openai_cost (id INTEGER PRIMARY KEY AUTOINCREMENT, at_iso TEXT NOT NULL, day_tw TEXT NOT NULL, input_tokens INTEGER, cached_input_tokens INTEGER, output_tokens INTEGER, nano_usd INTEGER NOT NULL, estimate_only INTEGER NOT NULL DEFAULT 0, error_code TEXT);
CREATE INDEX IF NOT EXISTS idx_ai_center_openai_cost_day ON ai_center_openai_cost(day_tw);
CREATE TABLE IF NOT EXISTS ai_center_openai_cost_reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at_ms INTEGER NOT NULL, day_tw TEXT NOT NULL, nano_usd INTEGER NOT NULL);`);
 })().catch(e=>{initialized=null;throw e});}
 await initialized;
}
async function loadConfig(env){
 const row=await env.DB.prepare('SELECT data_json FROM ai_center_settings WHERE id=1').first();
 if(!row)return defaults();
 let stored={};try{stored=JSON.parse(row.data_json)}catch{}
 return normalizeConfig(stored);
}
function normalizeConfig(c){
 const d=defaults();
 const enabled={}; for(const name of PROVIDERS)enabled[name]=c?.enabled?.[name]===undefined?d.enabled[name]:c.enabled[name]===true;
 const backup=(Array.isArray(c?.backup_order)&&new Set(c.backup_order).size===2&&c.backup_order.includes('qwen')&&c.backup_order.includes('groq'))?c.backup_order:d.backup_order;
 const caps={};for(const p of PROVIDERS){const v=c?.daily_provider_caps?.[p];caps[p]=(v===undefined?d.daily_provider_caps[p]:(v===null||v===''?null:int(v,null,1,1000000)));}
 const quotas={};for(const tool of ['bazi','tarot','yijing','qimen']){
  quotas[tool]={};for(const level of ['visitor','free','paid']){
   const v=c?.tool_quotas?.[tool]?.[level];quotas[tool][level]=(v===null||v===undefined||v==='')?null:int(v,null,0,100000);
  }
 }
 // Old v1 configs are migrated in memory; existing A/B 50:50 is preserved and C/D initially remain backups.
 const oldPercent=int(c?.gemini_a_percent,50,0,100);
 const weights=c?.primary_weights;
 let primary_weights={gemini_a:oldPercent,gemini_b:100-oldPercent,qwen:0,groq:0,openai:0};
 if(weights!==undefined){
  if(!weights||typeof weights!=='object'||PROVIDERS.some(p=>!Number.isInteger(weights[p]??(p==='openai'?0:null))||(weights[p]??(p==='openai'?0:null))<0||(weights[p]??(p==='openai'?0:null))>100)||PROVIDERS.reduce((n,p)=>n+(weights[p]??(p==='openai'?0:0)),0)!==100)
   throw new Error('INVALID_PRIMARY_WEIGHTS');
  primary_weights=Object.fromEntries(PROVIDERS.map(p=>[p,weights[p]??0]));
 }
 const allocation_mode=c?.allocation_mode==='priority'?'priority':'ratio';
 const requestedOrder=c?.priority_order;
 const oldBackup=[...backup];
 const legacyOrder=['gemini_a','gemini_b',...oldBackup,'openai'];
 const priority_order=Array.isArray(requestedOrder)&&requestedOrder.length===5&&new Set(requestedOrder).size===5&&PROVIDERS.every(p=>requestedOrder.includes(p))?[...requestedOrder]:legacyOrder;
 const since=typeof c?.primary_allocation_started_at==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(c.primary_allocation_started_at)?c.primary_allocation_started_at:null;
 return {version:3,gemini_a_percent:primary_weights.gemini_a,primary_weights,allocation_mode,priority_order,primary_allocation_started_at:since,enabled,backup_order:backup,
  failure_threshold:int(c?.failure_threshold,3,1,20),cooldown_minutes:int(c?.cooldown_minutes,10,1,240),daily_provider_caps:caps,tool_quotas:quotas};
}
async function saveConfig(env,config){
 const date=new Date().toISOString();
 await env.DB.prepare(`INSERT INTO ai_center_settings(id,data_json,updated_at) VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at`).bind(JSON.stringify(config),date).run();
 return date;
}
async function sameSecret(input,secret){
 if(!input||!secret||typeof input!=='string'||typeof secret!=='string')return false;
 const e=new TextEncoder();const hashes=await Promise.all([crypto.subtle.digest('SHA-256',e.encode(input)),crypto.subtle.digest('SHA-256',e.encode(secret))]);
 const a=new Uint8Array(hashes[0]),b=new Uint8Array(hashes[1]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}

// Only the one AI Center admin page uses this independent 30-day session.
// No original admin key, plain session token, IP address or birth data is persisted in D1.
const ADMIN_SESSION_COOKIE='__Host-ai_center_session';
const ADMIN_SESSION_LIFE_MS=30*24*60*60*1000;
const ADMIN_SESSION_MAX_AGE=30*24*60*60;
function cookieToken(request){
 const part=String(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(ADMIN_SESSION_COOKIE+'='));
 const token=part?part.slice(ADMIN_SESSION_COOKIE.length+1):'';
 return /^[0-9a-f]{64}$/.test(token)?token:null;
}
function tokenHex(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');}
async function tokenDigest(env,token){
 const enc=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',enc.encode(String(env.AI_CENTER_ADMIN_KEY)) ,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('HMAC',key,enc.encode('AI-CENTER-SESSION-V1:'+token));
 return Array.from(new Uint8Array(signature),v=>v.toString(16).padStart(2,'0')).join('');
}
const activeCookie=token=>ADMIN_SESSION_COOKIE+'='+token+'; Max-Age='+ADMIN_SESSION_MAX_AGE+'; Path=/; Secure; HttpOnly; SameSite=Strict';
const expiredCookie=()=>ADMIN_SESSION_COOKIE+'=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Strict';
function jsonCookie(data,cookie,status=200){const headers=new Headers(JSON_HEADERS);headers.set('Set-Cookie',cookie);return new Response(JSON.stringify(data),{status,headers});}
async function createAdminSession(env){
 const token=tokenHex(),digest=await tokenDigest(env,token),until=Date.now()+ADMIN_SESSION_LIFE_MS;
 // Expired sessions are garbage-collected on new logins, never modifying other D1 tables.
 await env.DB.prepare('DELETE FROM ai_center_admin_sessions WHERE expires_at_ms<=?').bind(Date.now()).run();
 await env.DB.prepare('INSERT INTO ai_center_admin_sessions(token_digest,expires_at_ms) VALUES(?,?)').bind(digest,until).run();
 return {token,expiresAt:new Date(until).toISOString()};
}
async function findAdminSession(env,request){
 const token=cookieToken(request);if(!token)return null;
 const digest=await tokenDigest(env,token);
 const row=await env.DB.prepare('SELECT expires_at_ms FROM ai_center_admin_sessions WHERE token_digest=? AND expires_at_ms>?').bind(digest,Date.now()).first();
 return row?{token,digest,expiresAt:new Date(Number(row.expires_at_ms)).toISOString()}:null;
}
async function deleteAdminSession(env,request){
 const token=cookieToken(request);if(!token)return;
 await env.DB.prepare('DELETE FROM ai_center_admin_sessions WHERE token_digest=?').bind(await tokenDigest(env,token)).run();
}
function configured(env){return {gemini_a:String(env.GEMINI_A_API_KEY||'').length>20,gemini_b:String(env.GEMINI_B_API_KEY||'').length>20,qwen:String(env.AI_GATEWAY_KEY||'').length>=32,groq:String(env.GROQ_API_KEY||'').startsWith('gsk_'),openai:String(env.OPENAI_API_KEY||'').startsWith('sk-')};}
function abortIn(ms){const c=new AbortController(),timer=setTimeout(()=>c.abort(),ms);return {signal:c.signal,done:()=>clearTimeout(timer)};}
function providerFailure(provider,status,code,detail,elapsed){
 const error=safe(code,70),message=safe(detail,220);
 // 不列印 prompt、API Key 或會員資料
 console.warn('AI center provider error',JSON.stringify({provider,status,error,detail:message}));
 return {ok:false,provider,providerStatus:status,error,detail:message,durationMs:elapsed};
}
async function openaiSpend(env){
 const row=await env.DB.prepare('SELECT COALESCE(SUM(nano_usd),0) AS spent FROM ai_center_openai_cost').first();
 const reservations=await env.DB.prepare('SELECT COALESCE(SUM(nano_usd),0) AS reserved FROM ai_center_openai_cost_reservations WHERE created_at_ms>?').bind(Date.now()-120000).first();
 return {estimatedUsd:Number(row?.spent||0)/1e9,remainingBudgetUsd:Math.max(0,(PAID_MAX_BUDGET_NANO_USD-Number(row?.spent||0)-Number(reservations?.reserved||0))/1e9),budgetUsd:4,reservedUsd:Number(reservations?.reserved||0)/1e9};
}
async function reserveOpenai(env){
 await env.DB.prepare('DELETE FROM ai_center_openai_cost_reservations WHERE created_at_ms<?').bind(Date.now()-120000).run();
 const cfg=await loadConfig(env),cap=cfg.daily_provider_caps.openai;
 const today=dayTW();
 const r=await env.DB.prepare(`INSERT INTO ai_center_openai_cost_reservations(created_at_ms,day_tw,nano_usd) SELECT ?,?,? WHERE
 (SELECT COALESCE(SUM(nano_usd),0) FROM ai_center_openai_cost)+
 (SELECT COALESCE(SUM(nano_usd),0) FROM ai_center_openai_cost_reservations)+?<=?
 AND ((SELECT COUNT(*) FROM ai_center_attempts WHERE day_tw=? AND provider='openai')+
 (SELECT COUNT(*) FROM ai_center_openai_cost_reservations WHERE day_tw=?))<?
 RETURNING id`).bind(Date.now(),today,PAID_RESERVATION_NANO_USD,PAID_RESERVATION_NANO_USD,PAID_MAX_BUDGET_NANO_USD,today,today,cap===null?100000000:cap).first();
 return r?.id||null;
}
async function recordOpenaiCost(env,reservationId,usage,errorCode){
 const input=parseTokens(usage?.input_tokens),output=parseTokens(usage?.output_tokens),cached=Math.min(input??0,parseTokens(usage?.input_tokens_details?.cached_tokens)||0);
 const estimated=input===null||output===null;
 // GPT-6 Luna 標準短上下文 USD/1M tokens: input .10, cached .01, output .50.
 // 以 10^-9 USD 整數儲存。無 usage 時預留 $0.03 作保守計費推估，並明確標示非帳單。
 const nano=estimated?PAID_RESERVATION_NANO_USD:((input-cached)*100+cached*10+output*500);
 await env.DB.prepare('INSERT INTO ai_center_openai_cost(at_iso,day_tw,input_tokens,cached_input_tokens,output_tokens,nano_usd,estimate_only,error_code) VALUES(?,?,?,?,?,?,?,?)').bind(new Date().toISOString(),dayTW(),input,cached,output,nano,estimated?1:0,errorCode||null).run();
 await env.DB.prepare('DELETE FROM ai_center_openai_cost_reservations WHERE id=?').bind(reservationId).run();
}
async function callOpenai(env,prompt,tool,started){
 let reservationId;
 try{reservationId=await reserveOpenai(env)}catch(e){return providerFailure('openai',503,'OPENAI_COST_STORE_ERROR','付費預算紀錄無法使用，為避免意外支出已停止付費呼叫。',Date.now()-started)}
 if(!reservationId)return providerFailure('openai',429,'OPENAI_BUDGET_GUARD','OpenAI 安全預算或每日呼叫上限已達設定值，本次未呼叫付費 API。',Date.now()-started);
 let usage=null,err=null,result=null;
 const timer=abortIn(60000);
 try{
  const instructions=tool==='bazi'?'你是重視四柱、十神與流年交叉分析的八字老師。請用台灣繁體中文白話完整回答，不要自行重排命盤，不做確定性預言。':tool==='tarot'?'你是專業偉特塔羅解讀者。嚴格根據牌陣與正逆位，用台灣繁體中文完整解讀；不要憑空斷定當事人經歷，不做必然預言。':tool==='yijing'?'你是熟悉《易經》六十四卦與六爻動變的專業解卦老師。依據後端提供的原卦、動爻、變卦、卦辭與爻辭，以台灣繁體中文完成深入白話解讀；不重新起卦、不杜撰事實、不做必然預言。':'這是後端 API 連線測試。僅以台灣繁體中文回答「收到，連線成功。」';
  const res=await fetch(OPENAI_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+String(env.OPENAI_API_KEY).trim()},signal:timer.signal,body:JSON.stringify({model:OPENAI_MODEL,input:prompt,instructions,reasoning:{effort:'none'},max_output_tokens:tool==='bazi'||tool==='tarot'||tool==='yijing'?6000:160,store:false})});
  const d=await res.json().catch(()=>({}));usage=d?.usage;
  if(!res.ok){err=String(d?.error?.code||d?.error?.type||(res.status===429?'OPENAI_RATE_LIMIT':'OPENAI_API_ERROR'));result=providerFailure('openai',res.status,err,d?.error?.message||'OpenAI 未回傳詳細錯誤',Date.now()-started)}
  else if(d?.status==='incomplete'){err='OPENAI_OUTPUT_TRUNCATED';result=providerFailure('openai',200,err,'OpenAI 回答達輸出上限或中途未完成',Date.now()-started)}
  else{
   const answer=(d?.output||[]).filter(x=>x?.type==='message').flatMap(x=>x?.content||[]).filter(x=>x?.type==='output_text'&&typeof x?.text==='string').map(x=>x.text).join('\n').trim();
   if(!answer){err='EMPTY_AI_RESPONSE';result=providerFailure('openai',200,err,'OpenAI 未回傳可見文字',Date.now()-started)}
   else result={ok:true,provider:'openai',model:OPENAI_MODEL,answer:answer.slice(0,tool==='bazi'||tool==='tarot'||tool==='yijing'?45000:1000),durationMs:Date.now()-started,totalTokens:parseTokens(usage?.total_tokens)||(parseTokens(usage?.input_tokens)||0)+(parseTokens(usage?.output_tokens)||0)};
  }
 }catch(e){err=e?.name==='AbortError'?'OPENAI_TIMEOUT':'OPENAI_NETWORK_ERROR';result=providerFailure('openai',503,err,e?.message,Date.now()-started)}finally{timer.done();}
 try{await recordOpenaiCost(env,reservationId,usage,err)}catch(e){console.error('OpenAI cost ledger failure',safe(e?.message));return providerFailure('openai',503,'OPENAI_COST_STORE_ERROR','OpenAI 已呼叫，但無法確認預算記帳，請暫停 E 通道並檢查資料庫。',Date.now()-started)}
 return result;
}
async function callProvider(env,name,prompt,tool="test"){
 const started=Date.now();const conf=configured(env);
 if(!conf[name])return providerFailure(name,503,'PROVIDER_NOT_CONFIGURED','Cloudflare Secret 未設定',0);
 if(name==='openai')return callOpenai(env,prompt,tool,started);
 if(name==='gemini_a'||name==='gemini_b'){
  const key=String(name==='gemini_a'?env.GEMINI_A_API_KEY:env.GEMINI_B_API_KEY).trim();
  const timer=abortIn(40000);
  try{
   const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GOOGLE_MODEL}:generateContent`,{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:timer.signal,
    body:JSON.stringify({systemInstruction:{parts:[{text:tool==='bazi'?'你是熟悉傳統八字命理、重視命盤交叉分析的專業老師。使用自然流暢的臺灣繁體中文與白話，依據已提供的四柱、十神、五行、大運與流年解讀，不自行重新排盤、不捏造經歷；分清事實、推測和需驗證的假設，結論放在最後。':tool==='tarot'?'你是熟悉偉特塔羅、重視牌位與正逆位的專業解讀者。嚴格依照使用者提示詞和實際六張或三張牌解讀，使用自然台灣繁體中文，白話流暢、不捏造現實人物經歷、不做必然預言，完整結論放在最後。':tool==='yijing'?'你是精通《易經》六十四卦、動爻、變卦及卦爻辭的專業解卦老師。請根據已提供的卦象和當事人問題完整解讀，使用台灣繁體中文、白話有層次，避免無根據的推斷，不要自行重新起卦，結論放在最後。':'你是一位友善的臺灣繁體中文助理。這是 API 連線測試，只需要簡短回答。'}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:tool==='bazi'?0.7:tool==='tarot'?0.65:tool==='yijing'?0.65:0.2,maxOutputTokens:tool==='bazi'||tool==='tarot'||tool==='yijing'?6000:180}})
   });
   const d=await res.json().catch(()=>({}));
   if(!res.ok)return providerFailure(name,res.status,d?.error?.status||'GEMINI_HTTP_ERROR',d?.error?.message,(Date.now()-started));
   const answer=(d?.candidates?.[0]?.content?.parts||[]).filter(p=>typeof p?.text==='string'&&!p.thought).map(p=>p.text).join('\n').trim();
   if(!answer)return providerFailure(name,200,'EMPTY_AI_RESPONSE','Google 未回傳可見文字',Date.now()-started);
   return {ok:true,provider:name,model:DEFAULT_GOOGLE_MODEL,answer:answer.slice(0,tool==='bazi'||tool==='tarot'||tool==='yijing'?45000:1000),durationMs:Date.now()-started,totalTokens:parseTokens(d?.usageMetadata?.totalTokenCount)};
  }catch(e){return providerFailure(name,503,e?.name==='AbortError'?'GEMINI_TIMEOUT':'GEMINI_NETWORK_ERROR',e?.message,Date.now()-started)}finally{timer.done()}
 }
 if(name==='qwen'){
  const timer=abortIn(85000);
  try{
   const res=await fetch(QWEN_GATEWAY+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json','X-AI-Gateway-Key':String(env.AI_GATEWAY_KEY)},body:JSON.stringify({prompt,tool}),signal:timer.signal});
   const d=await res.json().catch(()=>({}));
   if(!res.ok||!d?.ok)return providerFailure(name,res.status,d?.error||'QWEN_GATEWAY_ERROR',d?.error||'Qwen 未提供詳細錯誤',Date.now()-started);
   const answer=String(d?.answer||'').trim();if(!answer)return providerFailure(name,200,'EMPTY_AI_RESPONSE','Qwen 未回傳可見文字',Date.now()-started);
   return {ok:true,provider:name,model:String(d?.model||DEFAULT_QWEN_MODEL),answer:answer.slice(0,tool==='bazi'||tool==='tarot'||tool==='yijing'?45000:1000),durationMs:Date.now()-started,totalTokens:parseTokens(d?.usage?.total_tokens)};
  }catch(e){return providerFailure(name,503,e?.name==='AbortError'?'QWEN_TIMEOUT':'QWEN_GATEWAY_NETWORK_ERROR',e?.message,Date.now()-started)}finally{timer.done()}
 }
 const timer=abortIn(55000);
 try{
  const res=await fetch(GROQ_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+String(env.GROQ_API_KEY).trim()},signal:timer.signal,
   body:JSON.stringify({model:DEFAULT_GROQ_MODEL,messages:[{role:'user',content:prompt}],temperature:1,reasoning_effort:'low',max_completion_tokens:tool==='bazi'||tool==='tarot'||tool==='yijing'?6000:500,stream:false})});
  const d=await res.json().catch(()=>({}));
  if(!res.ok)return providerFailure(name,res.status,res.status===429?'GROQ_RATE_LIMIT':'GROQ_PROVIDER_ERROR',d?.error?.message||'Groq 未提供詳細錯誤',Date.now()-started);
  if(d?.choices?.[0]?.finish_reason==='length')return providerFailure(name,200,'GROQ_OUTPUT_TRUNCATED','模型輸出達到 token 上限',Date.now()-started);
  const answer=String(d?.choices?.[0]?.message?.content||'').trim();
  if(!answer)return providerFailure(name,200,'EMPTY_AI_RESPONSE','Groq 未回傳可見文字',Date.now()-started);
  return {ok:true,provider:name,model:DEFAULT_GROQ_MODEL,answer:answer.slice(0,tool==='bazi'||tool==='tarot'||tool==='yijing'?45000:1000),durationMs:Date.now()-started,totalTokens:parseTokens(d?.usage?.total_tokens)};
 }catch(e){return providerFailure(name,503,e?.name==='AbortError'?'GROQ_TIMEOUT':'GROQ_NETWORK_ERROR',e?.message,Date.now()-started)}finally{timer.done()}
}
function parseTokens(v){const n=Number(v);return Number.isFinite(n)&&Number.isInteger(n)&&n>=0?n:null;}
async function track(env,result,mode,stage){
 const at=new Date();
 await env.DB.prepare(`INSERT INTO ai_center_attempts(at_iso,day_tw,provider,mode,stage,ok,duration_ms,total_tokens,error_code,error_detail) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(
  at.toISOString(),dayTW(at),result.provider,mode,stage,result.ok?1:0,Math.max(0,Number(result.durationMs)||0),result.totalTokens??null,result.ok?null:safe(result.error,70),result.ok?null:safe(result.detail,160)).run();
 // Health data writes; failures cool down on threshold, successful requests immediately restore state.
 if(result.ok){
  await env.DB.prepare(`INSERT INTO ai_center_health(provider,consecutive_failures,disabled_until_ms,last_success_at) VALUES(?,0,0,?) ON CONFLICT(provider) DO UPDATE SET consecutive_failures=0,disabled_until_ms=0,last_success_at=excluded.last_success_at`).bind(result.provider,at.toISOString()).run();
 }else{
  const cfg=await loadConfig(env);
  const health=await env.DB.prepare('SELECT consecutive_failures FROM ai_center_health WHERE provider=?').bind(result.provider).first();
  const streak=(Number(health?.consecutive_failures)||0)+1;
  const cooldown=streak>=cfg.failure_threshold?Date.now()+cfg.cooldown_minutes*60*1000:0;
  await env.DB.prepare(`INSERT INTO ai_center_health(provider,consecutive_failures,disabled_until_ms,last_error_code,last_error_at) VALUES(?,?,?,?,?) ON CONFLICT(provider) DO UPDATE SET consecutive_failures=excluded.consecutive_failures,disabled_until_ms=excluded.disabled_until_ms,last_error_code=excluded.last_error_code,last_error_at=excluded.last_error_at`).bind(result.provider,streak,cooldown,safe(result.error,70),at.toISOString()).run();
 }
}
async function getHealth(env){
 const r=await env.DB.prepare('SELECT * FROM ai_center_health').all();const by={};for(const p of PROVIDERS)by[p]={consecutive_failures:0,disabled_until_ms:0,last_error_code:null,last_error_at:null,last_success_at:null};
 for(const row of r.results||[])if(by[row.provider])by[row.provider]={...by[row.provider],...row};
 return by;
}
async function dailyUsage(env,cfg=null){
 // Caps count the entire Taiwan day; proportional primary selection starts fresh after
 // an admin changes the four-way weights, avoiding catch-up based on old allocations.
 const since=cfg?.primary_allocation_started_at||'1970-01-01T00:00:00.000Z';
 const r=await env.DB.prepare(`SELECT provider,COUNT(*) AS calls, SUM(CASE WHEN mode IN ('auto_test','bazi','tarot','yijing') AND stage='primary' AND at_iso>=? THEN 1 ELSE 0 END) AS primary_calls FROM ai_center_attempts WHERE day_tw=? GROUP BY provider`).bind(since,dayTW()).all();
 const map={};for(const p of PROVIDERS)map[p]={calls:0,primary_calls:0};for(const row of r.results||[])if(map[row.provider])map[row.provider]={calls:Number(row.calls)||0,primary_calls:Number(row.primary_calls)||0};return map;
}
function healthAllowed(cfg,health,p,usage){
 if(!cfg.enabled[p])return false;
 if((Number(health[p]?.disabled_until_ms)||0)>Date.now())return false;
 if(cfg.daily_provider_caps[p]!==null&&(usage[p]?.calls||0)>=cfg.daily_provider_caps[p])return false;
 return true;
}
function choosePrimary(cfg,health,usage){
 const eligible=PROVIDERS.filter(p=>healthAllowed(cfg,health,p,usage));
 if(!eligible.length)return [];
 if(cfg.allocation_mode==='priority')return cfg.priority_order.filter(p=>eligible.includes(p));
 const weights=cfg.primary_weights || {gemini_a:cfg.gemini_a_percent,gemini_b:100-cfg.gemini_a_percent,qwen:0,groq:0,openai:0};
 const weighted=eligible.filter(p=>weights[p]>0);
 const legacyFallback=cfg.priority_order||['gemini_a','gemini_b',...cfg.backup_order,'openai'];
 if(!weighted.length)return legacyFallback.filter(p=>eligible.includes(p));
 // Proportional deficit over the day's first-attempt records, across all four channels.
 // If a provider is disabled/cooling/capped, re-normalize using currently eligible weights.
 const weightTotal=weighted.reduce((n,p)=>n+weights[p],0);
 const callTotal=weighted.reduce((n,p)=>n+(usage[p]?.primary_calls||0),0);
 const initial=weighted.map(p=>({p,score:weights[p]*(callTotal+1)/weightTotal-(usage[p]?.primary_calls||0)}));
 initial.sort((a,b)=>b.score-a.score || legacyFallback.indexOf(a.p)-legacyFallback.indexOf(b.p));
 const first=initial[0].p;
 // Remaining positive-ratio models are preferred over 0% pure-fallback channels.
 // All enabled channels can still take over after a failure, including those set to 0%.
 // The remaining channels follow the admin-defined priority order, including 0% fallbacks.
 const rest=legacyFallback.filter(p=>eligible.includes(p)&&p!==first);
 return [first,...rest];
}
async function autoTest(env,cfg){
 const start=Date.now();const usage=await dailyUsage(env,cfg),health=await getHealth(env);
 const primary=choosePrimary(cfg,health,usage);
 const ordered=[...primary,...cfg.priority_order].filter((p,i,all)=>all.indexOf(p)===i && healthAllowed(cfg,health,p,usage));
 const tried=[];
 if(!ordered.length)return {ok:false,error:'NO_AVAILABLE_PROVIDER',detail:'所有 AI 都被停用、處於冷卻期或達到自行設定的使用上限。',attempts:[]};
 for(const [index,p] of ordered.entries()){
  // Upper bound on admin auto test's cumulative waiting time.
  if(index>0&&Date.now()-start>115000)break;
  const result=await callProvider(env,p,TEST_PROMPT);
  try{await track(env,result,'auto_test',index===0?'primary':'fallback')}catch(err){console.error('AI Center metrics write failed',safe(err?.message));return {ok:false,error:'D1_TRACKING_FAILED',detail:'呼叫結果無法可靠寫入資料庫，請檢查 D1 綁定及紀錄。',attempts:tried};}
  tried.push({provider:p,ok:result.ok,error:result.error||null,durationMs:result.durationMs});
  if(result.ok)return {ok:true,model:result.model,provider:p,answer:result.answer,seconds:Math.round(result.durationMs/100)/10,totalTokens:result.totalTokens,attempts:tried};
 }
 return {ok:false,error:'ALL_PROVIDER_ATTEMPTS_FAILED',detail:'可嘗試的 AI 均無法完成本次連線測試，或測試等待時間已達安全上限。',attempts:tried};
}

// A trace contains only request metadata, provider errors and a one-way owner hash.
// Never store the full birth chart, prompt or AI interpretation.
function skippedReason(cfg,health,usage,p){
 if(!cfg.enabled[p])return 'ADMIN_DISABLED';
 if(Number(health[p]?.disabled_until_ms||0)>Date.now())return 'COOLDOWN';
 if(cfg.daily_provider_caps[p]!==null && (usage[p]?.calls||0)>=cfg.daily_provider_caps[p])return 'DAILY_CAP';
 return null;
}
async function saveTrace(env,trace,ownerHash,status,channel,summary,attempts,skipped,tool='bazi'){
 await env.DB.prepare(`INSERT INTO ai_center_traces(trace_id,at_iso,tool,owner_hash,status,channel_code,summary_code,attempts_json,skipped_json)
 VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(trace_id) DO UPDATE SET status=excluded.status,channel_code=excluded.channel_code,summary_code=excluded.summary_code,attempts_json=excluded.attempts_json,skipped_json=excluded.skipped_json`)
 .bind(trace,new Date().toISOString(),tool,ownerHash,status,channel||null,summary||null,JSON.stringify(attempts),JSON.stringify(skipped)).run();
}
// Called only through an authenticated Service Binding from bazi-api.
async function baziInternalInterpret(env,prompt,traceId,ownerHash,tool="bazi"){
 const cfg=await loadConfig(env);
 const usage=await dailyUsage(env,cfg),health=await getHealth(env);
 const primary=choosePrimary(cfg,health,usage);
 const ordered=[...primary,...cfg.backup_order].filter((p,i,a)=>a.indexOf(p)===i && healthAllowed(cfg,health,p,usage));
 const skipped=PROVIDERS.map(p=>({channel:AI_CHANNELS[p],provider:p,reason:skippedReason(cfg,health,usage,p)})).filter(x=>x.reason);
 const attempts=[],started=Date.now();
 // The trace must exist before calling an AI so it can be looked up even if every channel fails.
 await saveTrace(env,traceId,ownerHash,'processing',null,null,attempts,skipped,tool);
 if(!ordered.length){await saveTrace(env,traceId,ownerHash,'failed',null,'NO_AVAILABLE_PROVIDER',attempts,skipped,tool);return {ok:false,error:'NO_AVAILABLE_PROVIDER',traceId};}
 for(const [index,p] of ordered.entries()){
  if(index>0&&Date.now()-started>115000){skipped.push({channel:AI_CHANNELS[p],provider:p,reason:'TIME_BUDGET'});break;}
  const cap=cfg.daily_provider_caps[p];
  await env.DB.prepare('DELETE FROM ai_center_attempt_reservations WHERE created_at_ms<?').bind(Date.now()-180000).run();
  const row=await env.DB.prepare(`INSERT INTO ai_center_attempt_reservations(day_tw,provider,created_at_ms)
   SELECT ?,?,? WHERE ((SELECT COUNT(*) FROM ai_center_attempts WHERE day_tw=? AND provider=?)
   +(SELECT COUNT(*) FROM ai_center_attempt_reservations WHERE day_tw=? AND provider=?))<? RETURNING id`)
   .bind(dayTW(),p,Date.now(),dayTW(),p,dayTW(),p,cap===null?100000000:cap).first();
  if(!row){skipped.push({channel:AI_CHANNELS[p],provider:p,reason:'RESERVATION_CAP'});continue;}
  let result;
  try{
   result=await callProvider(env,p,prompt,tool);
   if(result.ok && String(result.answer||'').trim().length<20)result={...result,ok:false,error:'READING_TOO_SHORT',detail:'AI 回答不足以形成完整解讀'};
   await track(env,result,tool,index===0?'primary':'fallback');
   attempts.push({channel:AI_CHANNELS[p],provider:p,ok:!!result.ok,error:result.error||null,detail:result.ok?null:safe(result.detail,140),durationMs:result.durationMs});
   // Persist each attempt before trying the next provider.
   await saveTrace(env,traceId,ownerHash,result.ok?'success':'processing',result.ok?AI_CHANNELS[p]:null,result.ok?null:result.error,attempts,skipped,tool);
  }catch(e){
   console.error('AI center bazi metering/trace failed',safe(e?.message));
   try{await saveTrace(env,traceId,ownerHash,'failed',null,'CENTER_METERING_UNAVAILABLE',attempts,skipped,tool)}catch(_){}
   return {ok:false,error:'CENTER_METERING_UNAVAILABLE',traceId};
  }finally{await env.DB.prepare('DELETE FROM ai_center_attempt_reservations WHERE id=?').bind(row.id).run();}
  if(result.ok&&result.answer?.length>=20)return {ok:true,reading:result.answer,channel:AI_CHANNELS[p],traceId};
 }
 await saveTrace(env,traceId,ownerHash,'failed',null,'ALL_PROVIDER_ATTEMPTS_FAILED',attempts,skipped,tool);
 return {ok:false,error:'ALL_PROVIDER_ATTEMPTS_FAILED',traceId};
}
async function saveFeedback(env,body){
 const traceId=String(body?.traceId||''),ownerHash=String(body?.ownerHash||'');
 if(!TRACE_FORMAT.test(traceId)|| !/^[a-f0-9]{64}$/.test(ownerHash))return {ok:false,error:'INVALID_TRACE'};
 const section=String(body.section||'').slice(0,48),category=String(body.category||'').slice(0,30),comment=String(body.comment||'').trim();
 if(!/^[a-zA-Z0-9_-]{1,48}$/.test(section)||!['chart','logic','language','other','service'].includes(category)||comment.length<5||comment.length>400)return {ok:false,error:'INVALID_FEEDBACK'};
 const row=await env.DB.prepare('SELECT status,owner_hash FROM ai_center_traces WHERE trace_id=?').bind(traceId).first();
 if(!row||row.owner_hash!==ownerHash||!['success','failed'].includes(row.status))return {ok:false,error:'TRACE_NOT_OWNED'};
 // 站內 AI 異常只接受失敗請求；舊版成功解讀的品質回報仍可查詢。
 if(row.status==='failed'&&category!=='service')return {ok:false,error:'INVALID_FEEDBACK'};
 if(row.status==='success'&&category==='service')return {ok:false,error:'INVALID_FEEDBACK'};
 const today=dayTW();
 const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM ai_center_feedback WHERE day_tw=? AND owner_hash=?').bind(today,ownerHash).first();
 if(Number(count?.n||0)>=5)return {ok:false,error:'FEEDBACK_DAILY_LIMIT'};
 const saved=await env.DB.prepare('INSERT INTO ai_center_feedback(trace_id,at_iso,day_tw,owner_hash,section,category,comment) VALUES(?,?,?,?,?,?,?) ON CONFLICT(trace_id) DO NOTHING')
 .bind(traceId,new Date().toISOString(),today,ownerHash,section,category,comment).run();
 if(!saved?.meta?.changes)return {ok:false,error:'ALREADY_REPORTED'};
 return {ok:true,traceId};
}
async function findTrace(env,id){
 if(!TRACE_FORMAT.test(id))return null;
 const row=await env.DB.prepare('SELECT trace_id,at_iso,tool,status,channel_code,summary_code,attempts_json,skipped_json FROM ai_center_traces WHERE trace_id=?').bind(id).first();
 if(!row)return null;
 const fb=await env.DB.prepare('SELECT at_iso,section,category,comment FROM ai_center_feedback WHERE trace_id=?').bind(id).first();
 return {...row,attempts:JSON.parse(row.attempts_json||'[]'),skipped:JSON.parse(row.skipped_json||'[]'),feedback:fb||null,attempts_json:undefined,skipped_json:undefined};
}

async function stats(env,days){
 const n=days===7?7:days===30?30:1;const start=new Date(Date.now()-(n-1)*86400000);
 const date=dayTW(start);
 const rows=(await env.DB.prepare(`SELECT provider,COUNT(*) AS calls,SUM(ok) AS successes,SUM(CASE WHEN ok=0 THEN 1 ELSE 0 END) AS failures, SUM(CASE WHEN mode IN ('auto_test','bazi','tarot','yijing') AND stage='primary' THEN 1 ELSE 0 END) AS primary_calls, SUM(COALESCE(total_tokens,0)) AS reported_tokens,SUM(CASE WHEN total_tokens IS NULL THEN 1 ELSE 0 END) AS calls_without_tokens,ROUND(AVG(duration_ms)) AS avg_ms FROM ai_center_attempts WHERE day_tw>=? GROUP BY provider`).bind(date).all()).results||[];
 const recent=(await env.DB.prepare(`SELECT at_iso,provider,mode,error_code,error_detail FROM ai_center_attempts WHERE day_tw>=? AND ok=0 ORDER BY id DESC LIMIT 25`).bind(date).all()).results||[];
 const by={};for(const p of PROVIDERS)by[p]={provider:p,calls:0,successes:0,failures:0,primary_calls:0,reported_tokens:0,calls_without_tokens:0,avg_ms:null};
 for(const row of rows)if(by[row.provider])by[row.provider]={...by[row.provider],...row};
 const health=await getHealth(env);
 const feedback=(await env.DB.prepare('SELECT trace_id,at_iso,section,category,comment FROM ai_center_feedback WHERE day_tw>=? ORDER BY at_iso DESC LIMIT 30').bind(date).all()).results||[];
 return {days:n,fromDate:date,toDate:dayTW(),stats:by,errors:recent,feedback,health,openaiCost:await openaiSpend(env),caption:'僅計入本總控記錄的管理員測試、八字與塔羅整合呼叫；其他直接呼叫供應商不會出現在此。'};
}
function htmlPage(){
 return new Response(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <meta name="robots" content="noindex,nofollow"><title>一念知機｜AI 總控中心</title><style>
 *{box-sizing:border-box}body{margin:0;background:#f6f7fb;color:#253045;font:15px/1.65 system-ui,"Microsoft JhengHei",sans-serif;padding:22px 12px}
 main{max-width:1040px;background:#fff;border:1px solid #e3e5ed;border-radius:16px;margin:0 auto;padding:25px;box-shadow:0 12px 36px #182f4b0b}
 h1{font-size:25px;margin:0 0 5px;color:#172846}h2{font-size:19px;margin:25px 0 13px}h3{font-size:15px;margin:15px 0 7px}p{margin:10px 0}.muted,small{color:#66768f}.muted{font-size:13px}.info{background:#edf4f3;border-radius:9px;padding:12px 15px;margin:14px 0;color:#365c68}.warn{background:#fff7e9;border:1px solid #f3d7aa;border-radius:9px;padding:12px 15px;margin:10px 0;color:#735023}.box{border:1px solid #e0e4ed;border-radius:11px;padding:16px;margin:15px 0}label{font-weight:600;display:block;margin-bottom:5px}input,select{font:inherit;border:1px solid #c8d0de;border-radius:7px;padding:9px 11px;color:#26344c;background:#fff;max-width:100%}input[type=password]{width:100%}input[type=number]{width:105px}input[type=checkbox]{width:18px;height:18px;accent-color:#514191}input[type=range]{width:100%;accent-color:#514191;cursor:pointer}
 button{font:inherit;background:#514191;color:#fff;border:0;border-radius:8px;padding:10px 18px;cursor:pointer}button.secondary{background:#edf0f8;color:#3b3c67;border:1px solid #d7dced}button:disabled{opacity:.5;cursor:wait}.row{display:flex;align-items:center;justify-content:space-between;gap:15px}.flex{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.tabs{display:flex;gap:9px;flex-wrap:wrap;margin:15px 0}.tabs button{background:#e9eaf3;color:#49466f}.tabs button.active{background:#514191;color:#fff}.light{background:#f3f5fa;padding:12px;border-radius:8px}.panel{display:none}.panel.active{display:block}.ratio{display:flex;height:13px;border-radius:100px;background:#eee;overflow:hidden}.ratio>span{background:#6250a5;display:block}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px 7px;text-align:left;border-bottom:1px solid #edf0f5}th{color:#62708a;font-weight:600}td.num,th.num{text-align:right}code,pre{font:13px/1.7 ui-monospace,Consolas,monospace}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f3fa;border-radius:8px;padding:12px;max-height:320px;overflow:auto}.pill{font-size:12px;border-radius:30px;padding:3px 9px;background:#eef0f5;color:#61718a}.green{color:#227449}.red{color:#b34243}.hide{display:none!important}.status{min-height:26px;font-size:14px;color:#584b88}.settings-list{display:grid;grid-template-columns:1fr 1fr;gap:12px}.quota{overflow-x:auto}.quota input{width:85px}.quota td:first-child{min-width:90px}.hint{font-size:12px;color:#6d7789}.titlebar{margin:0 0 12px}.mode{color:#4d5670;font-size:13px}.alert{font-weight:600;color:#9c4545}.weights-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.weight-card{background:#f3f5fa;border-radius:9px;padding:12px 14px}.weight-card label{display:flex;justify-content:space-between;gap:8px;align-items:center}.weight-card input{display:block;padding:0;width:100%}.failure-fold{margin:15px 0}.failure-fold>summary{display:flex;justify-content:space-between;align-items:center;gap:14px;cursor:pointer;font-size:15px;font-weight:700;list-style:none}.failure-fold>summary::-webkit-details-marker{display:none}.failure-fold>summary::before{content:"▸";color:#514191;font-size:18px;line-height:1}.failure-fold[open]>summary::before{content:"▾"}.failure-fold>summary>span:first-child{flex:1}.failure-fold>summary:focus-visible{outline:2px solid #514191;outline-offset:4px;border-radius:3px}.fold-action{font-size:13px;font-weight:400;color:#514191}.failure-table{margin-top:13px;border-top:1px solid #edf0f5;padding-top:8px}
 @media(max-width:680px){main{padding:17px}body{padding:10px 5px}.grid,.settings-list,.weights-grid{grid-template-columns:1fr}h1{font-size:21px}.row{align-items:flex-start}td,th{padding:7px 4px}}
 </style></head><body><main>
 <h1>一念知機｜AI 總控中心</h1>
 <p class="muted">正式管理位置：ezgocpu / ai-center-api</p>
 <p class="info"><b>第三階段｜可儲存調度設定與查閱統計</b><br>Gemini A、B、Qwen、Groq 與 GPT-6 Luna 五套 AI 支援比例分配或指定優先順序；OpenAI 預設停用正式調度，須管理員主動開啟。八字可經由 bazi-api 的私有服務綁結使用總控；塔羅透過 tarot-api 私有服務綁定使用總控。</p>
 <div class="box hide" id="login-box"><label for="password">管理者密碼（AI_CENTER_ADMIN_KEY）</label><div class="flex"><input style="flex:1;min-width:200px" id="password" type="password" autocomplete="off" placeholder="輸入管理密碼"><button id="login">登入管理</button></div><small id="login-hint">正在確認 30 天登入狀態…</small></div>
 <div id="session-bar" class="box light hide"><div class="flex" style="justify-content:space-between"><span id="session-status">✅ 管理員已登入｜最多保持 30 天</span><button class="secondary" id="logout">登出</button></div></div>
 <div id="secure" class="hide">
 <div class="tabs"><button class="active" data-tab="config">調度設定</button><button data-tab="stats">成功／失敗統計</button><button data-tab="test">連線測試</button><button data-tab="quotas">工具額度草案</button></div>
 <section class="panel active" id="config">
  <h2>五套 AI 調度方式</h2><div class="box">
  <label><input type="radio" name="allocation-mode" value="ratio" checked> 比例分配模式：依 A～E 比例選擇首選，失敗時依優先順序備援</label>
  <label><input type="radio" name="allocation-mode" value="priority"> 優先順序模式：固定從你排第一的通道開始，失敗才嘗試下一個</label>
  <p class="hint">五套 AI 的每日上限、冷卻及停用開關，兩種模式都會遵守。付費通道 E 預設停用正式調度。</p></div>
  <h2>五套 AI 首選分配比例</h2><div class="box">
  <p class="muted">A、B、C、D、E 都能參與自動調度；移動任一滑桿，其餘比例會自動重新分配，合計固定 100%。</p>
  <div id="four-weights" class="weights-grid"></div>
  <div class="flex" style="margin:14px 0"><b>合計：<span id="weights-total">100</span>%</b><span class="hint">0%＝不主動分配，但該通道啟用時仍可在其他 AI 失敗後備援</span></div>
  <div class="flex"><button class="secondary" data-preset="50,50,0,0,0">舊設定 50／50／0／0／0</button><button class="secondary" data-preset="30,30,25,15,0">四套混合 E 0%</button><button class="secondary" data-preset="20,20,20,20,20">五套各 20%</button><button class="secondary" data-preset="0,0,0,0,100">GPT E 100%（須啟用 E）</button></div>
  <p class="hint">依目前可用通道、已記錄的首選呼叫次數自動分配；故障、冷卻或達上限會暫時偏離比例。修改後要按下方「儲存調度設定」才生效。</p></div>
  <h2>五套 AI 優先順序（可上移、下移）</h2><div class="box">
  <p class="hint">優先順序模式會依照下方 1～5 名依序呼叫；比例模式仍按比例選首選，之後參考此順序進行備援。管理員單獨測試不用更改順序。</p>
  <div id="priority-list"></div>
  </div>
  <h2>啟用與每日安全上限</h2><div class="box"><div class="settings-list" id="provider-settings"></div>
   <p class="hint">每日上限是本總控記錄的呼叫次數上限，不等於服務商帳戶剩餘額度。E 通道預設不參與正式調度；手動測試 E 仍會消耗付費 API。</p></div>
  <h2>OpenAI E 通道預付額度保護</h2><div class="box">
  <p><b>GPT-6 Luna（E）</b>：預設不參與正式調度，也不自動備援；若要讓八字、塔羅正式使用 E，須勾選上方的 E 通道啟用，再選擇比例或優先順序。</p>
  <p id="openai-budget-status">載入 GPT-6 Luna 預算統計中…</p>
  <p class="hint">保守安全門檻：以這個總控記錄的 E 通道估算費用累計達 US$4 時阻止後續付費呼叫；不會每月自動重置。每次呼叫前預留 US$0.03。統計是估算，不能保證精確限制實際支出，真正結餘以 OpenAI 帳單為準。您已關閉自動加值；仍應保留 OpenAI 後台消費上限。</p>
  </div>
  <h2>故障處理</h2><div class="box flex"><label>連續失敗 <input id="threshold" type="number" min="1" max="20" value="3"> 次暫停</label><label>冷卻 <input id="cooldown" type="number" min="1" max="240" value="10"> 分鐘</label><p class="hint">冷卻結束後讓通道恢復嘗試；不對相同 Gemini 錯誤無限制重試。</p></div>
  <button id="save-config">儲存調度設定</button><span class="status" id="config-msg" aria-live="polite"></span>
 </section>
 <section class="panel" id="stats"><h2>每日 AI 使用量與故障紀錄</h2>
 <div class="flex"><button class="secondary" data-days="1">今天</button><button class="secondary" data-days="7">近 7 天</button><button class="secondary" data-days="30">近 30 天</button><button class="secondary" id="refresh-stats">重新整理</button></div>
 <div class="box light" id="distribution-note">統計資料載入後，這裡會顯示五套 AI 實際首選分配比例。</div>
 <div class="box quota"><table><thead><tr><th>AI 通道</th><th class="num">呼叫</th><th class="num">成功</th><th class="num">失敗</th><th class="num">成功率</th><th class="num">Tokens*</th><th class="num">平均 Tokens／次*</th><th class="num">平均秒數</th></tr></thead><tbody id="stats-body"></tbody></table><p class="hint">*僅統計供應商實際有回報的 Tokens，其他記為未知。平均 Tokens／次＝已回報 Tokens 總數 ÷ 該期間所有呼叫次數（包含未回報 Tokens 的失敗呼叫），不是每次完整占卜的精確耗用量。故障時的備援呼叫也各計一次，八字會員扣次仍由 bazi-api 負責。</p></div>
 <p class="hint">錯誤欄位優先顯示繁體中文解釋，並保留英文代碼及原始訊息，以便追查原因；未收錄的新錯誤會標示並保留原文。</p><h3>通道健康狀態</h3><div id="health-cards" class="grid"></div>
 <details id="recent-errors" class="box failure-fold"><summary><span>最近失敗紀錄 <span class="muted" id="error-count">（載入中）</span></span><span class="fold-action">展開查看／收合</span></summary><div class="quota failure-table"><table><thead><tr><th>時間（台灣）</th><th>AI</th><th>錯誤</th></tr></thead><tbody id="errors-body"></tbody></table></div></details>
 <h3>追蹤碼查詢</h3><div class="box"><p class="hint">輸入會員提供的故障追蹤碼，查詢實際呼叫的通道、跳過原因及會員回報（不儲存命盤或 AI 回答）。</p><div class="flex"><input id="trace-input" type="text" maxlength="32" placeholder="AI-20261014-1400-A1B2C3" style="width:290px"><button id="trace-search">查詢</button></div><pre id="trace-result" aria-live="polite">尚未查詢。</pre></div>
 <h3>最近會員回報（AI 異常與歷史回報）</h3><div class="box quota"><table><thead><tr><th>時間</th><th>追蹤碼</th><th>分區／類型</th><th>會員說明</th></tr></thead><tbody id="feedback-body"></tbody></table></div>
 <p class="hint" id="stats-note"></p>
 </section>
 <section class="panel" id="test"><h2>手動測試五套 AI</h2><div class="grid">
  <button data-provider="gemini_a">測試 Gemini A（原八字）</button><button data-provider="gemini_b">測試 Gemini B（原塔羅）</button>
  <button data-provider="qwen">測試 Qwen3-30B</button><button data-provider="groq">測試 Groq GPT-OSS 120B</button><button data-provider="openai">測試 OpenAI GPT-6 Luna（付費）</button></div>
 <p class="hint">單獨測試 E 不受 0% 或正式調度停用開關影響，但會消耗付費額度並遵守每日上限、US$4 安全預算。測試失敗會同時顯示中文說明及英文代碼。</p>
 <h2>自動調度測試</h2><p class="muted">模擬會員只按一次解讀：依目前所選的「比例分配」或「優先順序」模式選擇首選通道，失敗就依可用通道自動切換。每一次實際呼叫都列入統計。</p>
 <button id="auto-test">執行一次自動調度測試</button><h3>本次結果</h3><pre id="test-result" aria-live="polite">尚未測試。</pre>
 </section>
 <section class="panel" id="quotas"><h2>各工具額度設定（下一階段預備）</h2><p class="warn"><b>重要：</b>八字額度已由 bazi-api 驗證會員並套用；塔羅及八字已接入；易經目前僅管理員測試且不套用此處額度，奇門仍為草案。</p>
 <div class="box quota"><table><thead><tr><th>工具</th><th>訪客／每日</th><th>免費會員／每日</th><th>付費會員／每日</th></tr></thead><tbody id="quota-body"></tbody></table><p class="hint">留空＝未決定；輸入 0＝禁止使用。八字訪客留空沿用 1 次、會員 4 次；塔羅訪客與會員留空均沿用每天 3 次。</p></div><button id="save-quotas">儲存額度草案</button><span class="status" id="quota-msg" aria-live="polite"></span></section>
 </div><p class="muted">只有管理員測試與工具 Worker 經私有密鑰驗證的請求才會呼叫 AI；網站沒有開放任意提示詞 API；Cloudflare 金鑰均留在 Secret，不寫入 D1 或頁面。</p></main>
 <script>
 (()=>{
 'use strict';
 const $=id=>document.getElementById(id),names={gemini_a:'Gemini A',gemini_b:'Gemini B',qwen:'Qwen3-30B',groq:'Groq GPT-OSS 120B',openai:'OpenAI GPT-6 Luna'},ps=Object.keys(names),tools={bazi:'八字',tarot:'塔羅',yijing:'易經',qimen:'奇門'};
 let cfg=null,statDays=1;
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valMaybe=(v)=>v==null?'':String(v);
 // 僅為管理後台的中文顯示層：資料庫、API 回應及故障代碼仍保留原文，避免影響八字／塔羅及調度判斷。
 const errorLabels={
  FAILED_PRECONDITION:'前置條件未通過；本次通常是 Google 判定 API 使用地區不受支援（仍須依詳細訊息確認）',
  GEMINI_TIMEOUT:'Gemini 等待回應逾時（40 秒），本次請求已中止',
  GEMINI_NETWORK_ERROR:'Gemini 網路連線或請求傳送異常',
  GEMINI_HTTP_ERROR:'Gemini API 回傳 HTTP 錯誤，需查看下方詳細原因',
  QWEN_TIMEOUT:'Qwen 等待回應逾時（85 秒），本次請求已中止',
  QWEN_GATEWAY_NETWORK_ERROR:'Qwen 閘道網路連線異常',
  QWEN_GATEWAY_ERROR:'Qwen 閘道回傳錯誤',
  GROQ_TIMEOUT:'Groq 等待回應逾時（55 秒），本次請求已中止',
  GROQ_NETWORK_ERROR:'Groq 網路連線異常',
  GROQ_RATE_LIMIT:'Groq 請求過於頻繁，觸發服務商速率限制',
  GROQ_PROVIDER_ERROR:'Groq 服務商回傳錯誤，需查看下方詳細原因',
  GROQ_OUTPUT_TRUNCATED:'Groq 回答達輸出 Token 上限，解讀遭截斷',
  OPENAI_TIMEOUT:'GPT-6 Luna 等待回應超過 60 秒',
  OPENAI_NETWORK_ERROR:'GPT-6 Luna 連線或網路錯誤',
  OPENAI_API_ERROR:'OpenAI API 回傳錯誤',
  OPENAI_RATE_LIMIT:'OpenAI 速率或額度達限制',
  OPENAI_OUTPUT_TRUNCATED:'GPT-6 Luna 回答達輸出限制，內容未完成',
  OPENAI_BUDGET_GUARD:'為保護付費餘額，E 通道已達估算安全預算門檻，暫停付費呼叫',
  OPENAI_COST_STORE_ERROR:'OpenAI 付費記帳無法使用，已停止付費呼叫',
  insufficient_quota:'OpenAI API 餘額或帳單額度不足',
  invalid_api_key:'OpenAI API 金鑰錯誤或已停用',
  rate_limit_exceeded:'OpenAI API 請求速率超過限制',
  EMPTY_AI_RESPONSE:'服務商未回傳可用的回答文字',
  READING_TOO_SHORT:'AI 回答太短，不足以完成解讀',
  PROVIDER_NOT_CONFIGURED:'該 AI 通道的 Cloudflare Secret 未正確設定',
  RESOURCE_EXHAUSTED:'請求額度、速率或資源達到服務商限制',
  PERMISSION_DENIED:'權限不足；請檢查 API 金鑰及服務存取資格',
  UNAUTHENTICATED:'認證失敗；請檢查 API 金鑰',
  INVALID_ARGUMENT:'傳送給服務商的請求參數無效',
  NOT_FOUND:'找不到指定資源或 API 端點',
  UNAVAILABLE:'服務暫時無法使用，可能是供應商或網路問題',
  INTERNAL:'服務商內部發生錯誤',
  DEADLINE_EXCEEDED:'服務商處理逾時',
  CANCELLED:'請求已取消或中止',
  ABORTED:'請求被中止',
  UNKNOWN:'未知服務商錯誤',
  NO_AVAILABLE_PROVIDER:'沒有可用 AI：可能已停用、冷卻中或達每日上限',
  ALL_PROVIDER_ATTEMPTS_FAILED:'本次已嘗試的 AI 全部失敗，或達到安全等待上限',
  D1_TRACKING_FAILED:'無法寫入 D1 調度紀錄',
  CENTER_METERING_UNAVAILABLE:'AI 總控統計或追蹤紀錄寫入失敗',
  AI_CENTER_UNAVAILABLE:'AI 總控暫時無法處理請求',
  QUOTA_CONFIG_UNAVAILABLE:'無法讀取 AI 額度設定',
  UNAUTHORIZED:'驗證失敗或登入已到期',
  ADMIN_SECRET_NOT_CONFIGURED:'AI 總控管理員密碼尚未設定',
  ADMIN_API_ERROR:'管理後台伺服器發生錯誤',
  DB_BINDING_MISSING:'缺少 D1 資料庫綁定',
  METHOD_NOT_ALLOWED:'這個 API 不接受目前的請求方法',
  CONTENT_TYPE_REQUIRED:'請求必須使用 JSON 格式',
  REQUEST_TOO_LARGE:'請求內容超過大小限制',
  CROSS_SITE_FORBIDDEN:'為安全起見，禁止跨網站執行此操作',
  ORIGIN_NOT_ALLOWED:'請求的網站來源不被允許',
  INVALID_CONFIG:'調度設定格式無效',
  INVALID_PRIMARY_WEIGHTS:'五套 AI 比例無效；各通道需為 0%～100%，合計為 100%',
  INVALID_MODEL:'指定的 AI 模型不存在或無效',
  PROVIDER_DAILY_CAP_REACHED:'該 AI 已達本總控設定的每日呼叫上限',
  TRACE_NOT_FOUND:'找不到對應的 AI 追蹤紀錄',
  INVALID_TRACE:'追蹤碼或身分識別格式不正確',
  INVALID_TRACE_ID:'AI 追蹤碼格式不正確',
  TRACE_NOT_OWNED:'追蹤碼不屬於目前的使用者',
  INVALID_FEEDBACK:'會員回報內容或類別不符合規定',
  FEEDBACK_DAILY_LIMIT:'今日會員回報次數已達上限',
  ALREADY_REPORTED:'此追蹤碼已經回報過',
  FEEDBACK_STORE_ERROR:'無法儲存會員回報',
  INVALID_TAROT_PROMPT:'塔羅解讀提示詞格式不符規定',
  INVALID_BAZI_PROMPT:'八字解讀提示詞格式不符規定',
  QUOTA_EXCEEDED:'使用額度已耗盡',
  RATE_LIMIT_EXCEEDED:'呼叫過於頻繁，達到速率限制',
  DAILY_LIMIT_REACHED:'今日可使用次數已用完',
  BILLING_NOT_ENABLED:'尚未啟用服務商計費或帳單專案',
  MODEL_NOT_FOUND:'找不到指定 AI 模型',
  SERVICE_UNAVAILABLE:'服務暫時無法使用',
  TIMEOUT:'等待回應逾時',
  NETWORK_ERROR:'網路連線異常',
  BAD_REQUEST:'請求格式有誤',
  INTERNAL_SERVER_ERROR:'服務器內部錯誤'
 };
 const httpLabels={400:'請求內容有誤',401:'未通過身分驗證',403:'無權限或地區不受支援',404:'資源或模型不存在',408:'請求等待逾時',409:'請求狀態衝突',413:'請求內容太大',422:'請求內容無法處理',429:'呼叫太頻繁或達到額度限制',500:'服務器內部錯誤',502:'上游 AI 回傳錯誤',503:'服務暫時不可用',504:'上游 AI 回應逾時'};
 function codeZh(value){
  const code=String(value==null?'':value).trim();if(!code||code==='無')return '無';
  const http=code.match(/^HTTP ([0-9]{3})$/i);
  const explanation=errorLabels[code]||(http&&httpLabels[Number(http[1])])||(/^[A-Z][A-Z0-9_]+$/.test(code)?'尚未收錄的錯誤代碼，請保留代碼供排查':null);
  return explanation?explanation+'（'+code+'）':detailZh(code);
 }
 function detailZh(value){
  const original=String(value==null?'':value).trim();if(!original)return '';
  if(/[\u3400-\u9fff]/.test(original))return original;
  const lower=original.toLowerCase();let message='';
  if(lower.includes('user location is not supported')||lower.includes('location is not supported')||lower.includes('unsupported region')||lower.includes('not supported in your region'))message='Google 或服務商判定此次 API 請求的地區不受支援；不代表帳號永久無法使用';
  else if(lower.includes('operation was aborted')||lower.includes('the operation was aborted')||lower.includes('aborted due to timeout'))message='連線已被中止；若同時顯示逾時代碼，表示超過程式等待上限';
  else if(lower.includes('high demand')||lower.includes('spikes in demand')||lower.includes('experiencing high demand'))message='這個 AI 模型目前需求過高，服務暫時繁忙；通常稍後即可恢復，請稍後重試';
  else if(lower.includes('rate limit')||lower.includes('too many requests')||lower.includes('requests per minute')||lower.includes('rate_limit'))message='請求頻率超過服務商限制，請稍後重試';
  else if(lower.includes('quota exceeded')||lower.includes('quota has been exceeded')||lower.includes('resource exhausted')||lower.includes('resource_exhausted')||lower.includes('been exhausted')||lower.includes('exceeded your quota'))message='目前請求額度或運算資源已達到限制';
  else if(lower.includes('permission denied')||lower.includes('permission_denied')||lower.includes('forbidden'))message='API 存取權限不足，可能需要檢查金鑰、專案或使用資格';
  else if(lower.includes('api key not valid')||lower.includes('invalid api key')||lower.includes('incorrect api key')||lower.includes('invalid_api_key'))message='API 金鑰無效或已停用';
  else if(lower.includes('billing')||lower.includes('payment required'))message='API 計費或帳單設定不符合服務商要求';
  else if(lower.includes('failed to fetch')||lower.includes('fetch failed')||lower.includes('network error')||lower.includes('connection reset'))message='網路連線或請求傳送失敗';
  else if(lower.includes('timeout')||lower.includes('timed out')||lower.includes('deadline exceeded'))message='等待服務商回應逾時';
  else if(lower.includes('model not found')||lower.includes('model does not exist')||lower.includes('does not support generatecontent'))message='指定的 AI 模型不存在或不支援目前的呼叫方式';
  else if(lower.includes('service unavailable')||lower.includes('temporarily unavailable')||lower.includes('overloaded'))message='服務商暫時無法提供服務或負載過高';
  else if(lower.includes('invalid request')||lower.includes('invalid argument')||lower.includes('bad request'))message='傳送給 AI 的請求參數或格式有誤';
  else if(lower.includes('safety')||lower.includes('content blocked')||lower.includes('blocked by'))message='請求或回答可能被服務商安全規則阻擋';
  else if(lower.includes('maximum')&&lower.includes('tokens')||lower.includes('context length'))message='文字長度或 Token 超出模型限制';
  else if(lower.includes('unauthorized')||lower.includes('authentication'))message='身分驗證失敗，需確認登入或金鑰設定';
  else if(lower.includes('not found'))message='無法找到請求的資源';
  else if(lower.includes('internal server error'))message='伺服器內部錯誤';
  else if(lower.includes('error'))message='服務商回傳錯誤；未能由這段訊息確定確切原因';
  else message='尚未收錄這段英文訊息，請保留原文供排查';
  return message+'（原文：'+original+'）';
 }
 function friendlyError(value){const msg=String(value==null?'':value);return errorLabels[msg]||/^HTTP [0-9]{3}$/i.test(msg)?codeZh(msg):detailZh(msg)}

 async function api(url,method='GET',payload,allowProviderFailure=false){
  const options={method,cache:'no-store',credentials:'same-origin',headers:{}};
  if(payload!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(payload)}
  const res=await fetch(url,options);let data;try{data=await res.json()}catch{throw Error('後端回傳不是 JSON（HTTP '+res.status+'）')}
  if(res.status===401){showLogin();throw Error('登入已到期，請重新輸入管理密碼。')}
  if((!res.ok||!data.ok) && !allowProviderFailure)throw Error((data.error?codeZh(data.error):'伺服器錯誤')+(data.detail?'｜'+detailZh(data.detail):'')+'（HTTP '+res.status+'）');
  return data;
 }
 // Four proportional primary weights. Other sliders rebalance automatically without changing total (100%).
 let currentWeights={gemini_a:50,gemini_b:50,qwen:0,groq:0,openai:0};
 let currentPriority=['gemini_a','gemini_b','qwen','groq','openai'];
 let paidBudget=null;
 function paintWeights(){
  // Build the slider elements only once; replacing a range input during dragging
  // would destroy pointer capture and make adjusting its value frustrating.
  if(!$('weight-gemini_a')){
   $('four-weights').innerHTML=ps.map(p=>'<div class="weight-card"><label for="weight-'+p+'"><span>'+names[p]+'</span><b id="weight-label-'+p+'"></b></label><input type="range" min="0" max="100" step="1" id="weight-'+p+'" aria-label="'+names[p]+' 首選比例"></div>').join('');
   for(const p of ps)$('weight-'+p).oninput=()=>rebalanceWeights(p,Number($('weight-'+p).value));
  }
  for(const p of ps){$('weight-'+p).value=currentWeights[p];$('weight-label-'+p).textContent=currentWeights[p]+'%';}
  $('weights-total').textContent=ps.reduce((sum,p)=>sum+currentWeights[p],0);
 }
 function rebalanceWeights(changed,value){
  const other=ps.filter(p=>p!==changed),oldSum=other.reduce((sum,p)=>sum+currentWeights[p],0),rest=100-value;
  const recalculated={};
  if(oldSum===0){other.forEach(p=>recalculated[p]=0);recalculated[other[0]]=rest;}
  else{
   const scaled=other.map(p=>({p,exact:currentWeights[p]*rest/oldSum}));
   for(const x of scaled)recalculated[x.p]=Math.floor(x.exact);
   const remainder=rest-other.reduce((sum,p)=>sum+recalculated[p],0);
   scaled.sort((a,b)=>(b.exact-Math.floor(b.exact))-(a.exact-Math.floor(a.exact)) || ps.indexOf(a.p)-ps.indexOf(b.p));
   for(let i=0;i<remainder;i++)recalculated[scaled[i].p]++;
  }
  currentWeights={...recalculated,[changed]:value};paintWeights();
 }
 function renderPriority(){
  $('priority-list').innerHTML=currentPriority.map((p,i)=>'<div class="flex" style="padding:7px 0;border-bottom:1px solid #ececf4"><b style="min-width:26px">'+(i+1)+'.</b><span style="flex:1">'+esc(names[p])+'</span><button type="button" class="secondary" data-move-up="'+i+'" '+(i===0?'disabled':'')+'>↑ 上移</button><button type="button" class="secondary" data-move-down="'+i+'" '+(i===ps.length-1?'disabled':'')+'>↓ 下移</button></div>').join('');
  $('priority-list').querySelectorAll('[data-move-up],[data-move-down]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.moveUp??b.dataset.moveDown),j=b.hasAttribute('data-move-up')?i-1:i+1;if(j<0||j>=currentPriority.length)return;[currentPriority[i],currentPriority[j]]=[currentPriority[j],currentPriority[i]];renderPriority();$('config-msg').textContent='優先順序已調整，按「儲存調度設定」後才會生效。';});
 }
 function showPaidBudget(){if(!paidBudget)return;$('openai-budget-status').textContent='本總控 E 通道費用估算：US$'+Number(paidBudget.estimatedUsd||0).toFixed(4)+'／US$4.0000｜估算剩餘安全緩衝 US$'+Number(paidBudget.remainingBudgetUsd||0).toFixed(4)+'（不等於 OpenAI 帳戶實際餘額）';}
 document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{currentWeights=Object.fromEntries(ps.map((p,i)=>[p,Number(b.dataset.preset.split(',')[i])]));paintWeights();$('config-msg').textContent='比例已調整，請按「儲存調度設定」才會套用。';});
 function renderConfig(){
  currentWeights={...cfg.primary_weights};paintWeights();currentPriority=[...cfg.priority_order];renderPriority();document.querySelectorAll('input[name=allocation-mode]').forEach(r=>r.checked=r.value===cfg.allocation_mode);
  $('threshold').value=cfg.failure_threshold;$('cooldown').value=cfg.cooldown_minutes;
  $('provider-settings').innerHTML=ps.map(p=>'<div class="light"><label><input type="checkbox" id="on-'+p+'" '+(cfg.enabled[p]?'checked':'')+'> '+names[p]+'</label><div class="flex"><small>每日呼叫上限</small><input type="number" id="cap-'+p+'" min="1" max="1000000" placeholder="未設定" value="'+esc(valMaybe(cfg.daily_provider_caps[p]))+'"></div></div>').join('');
  $('quota-body').innerHTML=Object.entries(tools).map(([id,name])=>'<tr><td>'+name+'</td>'+['visitor','free','paid'].map(level=>'<td><input type="number" min="0" max="100000" id="quota-'+id+'-'+level+'" placeholder="未設定" value="'+esc(valMaybe(cfg.tool_quotas[id][level]))+'"></td>').join('')+'</tr>').join('');
 }
 function readOptional(id,max){const s=$(id).value.trim();if(s==='')return null;const n=Number(s);if(!Number.isSafeInteger(n)||n<0||n>max)throw Error(id+' 必須為 0 至 '+max+' 的整數');return n;}
 $('save-config').onclick=async()=>{
  try{
   const updated=JSON.parse(JSON.stringify(cfg));updated.primary_weights={...currentWeights};updated.gemini_a_percent=currentWeights.gemini_a;updated.allocation_mode=document.querySelector('input[name=allocation-mode]:checked').value;updated.priority_order=[...currentPriority];updated.backup_order=currentPriority.indexOf('qwen')<currentPriority.indexOf('groq')?['qwen','groq']:['groq','qwen'];
   updated.failure_threshold=Number($('threshold').value);updated.cooldown_minutes=Number($('cooldown').value);
   for(const p of ps){updated.enabled[p]=$('on-'+p).checked;updated.daily_provider_caps[p]=readOptional('cap-'+p,1000000);if(updated.daily_provider_caps[p]===0)throw Error('每日上限必須至少 1；若要停用通道請關閉開關');}
   $('config-msg').textContent='儲存中…';const d=await api('/api/admin/config','PUT',{config:updated});cfg=d.config;renderConfig();$('config-msg').textContent='✅ 五通道調度設定已儲存到 D1';
  }catch(e){$('config-msg').textContent='❌ '+friendlyError(e.message);}
 };
 $('save-quotas').onclick=async()=>{
  try{const updated=JSON.parse(JSON.stringify(cfg));for(const tool of Object.keys(tools))for(const level of ['visitor','free','paid'])updated.tool_quotas[tool][level]=readOptional('quota-'+tool+'-'+level,100000);
    $('quota-msg').textContent='儲存中…';const d=await api('/api/admin/config','PUT',{config:updated});cfg=d.config;renderConfig();$('quota-msg').textContent='✅ 設定已存 D1；八字新請求將套用，易經僅管理員測試，不套用此處額度。';
  }catch(e){$('quota-msg').textContent='❌ '+friendlyError(e.message);}
 };
 function taiwanDate(iso){try{return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(iso))}catch{return String(iso)}}
 async function refreshStats(){
  try{const d=await api('/api/admin/stats?days='+statDays);let total=0;
   $('stats-body').innerHTML=ps.map(p=>{const v=d.stats[p],n=Number(v.calls)||0,s=Number(v.successes)||0,f=Number(v.failures)||0,t=Number(v.reported_tokens)||0;total+=n;return '<tr><td>'+names[p]+'</td><td class="num">'+n+'</td><td class="num green">'+s+'</td><td class="num red">'+f+'</td><td class="num">'+(n?Math.round(s/n*100)+'%':'—')+'</td><td class="num">'+t.toLocaleString('zh-TW')+'</td><td class="num"><strong>'+(n&&Number(v.calls_without_tokens||0)<n?Math.round(t/n).toLocaleString('zh-TW'):'—')+'</strong></td><td class="num">'+(v.avg_ms==null?'—':(Number(v.avg_ms)/1000).toFixed(1))+'</td></tr>'}).join('');
   const primarySum=ps.reduce((sum,p)=>sum+(Number(d.stats[p].primary_calls)||0),0);
   $('distribution-note').textContent='五套 AI 首選分配：'+ps.map(p=>names[p]+' '+(Number(d.stats[p].primary_calls)||0)+' 次（'+(primarySum?Math.round(Number(d.stats[p].primary_calls)*100/primarySum)+'%':'—')+'）').join('／')+'。管理員單套連線測試不計入分流；包含管理員自動調度及八字、塔羅的正式首選呼叫；期間曾修改比例則為累計結果，不代表當前比例。';
   $('health-cards').innerHTML=ps.map(p=>{const h=d.health[p],until=Number(h.disabled_until_ms)||0,remaining=Math.max(0,Math.ceil((until-Date.now())/60000));const txt=remaining?'冷卻中，約 '+remaining+' 分鐘':(Number(h.consecutive_failures)||0)>0?'最近連續失敗 '+h.consecutive_failures+' 次':'正常／尚無故障';return '<div class="light"><b>'+names[p]+'</b><br><span class="'+(remaining?'red':'muted')+'">'+esc(txt)+'</span><br><small>最後失敗：'+esc(codeZh(h.last_error_code||'無'))+'</small></div>'}).join('');
   $('errors-body').innerHTML=d.errors.length?d.errors.map(e=>'<tr><td>'+esc(taiwanDate(e.at_iso))+'</td><td>'+esc(names[e.provider]||e.provider)+'</td><td>'+esc(codeZh(e.error_code))+'<br><small>'+esc(detailZh(e.error_detail))+'</small></td></tr>').join(''):'<tr><td colspan="3" class="muted">此期間沒有失敗紀錄</td></tr>';
   $('error-count').textContent=d.errors.length?'（顯示最近 '+d.errors.length+' 筆'+(d.errors.length===25?'，最多顯示 25 筆':'')+'）':'（目前沒有失敗紀錄）';
   $('feedback-body').innerHTML=d.feedback.length?d.feedback.map(f=>'<tr><td>'+esc(taiwanDate(f.at_iso))+'</td><td>'+esc(f.trace_id)+'</td><td>'+esc(f.section)+' / '+esc(f.category)+'</td><td>'+esc(f.comment)+'</td></tr>').join(''):'<tr><td colspan="4" class="muted">目前尚無回報</td></tr>';
   paidBudget=d.openaiCost;showPaidBudget();$('stats-note').textContent=d.fromDate+' 至 '+d.toDate+'｜總呼叫 '+total+' 次。'+d.caption;
  }catch(e){$('stats-note').textContent='讀取統計失敗：'+friendlyError(e.message)}
 }
 $('trace-search').onclick=async()=>{
   const code=$('trace-input').value.trim().toUpperCase();$('trace-result').textContent='查詢中…';
   try{const d=await api('/api/admin/trace?code='+encodeURIComponent(code));const item=d.item;
     const lines=['追蹤碼：'+item.trace_id,'時間：'+taiwanDate(item.at_iso),'工具：'+item.tool,'結果：'+({success:'成功',failed:'失敗',processing:'處理中'}[item.status]||item.status),'成功通道：'+(item.channel_code||'無'),'錯誤：'+codeZh(item.summary_code||'無'),''];
     lines.push('調度過程：');for(const a of item.attempts)lines.push('通道 '+a.channel+'：'+(a.ok?'成功':'失敗 '+codeZh(a.error||'未知錯誤'))+(a.detail?'｜'+detailZh(a.detail):''));
     lines.push('跳過／不可用：');for(const a of item.skipped)lines.push('通道 '+a.channel+'：'+codeZh(a.reason));
     if(item.feedback)lines.push('會員回報：'+item.feedback.category+' / '+item.feedback.comment);
     $('trace-result').textContent=lines.join(String.fromCharCode(10));
   }catch(e){$('trace-result').textContent='查無紀錄：'+friendlyError(e.message)}
 };
 document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>{statDays=Number(b.dataset.days);refreshStats()});$('refresh-stats').onclick=refreshStats;
 function displayTest(d,label){const lines=[];lines.push(d.ok?'✅ '+label+' 成功':'❌ '+label+' 失敗');if(d.provider)lines.push('使用通道：'+(names[d.provider]||d.provider));if(d.model)lines.push('模型：'+d.model);if(d.seconds!==undefined)lines.push('耗時：'+d.seconds+' 秒');if(d.answer)lines.push('AI 回答：'+d.answer);if(d.totalTokens!=null)lines.push('Tokens：'+d.totalTokens);if(d.error)lines.push('錯誤：'+codeZh(d.error));if(d.detail)lines.push('詳情：'+detailZh(d.detail));if(d.attempts)lines.push('調度經過：'+d.attempts.map(x=>(names[x.provider]||x.provider)+(x.ok?' 成功':' 失敗'+(x.error?'（'+codeZh(x.error)+'）':''))).join(' → '));$('test-result').textContent=lines.join('\\n')}
 let busy=false;
 async function runTest(provider){if(busy)return;busy=true;const b=[...document.querySelectorAll('[data-provider],#auto-test')];b.forEach(x=>x.disabled=true);$('test-result').textContent='正在進行真實 AI 連線測試，請稍候…';
  try{const route=provider==='auto'?'/api/admin/auto-test':'/api/admin/test';const d=await api(route,'POST',provider==='auto'?{}:{model:provider},true);displayTest(d,provider==='auto'?'自動調度':names[provider]);await refreshStats()}
  catch(e){$('test-result').textContent='❌ '+friendlyError(e.message)+'\\n請到「成功／失敗統計」查看記錄';await refreshStats()}
  finally{busy=false;b.forEach(x=>x.disabled=false)}
 }
 document.querySelectorAll('[data-provider]').forEach(b=>b.onclick=()=>runTest(b.dataset.provider));$('auto-test').onclick=()=>runTest('auto');
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab));if(b.dataset.tab==='stats')refreshStats()});
 function showLogin(){cfg=null;$('secure').classList.add('hide');$('session-bar').classList.add('hide');$('login-box').classList.remove('hide');$('login').disabled=false;$('login').textContent='登入管理';}
 function showSession(expiresAt){$('login-box').classList.add('hide');$('session-bar').classList.remove('hide');$('secure').classList.remove('hide');$('password').value='';$('session-status').textContent='✅ 管理員已登入｜30 天內免重複輸入密碼'+(expiresAt?'（到期：'+new Date(expiresAt).toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei'})+'）':'');}
 async function loadDashboard(expiresAt){const d=await api('/api/admin/config');cfg=d.config;paidBudget=d.openaiCost;renderConfig();showPaidBudget();showSession(expiresAt);await refreshStats();}
 async function restoreSession(){
  $('login').disabled=true;
  try{const res=await fetch('/api/admin/session',{cache:'no-store',credentials:'same-origin'});
   if(res.status===401){showLogin();$('login-hint').textContent='首次登入後，同裝置可保持最多 30 天。原始管理密碼不儲存在瀏覽器。';return;}
   const d=await res.json();if(!res.ok||!d.ok)throw Error(d.error||'無法驗證登入');
   await loadDashboard(d.expiresAt);
  }catch(e){showLogin();$('login-hint').textContent='無法恢復登入狀態：'+friendlyError(e.message)+'。如持續發生，請稍後再試。';}
 }
 $('login').onclick=async()=>{
  const input=$('password').value.trim();if(!input)return alert('請先輸入管理者密碼');
  $('login').disabled=true;$('login').textContent='驗證中…';
  try{
   const res=await fetch('/api/admin/login',{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input})});
   const d=await res.json();if(!res.ok||!d.ok)throw Error(d.error||'管理員驗證失敗');
   $('password').value='';await loadDashboard(d.expiresAt);
  }catch(e){showLogin();$('login-hint').textContent='無法登入：'+friendlyError(e.message);}
 };
 $('password').addEventListener('keydown',e=>{if(e.key==='Enter')$('login').click()});
 $('logout').onclick=async()=>{
  $('logout').disabled=true;
  try{
   const res=await fetch('/api/admin/logout',{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});
   if(!res.ok)throw Error('HTTP '+res.status);
   showLogin();$('login-hint').textContent='已登出。下次登入請輸入原本的管理密碼。';
  }catch(e){$('session-status').textContent='登出未完成：'+friendlyError(e.message)+'。請稍後再試。';}
  finally{$('logout').disabled=false;}
 };
 restoreSession();
 })();
 </script></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}
async function parseJSON(request){if((request.headers.get('Content-Type')||'').split(';')[0].trim()!=='application/json')throw new Error('CONTENT_TYPE_REQUIRED');if(Number(request.headers.get('Content-Length')||0)>20000)throw new Error('REQUEST_TOO_LARGE');return await request.json();}
function adminResult(res){return {...res,seconds:res.durationMs==null?undefined:Math.round(res.durationMs/100)/10};}
export default {async fetch(request,env){
 const url=new URL(request.url),p=url.pathname;
 if(p==='/'&&request.method==='GET')return htmlPage();
 if(p==='/health'&&request.method==='GET')return json({ok:true,service:'ai-center-api',phase:'admin-dashboard-v3',configured:configured(env),publicInterpretEnabled:false});
 // Tarot private API: only tarot-api Service Binding with a separate 32+ character secret.
 if(p==='/api/internal/tarot/interpret'||p==='/api/internal/tarot/feedback'||p==='/api/internal/tarot/quota'){
   const key=String(env.AI_CENTER_TAROT_KEY||'');
   if(key.length<32||!await sameSecret(request.headers.get('X-AI-Center-Tarot-Key')||'',key))return json({ok:false,error:'UNAUTHORIZED'},401);
   if(p==='/api/internal/tarot/quota'&&request.method==='GET'){
     try{await initDB(env);const q=(await loadConfig(env)).tool_quotas.tarot;return json({ok:true,visitor:q.visitor??3,free:q.free??3,paid:q.paid});}
     catch(e){return json({ok:false,error:'QUOTA_CONFIG_UNAVAILABLE'},503)}
   }
   if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
   try{
     await initDB(env);const body=await request.json();
     if(p.endsWith('/feedback')){const result=await saveFeedback(env,body);return json(result,result.ok?200:result.error==='ALREADY_REPORTED'?409:400);}
     const prompt=typeof body?.prompt==='string'?body.prompt.trim():'';
     const traceId=String(body?.traceId||''),ownerHash=String(body?.ownerHash||'');
     if(prompt.length<200||prompt.length>24000||!prompt.includes('塔羅'))return json({ok:false,error:'INVALID_TAROT_PROMPT'},400);
     if(!TRACE_FORMAT.test(traceId)||!/^[a-f0-9]{64}$/.test(ownerHash))return json({ok:false,error:'INVALID_TRACE_ID'},400);
     const result=await baziInternalInterpret(env,prompt,traceId,ownerHash,'tarot');
     return json(result,result.ok?200:503);
   }catch(e){console.error('AI center tarot route failed',safe(e?.message));return json({ok:false,error:'AI_CENTER_UNAVAILABLE'},503)}
 }
  // 易經的私有解卦通道：只有持有 Service Binding + 專用 Secret 的 yijing-api 可以呼叫。
  if(p==='/api/internal/yijing/interpret'){
    if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
    if(String(env.AI_CENTER_YIJING_KEY||'').length<32 || !await sameSecret(request.headers.get('X-AI-Center-Yijing-Key')||'',String(env.AI_CENTER_YIJING_KEY)))return json({ok:false,error:'UNAUTHORIZED'},401);
    try{
      await initDB(env);
      const raw=await request.text();if(raw.length>28000)return json({ok:false,error:'REQUEST_TOO_LARGE'},413);
      const data=JSON.parse(raw);
      const prompt=typeof data?.prompt==='string'?data.prompt.trim():'';
      const traceId=String(data?.traceId||''),ownerHash=String(data?.ownerHash||'');
      if(prompt.length<250||prompt.length>24000||!prompt.includes('《易經》')||!prompt.includes('【卦象】'))return json({ok:false,error:'INVALID_YIJING_PROMPT'},400);
      if(!TRACE_FORMAT.test(traceId)|| !/^[a-f0-9]{64}$/.test(ownerHash))return json({ok:false,error:'INVALID_TRACE_ID'},400);
      const result=await baziInternalInterpret(env,prompt,traceId,ownerHash,'yijing');
      return json(result,result.ok?200:503);
    }catch(e){console.error('AI center yijing route failed',safe(e?.message));return json({ok:false,error:'AI_CENTER_UNAVAILABLE'},503)}
  }
 if(p==='/api/internal/bazi/interpret'){
   if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
   if(String(env.AI_CENTER_BAZI_KEY||'').length<32 || !await sameSecret(request.headers.get('X-AI-Center-Bazi-Key')||'',String(env.AI_CENTER_BAZI_KEY)))return json({ok:false,error:'UNAUTHORIZED'},401);
   try{
     await initDB(env);
     if(Number(request.headers.get('Content-Length')||0)>110000)return json({ok:false,error:'REQUEST_TOO_LARGE'},413);
     const data=await request.json();const prompt=typeof data?.prompt==='string'?data.prompt.trim():'';
     if(prompt.length<250||prompt.length>24000||!prompt.includes('四柱'))return json({ok:false,error:'INVALID_BAZI_PROMPT'},400);
     const traceId=String(data.traceId||''),ownerHash=String(data.ownerHash||'');
     if(!TRACE_FORMAT.test(traceId)|| !/^[a-f0-9]{64}$/.test(ownerHash))return json({ok:false,error:'INVALID_TRACE_ID'},400);
     const out=await baziInternalInterpret(env,prompt,traceId,ownerHash);
     return json(out,out.ok?200:503);
   }catch(e){console.error('AI center bazi route failed',safe(e?.message));return json({ok:false,error:'AI_CENTER_UNAVAILABLE'},503)}
  }
  if(p==='/api/internal/bazi/feedback'){
   if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
   if(String(env.AI_CENTER_BAZI_KEY||'').length<32||!await sameSecret(request.headers.get('X-AI-Center-Bazi-Key')||'',String(env.AI_CENTER_BAZI_KEY)))return json({ok:false,error:'UNAUTHORIZED'},401);
   try{await initDB(env);const body=await request.json();const result=await saveFeedback(env,body);return json(result,result.ok?200:result.error==='ALREADY_REPORTED'?409:400)}
   catch(e){console.error('AI Center feedback failed',safe(e?.message));return json({ok:false,error:'FEEDBACK_STORE_ERROR'},503)}
  }
  if(!p.startsWith('/api/admin/'))return json({ok:false,error:'NOT_FOUND'},404);
 const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({ok:false,error:'ORIGIN_NOT_ALLOWED'},403);
 if(['POST','PUT'].includes(request.method)&&request.headers.get('Sec-Fetch-Site')==='cross-site')return json({ok:false,error:'CROSS_SITE_FORBIDDEN'},403);
 if(!['GET','POST','PUT'].includes(request.method))return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
 if(String(env.AI_CENTER_ADMIN_KEY||'').length<16)return json({ok:false,error:'ADMIN_SECRET_NOT_CONFIGURED'},503);
 try{
  await initDB(env);
  if(p==='/api/admin/login'){
   if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
   const body=await parseJSON(request),password=body?.password;
   if(typeof password!=='string'||password.length>1024||!await sameSecret(password,String(env.AI_CENTER_ADMIN_KEY)))return json({ok:false,error:'UNAUTHORIZED'},401);
   const session=await createAdminSession(env);
   return jsonCookie({ok:true,expiresAt:session.expiresAt},activeCookie(session.token));
  }
  if(p==='/api/admin/logout'){
   if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
   await deleteAdminSession(env,request);
   return jsonCookie({ok:true},expiredCookie());
  }
  const session=await findAdminSession(env,request);
  // Preserve the former authenticated API clients, while the web page uses cookie only.
  const legacyKey=await sameSecret(request.headers.get('X-AI-Center-Admin-Key')||'',String(env.AI_CENTER_ADMIN_KEY));
  if(p==='/api/admin/session'&&request.method==='GET')return session?json({ok:true,expiresAt:session.expiresAt}):json({ok:false,error:'UNAUTHORIZED'},401);
  if(!session&&!legacyKey)return json({ok:false,error:'UNAUTHORIZED'},401);
  if(p==='/api/admin/config'&&request.method==='GET')return json({ok:true,config:await loadConfig(env),configured:configured(env),openaiCost:await openaiSpend(env)});
  if(p==='/api/admin/config'&&request.method==='PUT'){
   const body=await parseJSON(request);if(!body||typeof body.config!=='object'||!body.config)return json({ok:false,error:'INVALID_CONFIG'},400);
   // Whitelist and clamp every persisted field; unknown fields discarded.
   let config;try{config=normalizeConfig(body.config)}catch(e){return json({ok:false,error:'INVALID_PRIMARY_WEIGHTS',detail:'五套 AI 首選比例必須為 0 至 100 的整數，且合計正好 100%。'},400)}const before=await loadConfig(env);if(PROVIDERS.some(p=>before.primary_weights[p]!==config.primary_weights[p]))config.primary_allocation_started_at=new Date().toISOString();else config.primary_allocation_started_at=before.primary_allocation_started_at;await saveConfig(env,config);return json({ok:true,config});
  }
  if(p==='/api/admin/stats'&&request.method==='GET')return json({ok:true,...await stats(env,Number(url.searchParams.get('days')))});
  if(p==='/api/admin/trace'&&request.method==='GET'){
    const item=await findTrace(env,String(url.searchParams.get('code')||''));return json(item?{ok:true,item}:{ok:false,error:'TRACE_NOT_FOUND'},item?200:404);
  }
  if(p==='/api/admin/test'&&request.method==='POST'){
   const body=await parseJSON(request),provider=String(body?.model||'');if(!PROVIDERS.includes(provider))return json({ok:false,error:'INVALID_MODEL'},400);
   // Manual test is allowed even if a provider is disabled/cooling, for diagnostics; do not bypass a configured daily cap.
   const cfg=await loadConfig(env),usage=await dailyUsage(env,cfg);
   if(cfg.daily_provider_caps[provider]!==null&&usage[provider].calls>=cfg.daily_provider_caps[provider])return json({ok:false,error:'PROVIDER_DAILY_CAP_REACHED'},429);
   const result=await callProvider(env,provider,TEST_PROMPT);await track(env,result,'manual_test','manual');return json(adminResult(result),result.ok?200:result.providerStatus===429?429:502);
  }
  if(p==='/api/admin/auto-test'&&request.method==='POST'){
   await parseJSON(request);const cfg=await loadConfig(env);const result=await autoTest(env,cfg);return json(result,result.ok?200:503);
  }
  return json({ok:false,error:'NOT_FOUND'},404);
 }catch(e){console.error('AI Center admin failure',safe(e?.message));return json({ok:false,error:'ADMIN_API_ERROR',detail:safe(e?.message||'未知錯誤')},503)}
}};
