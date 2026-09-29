(() => {
  "use strict";

  const GAN_ELEMENT = {
    "甲":"木","乙":"木","丙":"火","丁":"火","戊":"土",
    "己":"土","庚":"金","辛":"金","壬":"水","癸":"水"
  };
  const GAN_YINYANG = {
    "甲":"陽","乙":"陰","丙":"陽","丁":"陰","戊":"陽",
    "己":"陰","庚":"陽","辛":"陰","壬":"陽","癸":"陰"
  };
  const ZHI_ELEMENT = {
    "子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火",
    "午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水"
  };
  const ZHI_YINYANG = {
    "子":"陽","丑":"陰","寅":"陽","卯":"陰","辰":"陽","巳":"陰",
    "午":"陽","未":"陰","申":"陽","酉":"陰","戌":"陽","亥":"陰"
  };
  const ELEMENTS = ["木","火","土","金","水"];
  const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const TEN_GODS = ["比肩","劫財","食神","傷官","偏財","正財","七殺","正官","偏印","正印"];

  // 藏干常見比例，用於「結構加權」視覺化；不是各流派唯一標準。
  const HIDDEN_STEMS = {
    "子":[["癸",1]],
    "丑":[["己",0.6],["癸",0.3],["辛",0.1]],
    "寅":[["甲",0.6],["丙",0.3],["戊",0.1]],
    "卯":[["乙",1]],
    "辰":[["戊",0.6],["乙",0.3],["癸",0.1]],
    "巳":[["丙",0.6],["戊",0.3],["庚",0.1]],
    "午":[["丁",0.7],["己",0.3]],
    "未":[["己",0.6],["丁",0.3],["乙",0.1]],
    "申":[["庚",0.6],["壬",0.3],["戊",0.1]],
    "酉":[["辛",1]],
    "戌":[["戊",0.6],["辛",0.3],["丁",0.1]],
    "亥":[["壬",0.7],["甲",0.3]]
  };

  const DAYMASTER_PROFILES = {
    "甲": {image:"參天大樹", text:"重視方向、原則與成長，做事常希望有長線規劃與可持續的累積。"},
    "乙": {image:"花草藤蔓", text:"重視彈性、連結與環境感受，常擅長以細膩方式調整自己與他人的關係。"},
    "丙": {image:"太陽之火", text:"重視明確、行動與表達，常希望事情有方向、有進度，也容易成為氣氛與動能來源。"},
    "丁": {image:"燈燭之火", text:"重視專注、感受與細節，常能把注意力放在特定人事物上，形成持續而精準的投入。"},
    "戊": {image:"高山厚土", text:"重視穩定、承擔與整體架構，通常習慣先建立可依靠的基礎，再逐步向外推進。"},
    "己": {image:"田園沃土", text:"重視實用、整理與培養，常善於把零散資源重新組織成可運作的系統。"},
    "庚": {image:"礦石刀鋒", text:"重視效率、界線與決斷，處理問題時較傾向直接找出關鍵並迅速修正。"},
    "辛": {image:"珠玉精金", text:"重視品質、判斷與精準度，對細節、標準、美感或價值差異往往較敏銳。"},
    "壬": {image:"江海大水", text:"重視流動、視野與可能性，思考容易跨領域，遇到新環境時也較能快速適應。"},
    "癸": {image:"雨露泉水", text:"重視觀察、資訊與細微變化，常先吸收環境訊號，再選擇較合適的時機行動。"}
  };

  const TEN_GOD_TEXT = {
    "比肩":"自我、同儕、獨立與並肩競爭",
    "劫財":"行動、資源競逐、社交與冒險",
    "食神":"輸出、創作、享受與穩定表達",
    "傷官":"突破、質疑、創新與強烈表達",
    "偏財":"機會、流動資源、交易與外部連結",
    "正財":"秩序、實際成果、穩定資源與管理",
    "七殺":"壓力、競爭、決斷與高強度任務",
    "正官":"規範、責任、制度、名位與秩序",
    "偏印":"洞察、非典型學習、直覺與跨域吸收",
    "正印":"學習、支持、知識、方法與保護"
  };

  const GROUP_TEXT = {
    "比劫": "自主性、同儕互動與資源掌握感較容易成為人生主題。",
    "食傷": "表達、創作、技術輸出與把想法做成成果的需求較容易被看見。",
    "財星": "資源配置、交易、成果與現實回報的敏感度較容易成為重點。",
    "官殺": "責任、規則、競爭、壓力與職涯位置往往是較明顯的課題。",
    "印星": "學習、知識、方法、支援系統與安全感往往是重要的能量來源。"
  };

  const GENERATES = {"木":"火","火":"土","土":"金","金":"水","水":"木"};
  const CONTROLS = {"木":"土","土":"水","水":"火","火":"金","金":"木"};

  function pad(n) { return String(n).padStart(2, "0"); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function round1(n) { return Math.round(n * 10) / 10; }

  function parseLocalDateTime(value) {
    if (!value) throw new Error("請輸入出生日期與時間");
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) throw new Error("日期時間格式不正確");
    return {year:+m[1],month:+m[2],day:+m[3],hour:+m[4],minute:+m[5],second:0};
  }

  function formatSolar(solar) {
    if (!solar) return "—";
    if (typeof solar.toYmdHms === "function") return solar.toYmdHms();
    return [solar.getYear(),"-",pad(solar.getMonth()),"-",pad(solar.getDay())," ",pad(solar.getHour()),":",pad(solar.getMinute()),":",pad(solar.getSecond ? solar.getSecond() : 0)].join("");
  }

  function splitGanZhi(gz="") {
    const s = String(gz || "");
    return {gan:s.charAt(0) || "", zhi:s.charAt(1) || ""};
  }

  function tenGodOfGan(dayMaster, otherGan) {
    const dmEl = GAN_ELEMENT[dayMaster];
    const otherEl = GAN_ELEMENT[otherGan];
    if (!dmEl || !otherEl) return "";
    const samePolarity = GAN_YINYANG[dayMaster] === GAN_YINYANG[otherGan];
    if (otherEl === dmEl) return samePolarity ? "比肩" : "劫財";
    if (GENERATES[dmEl] === otherEl) return samePolarity ? "食神" : "傷官";
    if (CONTROLS[dmEl] === otherEl) return samePolarity ? "偏財" : "正財";
    if (CONTROLS[otherEl] === dmEl) return samePolarity ? "七殺" : "正官";
    if (GENERATES[otherEl] === dmEl) return samePolarity ? "偏印" : "正印";
    return "";
  }

  function branchMainGan(zhi) {
    return HIDDEN_STEMS[zhi]?.[0]?.[0] || "";
  }

  function buildPillar(eight, type) {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const get = name => {
      const fn = eight[`get${cap}${name}`];
      return typeof fn === "function" ? fn.call(eight) : null;
    };
    const gan = get("Gan") || "";
    const zhi = get("Zhi") || "";
    return {
      key:type,
      ganZhi:get("") || `${gan}${zhi}`,
      gan,
      zhi,
      ganElement:GAN_ELEMENT[gan] || "",
      zhiElement:ZHI_ELEMENT[zhi] || "",
      ganYinYang:GAN_YINYANG[gan] || "",
      zhiYinYang:ZHI_YINYANG[zhi] || "",
      hideGan:get("HideGan") || [],
      wuXing:get("WuXing") || "",
      naYin:get("NaYin") || "",
      shiShenGan:get("ShiShenGan") || "",
      shiShenZhi:get("ShiShenZhi") || [],
      diShi:get("DiShi") || "",
      xunKong:get("XunKong") || ""
    };
  }

  function visibleFiveElements(pillars) {
    const counts = Object.fromEntries(ELEMENTS.map(e => [e, 0]));
    pillars.forEach(p => {
      if (GAN_ELEMENT[p.gan]) counts[GAN_ELEMENT[p.gan]]++;
      if (ZHI_ELEMENT[p.zhi]) counts[ZHI_ELEMENT[p.zhi]]++;
    });
    return counts;
  }

  function weightedFiveElements(pillars) {
    const weights = Object.fromEntries(ELEMENTS.map(e => [e, 0]));
    pillars.forEach((p, idx) => {
      const ge = GAN_ELEMENT[p.gan];
      if (ge) weights[ge] += 1;
      const hidden = HIDDEN_STEMS[p.zhi] || [];
      hidden.forEach(([g,w]) => {
        const el = GAN_ELEMENT[g];
        if (el) weights[el] += w * (idx === 1 ? 1.35 : 1.05); // 月支只做輕量季節加權
      });
    });
    const total = Object.values(weights).reduce((a,b)=>a+b,0) || 1;
    const percentages = Object.fromEntries(ELEMENTS.map(e => [e, round1(weights[e] / total * 100)]));
    return {weights:Object.fromEntries(ELEMENTS.map(e=>[e,round1(weights[e])])), percentages};
  }

  function tenGodDistribution(dayMaster, pillars) {
    const raw = Object.fromEntries(TEN_GODS.map(x => [x,0]));
    pillars.forEach((p, idx) => {
      if (p.gan && p.key !== "day") {
        const tg = tenGodOfGan(dayMaster, p.gan);
        if (tg) raw[tg] += 1;
      }
      const hidden = HIDDEN_STEMS[p.zhi] || [];
      hidden.forEach(([g,w]) => {
        const tg = tenGodOfGan(dayMaster,g);
        if (tg) raw[tg] += w * (idx === 1 ? 1.35 : 1.05);
      });
    });
    const total = Object.values(raw).reduce((a,b)=>a+b,0) || 1;
    const values = Object.fromEntries(TEN_GODS.map(x => [x,round1(raw[x])]));
    const percentages = Object.fromEntries(TEN_GODS.map(x => [x,round1(raw[x]/total*100)]));
    const groups = {
      "比劫": raw["比肩"] + raw["劫財"],
      "食傷": raw["食神"] + raw["傷官"],
      "財星": raw["偏財"] + raw["正財"],
      "官殺": raw["七殺"] + raw["正官"],
      "印星": raw["偏印"] + raw["正印"]
    };
    const groupTotal = Object.values(groups).reduce((a,b)=>a+b,0) || 1;
    const groupPercentages = Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,round1(v/groupTotal*100)]));
    return {values, percentages, groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,round1(v)])), groupPercentages};
  }

  function yinYangDistribution(pillars) {
    let yang=0, yin=0;
    pillars.forEach(p=>{
      if (GAN_YINYANG[p.gan] === "陽") yang++;
      if (GAN_YINYANG[p.gan] === "陰") yin++;
      if (ZHI_YINYANG[p.zhi] === "陽") yang++;
      if (ZHI_YINYANG[p.zhi] === "陰") yin++;
    });
    return {yang,yin,yangPercent:Math.round(yang/(yang+yin||1)*100),yinPercent:Math.round(yin/(yang+yin||1)*100)};
  }

  function pairKey(a,b){ return [a,b].sort().join(""); }
  const GAN_HE = new Map([["己甲","甲己合土"],["乙庚","乙庚合金"],["丙辛","丙辛合水"],["丁壬","丁壬合木"],["戊癸","戊癸合火"]]);
  const GAN_CHONG = new Map([["庚甲","甲庚沖"],["乙辛","乙辛沖"],["丙壬","丙壬沖"],["丁癸","丁癸沖"]]);
  const ZHI_LIUHE = new Map([["丑子","子丑合"],["亥寅","寅亥合"],["卯戌","卯戌合"],["辰酉","辰酉合"],["巳申","巳申合"],["午未","午未合"]]);
  const ZHI_CHONG = new Map([["午子","子午沖"],["丑未","丑未沖"],["寅申","寅申沖"],["卯酉","卯酉沖"],["戌辰","辰戌沖"],["亥巳","巳亥沖"]]);
  const ZHI_HAI = new Map([["子未","子未害"],["丑午","丑午害"],["寅巳","寅巳害"],["卯辰","卯辰害"],["亥申","申亥害"],["戌酉","酉戌害"]]);
  const ZHI_PO = new Map([["子酉","子酉破"],["丑辰","丑辰破"],["寅亥","寅亥破"],["卯午","卯午破"],["巳申","巳申破"],["戌未","未戌破"]]);
  const SANHE = [
    {chars:["申","子","辰"],name:"申子辰三合水局",element:"水"},
    {chars:["亥","卯","未"],name:"亥卯未三合木局",element:"木"},
    {chars:["寅","午","戌"],name:"寅午戌三合火局",element:"火"},
    {chars:["巳","酉","丑"],name:"巳酉丑三合金局",element:"金"}
  ];
  const SANHUI = [
    {chars:["亥","子","丑"],name:"亥子丑三會水",element:"水"},
    {chars:["寅","卯","辰"],name:"寅卯辰三會木",element:"木"},
    {chars:["巳","午","未"],name:"巳午未三會火",element:"火"},
    {chars:["申","酉","戌"],name:"申酉戌三會金",element:"金"}
  ];

  function detectRelations(pillars) {
    const out=[];
    const posName={year:"年",month:"月",day:"日",time:"時"};
    for(let i=0;i<pillars.length;i++){
      for(let j=i+1;j<pillars.length;j++){
        const a=pillars[i], b=pillars[j];
        const gk=pairKey(a.gan,b.gan), zk=pairKey(a.zhi,b.zhi);
        if(GAN_HE.has(gk)) out.push({type:"天干五合",tone:"good",label:GAN_HE.get(gk),positions:`${posName[a.key]}柱＋${posName[b.key]}柱`});
        if(GAN_CHONG.has(gk)) out.push({type:"天干沖",tone:"alert",label:GAN_CHONG.get(gk),positions:`${posName[a.key]}柱＋${posName[b.key]}柱`});
        if(ZHI_LIUHE.has(zk)) out.push({type:"地支六合",tone:"good",label:ZHI_LIUHE.get(zk),positions:`${posName[a.key]}支＋${posName[b.key]}支`});
        if(ZHI_CHONG.has(zk)) out.push({type:"地支六沖",tone:"alert",label:ZHI_CHONG.get(zk),positions:`${posName[a.key]}支＋${posName[b.key]}支`});
        if(ZHI_HAI.has(zk)) out.push({type:"地支六害",tone:"warn",label:ZHI_HAI.get(zk),positions:`${posName[a.key]}支＋${posName[b.key]}支`});
        if(ZHI_PO.has(zk)) out.push({type:"地支六破",tone:"warn",label:ZHI_PO.get(zk),positions:`${posName[a.key]}支＋${posName[b.key]}支`});
      }
    }
    const zs=pillars.map(p=>p.zhi);
    SANHE.forEach(r=>{
      const hit=r.chars.filter(x=>zs.includes(x));
      if(hit.length===3) out.push({type:"三合",tone:"good",label:r.name,positions:"原局三支齊"});
      else if(hit.length===2) out.push({type:"半合",tone:"info",label:`${hit.join("、")}形成三合局的兩支`,positions:`向${r.element}局靠攏`});
    });
    SANHUI.forEach(r=>{
      const hit=r.chars.filter(x=>zs.includes(x));
      if(hit.length===3) out.push({type:"三會",tone:"good",label:r.name,positions:"原局三支齊"});
    });
    const count=z=>zs.filter(x=>x===z).length;
    [["辰","辰辰自刑"],["午","午午自刑"],["酉","酉酉自刑"],["亥","亥亥自刑"]].forEach(([z,label])=>{
      if(count(z)>=2) out.push({type:"自刑",tone:"warn",label,positions:`${z}出現 ${count(z)} 次`});
    });
    const hasAll=arr=>arr.every(x=>zs.includes(x));
    if(hasAll(["寅","巳","申"])) out.push({type:"三刑",tone:"alert",label:"寅巳申三刑",positions:"原局三支齊"});
    if(hasAll(["丑","戌","未"])) out.push({type:"三刑",tone:"alert",label:"丑戌未三刑",positions:"原局三支齊"});
    if(zs.includes("子")&&zs.includes("卯")) out.push({type:"刑",tone:"warn",label:"子卯刑",positions:"原局同見"});
    return out;
  }

  function structureScores(dayMaster, weighted, tenGod, relations, pillars) {
    const p=weighted.percentages;
    const balance = clamp(Math.round(100 - ELEMENTS.reduce((s,e)=>s+Math.abs((p[e]||0)-20),0)/1.6),0,100);
    const dmEl=GAN_ELEMENT[dayMaster];
    const resourceEl=ELEMENTS.find(e=>GENERATES[e]===dmEl);
    let support=(weighted.weights[dmEl]||0)+(weighted.weights[resourceEl]||0);
    let total=Object.values(weighted.weights).reduce((a,b)=>a+b,0)||1;
    // 通根與月令只作規則式加分，呈現「支持度」而非定論身強身弱。
    const roots=pillars.filter(pil=>pil.zhiElement===dmEl || (HIDDEN_STEMS[pil.zhi]||[]).some(([g])=>GAN_ELEMENT[g]===dmEl)).length;
    const monthEl=pillars[1]?.zhiElement;
    if(monthEl===dmEl) support+=1.2;
    if(monthEl===resourceEl) support+=0.8;
    support+=roots*0.25;
    total+=2.2;
    const supportScore=clamp(Math.round(support/total*100),0,100);
    const diversity=clamp(Math.round(Object.values(tenGod.values).filter(v=>v>0.15).length/10*100),0,100);
    const activity=clamp(relations.length*12,0,100);
    return {balance,support:supportScore,diversity,activity,roots};
  }

  function supportLabel(score){
    if(score>=63) return "偏強傾向";
    if(score>=54) return "稍強傾向";
    if(score>=47) return "中和附近";
    if(score>=38) return "稍弱傾向";
    return "偏弱傾向";
  }

  function buildHighlights(dayMaster, weighted, tenGod, yinYang, scores, relations, pillars) {
    const dominantElement=ELEMENTS.slice().sort((a,b)=>weighted.percentages[b]-weighted.percentages[a])[0];
    const weakestElement=ELEMENTS.slice().sort((a,b)=>weighted.percentages[a]-weighted.percentages[b])[0];
    const dominantTen=TEN_GODS.slice().sort((a,b)=>tenGod.percentages[b]-tenGod.percentages[a])[0];
    const dominantGroup=Object.keys(tenGod.groupPercentages).sort((a,b)=>tenGod.groupPercentages[b]-tenGod.groupPercentages[a])[0];
    const profile=DAYMASTER_PROFILES[dayMaster] || {image:"日主",text:"以日主作為命盤結構的核心基準。"};
    const polarity = yinYang.yangPercent===yinYang.yinPercent ? "陰陽較平均" : (yinYang.yangPercent>yinYang.yinPercent ? "陽性比例較高" : "陰性比例較高");
    const relationText = relations.length ? `原局辨識到 ${relations.length} 組常見干支互動，可逐項展開查看。` : "原局未出現明顯的常見合沖刑害組合。";
    return {
      dominantElement,weakestElement,dominantTen,dominantGroup,profile,polarity,relationText,
      summary:`${dayMaster}${GAN_ELEMENT[dayMaster]}日主，以「${profile.image}」作為傳統象徵。加權結構中以${dominantElement}較突出，十神群組以${dominantGroup}較顯著；日主支持度屬「${supportLabel(scores.support)}」。`,
      personality:`${profile.text} ${TEN_GOD_TEXT[dominantTen] ? `同時，${dominantTen}的結構較醒目，常把「${TEN_GOD_TEXT[dominantTen]}」帶到日常選擇中。` : ""} ${polarity}，可把它理解成處理事情時偏向主動外放或內收觀察的其中一個線索。`,
      career:`目前十神群組以${dominantGroup}較突出。${GROUP_TEXT[dominantGroup] || ""} 這比較適合用來理解工作偏好與壓力來源，不宜單憑一項就直接指定職業。`,
      finance:`財星在十神群組中的結構占比約 ${tenGod.groupPercentages["財星"] || 0}%。這代表「資源、交易、成果與現實回報」在命盤中的可見度；占比高低不等於一定有錢或沒錢，仍要配合日主承載、運勢與現實選擇。`,
      relationship:`傳統命理會綜合日支、財官、合沖刑害等資訊觀察關係模式。本盤日支為「${pillars[2]?.zhi || "—"}」，原局共有 ${relations.length} 組常見干支互動；本工具只呈現結構線索，不作婚姻成敗或特定事件的絕對斷語。`,
      learning:`印星占比約 ${tenGod.groupPercentages["印星"] || 0}%，食傷占比約 ${tenGod.groupPercentages["食傷"] || 0}%。前者常用來觀察吸收、方法與知識支持，後者則常用來觀察輸出、創作與表達，兩者的相對比例可作為學習方式的參考。`,
      note:"本頁的加權、支持度與結構分數屬網站規則式整理，用來把命盤資料視覺化；不同八字流派在格局、旺衰、喜用神與調候上可能有不同判法。"
    };
  }

  function buildDaYun(eight, gender, dayMaster, pillars) {
    try {
      const yun = eight.getYun(Number(gender), 2);
      const all = yun.getDaYun(9);
      const natalStems=pillars.map(p=>p.gan), natalBranches=pillars.map(p=>p.zhi);
      const cycles = all.filter(x => x.getIndex() > 0).slice(0,8).map(x => {
        const ganZhi=x.getGanZhi();
        const {gan,zhi}=splitGanZhi(ganZhi);
        return {
          ganZhi,gan,zhi,
          ganElement:GAN_ELEMENT[gan]||"",zhiElement:ZHI_ELEMENT[zhi]||"",
          tenGodGan:tenGodOfGan(dayMaster,gan),tenGodZhi:tenGodOfGan(dayMaster,branchMainGan(zhi)),
          startYear:x.getStartYear(),endYear:x.getEndYear(),startAge:x.getStartAge(),endAge:x.getEndAge(),
          xunKong:typeof x.getXunKong === "function" ? x.getXunKong() : "",
          interactions:interactionAgainstNatal(gan,zhi,natalStems,natalBranches)
        };
      });
      return {forward:yun.isForward(),startYears:yun.getStartYear(),startMonths:yun.getStartMonth(),startDays:yun.getStartDay(),startHours:yun.getStartHour(),startSolar:formatSolar(yun.getStartSolar()),cycles};
    } catch (err) {
      return {error:err&&err.message?err.message:String(err),cycles:[]};
    }
  }

  function interactionAgainstNatal(gan,zhi,natalStems,natalBranches){
    const out=[];
    natalStems.forEach((g,i)=>{
      const key=pairKey(gan,g);
      if(GAN_HE.has(key)) out.push(GAN_HE.get(key));
      if(GAN_CHONG.has(key)) out.push(GAN_CHONG.get(key));
    });
    natalBranches.forEach((b,i)=>{
      const key=pairKey(zhi,b);
      if(ZHI_LIUHE.has(key)) out.push(ZHI_LIUHE.get(key));
      if(ZHI_CHONG.has(key)) out.push(ZHI_CHONG.get(key));
      if(ZHI_HAI.has(key)) out.push(ZHI_HAI.get(key));
      if(ZHI_PO.has(key)) out.push(ZHI_PO.get(key));
      if(zhi===b && ["辰","午","酉","亥"].includes(zhi)) out.push(`${zhi}${zhi}自刑`);
    });
    return [...new Set(out)];
  }

  function getYearFlow(year, dayMaster, pillars){
    try{
      const solar=Solar.fromYmdHms(year,7,1,12,0,0); // 取立春後代表年柱
      const eight=solar.getLunar().getEightChar();
      const gan=typeof eight.getYearGan==="function"?eight.getYearGan():"";
      const zhi=typeof eight.getYearZhi==="function"?eight.getYearZhi():"";
      return {
        year,gan,zhi,ganZhi:`${gan}${zhi}`,
        tenGodGan:tenGodOfGan(dayMaster,gan),tenGodZhi:tenGodOfGan(dayMaster,branchMainGan(zhi)),
        element:GAN_ELEMENT[gan]||"",
        interactions:interactionAgainstNatal(gan,zhi,pillars.map(p=>p.gan),pillars.map(p=>p.zhi))
      };
    }catch(_){return {year,ganZhi:"—",interactions:[]};}
  }

  function buildYearFlows(input, dayMaster, pillars){
    const start=Math.max(new Date().getFullYear(), input.year);
    return Array.from({length:10},(_,i)=>getYearFlow(start+i,dayMaster,pillars));
  }

  function buildMonthFlows(year, dayMaster, pillars){
    const out=[];
    for(let m=1;m<=12;m++){
      try{
        const solar=Solar.fromYmdHms(year,m,15,12,0,0);
        const eight=solar.getLunar().getEightChar();
        const gan=typeof eight.getMonthGan==="function"?eight.getMonthGan():"";
        const zhi=typeof eight.getMonthZhi==="function"?eight.getMonthZhi():"";
        out.push({month:m,gan,zhi,ganZhi:`${gan}${zhi}`,tenGodGan:tenGodOfGan(dayMaster,gan),tenGodZhi:tenGodOfGan(dayMaster,branchMainGan(zhi)),interactions:interactionAgainstNatal(gan,zhi,pillars.map(p=>p.gan),pillars.map(p=>p.zhi))});
      }catch(_){out.push({month:m,ganZhi:"—",interactions:[]});}
    }
    return out;
  }

  function getJieInfo(lunar) {
    const out={};
    try{const prev=lunar.getPrevJie();if(prev)out.prev={name:prev.getName?prev.getName():"",solar:prev.getSolar?formatSolar(prev.getSolar()):""};}catch(_){}
    try{const next=lunar.getNextJie();if(next)out.next={name:next.getName?next.getName():"",solar:next.getSolar?formatSolar(next.getSolar()):""};}catch(_){}
    return out;
  }

  function cast(options) {
    if(typeof Solar === "undefined" || !Solar || typeof Solar.fromYmdHms !== "function") throw new Error("八字曆法核心尚未載入，請確認網路或 lunar-javascript 核心是否可用");
    const input=parseLocalDateTime(options.datetime);
    const gender=Number(options.gender)===0?0:1;
    const sect=Number(options.sect)===1?1:2;
    const solar=Solar.fromYmdHms(input.year,input.month,input.day,input.hour,input.minute,input.second);
    const lunar=solar.getLunar();
    const eight=lunar.getEightChar();
    if(typeof eight.setSect === "function") eight.setSect(sect);
    const pillars=[buildPillar(eight,"year"),buildPillar(eight,"month"),buildPillar(eight,"day"),buildPillar(eight,"time")];
    const dayMaster=pillars[2].gan;
    const fiveElements=visibleFiveElements(pillars);
    const weighted=weightedFiveElements(pillars);
    const tenGod=tenGodDistribution(dayMaster,pillars);
    const yinYang=yinYangDistribution(pillars);
    const relations=detectRelations(pillars);
    const scores=structureScores(dayMaster,weighted,tenGod,relations,pillars);
    const highlights=buildHighlights(dayMaster,weighted,tenGod,yinYang,scores,relations,pillars);
    const jie=getJieInfo(lunar);
    let lunarText="";
    try{lunarText=`${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;}catch(_){lunarText=lunar.toString?lunar.toString():"";}
    const currentYear=new Date().getFullYear();
    return {
      input,gender,sect,solarText:formatSolar(solar),lunarText,pillars,dayMaster,
      dayMasterElement:GAN_ELEMENT[dayMaster]||"",dayMasterYinYang:GAN_YINYANG[dayMaster]||"",
      fiveElements,weightedFiveElements:weighted,tenGodDistribution:tenGod,yinYang,relations,scores,highlights,
      taiYuan:typeof eight.getTaiYuan === "function" ? eight.getTaiYuan() : "",
      mingGong:typeof eight.getMingGong === "function" ? eight.getMingGong() : "",
      shenGong:typeof eight.getShenGong === "function" ? eight.getShenGong() : "",
      jie,daYun:buildDaYun(eight,gender,dayMaster,pillars),
      yearFlows:buildYearFlows(input,dayMaster,pillars),
      monthFlowYear:currentYear,
      monthFlows:buildMonthFlows(currentYear,dayMaster,pillars)
    };
  }

  window.BaziCore=Object.freeze({cast,GAN_ELEMENT,ZHI_ELEMENT,GAN_YINYANG,ZHI_YINYANG,ELEMENTS,TEN_GODS,HIDDEN_STEMS,TEN_GOD_TEXT,version:"2.0"});
})();
