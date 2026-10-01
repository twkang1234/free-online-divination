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

  
  function generateTenGodMasterGuide(data) {
    if (!data || !data.tenGodDistribution || !data.pillars) return null;
    const dm = data.dayMaster;
    const dmEl = GAN_ELEMENT[dm];
    const ps = data.tenGodDistribution.percentages || {};
    const gp = data.tenGodDistribution.groupPercentages || {};
    const wp = data.weightedFiveElements?.percentages || {};

    // 排序所有十神
    const sortedGods = TEN_GODS.slice().map(t => [t, Number(ps[t]) || 0]).sort((a,b) => b[1] - a[1]);
    const topGod = sortedGods[0] || ['偏印', 0];
    const secondGod = sortedGods[1] || ['劫財', 0];
    const thirdGod = sortedGods[2] || ['七殺', 0];

    // 排序五行
    const sortedEls = ELEMENTS.slice().map(e => [e, Number(wp[e]) || 0]).sort((a,b) => b[1] - a[1]);
    const topEl = sortedEls[0] || [dmEl, 0];
    const secondEl = sortedEls[1] || [dmEl, 0];
    const weakEl = sortedEls[sortedEls.length - 1] || ['水', 0];

    // 排序五大十神群組
    const groups = ['比劫', '食傷', '財星', '官殺', '印星'];
    const sortedGroups = groups.slice().map(g => [g, Number(gp[g]) || 0]).sort((a,b) => b[1] - a[1]);
    const topGroup = sortedGroups[0] || ['印星', 0];
    const weakGroup = sortedGroups[sortedGroups.length - 1] || ['食傷', 0];

    // 對應最弱群組的十神名稱
    const groupGodMap = {
      '比劫': ['比肩', '劫財'],
      '食傷': ['食神', '傷官'],
      '財星': ['偏財', '正財'],
      '官殺': ['七殺', '正官'],
      '印星': ['偏印', '正印']
    };
    const weakGodNames = groupGodMap[weakGroup[0]] || ['食神', '傷官'];
    const weakGodsPct = Math.round(((ps[weakGodNames[0]] || 0) + (ps[weakGodNames[1]] || 0)) * 10) / 10;

    // 核心系統比喻與底層邏輯
    const metaphorMap = {
      '偏印': '超級電腦',
      '正印': '中央智慧資料庫',
      '比肩': '重裝獨立伺服器',
      '劫財': '高頻博弈引擎',
      '食神': '深度研發工匠室',
      '傷官': '超頻顛覆處理器',
      '偏財': '商業調度中心',
      '正財': '高精度精算系統',
      '七殺': '戰略反恐指揮塔',
      '正官': '秩序合規主控台'
    };

    const coreLogicMap = {
      '偏印': '先解構，再建構；沒有驗證過的資訊，我不信。',
      '正印': '以厚德承載，追求長遠安全與體制認同；先吸收涵養，不急於浮誇爭功。',
      '比肩': '獨立自主，人人平等；我的地盤我做主，不隨波逐流，堅持親力親為。',
      '劫財': '尊嚴與勝負欲極強，遇強則強，習慣單打獨鬥，凡事不甘居人後。',
      '食神': '追求純粹、舒適與審美；注重精神品質與手藝打磨，順其自然不喜被強迫。',
      '傷官': '打破常規，追求極致突破；討厭平庸與束縛，敢於挑戰權威與既定框架。',
      '偏財': '敏銳捕捉商機，靈活整合資源；看大局、重實效，善於以小博大。',
      '正財': '踏實精確，風險控制第一；凡事講求SOP、性價比與可預期的穩定收益。',
      '七殺': '危機感驅動，敢於直面硬仗；以結果為導向，崇尚實力、抗壓與雷厲風行。',
      '正官': '追求秩序、榮譽與體制規範；顧全大局，重視道德底線與社會公信力。'
    };

    const behaviorModeMap = {
      '偏印': '偏印代表非傳統的學習與吸收。命主的大腦就像一台高效能的伺服器，遇到任何問題，第一反應不是情緒化，而是「進入研究狀態」。他們會不斷地拆解、比較、跨領域搜尋資料，試圖找出事物運作的底層規律。',
      '正印': '正印代表深厚扎實的傳統吸納與沉澱。大腦就像一座海納百川的圖書館，凡事講求脈絡、傳承與信用，遇事沉得住氣，善於傾聽與消化他人需求，不輕易動怒。',
      '比肩': '比肩代表自我意志的高度篤定。思維獨立如頑石，遇到歧見或挑戰時，習慣以自己的準則來衡量，不喜仰賴他人施捨，凡事親力親為，堅持走自己的路。',
      '劫財': '劫財代表強大的群體競爭本能與敏銳直覺。大腦時刻處於高度警覺與爭取狀態，善於在人際場域中捕捉先機，遇逆境不低頭，具有極強的號召力與防衛心。',
      '食神': '食神代表細膩的專注力與感知力。做事講求沉浸與條理，遇事善於內化自省，注重精神共鳴與手藝打磨，不喜與人勾心鬥角，傾向於用專業與才華服人。',
      '傷官': '傷官代表天馬行空的靈感與批判力。大腦永遠在尋找現有機制的漏洞與創新機會，反應奇快、一針見血，討厭繁文縟節與愚蠢的規範，常有驚世駭俗之創見。',
      '偏財': '偏財代表開放宏觀的商業嗅覺。思維不拘泥於細節，善於審時度勢、借力使力，在複雜的人事與市場中快速抓住核心槓桿，人際圓滑、敢於冒險搏大。',
      '正財': '正財代表條理分明的精確計算與落地耐力。遇到任何任務，第一反應是評估成本效益、制定清晰路徑，凡事講求按部就班與可靠性，是團隊中最值得信任的定海神針。',
      '七殺': '七殺代表雷厲風行的危機應變能力。平時自帶不怒自威的氣場，在險境或重壓之下反而心明眼亮、果斷亮劍，執行力與破局魄力極為驚人。',
      '正官': '正官代表嚴謹自律的制度思維與大局觀。行事光明磊落，講求原則、承諾與責任，善於在既有體系中協調各方利益，贏得長輩與同儕的高度認可。'
    };

    // 五行交融深度剖析
    let fiveElBlendOne = '';
    if (topEl[0] === '土' && (topGod[0] === '偏印' || topGod[0] === '正印')) {
      fiveElBlendOne = `土主「承載與思考」。${topEl[1]}%的土配上${topGod[1]}%的${topGod[0]}，意味著命主的思考極具深度與廣度，但同時也帶來了「土多金埋」或「厚土壅塞」的沉重感。這會導致一個致命的行為卡點：「想得太多，做得太少」。因為大腦運轉太快，總覺得還沒準備好、還沒研究透徹，因此遲遲不願出手，或是對既有的SOP缺乏耐心，喜歡自己另闢蹊徑。`;
    } else if (topEl[0] === '金' && (topGod[0] === '比肩' || topGod[0] === '劫財')) {
      fiveElBlendOne = `金主「剛毅、決斷與原則」。${topEl[1]}%的金配上${topGod[1]}%的${topGod[0]}，意味著命主的性格極具剛性、威嚴與魄力，做事原則極強，不喜被拘束。但這同時帶來了「過剛則折」的沉重感，容易在人際相處中顯得過於銳利硬朗，不自覺給周遭帶來威壓感。`;
    } else if (topEl[0] === '木') {
      fiveElBlendOne = `木主「生發、仁慈與向上規劃」。${topEl[1]}%的木配上${topGod[1]}%的${topGod[0]}，命主思維活躍、富有遠見和擴張欲；但木旺缺乏收斂時，容易想法繁雜、多線展開而難以聚焦收尾。`;
    } else if (topEl[0] === '火') {
      fiveElBlendOne = `火主「熱烈、光明與感染力」。${topEl[1]}%的火配上${topGod[1]}%的${topGod[0]}，行動如電光石火、極具感染力與號召力；但火急易躁，需防耐心不足或情緒波動過於猛烈。`;
    } else {
      fiveElBlendOne = `水主「智慧、靈動與深層滲透」。${topEl[1]}%的水配上${topGod[1]}%的${topGod[0]}，直覺極敏銳、擅長隨機應變；但水多漫溢時容易思緒渙散、情緒悶沉，缺乏定力守成。`;
    }

    // 第二段：行動與防禦機制
    let actionTitle = `披著「${secondGod[0]}」外衣的「${thirdGod[0]}」戰士`;
    if (secondGod[0] === '食神' || secondGod[0] === '傷官') {
      actionTitle = `以「${secondGod[0]}」為鋒刃的「${thirdGod[0]}」開拓者`;
    } else if (secondGod[0] === '正財' || secondGod[0] === '偏財') {
      actionTitle = `以「${secondGod[0]}」為抓手的「${thirdGod[0]}」操盤手`;
    } else if (secondGod[0] === '正官' || secondGod[0] === '七殺') {
      actionTitle = `具備「${secondGod[0]}」威儀與「${thirdGod[0]}」底氣的執行者`;
    }

    let actionLogic = '尊嚴與勝負欲極強，遇強則強，習慣單打獨鬥。';
    if (secondGod[0] === '偏財' || secondGod[0] === '正財') {
      actionLogic = '追求務實產出與資源回報，拒絕無意義的消耗，以結果衡量價值。';
    } else if (secondGod[0] === '食神' || secondGod[0] === '傷官') {
      actionLogic = '追求思想自主與靈感具象化，不甘受限於平庸框架，以創意征服挑戰。';
    }

    // 第二段 行為模式
    let actionBehaviorOne = `${secondGod[0]}（${secondGod[1]}%）+ ${secondEl[0]}（${secondEl[1]}%）：${secondEl[0]}主${secondEl[0] === '金' ? '意氣、剛硬' : secondEl[0] === '木' ? '生機、仁義' : secondEl[0] === '水' ? '智慧、變通' : secondEl[0] === '火' ? '熱情、守禮' : '承載、信用'}。${secondGod[0]}代表自我意識強烈、不甘示弱、敢於競爭。這使得命主在群體中往往帶有一種「傲氣」，不容易輕易妥協。`;
    if (secondGod[0] !== '劫財') {
      actionBehaviorOne = `${secondGod[0]}（${secondGod[1]}%）+ ${secondEl[0]}（${secondEl[1]}%）：${secondEl[0]}賦予命主${secondEl[0] === '金' ? '果決俐落' : secondEl[0] === '木' ? '蓬勃生機' : secondEl[0] === '水' ? '靈活應變' : secondEl[0] === '火' ? '熱烈直率' : '沉穩踏實'}的作風。${secondGod[0]}調動了強烈的執行意志，在關鍵時刻能迅速切入核心。`;
    }

    let actionBehaviorTwo = `${thirdGod[0]}（${thirdGod[1]}%）：${thirdGod[0]}是壓力、規矩與挑戰。當遇到困難或明確的敵人時，${thirdGod[0]}的能量會瞬間爆發，讓命主進入極度專注的「戰鬥狀態」，展現出強大的執行力與抗壓性。`;

    // 第二段 五行交融（格局化學反應）
    let actionBlend = '';
    const hasKill = ps['七殺'] > 10;
    const hasSeal = (ps['偏印'] || 0) + (ps['正印'] || 0) > 25;
    const hasOutput = (ps['傷官'] || 0) + (ps['食神'] || 0) > 15;
    const hasWealth = (ps['偏財'] || 0) + (ps['正財'] || 0) > 15;
    const hasPeer = (ps['比肩'] || 0) + (ps['劫財'] || 0) > 20;

    if (hasKill && hasSeal) {
      actionBlend = `這裡有一個非常關鍵的命理現象——「殺印相生」（火生土，土生金）。${ps['七殺']}%的七殺（火）本來是來剋${dm}金的，但中間隔著強大的偏印（土），火氣被土吸收，轉而去生扶日主。這意味著：命主能將外界的巨大壓力、批評或危機，轉化為自我成長的養分（印）。他們是那種「越挫越勇，在壓力下反而能冷靜產出」的類型。`;
    } else if (hasOutput && hasWealth) {
      actionBlend = `這裡展現出標準的「食傷生財」格局動力。食傷之才華與靈感源源不絕，化為推動商業實踐與資源變現的澎湃動力。命主能夠把抽象的點子轉化為具體的世俗回報，具有極強的市場嗅覺。`;
    } else if (hasOutput && hasSeal) {
      actionBlend = `此處呈現「傷官配印」的高階思維模型。奔放銳利、敢於顛覆的創新衝勁，被深厚嚴謹的印星深度涵養與收斂，化為具有極高專業門檻的深度作品，既有鋒芒又具備深度底蘊。`;
    } else if (hasPeer && hasOutput) {
      actionBlend = `此處展現「比劫生食傷」的群體號召格局。同儕夥伴的認同與自信心，轉化為大膽輸出、揮灑才華的強大驅動力，善於帶領團隊攻城掠地。`;
    } else {
      actionBlend = `命局次強力量與主導星之間形成互補鏈條，當面對外部挑戰時，能迅速調動內部儲備的底蘊轉化為外顯防禦力，在逆境與壓力下表現出遠超常人的韌性。`;
    }

    // 第三段：致命傷與能量黑洞
    let holeTitle = `被封印的「${weakGroup[0]}」（${weakEl[0]}${weakEl[1]}% + ${weakGroup[0]}${weakGroup[1]}%）`;
    let holeLogic = '內部運算過載，但缺乏對外的「輸出介面」。';
    let holeMissingTitle = '表達與變通的缺失';
    let holeMissingText = `${weakGroup[0]}代表表達、創作、展示、社交潤滑與情緒宣洩。${weakEl[0]}${weakEl[1]}%，意味著命主內心即便有萬馬奔騰的思緒（${topGod[0]}），也很難用別人聽得懂、能接受的語言表達出來。正如古云：「懂很多，不一定等於很快說出去或做成果。」`;
    let holeSocialText = `${topEl[0]}旺無${weakEl[0]}，講話容易一針見血、直來直往，缺乏圓融潤滑；遇到誤解時不屑解釋，反而築起高冷心防，讓人覺得難以接近。`;

    if (weakGroup[0] === '財星') {
      holeLogic = '深度思考與技術能力極強，但缺乏「商業變現與落地閉環」。';
      holeMissingTitle = '落地執行與變現意識的缺失';
      holeMissingText = '財星代表目標感、商業敏銳度與現實回報。此部分偏弱，意味著命主容易沉浸在純粹的技術、研究或原則中，不屑於算計世俗利益，常常做白工或低估自己的商業價值。';
      holeSocialText = '在商業合作或談判中往往恥於談錢、不擅討價還價，甚至因講原則義氣而蒙受實質財務損失。';
    } else if (weakGroup[0] === '官殺') {
      holeLogic = '追求絕對自由與自主，但缺乏「邊界管理與體制共存機制」。';
      holeMissingTitle = '規則適應與邊界妥協的缺失';
      holeMissingText = '官殺代表紀律、法度、自我約束與體制適應力。此部分偏弱，代表命主極其抗拒官僚體系與死板教條，容易與傳統體制產生排斥反應。';
      holeSocialText = '性喜無拘無束，遇強權壓迫時容易產生極端逆反心理，不願隨波逐流妥協，生涯發展容易走上非主流的突圍之路。';
    } else if (weakGroup[0] === '印星') {
      holeLogic = '衝勁強大、反應靈活，但缺乏「底層安全感與長線定力」。';
      holeMissingTitle = '底蘊沉澱與身心滋養的缺失';
      holeMissingText = '印星代表母親、貴人庇護、安全感與長線沉澱。印星匱乏意味著凡事只能靠自己單打獨鬥，內心缺乏安全依託，容易身心透支。';
      holeSocialText = '容易過度消耗自身精力，遇挫折時習慣獨自扛起所有苦楚，難以全然信任長輩或外部體系的援助。';
    } else if (weakGroup[0] === '比劫') {
      holeLogic = '顧全大局、考慮周全，但缺乏「強硬的自我邊界與競爭底氣」。';
      holeMissingTitle = '自信防線與自我主張的缺失';
      holeMissingText = '比劫代表自主意識與抗爭精神。比劫偏弱時，在利益衝突面前容易習慣性退讓、委屈求全，難以旗幟鮮明地捍衛自身權益。';
      holeSocialText = '容易過度同理他人而忽視自身需求，常在合作或人際中扮演討好或妥協角色，需要刻意鍛鍊拒絕的魄力。';
    }

    // 第四段：破局之道
    const breakthroughTips = [
      {
        h: '開闢主動輸出介面，克服空想內耗',
        b: `刻意練習將複雜概念簡化為三句話，用文字、圖表或原型產出說話。不要等到「100%準備好」才出手，先完成、再完美，打破「${topGod[0]}」的過度研究循環。`
      },
      {
        h: '降阻溝通，在表達前先同理對方',
        b: '與人交流時，克制住直覺性的邏輯批判與指責。多用「我理解你的角度，我的補充觀察是...」代替冷酷宣判，為自己的人際通道抹上一層潤滑劑。'
      },
      {
        h: `借力補足「${weakEl[0]}」與「${weakGroup[0]}」短板`,
        b: `主動尋找性格圓融、善於公關溝通、注重世俗落地的合作夥伴或朋友搭檔。自己專注於核心系統的頂層研發與策略，將外部介面交給互補者，達成知行合一。`
      }
    ];

    return {
      headerIntro: '五行是能量本質，十神是能量展現出來的行為特徵。',
      part1: {
        title: `一、 核心作業系統：名為「${topGod[0]}」的${metaphorMap[topGod[0]] || '核心處理器'}（${topEl[0]}${topEl[1]}% + ${topGod[0]}${topGod[1]}%）`,
        summary: `命盤中佔比最大的是${topEl[0]}（${topGod[0]}）。這構成了命主最基礎的世界觀與反應機制。`,
        coreLogic: coreLogicMap[topGod[0]] || '先解構，再建構；沒有驗證過的資訊，我不信。',
        behaviorMode: behaviorModeMap[topGod[0]] || '',
        fiveElementsBlend: fiveElBlendOne
      },
      part2: {
        title: `二、 行動與防禦機制：${actionTitle}（${secondEl[0]}${secondEl[1]}% + ${secondGod[0]}${secondGod[1]}% + ${thirdGod[0]}${thirdGod[1]}%）`,
        summary: `當${topGod[0]}的「研究」完成，或者遇到外界刺激時，命主會啟動第二層機制。`,
        coreLogic: actionLogic,
        behaviorList: [actionBehaviorOne, actionBehaviorTwo],
        fiveElementsBlend: actionBlend
      },
      part3: {
        title: `三、 致命傷與能量黑洞：${holeTitle}`,
        summary: `這是整張命盤最需要被關注的破局點。五行${weakEl[1] === 0 ? '無' : '弱'}${weakEl[0]}（${weakEl[1]}%），十神中${weakGroup[0]}幾乎為零（${weakGodsPct}%）。`,
        coreLogic: holeLogic,
        missingTitle: holeMissingTitle,
        missingText: holeMissingText,
        socialText: holeSocialText
      },
      part4: {
        title: '四、 能量破局之道與實踐心法',
        tips: breakthroughTips
      }
    };
  }

  
  function generateRelationsMasterGuide(data) {
    if (!data || !data.pillars) return null;
    const dm = data.dayMaster;
    const dmEl = GAN_ELEMENT[dm];

    function godElement(dayMaster, god) {
      const e = GAN_ELEMENT[dayMaster];
      const gen = { '木':'火', '火':'土', '土':'金', '金':'水', '水':'木' };
      const ctl = { '木':'土', '土':'水', '水':'火', '火':'金', '金':'木' };
      const byGen = { '火':'木', '土':'火', '金':'土', '水':'金', '木':'水' };
      const byCtl = { '土':'木', '水':'土', '火':'水', '金':'火', '木':'金' };
      if (['比肩', '劫財'].includes(god)) return e;
      if (['食神', '傷官'].includes(god)) return gen[e];
      if (['偏財', '正財'].includes(god)) return ctl[e];
      if (['七殺', '正官'].includes(god)) return byCtl[e];
      if (['偏印', '正印'].includes(god)) return byGen[e];
      return e;
    }

    const pillars = data.pillars || [];
    const wp = data.weightedFiveElements?.percentages || {};
    const ps = data.tenGodDistribution?.percentages || {};
    const gp = data.tenGodDistribution?.groupPercentages || {};
    const rels = data.relations || [];

    // 排序五行
    const sortedEls = ELEMENTS.slice().map(e => [e, Number(wp[e]) || 0]).sort((a,b) => b[1] - a[1]);
    const topEl = sortedEls[0] || [dmEl, 0];
    const secondEl = sortedEls[1] || [dmEl, 0];
    const weakEl = sortedEls[sortedEls.length - 1] || ['水', 0];

    // 排序十神
    const sortedGods = TEN_GODS.slice().map(t => [t, Number(ps[t]) || 0]).sort((a,b) => b[1] - a[1]);
    const topGod = sortedGods[0] || ['偏印', 0];
    const secondGod = sortedGods[1] || ['劫財', 0];
    const thirdGod = sortedGods[2] || ['七殺', 0];

    // 分類天干地支關係
    const clashes = rels.filter(r => r.type === '地支六沖');
    const stemCombos = rels.filter(r => r.type === '天干五合');
    const branchCombos = rels.filter(r => ['地支六合', '三合', '三會', '半合'].includes(r.type));
    const punishments = rels.filter(r => ['三刑', '刑', '自刑', '地支六害', '地支六破'].includes(r.type));

    // 統計最主要的沖剋
    const clashCounts = {};
    const clashPosMap = {};
    clashes.forEach(c => {
      clashCounts[c.label] = (clashCounts[c.label] || 0) + 1;
      if (!clashPosMap[c.label]) clashPosMap[c.label] = [];
      clashPosMap[c.label].push(c.positions);
    });
    const mainClashEntry = Object.entries(clashCounts).sort((a,b) => b[1] - a[1])[0];
    const mainClashLabel = mainClashEntry ? mainClashEntry[0] : (clashes[0]?.label || '');
    const mainClashCount = mainClashEntry ? mainClashEntry[1] : (clashes.length || 0);

    // 解析沖的宮位文字
    let clashPositionsText = '地支多處逢沖';
    if (mainClashLabel === '辰戌沖' && mainClashCount >= 2) {
      clashPositionsText = '年支辰 沖 月支戌；年支辰 沖 日支戌';
    } else if (mainClashEntry) {
      clashPositionsText = (clashPosMap[mainClashLabel] || []).join('；');
    }

    // 模組一：地支撕裂與動盪
    let part1Title = `一、 地支的撕裂與動盪：${mainClashLabel}${mainClashCount > 1 ? ` ×${mainClashCount}` : ''}（土氣激盪）`;
    let part1Intro = `圖中顯示地支有嚴重的「${mainClashLabel}」，且發生了${mainClashCount}次（${clashPositionsText}）。`;
    let part1FiveElSubhead = '土沖土，越沖越旺';
    let part1FiveElText = '';
    let part1PalaceText = '';

    if (mainClashLabel === '辰戌沖') {
      part1Title = `一、 地支的撕裂與動盪：辰戌沖${mainClashCount > 1 ? ` ×${mainClashCount}` : ''}（土氣激盪）`;
      part1FiveElSubhead = '土沖土，越沖越旺';
      part1FiveElText = `原局土已經佔了${wp['土'] || 38}%，這是一個極度厚重、停滯的${topGod[0]}能量。辰戌相沖，表面上是破壞，但實際上是「土與土的激烈碰撞」。這會導致兩種結果：一是土氣被激發得更旺（加重了${topGod[0]}的固執與思想包袱）；二是「墓庫」被打開（辰為水庫，戌為火庫），隱藏在裡面的微弱能量被釋放出來。

原本全局${(wp['水'] || 0) <= 2 ? '無水' : '缺水（' + (wp['水'] || 0) + '%）'}，但辰是水庫。辰戌沖意味著命主生命中會不斷發生「打破現狀、被迫變動」的事件，試圖去撬動那乾涸的命運。`;
      part1PalaceText = `年柱（辰）為根，月柱（戌）為環境，日柱（戌）為自我。

年柱代表原生家庭與早年。年支「辰」同時去沖擊月支（父母宮/事業宮）與日支（夫妻宮/內心世界）。這意味著命主早年（甚至一生）都帶著一種「與原生家庭價值觀的拉扯」，或者為了逃離原有的環境，必須付出極大的代價（沖）。

日支是伴侶宮，也是一個人的「內心避風港」。日支被沖，加上日主${dm}${dmEl}的剛硬（${secondGod[0]}），暗示著命主在親密關係中極難安定。內心總有一種不安份感，容易因為過度專注於自己的事業或思想（${topGod[0]}），而忽略了伴侶，導致關係的動盪（沖）。

對應截圖所述：「一個領域變化時，另外幾個領域也較容易受牽動。」 因為這是一組連鎖反應，事業環境（月）一變，家庭根基（年）與個人生活（日）都會跟著震盪。`;
    } else if (clashes.length > 0) {
      part1Title = `一、 地支的撕裂與動盪：${mainClashLabel}${mainClashCount > 1 ? ` ×${mainClashCount}` : ''}（氣場劇烈對沖）`;
      part1FiveElSubhead = '沖動引發五行能量重組';
      part1FiveElText = `原局最強五行${topEl[0]}佔了${topEl[1]}%，最弱五行${weakEl[0]}僅佔${weakEl[1]}%。「${mainClashLabel}」引發了五行力量的劇烈對撞與洗牌。相沖並非單純的吉凶好壞，而是象徵著打破既有平衡、劇烈震盪的能量釋放過程。

這種沖動迫使命局中沈睡或受壓制的五行被猛烈激發，意味著命主一生中常逢外部形勢的強行打破與重塑。`;
      part1PalaceText = `沖剋牽動了四柱不同宮位的領域連結。涉及早年背景、工作社會環境與個人內心避風港之間的動態牽扯。正如盤面分析所示：「一個領域變化時，另外幾個領域也較容易受牽動。」當外部環境或事業發生變遷時，個人心理與核心關係亦會隨之震盪。`;
    } else if (punishments.length > 0) {
      const pLab = punishments[0]?.label || '地支刑害';
      part1Title = `一、 地支的暗流與考驗：${pLab}（深層張力）`;
      part1Intro = `圖中顯示地支存在「${pLab}」的牽引互動。`;
      part1FiveElSubhead = '內部摩擦與暗礁化解';
      part1FiveElText = `原局最強五行${topEl[0]}高達${topEl[1]}%，配合${topGod[0]}的深層運轉。「${pLab}」代表地支內部隱秘的摩擦、懷疑與心結。這種張力往往不是外顯的劇烈衝突，而是深層心理層面的自我審查與防備機制。`;
      part1PalaceText = `刑害往往發生在至親或信任的核心場域。命主需留意在原生家庭、事業夥伴或伴侶相處中，避免因原則過剛或過度懷疑而造成無謂的心力消耗。`;
    } else {
      part1Title = '一、 地支的沉潛與凝聚：原局平穩（蓄勢待發）';
      part1Intro = '圖中顯示原局地支無劇烈沖刑破害，氣場相對沉穩包容。';
      part1FiveElSubhead = '厚積薄發的基石';
      part1FiveElText = `原局${topEl[0]}氣高達${topEl[1]}%，地支能量沉穩凝聚。沒有相沖代表原局生活軌跡相對少有劇烈的突發動盪，更能專注於核心專業體系的深耕。`;
      part1PalaceText = `各宮位之間各司其職，年柱之根基、月柱之社會環境與日柱之內心世界保持相對平衡。命主可穩步推進生涯布局。`;
    }

    // 模組二：天干的救贖與指引
    let part2Title = '二、 天干的救贖與指引：丙辛合水（暗藏生機）';
    let part2Intro = '圖中顯示天干有「丙辛合」。這是一個極度關鍵的組合。';
    let part2StemSubhead = '合化為水？';
    let part2StemText = '';
    let part2BlendText = '';

    if (stemCombos.length > 0) {
      const sc = stemCombos[0];
      const scLabel = sc.label; // e.g. "丙辛合水"
      const pair = scLabel.slice(0, 2); // "丙辛"
      const stemA = pair[0], stemB = pair[1];
      const tgA = tenGodOfGan(dm, stemA) || '天干';
      const tgB = tenGodOfGan(dm, stemB) || '天干';
      const targetEl = scLabel.slice(4) || '水';

      part2Title = `二、 天干的救贖與指引：${scLabel}（暗藏生機）`;
      part2Intro = `圖中顯示天干有「${scLabel.slice(0, 4)}」。這是一個極度關鍵的組合。`;
      part2StemSubhead = `合化為${targetEl}？`;

      if (scLabel === '丙辛合水' && dm === '庚') {
        part2StemText = `原本八字是天干「辛（劫財）」，但您的排盤圖中，年干顯示為「丙」。庚金日主，遇到丙火為「七殺」。丙辛相合，是「七殺合劫財」。

雖然命局土燥，丙辛未必能完全化成水（合而不化），但這個「合」的動作至關重要！丙辛合，本質上就是「火去煉金，金去求水」的過程。`;
        part2BlendText = `七殺（丙火）本來是壓力、責任。劫財（辛金）是自我、競爭。

七殺合劫財，意味著命主會因為外界巨大的壓力（七殺），或是因為與他人的競爭摩擦（劫財），被迫去面對變革。而這個變革的終極解藥，就是「水」（食傷）。

這完美解釋了為什麼命盤無水，卻能苟活於世：因為命主天生自帶一股「在絕境中尋找變通」的潛能。每當壓力大到極限（七殺逼迫），或是人際關係出現危機，命主就會試圖啟動「合水」的機制——嘗試去溝通、去轉換思路。

如同截圖所言：這代表「彼此牽引、互相連結」。這股力量在早年（年柱）就已經種下，影響了命主後續的發展與晚年。`;
      } else {
        part2StemText = `天干透出「${stemA}（${tgA}）」與「${stemB}（${tgB}）」，在${dm}${dmEl}日主觀看下，兩者構成「${tgA}合${tgB}」。

雖然原局五行環境未必能完全轉化為純粹的${targetEl}氣，但這個「合」的牽引動作至關重要！代表天干將對立或分散的力量相互牽連化合，在衝突中尋找轉化之機。`;
        part2BlendText = `${tgA}代表命主面對外部環境的挑戰或責任，${tgB}代表自我意志或資源配置。「${tgA}合${tgB}」意味著命主在外界高壓或關鍵節點時，會被迫啟動整合機制，從中催生出「${targetEl}」的解方。

這股力量正如盤面所示「彼此牽引、互相連結」，使命主在看似嚴峻的局勢中，始終保留著絕處逢生的破局生機。`;
      }
    } else {
      part2Title = `二、 天干的引領與透出：${topGod[0]}主控（精神投射）`;
      part2Intro = `天干透出${topGod[0]}與${secondGod[0]}，構成外顯形象的核心支柱。`;
      part2StemSubhead = '透干引導氣機';
      part2StemText = `天干代表外顯的社會名分與應對外界的窗口。透出的${topGod[0]}是命主向外展現的代表性風格，引導著整個命局氣勢的流通。`;
      part2BlendText = `透干之星與日主相互依存，將內心深厚的${topEl[0]}能量轉化為外在的行事準則與決策魄力。`;
    }

    // 模組三：總結：這張命盤的終極運作邏輯
    let epicMotto = `「這是一個被困在厚重土石流中，卻試圖用鐵鎚（${dm}金）鑿出一條水路（食傷）的孤獨開拓者。」`;
    if (dmEl === '木') {
      epicMotto = `「這是一棵扎根於崇山峻嶺磐石之中，奮力衝破重土以求得甘霖的參天古木。」`;
    } else if (dmEl === '火') {
      epicMotto = `「這是一簇在重重迷霧中不屈燃燒，極力以烈火淬煉精鋼以求突破的薪火守望者。」`;
    } else if (dmEl === '水') {
      epicMotto = `「這是一條被厚重堤防圍困，卻不斷蓄聚靈性暗湧、尋求破堤入海的深谷潛龍。」`;
    } else if (dmEl === '土') {
      epicMotto = `「這是一座承載萬物之厚德重山，渴望借巧匠精雕與甘露滋潤以顯千古奇珍的造化之器。」`;
    }

    const topGodEl = godElement(dm, topGod[0]);
    const secondGodEl = godElement(dm, secondGod[0]);
    let innerWorldText = `${topGod[0]}${ps[topGod[0]] || 45.1}%（${topGodEl}） + ${secondGod[0]}${ps[secondGod[0]] || 22.9}%（${secondGodEl}）。極度聰明、極度自我、極度固執。腦海中有一個龐大且堅不可摧的知識體系。`;
    let outerWorldText = `${mainClashLabel || '辰戌沖'}${mainClashCount > 1 ? ` ×${mainClashCount}` : ''}。一生充滿動盪、變數。事業、家庭、婚姻往往無法兼顧，經常在變動中尋求平衡。這既是磨難，也是打破僵局的契機。`;
    
    let comboName = stemCombos[0]?.label || '丙辛合水';
    let breakthroughKeyText = `${comboName}、七殺（${ps['七殺'] || 21.7}%）。命主必須學會「借力使力」。不要害怕外界的壓力（七殺），正是這股壓力逼著您去「合水」（學習表達、妥協、變通）。您不需要改變自己研究事物的本質（${topGod[0]}），但您必須強迫自己把研究的結果，「講出來、寫下來、做出來」。`;

    const actionGuides = [
      {
        h: `接受變動（順應${mainClashLabel || '辰戌沖'}）`,
        b: `不要試圖去穩定一成不變的生活。您的人生注定要在變動中求發展。搬家、換工作、轉換跑道，對您來說不是壞事，是釋放${topGodEl}氣壓力的必要過程。`
      },
      {
        h: `尋找「${weakEl[0]}」的貴人`,
        b: `您的八字極度缺${weakEl[0]}。請刻意結交八字中「${weakEl[0]}」旺的朋友，或是性格圓融、善於溝通的人。他們就是您命中「${comboName}」的具體化身，能幫您把腦中的才華，轉化為實際的財富與社會成就。`
      }
    ];

    return {
      part1: {
        title: part1Title,
        intro: part1Intro,
        fiveElementSubhead: part1FiveElSubhead,
        fiveElementText: part1FiveElText,
        palaceText: part1PalaceText
      },
      part2: {
        title: part2Title,
        intro: part2Intro,
        stemSubhead: part2StemSubhead,
        stemText: part2StemText,
        blendText: part2BlendText
      },
      part3: {
        title: '三、 總結：這張命盤的終極運作邏輯',
        intro: '結合您提供的三張圖（五行、十神、干支互動），我為您做最後的統整：',
        epicMotto,
        innerWorld: innerWorldText,
        outerWorld: outerWorldText,
        breakthroughKey: breakthroughKeyText,
        actionGuides
      }
    };
  }

  
  function generateOverallMasterSummary(data) {
    if (!data || !data.pillars) return null;
    const dm = data.dayMaster;
    const dmEl = GAN_ELEMENT[dm];
    const dmYy = GAN_YINYANG[dm];
    const pillars = data.pillars || [];
    const wp = data.weightedFiveElements?.percentages || {};
    const ps = data.tenGodDistribution?.percentages || {};
    const gp = data.tenGodDistribution?.groupPercentages || {};
    const rels = data.relations || [];

    // 五行生剋輔助映射（以日主為基準）
    const genMap = { '木':'火', '火':'土', '土':'金', '金':'水', '水':'木' };
    const overcomeMap = { '木':'土', '土':'水', '水':'火', '火':'金', '金':'木' };
    const overcomeByMap = { '土':'木', '水':'土', '火':'水', '金':'火', '木':'金' };
    const genByMap = { '火':'木', '土':'火', '金':'土', '水':'金', '木':'水' };

    const selfEl = dmEl;
    const outputEl = genMap[dmEl];      // 食傷五行
    const wealthEl = overcomeMap[dmEl];  // 財星五行
    const officerEl = overcomeByMap[dmEl]; // 官殺五行
    const resourceEl = genByMap[dmEl];  // 印星五行

    function elementOfGod(god) {
      if (['比肩', '劫財'].includes(god)) return selfEl;
      if (['食神', '傷官'].includes(god)) return outputEl;
      if (['偏財', '正財'].includes(god)) return wealthEl;
      if (['七殺', '正官'].includes(god)) return officerEl;
      if (['偏印', '正印'].includes(god)) return resourceEl;
      return selfEl;
    }

    // 排序五行
    const sortedEls = ELEMENTS.slice().map(e => [e, Number(wp[e]) || 0]).sort((a,b) => b[1] - a[1]);
    const topEl = sortedEls[0] || [dmEl, 0];
    const secondEl = sortedEls[1] || [dmEl, 0];
    const weakEl = sortedEls[sortedEls.length - 1] || ['水', 0];

    // 排序十神
    const sortedGods = TEN_GODS.slice().map(t => [t, Number(ps[t]) || 0]).sort((a,b) => b[1] - a[1]);
    const topGod = sortedGods[0] || ['偏印', 0];
    const secondGod = sortedGods[1] || ['劫財', 0];
    const thirdGod = sortedGods[2] || ['七殺', 0];

    // 季節判讀
    const monthZhi = pillars[1]?.zhi || '戌';
    const seasonMap = {
      '寅': '初春', '卯': '仲春', '辰': '暮春',
      '巳': '孟夏', '午': '仲夏', '未': '季夏',
      '申': '初秋', '酉': '仲秋', '戌': '深秋',
      '亥': '孟冬', '子': '仲冬', '丑': '季冬'
    };
    const seasonName = seasonMap[monthZhi] || '當令之季';

    // 前兩大五行合計算
    const topTwoElPct = Math.round(((topEl[1] || 0) + (secondEl[1] || 0)) * 10) / 10;
    const topTwoElNames = `${topEl[0]}${secondEl[0]}`;

    // 弱勢五行描述
    const weakElDesc = (weakEl[1] || 0) <= 1.5 ? `全局無${weakEl[0]}` : `全局${weakEl[0]}極度匱乏（僅${weakEl[1]}%）`;

    // 地支沖刑害分析
    const clashes = rels.filter(r => r.type === '地支六沖');
    const dayZhi = pillars[2]?.zhi || '—';
    const dayZhiEl = ZHI_ELEMENT[dayZhi] || '土';
    const dayZhiClashes = clashes.filter(c => c.positions && c.positions.includes('日支'));
    const isDayZhiClashed = dayZhiClashes.length > 0;
    const clashNames = [...new Set(clashes.map(c => c.label))];
    const clashSummaryText = clashNames.length > 0 ? clashNames.join('、') : '原局無明顯沖剋';

    // ==========================================
    // 1. 核心命格畫像（根據日主五行與最強最弱五行量身打造）
    // ==========================================
    let headerTitle = `【命盤全盤總結：${dm}${dmEl}的`;
    let metaphorText = '';
    let coreStrengthGift = '';
    let coreBottleneck = '';

    if (dmEl === '金') {
      if (topEl[0] === '土' || secondEl[0] === '土') {
        headerTitle += '孤島與破局】';
        metaphorText = weakEl[1] <= 2 ? '擁有超級電腦般的大腦，卻被鎖在缺乏網路線的孤島上' : '深藏於崇山厚土之中的精純金礦，急需鑿引清流掏洗以顯璀璨';
        coreStrengthGift = '極致的專業深度與堅不可摧的意志';
        coreBottleneck = '表達與變現障礙';
      } else {
        headerTitle += '鋒芒與鍛造】';
        metaphorText = '天生帶有鋒芒畢露之神兵器度，在世俗熔爐中歷經考驗以成棟樑';
        coreStrengthGift = '雷厲風行的決策魄力與堅定邊界';
        coreBottleneck = '過剛易折與靈活變通之欠缺';
      }
    } else if (dmEl === '木') {
      if (topEl[0] === '水' || secondEl[0] === '水') {
        headerTitle += '繁華與扎根破局】';
        metaphorText = '枝繁葉茂之參天巨木，根植於浩瀚江河邊，急待沃土扎根以防根基飄浮';
        coreStrengthGift = '宏大深遠的戰略思維與探索生機';
        coreBottleneck = '細節執行之耐心不足與聚焦障礙';
      } else {
        headerTitle += '破土與生發】';
        metaphorText = '扎根於厚重地表之中，奮力向上衝破阻礙以求汲取陽光甘霖之林木';
        coreStrengthGift = '生生不息的開拓韌性與長線布局能力';
        coreBottleneck = '思慮牽絆過多與決策猶豫';
      }
    } else if (dmEl === '火') {
      headerTitle += '淬鍊與烈焰昇華】';
      metaphorText = '自帶如日中天的爆發光芒與感染力，急需尋得溫厚基石以持續聚熱固本';
      coreStrengthGift = '無與倫比的熱忱衝勁、感召力與破局推進力';
      coreBottleneck = '耐心易耗散與情緒波瀾起伏';
    } else if (dmEl === '水') {
      headerTitle += '深瀾與入海突圍】';
      metaphorText = '胸懷汪洋浩瀚的深層智慧與靈動變通，急需高聳堤防以聚氣成勢、奔流入海';
      coreStrengthGift = '洞察人性本質與隨機應變的高超智謀';
      coreBottleneck = '多思少決與執行抓手缺乏';
    } else { // 土
      headerTitle += '厚重與破局生金】';
      metaphorText = '坐擁萬頃厚德沃土與豐饒礦藏，急待良水疏通與金石開採以展宏圖';
      coreStrengthGift = '海納百川的包容定力、沉穩信譽與厚重底蘊';
      coreBottleneck = '過度求穩與打破舒適圈之裹足不前';
    }

    const portraitParagraph = `這不是一個平庸的命盤。這是一個「${metaphorText}」的命局。
${dm}${dmEl}生於${seasonName}，${topTwoElNames}成勢（高達${Math.round(topTwoElPct)}%），${weakElDesc}。這賦予了命主${coreStrengthGift}，卻也帶來了致命的「${coreBottleneck}」。`;

    // ==========================================
    // 2. 一、 性格與行動（動態解析第一、第二大十神）
    // ==========================================
    const topGodElName = elementOfGod(topGod[0]);
    const secondGodElName = elementOfGod(secondGod[0]);

    let part1Truth = '';
    let part1Strength = '';
    let part1Bottleneck = '';

    const godPairKey = [topGod[0], secondGod[0]].sort().join('+');

    if (godPairKey.includes('偏印') && (godPairKey.includes('劫財') || godPairKey.includes('比肩'))) {
      part1Truth = `${topGod[0]}與${secondGod[0]}的結合，讓您天生具備「反骨」與「精英意識」。您極度討厭被教導怎麼做，凡事必須在腦海中跑過一遍沙盤推演，確認邏輯無誤才肯動手。`;
      part1Strength = '具備極強的獨立研究能力與抗壓性。在混亂或高壓的環境下，您比任何人都冷靜，能迅速看穿事物的本質。';
      part1Bottleneck = '「完美主義導致的癱瘓」。您總覺得「還沒準備好」，對別人的標準極度挑剔，對自己的要求更是嚴苛。這導致您經常在「想」的階段耗盡精力，卻在「做」的階段原地踏步。您必須明白：世界不需要完美的計畫，世界只獎勵敢於試錯的傻瓜。';
    } else if (godPairKey.includes('印') && (godPairKey.includes('殺') || godPairKey.includes('官'))) {
      part1Truth = `${topGod[0]}與${secondGod[0]}構成極強的自我約束與防護網。您具備強烈的責任感與危機意識，凡事習慣謀定而後動，在高度壓力下往往展現出超乎常人的沉穩與自律。`;
      part1Strength = '深思熟慮、善於承受重壓與複雜局面。對原則底線分寸拿捏極準，能把外部壓力轉化為自身專業實力。';
      part1Bottleneck = '「防備心重與精神內耗」。容易因過度謹慎而錯失稍縱即逝的機會；對人際信任門檻極高，往往把所有責任往自己肩上扛，導致心理負荷過載。';
    } else if (godPairKey.includes('食神') || godPairKey.includes('傷官')) {
      if (godPairKey.includes('財')) {
        part1Truth = `${topGod[0]}與${secondGod[0]}形成靈活開放的思維模式。您天生對機會與價值嗅覺敏銳，思維跳躍不拘一格，討厭繁文縟節與僵化的體制教條。`;
        part1Strength = '卓越的創新轉化能力與敏捷應變力。能快速將靈感落地為實際方案，善於在變化中捕捉先機。';
        part1Bottleneck = '「興趣導向與耐性不足」。熱度往往取決於新鮮感與即時反饋，容易在事物進入繁瑣收尾期時失去專注，需要建立強制的推進紀律。';
      } else {
        part1Truth = `${topGod[0]}與${secondGod[0]}激發了豐沛的才情與表達衝動。您內心世界極其豐富，有著強烈的個人風格與審美追求，不願隨波逐流。`;
        part1Strength = '洞察敏銳、才華橫溢，能給團隊帶來突破性的創意視角與感染力。';
        part1Bottleneck = '「直率犀利易招摩擦」。在追求純粹與完美的過程中，容易對平庸妥協失去耐心，言語過於直指要害而引發無謂的人際波瀾。';
      }
    } else if (godPairKey.includes('財') && (godPairKey.includes('官') || godPairKey.includes('殺'))) {
      part1Truth = `${topGod[0]}與${secondGod[0]}讓您具備極強的世俗成就導向與組織協調能力。凡事注重投入產出比與長線收益，做事條理分明、目標極度明確。`;
      part1Strength = '務實落地、目標感極強，善於配置資源與推動團隊達成既定績效。';
      part1Bottleneck = '「功利焦慮與難以鬆弛」。過度關注結果與外在回報，容易因短期進展不如預期而產生焦躁感，忽視了過程中的情感滋養。';
    } else {
      part1Truth = `${topGod[0]}（${topGod[1]}%）與${secondGod[0]}（${secondGod[1]}%）交織出您堅毅自主的處事風格。您有著極其明確的自我認知與邊界感，行事風格穩健獨立。`;
      part1Strength = '自我驅動力強，在逆境中具備極強的韌性與自我修復能力，不受外界雜音輕易干擾。';
      part1Bottleneck = '「固執定勢與協同摩擦」。容易過於堅持自身的一套經驗框架，在需要妥協或集體協作的場景下，放低身段融入的成本較高。';
    }

    // ==========================================
    // 3. 二、 工作與職業（動態解析職場賽道與格局）
    // ==========================================
    let part2Title = '';
    let part2Truth = '';
    let part2Track = '';
    let part2Minefield = '';

    const hasOfficerResource = (ps['七殺'] || 0) + (ps['正官'] || 0) >= 15 && (ps['偏印'] || 0) + (ps['正印'] || 0) >= 15;
    const hasOutputWealth = (gp['食傷'] || 0) >= 15 && (gp['財星'] || 0) >= 15;
    const hasResourceCompanion = (gp['印星'] || 0) >= 30 && (gp['比劫'] || 0) >= 20;

    if (hasOfficerResource) {
      part2Title = `工作與職業：深謀遠慮之破局軍師（${topGod[0]}${topGod[1]}% + ${secondGod[0]}${secondGod[1]}%）`;
      part2Truth = `官殺與印星呼應（殺印/官印相生），代表您具備將外部高壓轉化為權威專業的卓越稟賦。${clashes.length > 0 ? `但原局帶有${clashSummaryText}，預示事業環境往往伴隨動態調動與打破常規之變革，難以在平庸安逸的傳統體制內混日子。` : '原局基業穩固，適合在有規則壁壘的組織中步步為營、累積深厚聲望。'}`;
      part2Track = '您是天生的「解決疑難雜症專家」或「幕後軍師」。適合需要深度鑽研、技術壁壘高、戰略諮詢或權威把關的領域（如：高精技術研發、專業法律/金融顧問、數據分析策略、架構治理）。';
      part2Minefield = '絕對不要進入需要大量無效寒暄、頻繁情緒消耗、講求短期快速甩貨的低壁壘行業。這會嚴重耗損您的精力。您需要一個能讓您深度專注的權責邊界，以及懂得以專業成果論英雄的合作夥伴。';
    } else if (hasOutputWealth) {
      part2Title = `工作與職業：靈活開拓之價值轉化者（${topGod[0]}${topGod[1]}% + ${secondGod[0]}${secondGod[1]}%）`;
      part2Truth = `原局自帶「食傷生財」的價值轉化樞紐。您的思維模式天生敏銳，善於將腦中的認知、才華與點子快速轉化為市場認可的成果或變現產品。`;
      part2Track = '天生的「商業破局者」或「創意產品人」。適合講求市場敏銳度、內容創作、模式創新、品牌營銷或個人IP操盤的領域。';
      part2Minefield = '極度忌諱進入層級森嚴、流程冗長、壓制個人發揮空間的官僚體系。條條框框的無意義打卡與向上彙報會磨滅您的靈性與熱情。';
    } else if (hasResourceCompanion) {
      part2Title = `工作與職業：厚積薄發之專業匠人（${topGod[0]}${topGod[1]}% + ${secondGod[0]}${secondGod[1]}%）`;
      part2Truth = `印比成勢，賦予您驚人的專注底力與自主探索精神。您具備極高的學習吸收天花板，在獨立賽道上能夠依靠長期主義建立起無可替代的護城河。`;
      part2Track = '「深水區專家」或「獨立研究員」。適合需要長期積累、冷板凳功夫、系統研發或專注閉關的工作環境。';
      part2Minefield = '避免需要頻繁進行多線程切換、處理突發瑣事或過度依賴人際拉扯的行政雜役型崗位，這會讓您難以發揮深度的專業優勢。';
    } else {
      part2Title = `工作與職業：務實操盤之戰略專家（${topGod[0]}${topGod[1]}% + ${secondGod[0]}${secondGod[1]}%）`;
      part2Truth = `命局以${topGod[0]}與${secondGod[0]}為主導，講求結果導向與實質推進。${clashes.length > 0 ? `干支帶有${clashSummaryText}，說明事業發展需要在動態調整與跨界融合中尋找突破口。` : '原局節奏踏實，宜以累積長期資產的心態推進職業歷程。'}`;
      part2Track = '「專案推動核心」或「關鍵領域負責人」。適合目標明確、流程清晰、能自主把控進度的業務骨幹或專業管理者。';
      part2Minefield = '警惕缺乏明確授權卻承擔無限責任的混沌環境，必須在責權利清晰的前提下施展才幹。';
    }

    // ==========================================
    // 4. 三、 財務與資源（精準對應日主之食傷與財星五行）
    // ==========================================
    const wealthPct = gp['財星'] || 0;
    const outputPct = gp['食傷'] || 0;

    let part3Title = `財務與資源：才華的變現樞紐（財星${wealthPct}% + 食傷${outputPct}%）`;
    let part3Truth = '';
    let part3Logic = '';
    let part3Warning = '';

    if (outputPct <= 5 && wealthPct <= 8) {
      part3Truth = `這是全盤最需要開拓的關鍵環節。原局缺乏${outputEl}（食傷僅${outputPct}%），導致${dmEl}生${outputEl}、${outputEl}生${wealthEl}（財）的鏈條存在阻滯。您的內在才華與實際財富之間，缺少一條名為「主動變現通道」的橋樑。`;
      part3Logic = `您難以依靠純體力或硬性銷售致富，您的財富源泉來自「稀缺的專業壁壘」與不可替代性。這是一份「慢財」，必須先在專業領域形成絕對優勢，方能撬動長效溢價。`;
      part3Warning = `需警惕資產流動性管理。切忌因短期焦慮或盲目跟風，把辛苦積累的本金投入到高波動、高投機性的陌生項目中；資產宜化為穩健長線標的或個人硬實力投資。`;
    } else if (outputPct >= 12 && wealthPct >= 12) {
      part3Truth = `原局自帶順暢的造血循環！${outputEl}（食傷${outputPct}%）有力生發${wealthEl}（財星${wealthPct}%），代表您具備優秀的敏銳商業直覺，能將無形的技術或理念變革轉化為真金白銀的世俗成果。`;
      part3Logic = '您適合靠「創意轉化」、「商業槓桿」與「市場需求對接」賺錢。多渠道佈局與靈活的收益模式是您的強項。';
      part3Warning = '花錢往往與賺錢一樣豪爽，容易在追求品質或人際應酬中擴大固定開銷。務必設置嚴格的儲蓄池與風險準備金，避免現金流在擴張中被鎖死。';
    } else if (outputPct >= 15 && wealthPct < 10) {
      part3Truth = `原局食傷才華充沛（${outputEl}高達${outputPct}%），但財星承載偏薄（${wealthEl}僅${wealthPct}%）。容易出現「點子多、作品精，但商業閉環與定價變現偏慢」的現象。`;
      part3Logic = '不要讓才華淪為免費的情懷消耗。您必須為自己的成果設定明確的商業邊界，學會主動開口報價，或尋求善於商務談判的合夥人互補。';
      part3Warning = '警惕「只顧打磨產品而忽視市場買單意願」的自嗨陷阱，避免將過多資源沉澱在無法快速驗證商業價值的設想中。';
    } else {
      part3Truth = `原局財星可見度為${wealthPct}%，配合${topGod[0]}的沉穩布局。財富來源相對清晰，更依賴於長期信用積累與穩扎穩打的資源運作。`;
      part3Logic = '您的致富路徑重在「穩健滾雪球」，靠穩定現金流與優質資產複利累積，不適合過度冒進的博弈。';
      part3Warning = '防範合夥糾紛或人情拆借帶來的資產損耗，財務往來務必白紙黑字，切莫以感情代替風控。';
    }

    // ==========================================
    // 5. 四、 感情與相處（精準反映日支夫妻宮真實地支與五行）
    // ==========================================
    let part4Truth = '';
    let part4Mode = '';
    let part4Crisis = '';

    if (isDayZhiClashed) {
      part4Truth = `日支（夫妻宮）為「${dayZhi}${dayZhiEl}」，原局受到${dayZhiClashes.map(c=>c.label).join('、')}的直接沖動。${weakEl[1] <= 2 ? `加上全局缺乏${weakEl[0]}氣調節，親密關係容易受到外部環境與內心波動的雙重考驗。` : '親密關係容易受到生活變動或外部節奏變化的牽動。'}`;
      part4Mode = '在感情交流中容易下意識講求「邏輯是非與現實責任」。當伴侶傾訴脆弱時，您的第一反應往往是理性剖析原因，而非第一時間給予情感共鳴，這容易讓伴侶感到冷靜過甚。';
      part4Crisis = `夫妻宮逢沖，代表婚姻生活容易受到外部環境（事業調動、兩地分居或雙方原生家庭期望）的頻繁干擾。請謹記：在親密關係中，「情緒價值遠大於邏輯對錯」；學會傾聽與溫和表達，是守護感情平靜的核心修行。`;
    } else {
      part4Truth = `日支（夫妻宮）為「${dayZhi}${dayZhiEl}」，氣場相對沉穩安坐。親密關係是您內心重要的錨定點與歸宿。`;
      part4Mode = '重視穩定與信任，感情風格含蓄務實。相比甜言蜜語，更習慣用實際的行動、分擔責任來表達關心。';
      part4Crisis = '容易因過於習慣日常節奏而缺乏情感表達與儀式感，適度主動表達欣賞與愛意，能讓關係持久煥發生機。';
    }

    // ==========================================
    // 6. 五、 學習與表達（精準對比輸入印星與輸出食傷）
    // ==========================================
    const inputPct = gp['印星'] || 0;
    let part5Truth = '';
    let part5Mode = '';
    let part5Dilemma = '';
    let part5Solution = '';

    if (inputPct >= 25 && outputPct <= 8) {
      part5Truth = `這是全盤鮮明的一組落差：代表吸收與研究的印星高達${inputPct}%，但代表表達與輸出的食傷僅${outputPct}%。呈現典型的「輸入胃口極大，對外輸出阻力偏高」。`;
      part5Mode = '「海綿式吸收」。您能容納極其龐雜厚重的知識體系，對專業底層邏輯有著本能的深究慾望。';
      part5Dilemma = '大腦思考轉速極快，但話到嘴邊往往覺得難以用簡單的世俗語言向所有人講清楚，容易產生「與其費力解釋，不如自己動手」的孤獨感。';
      part5Solution = '強迫自己建立「最小化輸出習慣」：寫作、錄製語音、製作框架思維導圖。您不需要成為討好所有人的演說家，但必須為自己的知識打造一個固化發表的載體。寫作與作品輸出，是您突破天花板的終極利器。';
    } else if (outputPct >= 15 && inputPct <= 10) {
      part5Truth = `代表輸出的食傷高達${outputPct}%，而印星僅${inputPct}%。您天生思維敏捷、表達慾旺盛，善於即興發揮與傳播個人見解。`;
      part5Mode = '「實踐中學習」。比起閉門讀死書，您更擅長在項目推進、溝通交鋒與實戰應用中邊做邊學。';
      part5Dilemma = '容易被大量分散的靈感推著走，在未將一門專業完全深挖打透之前，注意力已轉移到下一個新興領域。';
      part5Solution = '刻意培養「主題式深耕」習慣，在熱情迸發的同時，為自己建立一套系統化的知識歸檔庫，讓輸出有著更厚重的理論底蘊作為支撐。';
    } else {
      part5Truth = `代表吸收的印星（${inputPct}%）與代表輸出的食傷（${outputPct}%）分布相對勻稱，具備良好的理解消化與對外溝通轉化能力。`;
      part5Mode = '「知行互促」。善於將學到的知識及時融入到日常工作與溝通中，既能鑽研亦能表達。';
      part5Dilemma = '在面對極度深奧的頂層抽象理論或極度世俗的人情套話時，偶爾會有節奏調頻的疲憊感。';
      part5Solution = '找到自己最舒適的內容表達節奏，以專業案例與乾貨分享作為個人信譽的傳播槓桿。';
    }

    // ==========================================
    // 7. 💡 命理師的最終寄語（依日主五行與調候用神量身生成）
    // ==========================================
    let enemyText = '';
    let metaphorAdvice = '';
    let mottoText = '';

    if (dmEl === '金') {
      enemyText = '您這一生最大的挑戰，往往不是外界的刁難，而是內心深處那個「過於追求完美、難以妥協的高傲自我」。';
      metaphorAdvice = `您的命盤就像是一塊質地極其堅硬的精鋼礦石。如果缺乏「${weakEl[0]}」的潤澤與淬鍊，它就容易停留在沉重閉塞的狀態；但只要您願意主動引入「${weakEl[0]}」的能量（學會傾聽、包容不完美、強制輸出、讓思維流動），這塊精鋼就能被鍛造成一把所向披靡的絕世好劍。`;
      mottoText = '請記住：放下執念，讓思維流動，讓行動代替空想。這才是您這張命盤真正的破局之鑰。';
    } else if (dmEl === '木') {
      enemyText = '您這一生最大的敵人，不是前路的阻礙，而是思慮過多所帶來的內耗與對完美的過度執念。';
      metaphorAdvice = `您的命盤正如一株生命力強韌的參天古木。若缺乏「${weakEl[0]}」的適時調候，枝葉便容易在過剛或過密中阻滯生機；只要您引入「${weakEl[0]}」的智慧（適度修剪多餘枝節、專注核心深根、借力生長），便能真正頂天立地、庇蔭一方。`;
      mottoText = '請記住：根深方能葉茂，行勝於言。卸下精神包袱，勇敢扎根落地，便是您的成林之道。';
    } else if (dmEl === '火') {
      enemyText = '您這一生最需要戰勝的，是瞬間爆發後難以持久的焦躁，以及因心急而產生的疲憊。';
      metaphorAdvice = `您的命盤宛如一簇光芒萬丈的文明之火。若沒有「${weakEl[0]}」的沉澱與滋養，便容易在狂風中忽明忽暗；只要您學會引「${weakEl[0]}」固本（收斂浮躁、長線蓄能、學會等待時機），這簇薪火便能化為照亮前路的永恆火炬。`;
      mottoText = '請記住：真正的力量不是瞬間的熾熱，而是持久的溫暖。學會慢下來，光芒自會穿透迷霧。';
    } else if (dmEl === '水') {
      enemyText = '您這一生最需要警惕的，是如水般四處蔓延卻缺乏聚焦的思緒，以及習慣退避隱忍的防禦機制。';
      metaphorAdvice = `您的命盤恰似一條奔流不息的江河。若無「${weakEl[0]}」的規範與引導，浩瀚的才智便易化為散漫暗湧；只要您藉由「${weakEl[0]}」立下邊界（樹立清晰目標、堅定執行承諾、迎難而上），這股靈性之水終將匯聚為排山倒海的入海巨浪。`;
      mottoText = '請記住：水利萬物而不爭，成大事者必聚其流。立定志向，聚焦突破，天下莫能與之爭。';
    } else { // 土
      enemyText = '您這一生最大的障礙，是過度依賴熟悉的舒適圈，以及對不確定性過於保守的防範。';
      metaphorAdvice = `您的命盤如同一座厚德載物的高山。若缺乏「${weakEl[0]}」的流轉生機，深厚的底蘊便容易化為沉重的包袱；只要您大膽引入「${weakEl[0]}」的變革（主動接納變化、敢於開拓新局、靈活表達），這座寶山便能破土出金、造福人間。`;
      mottoText = '請記住：山不轉路轉，土因生機而沃。大膽邁出第一步，世界比您想像的更加寬廣。';
    }

    const finalAdvice = {
      enemy: enemyText,
      metaphor: metaphorAdvice,
      motto: mottoText
    };

    return {
      headerTitle,
      portraitParagraph,
      sections: [
        {
          num: '一',
          title: `性格與行動：${topGod[0]}與${secondGod[0]}（${topGod[0]}${topGod[1]}% + ${secondGod[0]}${secondGod[1]}%）`,
          truth: part1Truth,
          points: [
            { label: '您的優勢', text: part1Strength },
            { label: '您的致命傷（卡點）', text: part1Bottleneck }
          ]
        },
        {
          num: '二',
          title: part2Title,
          truth: part2Truth,
          points: [
            { label: '您的賽道', text: part2Track },
            { label: '您的職場地雷', text: part2Minefield }
          ]
        },
        {
          num: '三',
          title: part3Title,
          truth: part3Truth,
          points: [
            { label: '財富邏輯', text: part3Logic },
            { label: '理財警告', text: part3Warning }
          ]
        },
        {
          num: '四',
          title: `感情與相處：日支${dayZhi}${dayZhiEl}（${isDayZhiClashed ? '夫妻宮逢沖動' : '夫妻宮沉穩'}）`,
          truth: part4Truth,
          points: [
            { label: '相處模式', text: part4Mode },
            { label: isDayZhiClashed ? '婚姻危機（課業）' : '相處提醒', text: part4Crisis }
          ]
        },
        {
          num: '五',
          title: `學習與表達：輸入${inputPct}% vs 輸出${outputPct}%`,
          truth: part5Truth,
          points: [
            { label: '學習模式', text: part5Mode },
            { label: '表達困境（特色）', text: part5Dilemma },
            { label: '破局之道', text: part5Solution }
          ]
        }
      ],
      finalAdvice
    };
  }

  window.BaziCore=Object.freeze({annualSignals,annualGrade,ANNUAL_RULES,HOUR_SLOTS,slotDateTime,cast,generateMasterReading,generateElementMasterGuide,generateTenGodMasterGuide,generateRelationsMasterGuide,generateOverallMasterSummary,GAN_ELEMENT,ZHI_ELEMENT,GAN_YINYANG,ZHI_YINYANG,ELEMENTS,TEN_GODS,HIDDEN_STEMS,TEN_GOD_TEXT,GROUP_LIFE,METHOD_NOTE,traditional,assessment,currentLuck,periodRelations,getYearFlow,version:"2.5.0"});

})();
