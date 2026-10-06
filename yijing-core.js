(() => {
"use strict";

/*
 * DivinationHub 易經前端橋接層｜V5.2 hidden-core + unified usage
 * 這個檔案故意不包含 64 卦、384 爻、白話規則與解讀引擎。
 * 正式 API 已設定為 yijing-api.ezgocpu.workers.dev。
 */

const API_URL = window.YIJING_API_URL || "https://yijing-api.ezgocpu.workers.dev/reading";

async function draw(question="", context={}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({question, context}),
      signal:controller.signal,
      cache:"no-store"
    });
    let data={};
    try { data=await res.json(); } catch {}
    if (!res.ok || !data?.ok || !data?.reading) {
      throw new Error(data?.error || `API 錯誤（${res.status}）`);
    }
    return data.reading;
  } finally {
    clearTimeout(timer);
  }
}

function buildPrompt(reading) {
  return reading?.aiPrompt || "";
}

function buildTxt(reading) {
  return reading?.txt || "";
}

window.YijingCore = Object.freeze({
  draw,
  buildPrompt,
  buildTxt,
  version:"5.2-hidden-core-client"
});
})();
