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

  function castExact(options) {
    if(typeof Solar === "undefined" || !Solar || typeof Solar.fromYmdHms !== "function") throw new Error("八字曆法核心尚未載入，請確認網路或 lunar-javascript 核心是否可用");
    const input=parseLocalDateTime(options.datetime);
    const gender=Number(options.gender)===0?0:1;
    const sect=Number(options.sect)===1?1:2;
    const solar=Solar.fromYmdHms(input.year,input.month,input.day,input.hour,input.minute,input.second);
    const lunar=solar.getLunar();
    const eight=lunar.getEightChar();
    if(typeof eight.setSect === "function") eight.setSect(sect);
    const timeEight=sect===2&&input.hour===23?Solar.fromYmdHms(input.year,input.month,input.day,0,30,0).getLunar().getEightChar():eight;
    if(timeEight!==eight)timeEight.setSect(sect);
    const pillars=[buildPillar(eight,"year"),buildPillar(eight,"month"),buildPillar(eight,"day"),buildPillar(timeEight,"time")];
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

  // Annual signal grading v1: editorial weights, not probabilities or clinical risk.
  const ANNUAL_RULES={version:'annual-signals-1',weights:{沖:1.5,害:1,破:.75,刑:1.25,三刑:2.5},note:'本站命理訊號分級；非事件機率。合與會合不直接加吉分；同一關係同一位置去重，跨位置分別計算。大運只用作背景與流年互動，不把十年固定訊號逐年重複加總。'};
  function annualGrade(positive,negative){
    const net=positive-negative;
    return net<=-5?'大凶':net<=-1.5?'偏凶':net>=5?'大吉':net>=1.5?'偏吉':'平';
  }
  function annualSignals(data,item){
    const base=assessment(data,item),luck=currentLuck(data,item.referenceSolar||item.startSolar);
    const relations=[...new Map(base.relations.map(r=>[[r.type,r.label,r.position].join('|'),r])).values()];
    const pressure=relations.filter(r=>['沖','刑','害','破'].includes(r.type));
    const weight=r=>ANNUAL_RULES.weights[r.label.includes('三刑')?'三刑':r.type]||0;
    const buckets={};relations.forEach(r=>{const key=r.label.includes('三刑')?'三刑':r.label.includes('自刑')?'自刑':r.type==='會合'?(r.label.includes('三會')?'三會':'三合'):r.type;buckets[key]=(buckets[key]||0)+1;});
    const support=data.scores.support;
    const benefit=support>=54?{'比劫':-.5,'印星':-.5,'食傷':1,'財星':.8,'官殺':.5}:support<47?{'比劫':1,'印星':1,'食傷':-.35,'財星':-.5,'官殺':-.7}:{'比劫':.2,'印星':.2,'食傷':.4,'財星':.4,'官殺':.2};
    const groups=[item.tenGodGan,item.tenGodZhi].map(groupOfGod);
    const luckGroups=luck?[luck.tenGodGan,luck.tenGodZhi].map(groupOfGod):[];
    const signals=[];
    [item.tenGodGan,item.tenGodZhi].forEach((god,i)=>{
      const group=groups[i],b=benefit[group],value=b*(i?1.4:2);
      signals.push({label:`流年${i?'地支主氣':'天干'}${god}`,value,group,source:'年度十神'});
    });
    const same=groups.some(g=>benefit[g]>=.5&&luckGroups.includes(g));
    if(same)signals.push({label:'大運同類有利主題支持',value:1.6,source:'大運背景'});
    [...new Set(groups)].forEach(g=>{if(data.tenGodDistribution.groupPercentages[g]>=38)signals.push({label:`${g}原局集中再遇同類`,value:-.6,group:g,source:'原局偏重'});});
    const totalNegative=pressure.reduce((n,r)=>n+weight(r),0)+signals.filter(s=>s.value<0).reduce((n,s)=>n-s.value,0);
    const totalPositive=signals.filter(s=>s.value>0).reduce((n,s)=>n+s.value,0);
    const domain=(name,relevant,relationFilter)=>{
      let positive=0,negative=0;const evidence=[];
      signals.forEach(s=>{if(s.group&&!relevant.includes(s.group))return;if(!s.group&&!groups.some(g=>relevant.includes(g)))return;const v=s.value;positive+=Math.max(0,v);negative+=Math.max(0,-v);evidence.push({label:s.label,value:v});});
      pressure.filter(relationFilter).forEach(r=>{negative+=weight(r);evidence.push({label:r.label+'（'+r.position+'）',value:-weight(r)});});
      return {name,positive:+positive.toFixed(2),negative:+negative.toFixed(2),score:+(positive-negative).toFixed(2),grade:annualGrade(positive,negative),evidence};
    };
    const work=domain('工作',['官殺','食傷','財星','印星','比劫'],r=>['month','luck','combined'].includes(r.key));
    const money=domain('財務',['財星','食傷','比劫'],r=>r.key==='combined'||(data.pillars.find(p=>p.key===r.key)&&[data.pillars.find(p=>p.key===r.key).shiShenGan,...data.pillars.find(p=>p.key===r.key).shiShenZhi].some(g=>groupOfGod(g)==='財星')));
    // Relationship grading uses only direct day-branch pressure and links, not wealth=spouse assumptions.
    const dayPressure=pressure.filter(r=>r.position==='日支');
    const dayLinks=relations.filter(r=>r.position==='日支'&&r.type==='合');
    const relationship={name:'感情',positive:0,negative:+dayPressure.reduce((n,r)=>n+weight(r),0).toFixed(2),evidence:dayPressure.map(r=>({label:r.label+'（日支）',value:-weight(r)}))};
    relationship.score=-relationship.negative;relationship.grade=annualGrade(0,relationship.negative);relationship.links=dayLinks.length;
    const domains=[work,money,relationship];
    const cycles=data.daYun?.cycles||[],outside=cycles.length&&item.referenceSolar>=cycles.at(-1).endSolar;
    const grade=outside?'資料不足':annualGrade(totalPositive,totalNegative);
    if(outside)domains.forEach(d=>d.grade='資料不足');
    const tags=Object.entries(buckets).map(([name,count])=>`${name} ×${count}${['三刑','三合','三會'].includes(name)?'組':''}`);
    signals.filter(s=>s.value>0).forEach(s=>tags.push(s.label));
    const concentration=+(totalPositive+totalNegative).toFixed(2);
    const character=outside?'超出所列大運範圍':totalPositive>=3&&totalNegative>=3?'吉凶訊號都突出':totalNegative>=5?'壓力訊號高度集中':totalPositive>=5?'有利訊號高度集中':concentration>=3?'部分訊號較突出':'未見明顯集中';
    return {version:ANNUAL_RULES.version,year:item.year,grade,domains,relations,pressure,signals,tags,positive:+totalPositive.toFixed(2),negative:+totalNegative.toFixed(2),score:+(totalPositive-totalNegative).toFixed(2),concentration,character,outside,extreme:!outside&&[grade,...domains.map(d=>d.grade)].some(g=>g==='大吉'||g==='大凶'),context:base.contextText};
  }
  const HOUR_SLOTS=[['早子時','00:00–00:59','00:30','子'],['丑時','01:00–02:59','02:00','丑'],['寅時','03:00–04:59','04:00','寅'],['卯時','05:00–06:59','06:00','卯'],['辰時','07:00–08:59','08:00','辰'],['巳時','09:00–10:59','10:00','巳'],['午時','11:00–12:59','12:00','午'],['未時','13:00–14:59','14:00','未'],['申時','15:00–16:59','16:00','申'],['酉時','17:00–18:59','18:00','酉'],['戌時','19:00–20:59','20:00','戌'],['亥時','21:00–22:59','22:00','亥'],['晚子時（夜子）','23:00–23:59','23:30','子']];
  function slotDateTime(date,slot){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(Number(slot))||Number(slot)<0||Number(slot)>12)throw Error('請選擇有效的出生日期與時辰');
    return date+'T'+HOUR_SLOTS[Number(slot)][2];
  }

  function cast(options){
    if(options.timeSlot===undefined||options.timeSlot===null)return castExact(options);
    const index=Number(options.timeSlot),datetime=slotDateTime(options.date,index),data=castExact({...options,datetime});
    const slot=HOUR_SLOTS[index],range=slot[1].split('–');
    const signatures=range.map(time=>{const input=parseLocalDateTime(options.date+'T'+time),e=Solar.fromYmdHms(input.year,input.month,input.day,input.hour,input.minute,0).getLunar().getEightChar();e.setSect(data.sect);return [e.getYear(),e.getMonth(),e.getDay()].join('|');});
    data.timeInput={mode:'slot',index,label:slot[0],range:slot[1],representative:slot[2],boundaryUncertain:signatures[0]!==signatures[1]};
    if(data.pillars[3].zhi!==slot[3])throw Error('時辰與排盤結果不一致');
    return data;
  }

  function generateMasterReading(data) {
    if (!data || !data.pillars || data.pillars.length < 4) return null;
    const dm = data.dayMaster;
    const dmEl = GAN_ELEMENT[dm];
    const dmYy = GAN_YINYANG[dm];
    const ps = data.pillars;
    const wp = data.weightedFiveElements?.percentages || {};
    const tgDist = data.tenGodDistribution?.groupPercentages || {};
    const supportScore = data.scores?.support || 50;

    const dayPillar = ps[2].ganZhi;
    const dayZhi = ps[2].zhi;
    const monthPillar = ps[1].ganZhi;
    const monthZhi = ps[1].zhi;
    const monthTenGod = ps[1].shiShenGan || '偏印';

    let patternName = '';
    let isKuiGang = false;
    let isYangRen = false;
    let isJianLu = false;

    if (['庚戌','庚辰','戊戌','壬辰'].includes(dayPillar)) {
      isKuiGang = true;
      patternName = `${dayPillar}魁罡格`;
    } else if ((dm==='甲'&&monthZhi==='卯') || (dm==='庚'&&monthZhi==='酉') || (dm==='壬'&&monthZhi==='子') || (dm==='丙'&&monthZhi==='午') || (dm==='戊'&&monthZhi==='午')) {
      isYangRen = true;
      patternName = '羊刃格';
    } else if ((dm==='甲'&&monthZhi==='寅') || (dm==='乙'&&monthZhi==='卯') || (dm==='丙'&&monthZhi==='巳') || (dm==='丁'&&monthZhi==='午') || (dm==='庚'&&monthZhi==='申') || (dm==='辛'&&monthZhi==='酉') || (dm==='壬'&&monthZhi==='亥') || (dm==='癸'&&monthZhi==='子')) {
      isJianLu = true;
      patternName = '建祿格';
    } else {
      patternName = `${monthTenGod}格`;
    }

    const isStrong = supportScore >= 48;
    const strengthTitle = isStrong ? '身強' : '身弱';

    const earthPct = wp['土'] || 0;
    const metalPct = wp['金'] || 0;
    const waterPct = wp['水'] || 0;
    const woodPct = wp['木'] || 0;
    const firePct = wp['火'] || 0;

    let diseaseKey = '';
    let diseaseTitle = '';
    let diseaseDesc = '';

    if (dmEl === '金' && earthPct >= 30) {
      diseaseKey = '土重埋金';
      diseaseTitle = '土厚埋金之患（母慈滅子）';
      diseaseDesc = '印星（土）太多太重，土本來是生金的母親與貴人，但土多到極致反而會把庚金活埋（「母慈滅子」）。你最大的敵人往往是自己的固執、想太多、準備太久而不行動，或是被原生家庭/長輩的期待與框架壓得喘不過氣。';
    } else if (dmEl === '木' && waterPct >= 30) {
      diseaseKey = '水多木漂';
      diseaseTitle = '水多木漂之患';
      diseaseDesc = '印星（水）過於氾濫，木無立足之根。表面上想法極多、適應力強，但容易漂泊無定、計畫頻換，做事常欠缺實質的落腳點與深耕耐性。';
    } else if (dmEl === '火' && woodPct >= 30) {
      diseaseKey = '木多火塞';
      diseaseTitle = '木多火塞之患';
      diseaseDesc = '資源與顧慮過多，如同堆滿濕柴反而悶住火苗。思慮繁雜、包袱沉重，需要明確目標將雜亂的學識與人情梳理開來，才得以燃燒發光。';
    } else if (dmEl === '水' && metalPct >= 30) {
      diseaseKey = '金多水濁';
      diseaseTitle = '金多水濁（金寒水冷）之患';
      diseaseDesc = '印星生扶太甚，水氣寒冽凝結。外表冷靜孤傲，內心容易封閉、多疑，容易因防備心過重或自我要求太嚴，錯失許多主動結緣與開創的良機。';
    } else if (dmEl === '土' && firePct >= 30) {
      diseaseKey = '火炎土燥';
      diseaseTitle = '火旺土焦之患';
      diseaseDesc = '生扶的火過旺，厚土失去生機焦躁乾裂。脾氣急躁固執，看似堅定，但內在長期焦慮，極需潤澤與流動，否則容易在壓力和執念中自我消耗。';
    } else if (isStrong) {
      const domGroup = Object.entries(tgDist).sort((a,b)=>b[1]-a[1])[0]?.[0] || '比劫';
      diseaseKey = `${domGroup}過盛`;
      diseaseTitle = `${domGroup}太重之隱患`;
      diseaseDesc = `身旺而${domGroup}集中，做事主觀強烈、不甘屈就他人，容易獨斷專行、凡事硬扛，需特別防範個人英雄主義導致的孤立與人際阻力。`;
    } else {
      diseaseKey = '身弱難任財官';
      diseaseTitle = '身弱氣虛之承載考驗';
      diseaseDesc = '日主能量偏弱，外在環境的責任、期待或誘惑（財官）往往大於自身目前精力，容易心力交瘁、被外在要求牽著鼻子走，務必先培植底氣，切忌逞強硬扛。';
    }

    const headerTitle = isKuiGang
      ? `魁罡身強，${diseaseKey || '厚重有力'}`
      : `${patternName}${strengthTitle}，${diseaseKey || '氣勢雄厚'}`;

    const zhiCounts = {};
    ps.forEach(p => { zhiCounts[p.zhi] = (zhiCounts[p.zhi] || 0) + 1; });
    const zhiTextList = Object.entries(zhiCounts).map(([z, c]) => c > 1 ? `${c}大${ZHI_ELEMENT[z]}（${z}）` : `${ZHI_ELEMENT[z]}（${z}）`).join('、');
    const pillarsDropText = `日主是 ${dm}金（${dmYy}金），坐下是${dayZhi}土，日柱是標準的「${isKuiGang ? `${dayPillar}魁罡格` : dayPillar}」。\n月柱 ${monthPillar} 是純粹的燥厚之土（${monthTenGod}），地支更有 ${zhiTextList}。`;

    const conclusions = [];
    if (isKuiGang) {
      conclusions.push({
        label: '「你是極強的魁罡身旺盤」',
        text: '為人性格極具剛性、威嚴與魄力，做事原則極強、敢做敢當、不喜被拘束。'
      });
    } else if (isStrong) {
      conclusions.push({
        label: `「你是強健有力的${patternName}身旺盤」`,
        text: '個人主見明確、抗壓性強、做事有魄力與定見，不輕易隨波逐流，能在逆境中堅持自己的目標。'
      });
    } else {
      conclusions.push({
        label: `「你是細膩敏銳的${patternName}」`,
        text: '感受力豐富、為人圓融有彈性，擅長借力使力，但在高壓環境下需注意精力消耗與情緒邊界。'
      });
    }
    conclusions.push({
      label: `「${diseaseTitle}」`,
      text: diseaseDesc
    });

    const zhiChongPairs = [
      ['辰','戌','辰戌相沖'],['子','午','子午相沖'],['寅','申','寅申相沖'],
      ['卯','酉','卯酉相沖'],['巳','亥','巳亥相沖'],['丑','未','丑未相沖']
    ];
    const branchClashes = [];
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const p1 = ps[i], p2 = ps[j];
        for (const [z1, z2, cName] of zhiChongPairs) {
          if ((p1.zhi === z1 && p2.zhi === z2) || (p1.zhi === z2 && p2.zhi === z1)) {
            branchClashes.push({
              pos1: p1.key, pos2: p2.key,
              name: cName,
              zhi1: p1.zhi, zhi2: p2.zhi,
              pillar1: p1.ganZhi, pillar2: p2.ganZhi
            });
          }
        }
      }
    }

    let clashSectionTitle = '';
    let clashPillarsDrop = '';
    const realityLifePoints = [];
    let elementDepletedText = '';

    if (branchClashes.length > 0) {
      const clashZhis = [...new Set(branchClashes.flatMap(c => [c.zhi1, c.zhi2]))].join('');
      clashSectionTitle = `${clashZhis}沖引動的「人生領域動盪」`;
      clashPillarsDrop = `年支 ${ps[0].zhi}（${ZHI_ELEMENT[ps[0].zhi]}，內藏${(ps[0].hideGan||[]).join('、')}）與 月支 ${ps[1].zhi}（燥土）、日支 ${ps[2].zhi}（燥土） 形成緊密的沖剋相戰。`;

      if (branchClashes.some(c => (c.pos1 === 'year' && c.pos2 === 'month') || (c.pos1 === 'month' && c.pos2 === 'year'))) {
        realityLifePoints.push({
          label: '年柱 vs 月柱相沖（家業與祖蔭）：',
          text: '年柱代表祖輩、早年（1~16歲），月柱代表父母與出社會（17~32歲）。辰戌相沖代表離鄉背井之象，少年時期與家庭長輩理念容易有巨大摩擦，難以依靠祖蔭，多靠白手起家。'
        });
      }
      const dayClash = branchClashes.filter(c => c.pos1 === 'day' || c.pos2 === 'day');
      if (dayClash.length > 0) {
        realityLifePoints.push({
          label: '月柱 vs 日柱同支（戌戌）且逢年柱沖（夫妻宮震盪）：',
          text: '日支代表配偶宮與內心世界。兩戌沖一辰，配偶宮長期處於被震盪的狀態。命理師必須提醒：「感情婚姻晚婚為宜」，另一半個性容易與自己一樣硬，若雙方不懂得妥協，容易因原則問題產生劇烈摩擦；且需防婆媳或原生家庭（年月柱）介入婚姻。'
        });
      }

      const weakest = ELEMENTS.slice().sort((a,b) => (wp[a]||0) - (wp[b]||0))[0];
      const weakestPct = wp[weakest] || 0;
      elementDepletedText = `水氣被徹底沖絕：辰中原本微弱的「癸水」是此盤唯一的甘霖（僅占約 ${weakestPct}%），但被兩顆燥土戌一沖，辰中水氣被徹底拔除吸乾。這代表原本想要自由表達、發揮創意的輸出管道（食傷）容易受到家庭或社會現實責任的強力壓制。`;
    } else {
      clashSectionTitle = '四柱宮位結合五行氣勢流轉';
      clashPillarsDrop = `四柱干支相生相聚，年柱 ${ps[0].ganZhi}、月柱 ${ps[1].ganZhi}、日柱 ${ps[2].ganZhi}、時柱 ${ps[3].ganZhi} 各司其職。`;
      realityLifePoints.push({
        label: '宮位安定守成：',
        text: '原局地支無劇烈大沖，生活基石相對穩健，早年、青年至中年的起伏大多屬於循序漸進的挑戰，較少突發性的天翻地覆。'
      });
      elementDepletedText = `雖然地支無大沖，但各柱五行分布仍然呈現主客之勢，需隨大運流年引動來把握時機。`;
    }

    const healthWarnings = [];
    if (waterPct < 5) {
      healthWarnings.push({
        label: `泌尿生殖與腎水枯竭（水 ${waterPct}% 受重土剋絕）：`,
        body: '辰中癸水被戌中燥土與戊土夾攻剋死。相關預警：天生泌尿系統弱、腎氣不足、結石風險高，年紀稍長需特別留意攝護腺（男）或內分泌代謝功能，切忌長期憋尿與熬夜。'
      });
    } else if (waterPct > 35) {
      healthWarnings.push({
        label: `水多濕寒與心腎代謝（水旺占 ${waterPct}%）：`,
        body: '水旺過甚體質偏寒濕，容易水腫、血液循環遲緩、手腳冰冷，宜多曬太陽、保持規律有氧運動以行氣驅寒。'
      });
    }

    if (earthPct >= 30) {
      healthWarnings.push({
        label: `脾胃熱燥與腸胃病變（月日柱連環燥土，土占 ${earthPct}%）：`,
        body: `${monthPillar}、${dayPillar}兩柱全是燥土，加上時柱巳火生土。相關提醒：胃熱胃脹、消化系統脆弱、胃食道逆流，平時飲食切忌辛辣油膩與過量進補，體質偏燥熱體質。`
      });
    } else if (earthPct < 5) {
      healthWarnings.push({
        label: `脾胃運化不足（土氣微弱占 ${earthPct}%）：`,
        body: '土虛則中氣不足，脾胃吸收轉化功能欠佳，容易消化不良或食慾不振，三餐應定時定量，多攝取溫和易消化的食物。'
      });
    }

    if (woodPct < 6) {
      healthWarnings.push({
        label: `呼吸道與筋骨（強金剋弱木，木僅占 ${woodPct}%）：`,
        body: '土多金硬，八字原局藏干極微弱的乙木（肝膽、筋骨）受辛金、庚金猛烈剋伐。需提醒中年後預防筋骨僵硬酸痛、肝膽負擔過重、眼睛容易乾澀。'
      });
    }

    if (firePct > 35) {
      healthWarnings.push({
        label: `心血管熱燥與血壓波動（火旺占 ${firePct}%）：`,
        body: '火勢熾盛容易心浮氣躁、血壓波動或心血管負擔加重，宜少吃燥熱上火食材，隨時調解情緒壓力以平抑心火。'
      });
    }

    if (healthWarnings.length < 2) {
      healthWarnings.push({
        label: '呼吸道與皮膚屏障：',
        body: '注意金木交戰或燥濕切換時對呼吸道、氣管及皮膚的影響，保持空氣濕度與水分補充。'
      });
    }

    let diagDesc = '';
    let firstGod = '';
    let firstGodDesc = '';
    let secondGod = '';
    let secondGodDesc = '';
    let careerDesc = '';
    let luckyDir = '';

    if (isStrong) {
      if (dmEl === '金') {
        diagDesc = `此盤土重（${earthPct}%）、金旺（${metalPct}%），身極旺。\n最怕火來生土（火會加重厚土），也怕土再進來（土多直接窒息）。`;
        firstGod = '水（食神、傷官）';
        firstGodDesc = '用潤水來洗滌強金、滋潤燥土，並作為日主才華輸出的管道。';
        secondGod = '木（正財、偏財）';
        secondGodDesc = '用強木來疏鬆厚土，讓庚金破土而出，同時把才華落實為財富與成果。';
        careerDesc = '適合走「專業技術輸出、獨立創作、顧問、解決複雜問題」路線，而不是去傳統體制內當按部就班的行政職員（土多官殺重會讓他極度壓抑痛苦）。';
        luckyDir = '適合往北方（水）或東方（木）尋求發展機會。';
      } else if (dmEl === '木') {
        diagDesc = `此盤水木皆旺（水 ${waterPct}%、木 ${woodPct}%），身極強。最怕水多木漂，忌比劫爭奪。`;
        firstGod = '火（食神、傷官）';
        firstGodDesc = '用烈火通明洩木之秀氣，使滿腹才華得以昭顯於世，形成「木火通明」之大貴格。';
        secondGod = '土（財星）';
        secondGodDesc = '以厚土培木並固水，將宣洩之才華轉化為紮實可見的資產與事業根基。';
        careerDesc = '適合品牌開拓、文化傳媒、創意策劃、教育演說或高階營銷，發揮強大號召力。';
        luckyDir = '適合往南方（火）或中原/本地（土）拓展。';
      } else if (dmEl === '水') {
        diagDesc = `此盤金水雙盛（金 ${metalPct}%、水 ${waterPct}%），身旺至極。忌金再增寒，忌水再沖崩。`;
        firstGod = '木（食神、傷官）';
        firstGodDesc = '用茂盛之木疏導奔騰旺水，將衝動與智慧轉為技術發明與藝術創作。';
        secondGod = '火（財星）';
        secondGodDesc = '以溫火暖局調候，解凍寒冰之水，帶來溫暖人緣與實質財富回報。';
        careerDesc = '適合跨國商務、大數據運算、研發、流動性商業或自由職業，靈活自如。';
        luckyDir = '適合往東方（木）或南方（火）發展。';
      } else if (dmEl === '火') {
        diagDesc = `此盤木火通明（木 ${woodPct}%、火 ${firePct}%），身旺神強。忌木火助焰燃燒殆盡。`;
        firstGod = '土（食神、傷官）';
        firstGodDesc = '以潤土承接燥烈之火，化烈焰為溫潤能量，形成吐秀生金之勢。';
        secondGod = '金（財星）';
        secondGodDesc = '以真金被火所煉而成大器，展現強大求財手腕與決斷力。';
        careerDesc = '適合工程技術、商務談判、金融投資、演藝展示或專業顧問領域。';
        luckyDir = '適合往中央/西南（土）或西方（金）拓展。';
      } else {
        diagDesc = `此盤火土並重（火 ${firePct}%、土 ${earthPct}%），身厚氣雄。忌火再燒焦土。`;
        firstGod = '金（食神、傷官）';
        firstGodDesc = '以重金吐瀉厚土之秀氣，使笨重之土化為精緻器皿與專業能力。';
        secondGod = '水（財星）';
        secondGodDesc = '以清涼之水潤澤燥土，使萬物生長，財源廣進。';
        careerDesc = '適合精密研發、會計審計、專業架構師或獨立分析師。';
        luckyDir = '適合往西方（金）或北方（水）發展。';
      }
    } else {
      diagDesc = `此盤日主承載偏弱，受外部財官或耗洩影響甚大，最忌繼續加重壓制與消耗。`;
      firstGod = `${dmEl === '木' ? '水（正偏印）' : dmEl === '火' ? '木（正偏印）' : dmEl === '土' ? '火（正偏印）' : dmEl === '金' ? '土（正偏印）' : '金（正偏印）'}`;
      firstGodDesc = '以有力印星生身固本，提供知識後盾、長輩貴人提攜與穩定的心理安全感。';
      secondGod = `${dmEl}（比肩、劫財）`;
      secondGodDesc = '以同輩夥伴、團隊合作分擔壓力，互利共生，切忌單打獨鬥以卵擊石。';
      careerDesc = '適合背靠穩定組織平台、團隊協作、專業研究、特許行業或知名品牌保護傘下深耕發展。';
      luckyDir = '宜朝利於自身印比之方向尋求支持。';
    }

    return {
      pattern: {
        title: headerTitle,
        pillarsDrop: pillarsDropText,
        conclusions: conclusions
      },
      clash: {
        title: clashSectionTitle,
        pillarsDrop: clashPillarsDrop,
        realityLife: realityLifePoints,
        elementDepleted: elementDepletedText
      },
      health: {
        title: '精準健康預警：臟腑對應病灶（五行結合宮位）',
        intro: '命理師要能透過干支位置，說出客戶身體具體會出狀況的地方：',
        items: healthWarnings
      },
      usefulGod: {
        title: '抓出真正的「喜用神」與生涯抉擇建議',
        subtitle: '很多半調子命理師看到缺水就只會叫客戶補水，但合格命理師必須綜合四柱評估：',
        diagnosis: diagDesc,
        firstGod: firstGod,
        firstGodDesc: firstGodDesc,
        secondGod: secondGod,
        secondGodDesc: secondGodDesc,
        careerGuide: careerDesc,
        luckyDir: luckyDir
      }
    };
  }

  
  function generateElementMasterGuide(data) {
    if (!data || !data.pillars || data.pillars.length < 4) return null;
    const dm = data.dayMaster;
    const dmEl = GAN_ELEMENT[dm];
    const dmYy = GAN_YINYANG[dm];
    const ps = data.pillars;
    const wp = data.weightedFiveElements?.percentages || {};
    const supportScore = data.scores?.support || 50;
    const isStrong = supportScore >= 48;
    const strengthTitle = isStrong ? '身旺' : '身弱';

    // 排序五行
    const sorted = ELEMENTS.slice().sort((a,b) => (wp[b]||0) - (wp[a]||0));
    const e1 = sorted[0], e2 = sorted[1];
    const eLast = sorted[sorted.length - 1], ePenult = sorted[sorted.length - 2];
    const heavyPct = Math.round(((wp[e1]||0) + (wp[e2]||0)) * 10) / 10;
    const heavyDesc = `${e1}${e2}厚重`;
    const lackList = sorted.filter(e => (wp[e]||0) < 8);
    const lackDesc = lackList.length ? `局中缺${lackList.join('、')}` : `五行稍偏${eLast}`;

    // 尋找日支、時支的代表字
    const dayZhi = ps[2].zhi;
    const dayZhiEl = ZHI_ELEMENT[dayZhi];
    const timeZhi = ps[3].zhi;
    const timeZhiEl = ZHI_ELEMENT[timeZhi];

    let headerTitle = `${dm}金${strengthTitle}（${heavyDesc}、${lackDesc}）—— 專業命理開運與調和全攻略`;
    if (dmEl !== '金') {
      headerTitle = `${dm}${dmEl}${strengthTitle}（${heavyDesc}、${lackDesc}）—— 專業命理開運與調和全攻略`;
    }

    let coreMotto = '';
    let coreDetail = '';
    let firstGod = { name: '', title: '', intro: '', bullets: [] };
    let secondGod = { name: '', title: '', intro: '', bullets: [] };
    let thirdGod = { name: '', title: '', intro: '', bullets: [] };
    let checklist = [];

    if (dmEl === '金') {
      if (isStrong) {
        coreMotto = '禁忌土金，引水為泉，植木為樑，適火煉金';
        coreDetail = `此盤土金能量高達約 ${heavyPct}%，最忌再補「土（偏印/正印）與金（比劫/比肩）」——土來會徹底埋金、讓思維更加沉重窒息；金來會加劇比劫奪財、引發人際破耗。唯一的破局之道，在於以「水」為第一用神洗金潤土，以「木」為第二用神疏土生財，並善用日支之「火」淬鍊成器。`;

        firstGod = {
          name: '水',
          title: '智慧、流通與心性鬆綁',
          intro: '金太剛則易折，土太厚則壅塞。水是這輩子最重要的性靈修為，代表情緒的洩洪口與做事的彈性。',
          bullets: [
            { h: '放下執念，學會繞道而行', b: '遇事不硬碰硬、不與環境死磕。當感覺事情卡住時，提醒自己「流水遇石則繞，不損其奔騰」，妥協與轉彎不是認輸，而是最高級的策略。' },
            { h: '暢通表達，建立情緒出口', b: '五行缺水容易把壓力與委屈往肚子裡吞，最終化為內耗或暴躁。平時需建立傾訴機制，無論是找信任的朋友、專業諮詢，或是透過寫作、記錄將思緒排解出來，切忌悶在心中。' },
            { h: '柔和身段，練習刻意示弱', b: '庚辛金自尊極強，常給人難以靠近的距離感。學會主動傾聽他人意見，在人際溝通中多用提問代替斷言，留給他人三分餘地，也是為自己開闢活路。' }
          ]
        };

        secondGod = {
          name: '木',
          title: '落地執行、長期深耕與守財',
          intro: `時支「${timeZhi}${timeZhiEl}」是命局潛在的財富之根與破土工具。厚土需要木來疏鬆，否則才華永遠被掩埋。`,
          bullets: [
            { h: '打破空想，縮短「想法到行動」的距離', b: '印星重的人最容易過度規劃、在腦海中推演無數阻礙而遲遲不啟動。請堅持「先完成、再完美」，每有想法，24 小時內先邁出最小的一步。' },
            { h: '專注長期主義，戒除短線投機', b: '強金虎視眈眈，切忌追求賺快錢、高槓桿投資或盲目合夥分潤。資產配置應以穩定防禦、長線定投、實體資產為主，合約條款必須白紙黑字，切莫因講義氣而犧牲利益。' },
            { h: '適合發展領域', b: '需要長線累積、具結構性與落地深度的行業，如專業技術顧問、系統架構、教育培訓、文化出版、企劃設計、綠色產業、園藝木造等。' }
          ]
        };

        thirdGod = {
          name: '火',
          title: '規矩、提振與轉化',
          intro: `日支坐「${dayZhi}${dayZhiEl}」，內藏官殺之火。火能克制過旺的強金，但需要適度引導，避免與厚土混成焦燥。`,
          bullets: [
            { h: '化內耗為正向自律', b: '官殺火代表自我要求。不要把標準變成苛求自己的心魔，而要將其轉化為對專業的高標準輸出與正向影響力。' },
            { h: '借光取暖，保持心理陽光', b: '多接觸戶外陽光、進行有氧排汗運動，驅散命局厚土的陰沉與孤僻，讓內在充滿溫暖與包容力。' }
          ]
        };

        checklist = [
          { aspect: '開運貴人', method: '優先結交八字水旺（生於冬季亥、子月）或木旺（生於春季寅、卯月）的朋友、伴侶與合作夥伴。', purpose: '引進命局最匱乏的能量，幫助化解固執、帶來靈感與生財機遇。' },
          { aspect: '服裝配色', method: '日常穿搭以黑色、深藍色（屬水）與青綠色、草木綠（屬木）為首選；可點綴少許紅紫（屬火）；大幅減少大面積土黃、卡其、金銀與純白色。', purpose: '壓抑過強的土金燥氣，調和視覺與氣場平衡。' },
          { aspect: '居所風水', method: '居家或辦公桌適宜擺放流動流水景觀、小型魚缸、大葉綠色觀葉植物；保持室內光線明亮與空氣流通。', purpose: '滋潤室內氣場，以水潤土、以木疏土。' },
          { aspect: '身心調養', method: '養成游泳、水療、溫泉、泡澡的習慣；多安排至海邊、湖泊或森林步道散步；飲食多補充水分與黑芝麻、黑豆等滋陰補腎之物。', purpose: '針對「缺水燥土」可能引發的泌尿系統、腸胃消化與呼吸道脆弱進行體質調候。' }
        ];
      } else {
        // 金弱
        coreMotto = '禁忌木火，培土生金，引金固本，慎防水冷';
        coreDetail = `此盤日主金氣偏弱，受外部木（財星）耗、火（官殺）剋嚴重。最忌再盲目補水木或猛火剋金。破局之道在於以「土（印星）」為第一用神滋養身心，以「金（比劫）」為第二用神幫身奪權。`;
        firstGod = {
          name: '土', title: '築基、厚德與包容承接',
          intro: '土為金母，是身弱者最厚實的能量庇護所。',
          bullets: [
            { h: '專注本業積累，不盲目擴張', b: '身弱時切忌多線作戰，守住核心優勢方能立於不敗。' },
            { h: '借助貴人平台，團隊協同作戰', b: '多向資深長輩前輩請益，借助大機構或團隊的品牌支撐自己。' }
          ]
        };
        secondGod = {
          name: '金', title: '立界、勇斷與自信重塑',
          intro: '金為同儕助力，提供關鍵時挺身而出的膽識與骨氣。',
          bullets: [
            { h: '樹立心理邊界，敢於說不', b: '不再無底線討好妥協，清楚聲明個人底線。' },
            { h: '專案合夥，利益共享', b: '尋找互補盟友共同承擔風險，分進合擊。' }
          ]
        };
        thirdGod = {
          name: '水', title: '適度流通，避免凝滯',
          intro: '適量之水滋潤流通，但不可過多以免洩身太甚。',
          bullets: [
            { h: '保持靈動思維', b: '不因循守舊，在穩定框架內適度發揮靈活創意。' }
          ]
        };
        checklist = [
          { aspect: '開運貴人', method: '優先結交八字土旺（辰戌丑未月）或金旺（申酉月）的朋友與主管。', purpose: '補充自身氣力，提供貴人庇護與事業支撐。' },
          { aspect: '服裝配色', method: '日常穿搭多用土黃、米褐、暖白與金銀色系；減少大面積青綠與大紅。', purpose: '生旺本命元神，增強威儀與鎮定力。' },
          { aspect: '居所風水', method: '室內宜擺設黃水晶、陶瓷、厚實木石雕刻，保持客廳明亮穩固。', purpose: '厚植土金根基，安神固元。' },
          { aspect: '身心調養', method: '規律生活，避免熬夜勞碌；飲食多攝取山藥、根莖類、糙米溫潤健脾。', purpose: '健脾益肺，強固先天免疫屏障。' }
        ];
      }
    } else if (dmEl === '木') {
      if (isStrong) {
        coreMotto = '禁忌水木，引火通明，植土為財，適金修剪';
        coreDetail = `此盤木氣旺盛達 ${heavyPct}%，最忌再灌「水」生木或「木」比劫爭奪。破局之道在於以「火」為第一用神洩秀通明，以「土」為第二用神承接財富，並善用「金」修枝成樑。`;
        firstGod = {
          name: '火', title: '熱情、表達與才華通明',
          intro: '木火通明乃文彩斐然之象，把內在蓬勃想法轉化為耀眼影響力。',
          bullets: [
            { h: '勇於登台展現，擴大聲量', b: '不再隱藏實力，透過演講、內容創作或公開分享彰顯個人價值。' },
            { h: '以樂觀熱忱感染他人', b: '化解獨自生悶氣的慣性，用明朗正向的態度激勵團隊。' }
          ]
        };
        secondGod = {
          name: '土', title: '落實、深耕與資本轉化',
          intro: '茂盛之木需要厚土紮根，才華才能落地變現。',
          bullets: [
            { h: '堅持商業實用導向', b: '每項想法都必須對齊實際需求與獲利模式，避免曲高和寡。' },
            { h: '做好財富留存與資產布局', b: '把流動收益轉化為穩健不動產或優質資產。' }
          ]
        };
        thirdGod = {
          name: '金', title: '自律、聚焦與取捨裁減',
          intro: '金能修剪多餘枝節，使大樹向上昂揚。',
          bullets: [
            { h: '學會聚焦核心目標', b: '刪除無效社交與分散精力的旁枝末節，集中打爆單點。' }
          ]
        };
        checklist = [
          { aspect: '開運貴人', method: '優先結交八字火旺（巳午月）或土旺（辰戌丑未月）的合作夥伴。', purpose: '引動食傷生財大運，點石成金。' },
          { aspect: '服裝配色', method: '穿搭首選紅、粉、紫暖色調及米黃、大地色；減少大面積黑藍與墨綠。', purpose: '激發積極動能，轉化鬱結木氣。' },
          { aspect: '居所風水', method: '保持充足採光，擺設聚寶盆、暖光燈具或石雕茶盤。', purpose: '引火生土，聚氣生財。' },
          { aspect: '身心調養', method: '多安排戶外陽光運動，飲食多補充蕃茄、紅蘿蔔、枸杞等溫潤養氣食材。', purpose: '舒暢肝經，促進代謝與活力。' }
        ];
      } else {
        // 木弱
        coreMotto = '禁忌金土，引水灌溉，培木成林，慎防燥火';
        coreDetail = `此盤木弱受強金剋伐、厚土重耗。破局之道在於以「水（印星）」為第一用神滋潤養生，以「木（比劫）」為第二用神聚眾成林。`;
        firstGod = { name: '水', title: '涵養、充電與智慧汲取', intro: '久旱逢甘霖，身弱之木最需智慧養分灌注。', bullets: [{ h: '持續學習精進', b: '給自己充分充電與消化時間，不急於過早定論。' }, { h: '尋求慈長指引', b: '親近智者，在良師益友引領下少走彎路。' }] };
        secondGod = { name: '木', title: '抱團、同盟與互助共榮', intro: '獨木難支，唯有成林才能抵禦狂風驟雨。', bullets: [{ h: '依託社群力量', b: '融入志同道合的圈子，借同儕激勵提升行動力。' }, { h: '重塑自信脊梁', b: '肯定自身獨特優勢，不再自我懷疑。' }] };
        thirdGod = { name: '火', title: '微火暖神，不燥不烈', intro: '適度溫暖驅寒即可，切忌火烈焚身。', bullets: [{ h: '保持溫和熱忱', b: '在安穩中保有對生命的期待。' }] };
        checklist = [
          { aspect: '開運貴人', method: '多結交生於亥子月（水旺）或寅卯月（木旺）的朋友。', purpose: '灌注生機，強健心力。' },
          { aspect: '服裝配色', method: '以墨黑、深藍與翠綠、青碧為日常主色。', purpose: '生扶元神，凝神聚力。' },
          { aspect: '居所風水', method: '擺放水耕植物、綠植或書法墨寶，通風清爽。', purpose: '涵潤生機，蓄勢待發。' },
          { aspect: '身心調養', method: '充足睡眠，少熬夜傷肝；多飲水，多吃黑木耳、藍莓、深綠葉菜。', purpose: '滋養肝腎，疏筋活絡。' }
        ];
      }
    } else if (dmEl === '水') {
      if (isStrong) {
        coreMotto = '禁忌金水，引木疏導，引火暖局，適土為堤';
        coreDetail = `此盤金水過旺達 ${heavyPct}%，勢若奔騰汪洋。最忌金水再灌。破局之道在於以「木」為第一用神疏導旺勢，以「火」為第二用神暖局化寒，並善用「土」作為堤防規範。`;
        firstGod = { name: '木', title: '引導、創作與技術轉化', intro: '江海之水唯有順流疏導，方能化作推動巨輪的動力。', bullets: [{ h: '將直覺轉化為具體作品', b: '不再任由思緒飄散，用程式、設計、文字或產品落地呈現。' }, { h: '保持教學分享心態', b: '在輔導與輸出中整理自身龐雜知識。' }] };
        secondGod = { name: '火', title: '熱情、社交與財富暖局', intro: '水多則寒，唯有火光普照才能化冰雪為暖流，迎來繁榮財富。', bullets: [{ h: '積極走向真實市場', b: '主動參與商業合作，不甘於僅做幕後空想家。' }, { h: '溫暖表達同理心', b: '融化冰冷防備，拉近人際信任。' }] };
        thirdGod = { name: '土', title: '邊界、守規與擔當架構', intro: '堤防堅固，水流才不致泛濫成災。', bullets: [{ h: '訂定明確紀律目標', b: '以嚴謹時程表約束渙散節奏。' }] };
        checklist = [
          { aspect: '開運貴人', method: '優先結交八字木旺（寅卯月）或火旺（巳午月）的友人夥伴。', purpose: '疏導水性，溫暖心靈。' },
          { aspect: '服裝配色', method: '以青綠、翠色搭配熱情紅、橙橘色調；減少大面積黑白金灰。', purpose: '驅散寒氣，激發商務活力。' },
          { aspect: '居所風水', method: '多採用暖色光源，布置大型闊葉盆栽或香氛蠟燭。', purpose: '調和水氣，生旺木火。' },
          { aspect: '身心調養', method: '多到戶外曬太陽、進行熱瑜珈或快走；飲食多溫熱生薑、紅棗、桂圓。', purpose: '驅除體內寒濕，提升心腎陽氣。' }
        ];
      } else {
        coreMotto = '禁忌土火，引金生水，比劫幫扶，慎防乾涸';
        coreDetail = `此盤水弱受厚土圍困、燥火熬乾。破局之道在於以「金（印星）」為第一用神生水發源，以「水（比劫）」為第二用神匯流成川。`;
        firstGod = { name: '金', title: '凝練、標準與源遠流長', intro: '高山出泉，金生麗水，是水弱者源源不絕的智慧依靠。', bullets: [{ h: '鑽研硬核專業技術', b: '憑藉不可替代的硬實力立足。' }, { h: '依賴成熟制度規範', b: '在穩健規章中做事，避免無序內耗。' }] };
        secondGod = { name: '水', title: '聯網、借勢與靈活流動', intro: '涓涓細流匯入大江，借助團隊乘風破浪。', bullets: [{ h: '擴展人脈弱連結', b: '多接觸外界資訊，善用資訊差創造優勢。' }] };
        thirdGod = { name: '木', title: '適度舒展才性', intro: '有微木吐秀即可，切莫過度耗損。', bullets: [{ h: '保持好奇心', b: '隨喜參與感興趣的興趣探索。' }] };
        checklist = [
          { aspect: '開運貴人', method: '多結交申酉月（金旺）或亥子月（水旺）的朋友。', purpose: '引水思源，強健身心。' },
          { aspect: '服裝配色', method: '以純白、銀灰及海藍、曜黑為主色。', purpose: '增強冷靜專注與元氣防禦。' },
          { aspect: '居所風水', method: '擺放銅鐘、金屬風鈴、水晶球或清澈小型水景。', purpose: '金生水源，氣韻流暢。' },
          { aspect: '身心調養', method: '補充水分，充足作息；多食海帶、黑豆、百合、雪耳潤肺補水。', purpose: '潤燥養腎，強固循環機能。' }
        ];
      }
    } else if (dmEl === '火') {
      if (isStrong) {
        coreMotto = '禁忌木火，引土洩火，引金求財，適水既濟';
        coreDetail = `此盤木火能量強盛達 ${heavyPct}%。最忌再添木火烈焰。破局之道在於以「土」為第一用神洩火晦火，以「金」為第二用神熔金煉器生財，並善用「水」水火既濟。`;
        firstGod = { name: '土', title: '厚重、沉澱與收斂鋒芒', intro: '烈火需得厚土承納，將暴烈熱量轉化為滋養萬物的溫暖。', bullets: [{ h: '降躁戒急，先冷靜後表態', b: '情緒衝動時默數十秒，凡事不急於當下宣判對錯。' }, { h: '深耕專業成果', b: '把絢麗激情轉為可交付的文件、流程與實體產品。' }] };
        secondGod = { name: '金', title: '決斷、收穫與商業實踐', intro: '真金經烈火鍛造方成大器，是火旺者強大的財富戰場。', bullets: [{ h: '瞄準高價值商業目標', b: '敢於承擔大單交易與高難度談判。' }, { h: '落實績效數據考核', b: '用實實在在的成果說話。' }] };
        thirdGod = { name: '水', title: '既濟、冷靜與自我反思', intro: '水火相濟方能安詳長久。', bullets: [{ h: '培養沉靜冥想習慣', b: '透過靜坐定息平抑亢奮心神。' }] };
        checklist = [
          { aspect: '開運貴人', method: '多結交辰戌丑未月（土旺）或申酉月（金旺）的朋友夥伴。', purpose: '收斂心火，轉燥為富。' },
          { aspect: '服裝配色', method: '以米黃、咖啡、駝色搭配銀白、灰色；減少大紅大紫。', purpose: '平衡過度發散的火氣。' },
          { aspect: '居所風水', method: '布置陶瓷花瓶、大理石茶几，保持安靜涼爽氛圍。', purpose: '鎮定氣場，吸納躁氣。' },
          { aspect: '身心調養', method: '多游泳、散步、深呼吸，少吃麻辣燒烤，多飲綠豆湯、苦瓜降火。', purpose: '清心降火，保護心血管與神經。' }
        ];
      } else {
        coreMotto = '禁忌水金，引木生火，引火助陣，慎防水澆';
        coreDetail = `此盤火弱受強水撲滅、旺金耗神。破局之道在於以「木（印星）」為第一用神生火續焰，以「火（比劫）」為第二用神聚熱成輝。`;
        firstGod = { name: '木', title: '累積、閱讀與底蘊深潛', intro: '如得良柴添薪，身弱之火方能歷久不息。', bullets: [{ h: '廣泛汲取跨界知識', b: '透過深度閱讀建立扎實的方法論體系。' }, { h: '沉心靜氣打磨基礎', b: '不急於出名獲利，靜待春風吹拂。' }] };
        secondGod = { name: '火', title: '熱情、同心與抱團取暖', intro: '點點螢火聚集成炬，在夥伴支持中找回自信。', bullets: [{ h: '主動向正能量圈靠攏', b: '遠離抱怨消極環境，感受熱忱激勵。' }] };
        thirdGod = { name: '土', title: '適度承載轉換', intro: '微土固本，轉化熱能。', bullets: [{ h: '按部就班行動', b: '從小事成就感建立穩定節奏。' }] };
        checklist = [
          { aspect: '開運貴人', method: '優先結交寅卯月（木旺）或巳午月（火旺）的貴人。', purpose: '添柴加火，重煥生機。' },
          { aspect: '服裝配色', method: '穿搭首選草綠、森林綠及溫暖棗紅、亮橙色。', purpose: '生扶心陽，神采奕奕。' },
          { aspect: '居所風水', method: '採光良好，多擺放生機綠植、暖調木質傢俱與藝術畫作。', purpose: '木火相生，朝氣蓬勃。' },
          { aspect: '身心調養', method: '多接觸大自然與陽光，飲食補充櫻桃、紅棗、核桃、熱粥。', purpose: '溫補脾心，驅除體寒。' }
        ];
      }
    } else {
      // dmEl === '土'
      if (isStrong) {
        coreMotto = '禁忌火土，引金洩秀，引水為財，適木疏土';
        coreDetail = `此盤火土厚重重疊達 ${heavyPct}%。最忌火再炙烤厚土。破局之道在於以「金」為第一用神開採秀氣，以「水」為第二用神滋養生財，並善用「木」疏鬆板結厚土。`;
        firstGod = { name: '金', title: '精雕、效率與專業突破', intro: '厚土藏金，需得巧匠開採打磨，方顯千古奇珍。', bullets: [{ h: '打破保守沉悶，追求高效俐落', b: '凡事追求流程化、工具化，減少冗贅流程。' }, { h: '鍛鍊犀利分析思維', b: '敢於一針見血指出關鍵瓶頸。' }] };
        secondGod = { name: '水', title: '滋潤、流通與財源廣進', intro: '燥土得甘露滋潤，始有生機萬千。', bullets: [{ h: '積極開拓流動性商業機會', b: '擁抱跨界市場，建立多元收益管道。' }, { h: '靈活因應外在變化', b: '打破僵固框架，隨順形勢起舞。' }] };
        thirdGod = { name: '木', title: '秩序、革新與突破固化', intro: '林木深扎，土質疏鬆通氣。', bullets: [{ h: '主動擁抱新工具新挑戰', b: '走出舒適圈，讓思維煥然一新。' }] };
        checklist = [
          { aspect: '開運貴人', method: '優先結交申酉月（金旺）或亥子月（水旺）的朋友夥伴。', purpose: '開山見寶，點土成金。' },
          { aspect: '服裝配色', method: '以純白、銀色、藏青、玄黑為主色；少穿土黃、赭紅。', purpose: '消解笨重滯氣，增添靈秀。' },
          { aspect: '居所風水', method: '金屬工藝擺飾、微型噴泉、流水盆景，室內開窗透氣。', purpose: '流通氣場，以水潤土。' },
          { aspect: '身心調養', method: '慢跑、伸展運動，飲食多補充白木耳、海藻、蓮藕、多喝清茶。', purpose: '滋陰清熱，調理脾胃與呼吸道。' }
        ];
      } else {
        coreMotto = '禁忌木水，引火生土，比肩固土，慎防傾頹';
        coreDetail = `此盤土氣羸弱，受強木重剋、大水沖蝕。破局之道在於以「火（印星）」為第一用神生身固土，以「土（比劫）」為第二用神築堤固基。`;
        firstGod = { name: '火', title: '溫暖、信念與貴人烘托', intro: '得暖陽照耀，凍土方能孕育生機。', bullets: [{ h: '樹立不可動搖的信念', b: '在逆境中堅守初心，不為外境動搖。' }, { h: '主動向長者與主管爭取支持', b: '以誠懇贏得貴人傾力相助。' }] };
        secondGod = { name: '土', title: '厚德、扎根與踏實穩行', intro: '聚沙成塔，在腳踏實地中累積底氣。', bullets: [{ h: '專注單一領域穩紮穩打', b: '不急功近利，以匠人精神磨鍊本領。' }] };
        thirdGod = { name: '金', title: '適度自保禦敵', intro: '金能抗木護土，提供防衛底氣。', bullets: [{ h: '守好規則原則', b: '用清清楚楚的標準保護自己。' }] };
        checklist = [
          { aspect: '開運貴人', method: '多結交巳午月（火旺）或辰戌丑未月（土旺）的朋友。', purpose: '生扶基石，安穩心神。' },
          { aspect: '服裝配色', method: '以明亮紅、橙橘及溫暖卡其、駝色為主。', purpose: '驅寒除濕，充盈氣血。' },
          { aspect: '居所風水', method: '暖色光源、厚實地毯、陶瓷聚寶盆、石雕。', purpose: '安座泰山，基業長青。' },
          { aspect: '身心調養', method: '三餐定時，飲食多吃南瓜、黃豆、紅棗、茯苓，養護中焦脾胃。', purpose: '強健脾陽，提升運化吸收。' }
        ];
      }
    }

    return {
      headerTitle,
      coreMotto,
      coreDetail,
      firstGod,
      secondGod,
      thirdGod,
      checklist
    };
  }

  window.BaziCore=Object.freeze({annualSignals,annualGrade,ANNUAL_RULES,HOUR_SLOTS,slotDateTime,cast,generateMasterReading,generateElementMasterGuide,GAN_ELEMENT,ZHI_ELEMENT,GAN_YINYANG,ZHI_YINYANG,ELEMENTS,TEN_GODS,HIDDEN_STEMS,TEN_GOD_TEXT,GROUP_LIFE,METHOD_NOTE,traditional,assessment,currentLuck,periodRelations,getYearFlow,version:"2.5.0"});

})();
