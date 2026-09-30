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
    const y=+m[1], mo=+m[2], d=+m[3], h=+m[4], mi=+m[5];
    const leap=y%4===0&&(y%100!==0||y%400===0);
    const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if(y<1||mo<1||mo>12||d<1||d>days[mo-1]||h>23||mi>59)throw new Error('請輸入有效的出生日期與時間');
    return {year:y,month:mo,day:d,hour:h,minute:mi,second:0};
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
      return typeof fn === "function" ? traditional(fn.call(eight)) : null;
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
    return {weights, percentages};
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
    const values = Object.fromEntries(TEN_GODS.map(x => [x,raw[x]]));
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
  const GAN_HE = new Map([["己甲","甲己合土"],["乙庚","乙庚合金"],["丙辛","丙辛合水"],["丁壬","丁壬合木"],["戊癸","戊癸合火"]].map(([key,value])=>[pairKey(...key),value]));
  const GAN_CHONG = new Map([["庚甲","甲庚沖"],["乙辛","乙辛沖"],["丙壬","丙壬沖"],["丁癸","丁癸沖"]].map(([key,value])=>[pairKey(...key),value]));
  const ZHI_LIUHE = new Map([["丑子","子丑合"],["亥寅","寅亥合"],["卯戌","卯戌合"],["辰酉","辰酉合"],["巳申","巳申合"],["午未","午未合"]].map(([key,value])=>[pairKey(...key),value]));
  const ZHI_CHONG = new Map([["午子","子午沖"],["丑未","丑未沖"],["寅申","寅申沖"],["卯酉","卯酉沖"],["戌辰","辰戌沖"],["亥巳","巳亥沖"]].map(([key,value])=>[pairKey(...key),value]));
  const ZHI_HAI = new Map([["子未","子未害"],["丑午","丑午害"],["寅巳","寅巳害"],["卯辰","卯辰害"],["亥申","申亥害"],["戌酉","酉戌害"]].map(([key,value])=>[pairKey(...key),value]));
  const ZHI_PO = new Map([["子酉","子酉破"],["丑辰","丑辰破"],["寅亥","寅亥破"],["卯午","卯午破"],["巳申","巳申破"],["戌未","未戌破"]].map(([key,value])=>[pairKey(...key),value]));
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
      if(hit.length===3) out.push({type:"三合",tone:"good",label:r.name,positions:pillars.filter(p=>r.chars.includes(p.zhi)).map(p=>posName[p.key]+"支").join("＋")});
      else if(hit.length===2) out.push({type:hit.includes(r.chars[1])?"半合":"拱合",tone:"info",label:`${hit.join("、")}（${hit.includes(r.chars[1])?"半合":"拱合"}，未成完整三合局）`,positions:pillars.filter(p=>hit.includes(p.zhi)).map(p=>posName[p.key]+"支").join("＋")});
    });
    SANHUI.forEach(r=>{
      const hit=r.chars.filter(x=>zs.includes(x));
      if(hit.length===3) out.push({type:"三會",tone:"good",label:r.name,positions:pillars.filter(p=>r.chars.includes(p.zhi)).map(p=>posName[p.key]+"支").join("＋")});
    });
    const count=z=>zs.filter(x=>x===z).length;
    [["辰","辰辰自刑"],["午","午午自刑"],["酉","酉酉自刑"],["亥","亥亥自刑"]].forEach(([z,label])=>{
      if(count(z)>=2) out.push({type:"自刑",tone:"warn",label,positions:pillars.filter(p=>p.zhi===z).map(p=>posName[p.key]+"支").join("＋")});
    });
    const hasAll=arr=>arr.every(x=>zs.includes(x));
    if(hasAll(["寅","巳","申"])) out.push({type:"三刑",tone:"alert",label:"寅巳申三刑",positions:pillars.filter(p=>["寅","巳","申"].includes(p.zhi)).map(p=>posName[p.key]+"支").join("＋")});
    if(hasAll(["丑","戌","未"])) out.push({type:"三刑",tone:"alert",label:"丑戌未三刑",positions:pillars.filter(p=>["丑","戌","未"].includes(p.zhi)).map(p=>posName[p.key]+"支").join("＋")});
    if(zs.includes("子")&&zs.includes("卯")) out.push({type:"刑",tone:"warn",label:"子卯刑",positions:pillars.filter(p=>["子","卯"].includes(p.zhi)).map(p=>posName[p.key]+"支").join("＋")});
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
        year,kind:'year',referenceSolar:formatSolar(solar),
        startSolar:formatSolar(Solar.fromYmdHms(year,2,15,12,0,0).getLunar().getPrevJie().getSolar()),
        endSolar:formatSolar(Solar.fromYmdHms(year+1,2,15,12,0,0).getLunar().getPrevJie().getSolar()),
        gan,zhi,ganZhi:`${gan}${zhi}`,
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
        const jie=getJieInfo(solar.getLunar());
        out.push({kind:'month',year,month:m,referenceSolar:formatSolar(solar),startSolar:jie.prev?.solar||'',endSolar:jie.next?.solar||'',startJie:traditional(jie.prev?.name||''),endJie:traditional(jie.next?.name||''),yearGan:eight.getYearGan(),yearZhi:eight.getYearZhi(),gan,zhi,ganZhi:`${gan}${zhi}`,tenGodGan:tenGodOfGan(dayMaster,gan),tenGodZhi:tenGodOfGan(dayMaster,branchMainGan(zhi)),interactions:interactionAgainstNatal(gan,zhi,pillars.map(p=>p.gan),pillars.map(p=>p.zhi))});
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
    const data = {
      input,gender,sect,solarText:formatSolar(solar),lunarText,pillars,dayMaster,
      dayMasterElement:GAN_ELEMENT[dayMaster]||"",dayMasterYinYang:GAN_YINYANG[dayMaster]||"",
      fiveElements,weightedFiveElements:weighted,tenGodDistribution:tenGod,yinYang,relations,scores,highlights,
      taiYuan:typeof eight.getTaiYuan === "function" ? eight.getTaiYuan() : "",
      mingGong:typeof eight.getMingGong === "function" ? eight.getMingGong() : "",
      shenGong:typeof eight.getShenGong === "function" ? eight.getShenGong() : "",
      jie,daYun:buildDaYun(eight,gender,dayMaster,pillars),
      yearFlows:buildYearFlows(input,dayMaster,pillars),
      monthFlowYear:currentYear,
      monthCarry:buildMonthFlows(currentYear-1,dayMaster,pillars).at(-1),
      monthFlows:buildMonthFlows(currentYear,dayMaster,pillars)
    };
    attachPeriods(data);
    data.reading=buildLifeReading(data);
    data.highlights.summary=data.reading.summary;
    data.highlights.note=METHOD_NOTE;
    ['personality','career','finance','relationship','learning','relationText'].forEach((key,i)=>{const row=data.reading.rows[i];data.highlights[key]=row.text+' '+row.stuck;});
    return data;
  }

  // All report interpretations and period comparisons share this versioned rule set.
  const METHOD_NOTE = '本報告以常見八字象徵解釋生活傾向；百分比是本站藏干加權占比，並非能力、財富或事件機率。日主支持度只作扶抑方向參考，未完整判定格局、調候與喜用神。歲運評語在此規則下相對比較，不保證事件發生。';
  const GROUP_LIFE = {
    '比劫': {title:'自己掌握，重視自主',good:'需要獨立判斷、主動爭取或承擔決定時，較能展現立場與行動力。',stuck:'合作方法不同、權責沒有說清楚時，容易把討論變成主導權之爭。',work:'偏好能自己安排方法、看得見個人貢獻的工作；權責清楚時較能投入。',money:'容易把資源放在自己認同的人或計畫上，合夥分配與人情支出是較容易卡住的環節。',love:'相處時重視平等與自己的空間，容易用實際承擔表達在意；雙方都堅持自己的做法時，較難先讓步。'},
    '食傷': {title:'把想法說出來、做出來',good:'需要提案、創作、解說或改進方法時，較容易把想法轉成可見的表現。',stuck:'規則僵硬、說了卻不能改變現況時，容易失去耐性，或讓表達變成挑剔。',work:'偏好能輸出作品、展示技術或解決問題的工作；只要求服從卻沒有發揮空間時，較容易感到受限。',money:'較容易從作品、技術或服務建立交換價值；能否談清報價與交付範圍，會影響成果能否留下。',love:'相處時重視分享、回應與交流，較容易用言語或共同活動拉近距離；表達太快時，對方可能來不及消化。'},
    '財星': {title:'看重成果與實際回報',good:'需要盤點資源、處理客戶或完成具體目標時，較能抓到成本與成果的關係。',stuck:'回報不明、投入卻看不到成果時，容易焦慮，或把每件事都變成得失比較。',work:'偏好目標明確、成果可衡量的工作；對客戶需求、成本與交付較有感。',money:'資源與回報是較顯眼的命盤主題，優勢在重視收支和成果；壓力在想同時抓住太多機會或責任。',love:'相處時較看重生活安排、付出是否落實及彼此承諾；容易以解決問題表達關心，但也可能忽略情緒本身。'},
    '官殺': {title:'遇到責任與壓力會認真起來',good:'需要守住標準、處理急件或承擔責任時，較能集中注意力並推動事情。',stuck:'要求太多、期限太緊或標準互相衝突時，容易一直緊繃，也容易把要求帶到人際關係。',work:'偏好角色、標準與責任明確的環境；能承擔任務，但長期被催促或評價時壓力較大。',money:'較重視承諾、責任與可靠的收入安排；家庭或工作的固定負擔可能比單純追逐機會更牽動資源。',love:'相處時重視可靠、承諾與責任，常把事情做好視為關心；期待過高時，容易讓對方感到被要求。'},
    '印星': {title:'先理解，再形成自己的方法',good:'需要研究、整理資料或理解複雜問題時，較能耐心找出脈絡，累積專業。',stuck:'資料不齊卻必須立刻決定，或需要快速把想法說清楚時，容易卡在還想再確認。',work:'偏好能累積知識、研究方法或提供專業支援的工作；只催交付而不給理解時間時，較容易感到受阻。',money:'通常先看專業、品質與可靠性，再考慮如何換成回報；定價、成交與追蹤成果，可能不如研究本身自然。',love:'相處時重視理解、信任與被支持，較容易先分析對方的問題；當對方需要情緒回應時，可能感覺你在講道理。'}
  };
  function traditional(value) {
    if(Array.isArray(value)) return value.map(traditional);
    if(typeof value !== 'string') return value;
    const map={'杀':'殺','财':'財','伤':'傷','长':'長','养':'養','绝':'絕','临':'臨','带':'帶','钗':'釵','钏':'釧','蜡':'蠟','炉':'爐','头':'頭','涧':'澗','杨':'楊','剑':'劍','锋':'鋒','钅':'釒','灯':'燈','复':'覆','汉':'漢','驿':'驛','钏':'釧','银':'銀','腊':'臘','闰':'閏'};
    return value.replace(/[杀财伤长养绝临带钗钏蜡炉头涧杨剑锋灯复汉驿银腊闰]/g,c=>map[c]||c);
  }
  function groupOfGod(t){return ['比肩','劫財'].includes(t)?'比劫':['食神','傷官'].includes(t)?'食傷':['偏財','正財'].includes(t)?'財星':['七殺','正官'].includes(t)?'官殺':'印星';}
  function buildLifeReading(data){
    const gp=data.tenGodDistribution.groupPercentages, ps=data.tenGodDistribution.percentages;
    const top=Object.entries(ps).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
    const groups=Object.entries(gp).sort((a,b)=>b[1]-a[1]);
    const [g,v]=groups[0], life=GROUP_LIFE[g];
    const gap=gp['印星']-gp['食傷'];
    const learning=gap>=15?'理解與研究較自然，轉成說明或作品相對費力。例如已經知道問題在哪，卻還想補資料，或很難用幾句話讓別人跟上。':gap<=-15?'輸出與表達較自然，常在實作中學習。例如很快就有想法、願意示範，但需要完整說明依據或耐心補足細節時較容易卡住。':'吸收與輸出的占比落差不大，較能在理解與實作之間交替；實際節奏仍會受工作環境與經驗影響。';
    const dayRelations=data.relations.filter(r=>/日支/.test(r.positions));
    const pressure=dayRelations.filter(r=>/沖|刑|害|破/.test(r.label));
    const links=dayRelations.filter(r=>/合/.test(r.label));
    const relationBasis=dayRelations.map(r=>`${r.label}（${r.positions}）`).join('、');
    const relationText=pressure.length?'日支受到拉扯，關係中的生活安排、家庭期待或彼此節奏較容易需要協調；常見情境是感情本身沒有變，但外部安排改變後，原本的相處方式不再合用。':links.length?'日支有合的連結，關係較容易與其他生活領域一起考量；共同安排能增加連結，也可能讓彼此更難把自己的需要分開說清楚。':'目前沒有辨識到直接涉及日支的常見雙支合沖刑害，感情解讀以相處偏好為主，不能由此推定婚姻結果。';
    const money=gp['財星']<12?`${life.money} 財星占比較少，表示報酬與資源管理不是原局最醒目的主題；例如先把事做好、先幫上忙，最後才想到回報是否相稱。`:GROUP_LIFE['財星'].money;
    const rows=[
      {title:'性格與行動',text:life.title+'。'+life.good,stuck:life.stuck,basis:`${g} ${v}%；${top.slice(0,2).map(x=>x.join(' ')+'%').join('、')}`},
      {title:'工作與職涯',text:life.work,stuck:GROUP_LIFE[groups[1][0]].stuck,basis:`${g} ${v}%；${groups[1][0]} ${groups[1][1]}%`},
      {title:'財務與資源',text:money,stuck:gp['比劫']>=30?'自主與同儕力量也較突出，合作分配、替人承擔或共同花費，容易成為資源壓力。':gp['食傷']<12?'表達與輸出占比較少，知道很多或做得認真，未必能立即讓對方看見價值。':'成果、投入與回報不一定同步，最容易卡在對付出與所得的期待落差。',basis:`財星 ${gp['財星']}%；食傷 ${gp['食傷']}%；比劫 ${gp['比劫']}%`},
      {title:'感情與相處',text:life.love,stuck:relationText,basis:`日支 ${data.pillars[2].zhi}；${relationBasis||'未見直接日支雙支互動'}；${g} ${v}%`},
      {title:'學習與表達',text:learning,stuck:gap>=15?'需要即時發言、簡報或快速交付時，腦中的完整理解可能比外在成果走得更快。':gap<=-15?'需要長期閱讀、反覆查證或按照固定步驟學習時，容易覺得速度太慢。':'遇到的問題超過熟悉範圍時，仍可能在準備與行動之間猶豫。',basis:`印星 ${gp['印星']}%；食傷 ${gp['食傷']}%`},
      {title:'生活中的拉扯',text:data.relations.length?`原局有 ${data.relations.length} 項可見互動。${data.relations.filter(r=>/沖/.test(r.label)).length?'當家庭、工作與個人選擇不同步時，較容易需要重新安排優先順序。':'互動重點在不同生活領域如何連結，以及是否出現需要協調的慣性。'}`:'目前沒有辨識到常見原局互動，先以五行與十神的主要傾向理解這張盤。',stuck:life.stuck,basis:data.relations.map(r=>`${r.label}（${r.positions}）`).join('、')||'原局未見本站收錄的常見互動'}
    ];
    return {title:life.title,good:life.good,stuck:life.stuck,learning,rows,summary:`${data.dayMaster}${data.dayMasterElement}日主，十神以${top[0][0]}（${top[0][1]}%）最突出。這張盤的主要傾向是「${life.title}」。${life.good}`};
  }
  function periodRelations(gan,zhi,pillars){
    const out=[];
    const names={year:'年柱',month:'月柱',day:'日支',time:'時柱',luck:'大運',yearFlow:'流年'};
    const add=(label,type,p)=>out.push({label,type,key:p.key,position:names[p.key]||p.key});
    pillars.forEach(p=>{
      const gk=pairKey(gan,p.gan),zk=pairKey(zhi,p.zhi);
      [[GAN_HE,'合'],[GAN_CHONG,'沖']].forEach(([map,t])=>{if(map.has(gk))out.push({label:map.get(gk),type:t,key:p.key,position:p.key==='day'?'日干':names[p.key]||p.key});});
      [[ZHI_LIUHE,'合'],[ZHI_CHONG,'沖'],[ZHI_HAI,'害'],[ZHI_PO,'破']].forEach(([map,t])=>{if(map.has(zk))add(map.get(zk),t,p);});
      if(zhi===p.zhi&&['辰','午','酉','亥'].includes(zhi))add(`${zhi}${zhi}自刑`,'刑',p);
      if(pairKey(zhi,p.zhi)===pairKey('子','卯'))add('子卯刑','刑',p);
    });
    [['寅','巳','申'],['丑','戌','未']].forEach(chars=>{
      if(chars.includes(zhi)&&chars.every(c=>c===zhi||pillars.some(p=>p.zhi===c))){
        out.push({label:chars.join('')+'三刑',type:'刑',key:'combined',position:'歲運與命盤合看'});
      }
    });
    [...SANHE,...SANHUI].forEach(r=>{
      if(r.chars.includes(zhi)&&r.chars.every(c=>c===zhi||pillars.some(p=>p.zhi===c)))out.push({label:r.name,type:'會合',key:'combined',position:'歲運與命盤合看'});
    });
    return out;
  }
  function solarAt(text){const p=String(text).match(/\d+/g)?.map(Number);return p&&p.length>=3?Solar.fromYmdHms(p[0],p[1],p[2],p[3]||0,p[4]||0,p[5]||0):null;}
  function currentLuck(data,at){
    const stamp=at||formatSolar(Solar.fromYmdHms(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate(),new Date().getHours(),new Date().getMinutes(),0));
    return (data.daYun?.cycles||[]).find(c=>stamp>=c.startSolar&&stamp<c.endSolar);
  }
  function attachPeriods(data){
    const start=solarAt(data.daYun?.startSolar);
    (data.daYun?.cycles||[]).forEach((c,i)=>{
      c.kind='luck';c.startSolar=start?formatSolar(start.nextYear(i*10)):'';c.endSolar=start?formatSolar(start.nextYear((i+1)*10)):'';
      c.relations=periodRelations(c.gan,c.zhi,data.pillars);c.interactions=c.relations.map(r=>`${r.label}（${r.position}）`);
    });
    return data;
  }
  function assessment(data,item){
    const kind=item.kind||('month'in item?'month':'year'in item?'year':'luck');
    const stamp=item.referenceSolar||item.startSolar;
    const contexts=[];
    const luck=kind==='luck'?null:currentLuck(data,stamp);
    if(luck)contexts.push({...luck,key:'luck'});
    if(kind==='month'&&item.yearGan&&item.yearZhi)contexts.push({gan:item.yearGan,zhi:item.yearZhi,ganZhi:item.yearGan+item.yearZhi,key:'yearFlow'});
    const relations=periodRelations(item.gan,item.zhi,[...data.pillars,...contexts]);
    // A clash and a harm to the same pillar remain distinct; repeated targets are retained.
    const strain=relations.filter(r=>['沖','刑','害','破'].includes(r.type)).length;
    const help=relations.filter(r=>r.type==='合'||r.type==='會合').length;
    const groups=[...new Set([item.tenGodGan,item.tenGodZhi].filter(Boolean).map(groupOfGod))];
    const support=data.scores.support, gp=data.tenGodDistribution.groupPercentages;
    const direction=support>=54?'支持較足':support<47?'支持較少':'支持接近中間';
    const benefits=support>=54?{'比劫':-.5,'印星':-.5,'食傷':1,'財星':.8,'官殺':.5}:support<47?{'比劫':1,'印星':1,'食傷':-.35,'財星':-.5,'官殺':-.7}:{'比劫':.2,'印星':.2,'食傷':.4,'財星':.4,'官殺':.2};
    let score=[item.tenGodGan,item.tenGodZhi].filter(Boolean).reduce((s,t,i)=>s+benefits[groupOfGod(t)]*(i?.7:1),0);
    const reasons=[`${direction}（支持度 ${support}），${support>=54?'以表達、成果與承擔作為發揮方向':support<47?'以支援、學習與自主資源作為承接方向':'兼看輸出與支援的配合'}。`];
    groups.forEach(g=>{if(gp[g]>=38){score-=.25;reasons.push(`${g}原局已占 ${gp[g]}%，同類主題再出現，熟悉的優勢與慣性會一起放大。`);}});
    score-=Math.min(strain,6)*.35;
    // Combination indicates connection, not automatic auspiciousness: no '合' bonus.
    const label=score>=1.15&&strain<2?'較順':score>=.5&&strain<2?'偏順':score>=.5?'有利有壓力':score>=-.35&&strain<2?'平穩':score>=-1.1?'變動較大':'需留意';
    const cls={'較順':'fortune-best','偏順':'fortune-good','有利有壓力':'fortune-mixed','平穩':'fortune-steady','變動較大':'fortune-mixed','需留意':'fortune-watch'}[label];
    if(strain)reasons.push(`${strain} 項沖刑害破牽動${[...new Set(relations.filter(r=>['沖','刑','害','破'].includes(r.type)).map(r=>r.position))].join('、')}，增加協調與調整負擔。`);
    else reasons.push('目前列入的互動未見直接沖刑害破，評價主要來自十神主題與原局配合。');
    const topics={ '比劫':'自主決定、同儕合作與競爭','食傷':'作品、技術與表達','財星':'客戶、收入安排與資源交換','官殺':'職責、標準與任務壓力','印星':'進修、研究與專業支援'};
    const domains=[];
    const workGroup=groups.find(g=>['官殺','食傷','印星','財星'].includes(g))||groups[0];
    const workPressure=relations.filter(r=>['沖','刑','害','破'].includes(r.type)&&['month','luck','yearFlow','combined'].includes(r.key)).length;
    const workText={'比劫':'自主安排、分工與同儕競爭較受關注；有發揮空間時行動較快，分工不清時容易爭主導權。','食傷':'表達、技術或作品較有發揮題材；提案與交付更受注意，也容易因說法直接而碰到規則。','財星':'客戶需求、交付與成果要求較突出；機會往往伴隨成本、期限與回報的現實考驗。','官殺':'責任、考核與時限成為重點；能承擔時容易被看見，超出負荷時則會感到被要求。','印星':'學習、研究與專業整理較受關注；適合累積理解，但準備時間與成果期限可能互相拉扯。'};
    domains.push({name:'事業',label:workPressure?'推進伴隨調整':benefits[workGroup]>0?'較有發揮空間':'熟悉與壓力並存',text:workText[workGroup]||'延續原有工作主題。',basis:`${item.tenGodGan}、${item.tenGodZhi}；${workPressure?'工作位置或歲運背景有沖刑害破':'依十神主題觀察'}`});
    const hasMoney=groups.includes('財星'),hasOutput=groups.includes('食傷'),hasPeers=groups.includes('比劫');
    domains.push({name:'財務',label:hasMoney?(support<47?'機會伴隨負擔':'成果與收支受關注'):hasOutput?'能力轉成果':hasPeers?'分配與競爭':'以原有收支為主',text:hasMoney?'資源、客戶或回報議題較突出，會更在意投入是否值得；涉及的支出與承諾也可能同時增加。':hasOutput?'較有把技術、服務或作品拿出去的題材；能否形成收入，仍取決於需求、定價與交付。':hasPeers?'共同投入、分潤或同儕競爭較受關注，容易出現「出了多少力、應該分多少」的討論。':'本期沒有明顯財星或食傷主題，財務判讀以既有收入、學習成本或責任支出為主。',basis:`本期${groups.join('、')}；原局財星 ${gp['財星']}%，日主${direction}`});
    const dayR=relations.filter(r=>r.position==='日支');
    const dayStrain=dayR.filter(r=>['沖','刑','害','破'].includes(r.type)).length;
    const dayLink=dayR.some(r=>r.type==='合');
    domains.push({name:'感情',label:dayStrain?(dayLink?'連結與磨合並存':'磨合較多'):dayLink?'互動與連結增多':'以日常相處為主',text:dayStrain?'日支被沖刑害破牽動，較容易碰到相處節奏、生活安排或彼此期待需要協調的情境；有伴者看磨合，單身者看建立關係時的節奏差異。':dayLink?'日支出現合的連結，較容易把注意力放在陪伴、共同安排或關係的靠近；連結增加不等於必然遇見對象或結婚。':'未見直接牽動日支的雙支互動，感情先看日常相處。'+GROUP_LIFE[groups[0]||'印星'].love,basis:dayR.length?dayR.map(r=>`${r.label}（日支）`).join('、'):`日支 ${data.pillars[2].zhi} 未見直接雙支互動；參考${groups.join('、')}主題`});
    const contextText=kind==='luck'?'本命＋本步大運':`${luck?`大運 ${luck.ganZhi}`:'尚未起運或超出所列八步大運'}${kind==='month'?`；流年 ${item.yearGan||''}${item.yearZhi||''}`:''}`;
    return {score,label,cls,groups,gods:[item.tenGodGan,item.tenGodZhi],goodThemes:groups.map(g=>topics[g]),watchThemes:groups.map(g=>GROUP_LIFE[g].stuck),stats:{strain,help},relations,domains,reasons,contextText,interactionWatch:strain?'生活安排或合作方式較容易需要調整。':help?'互相牽引的題材較明顯，合作與生活安排需要一起考量。':''};
  }

  window.BaziCore=Object.freeze({cast,GAN_ELEMENT,ZHI_ELEMENT,GAN_YINYANG,ZHI_YINYANG,ELEMENTS,TEN_GODS,HIDDEN_STEMS,TEN_GOD_TEXT,GROUP_LIFE,METHOD_NOTE,traditional,assessment,currentLuck,periodRelations,getYearFlow,version:"2.1.0"});

})();
