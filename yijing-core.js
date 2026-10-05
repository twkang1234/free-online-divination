(() => {
"use strict";

const TRIGRAMS = {"乾": {"code": "111", "symbol": "☰", "element": "金", "image": "天"}, "兌": {"code": "110", "symbol": "☱", "element": "金", "image": "澤"}, "離": {"code": "101", "symbol": "☲", "element": "火", "image": "火"}, "震": {"code": "100", "symbol": "☳", "element": "木", "image": "雷"}, "巽": {"code": "011", "symbol": "☴", "element": "木", "image": "風"}, "坎": {"code": "010", "symbol": "☵", "element": "水", "image": "水"}, "艮": {"code": "001", "symbol": "☶", "element": "土", "image": "山"}, "坤": {"code": "000", "symbol": "☷", "element": "土", "image": "地"}};
const TRIGRAM_ORDER = ["乾", "兌", "離", "震", "巽", "坎", "艮", "坤"];
const HEXAGRAMS_RAW = {"乾-乾": {"number": 1, "name": "乾", "upper": "乾", "lower": "乾", "summary": "主動、創造、推進。適合先確立方向，再持續行動。"}, "乾-兌": {"number": 43, "name": "夬", "upper": "乾", "lower": "兌", "summary": "需要明確表態。該說清楚的事情不宜再拖。"}, "乾-離": {"number": 14, "name": "大有", "upper": "乾", "lower": "離", "summary": "資源充足。適合善用已有優勢，但勿因順利而自滿。"}, "乾-震": {"number": 34, "name": "大壯", "upper": "乾", "lower": "震", "summary": "力量正在增加。可以行動，但不要用力過猛。"}, "乾-巽": {"number": 9, "name": "小畜", "upper": "乾", "lower": "巽", "summary": "小幅累積。暫時難以大突破，但細節改善會有作用。"}, "乾-坎": {"number": 5, "name": "需", "upper": "乾", "lower": "坎", "summary": "等待時機。條件尚未完全成熟，準備比硬衝重要。"}, "乾-艮": {"number": 26, "name": "大畜", "upper": "乾", "lower": "艮", "summary": "蓄積實力。先把能力、資源與紀律準備好。"}, "乾-坤": {"number": 11, "name": "泰", "upper": "乾", "lower": "坤", "summary": "交流順暢、上下相通。適合推進合作與整合資源。"}, "兌-乾": {"number": 10, "name": "履", "upper": "兌", "lower": "乾", "summary": "謹慎而行。尊重規則與界線，避免踩到敏感地帶。"}, "兌-兌": {"number": 58, "name": "兌", "upper": "兌", "lower": "兌", "summary": "交流與喜悅。溝通有利，但要避免過度迎合。"}, "兌-離": {"number": 38, "name": "睽", "upper": "兌", "lower": "離", "summary": "立場不同。可以求同存異，不必強迫完全一致。"}, "兌-震": {"number": 54, "name": "歸妹", "upper": "兌", "lower": "震", "summary": "角色與條件不對等。需要認清位置與現實限制。"}, "兌-巽": {"number": 61, "name": "中孚", "upper": "兌", "lower": "巽", "summary": "誠信與內在一致。真實溝通比技巧更重要。"}, "兌-坎": {"number": 60, "name": "節", "upper": "兌", "lower": "坎", "summary": "節制與規則。設定合理邊界，才能長期維持。"}, "兌-艮": {"number": 41, "name": "損", "upper": "兌", "lower": "艮", "summary": "做減法。縮小、節制、放下某些東西反而有利。"}, "兌-坤": {"number": 19, "name": "臨", "upper": "兌", "lower": "坤", "summary": "接近、發展。機會正在靠近，宜主動準備並建立關係。"}, "離-乾": {"number": 13, "name": "同人", "upper": "離", "lower": "乾", "summary": "同道合作。共同目標比私人好惡更重要。"}, "離-兌": {"number": 49, "name": "革", "upper": "離", "lower": "兌", "summary": "變革時機。舊方法已不適用，需要有計畫地轉換。"}, "離-離": {"number": 30, "name": "離", "upper": "離", "lower": "離", "summary": "清楚與依附。看見重點，也要確認你依賴的是什麼。"}, "離-震": {"number": 55, "name": "豐", "upper": "離", "lower": "震", "summary": "旺盛與高峰。把握機會，也要為高峰後做準備。"}, "離-巽": {"number": 37, "name": "家人", "upper": "離", "lower": "巽", "summary": "內部秩序。先把團隊、家庭或核心關係整理好。"}, "離-坎": {"number": 63, "name": "既濟", "upper": "離", "lower": "坎", "summary": "事情接近完成。越到最後越要注意細節與後續。"}, "離-艮": {"number": 22, "name": "賁", "upper": "離", "lower": "艮", "summary": "外在修飾有用，但本質仍是核心。不要只看表面。"}, "離-坤": {"number": 36, "name": "明夷", "upper": "離", "lower": "坤", "summary": "光被遮蔽。低調保護自己，暫時不要逞強。"}, "震-乾": {"number": 25, "name": "無妄", "upper": "震", "lower": "乾", "summary": "保持真誠與自然。避免過度算計與不必要的控制。"}, "震-兌": {"number": 17, "name": "隨", "upper": "震", "lower": "兌", "summary": "順勢而為。觀察環境變化後調整，比僵守原案有效。"}, "震-離": {"number": 21, "name": "噬嗑", "upper": "震", "lower": "離", "summary": "需要處理障礙。把模糊問題明確化，才能真正解開。"}, "震-震": {"number": 51, "name": "震", "upper": "震", "lower": "震", "summary": "突發震動。先穩住情緒，再處理事件本身。"}, "震-巽": {"number": 42, "name": "益", "upper": "震", "lower": "巽", "summary": "增加與成長。投入正確資源，有機會形成正循環。"}, "震-坎": {"number": 3, "name": "屯", "upper": "震", "lower": "坎", "summary": "起步艱難但可成長。先處理混亂，再談快速前進。"}, "震-艮": {"number": 27, "name": "頤", "upper": "震", "lower": "艮", "summary": "養成與供給。注意你持續餵養的是什麼習慣與關係。"}, "震-坤": {"number": 24, "name": "復", "upper": "震", "lower": "坤", "summary": "回到正軌。重新開始的力量正在形成。"}, "巽-乾": {"number": 44, "name": "姤", "upper": "巽", "lower": "乾", "summary": "突然相遇或誘惑。先觀察，不宜太快投入過深。"}, "巽-兌": {"number": 28, "name": "大過", "upper": "巽", "lower": "兌", "summary": "壓力過重。需要調整結構，否則容易超出承載能力。"}, "巽-離": {"number": 50, "name": "鼎", "upper": "巽", "lower": "離", "summary": "轉化與成器。適合提升品質、角色或制度層級。"}, "巽-震": {"number": 32, "name": "恆", "upper": "巽", "lower": "震", "summary": "持續與耐力。真正有效的是穩定，而不是短期爆發。"}, "巽-巽": {"number": 57, "name": "巽", "upper": "巽", "lower": "巽", "summary": "滲透與溝通。以柔和、持續方式影響局勢。"}, "巽-坎": {"number": 48, "name": "井", "upper": "巽", "lower": "坎", "summary": "共享資源與根本。改善制度與基礎，比表面補救重要。"}, "巽-艮": {"number": 18, "name": "蠱", "upper": "巽", "lower": "艮", "summary": "修補舊問題。先處理累積已久的漏洞，再開新局。"}, "巽-坤": {"number": 46, "name": "升", "upper": "巽", "lower": "坤", "summary": "穩步上升。靠累積與耐心，長期比短期更有利。"}, "坎-乾": {"number": 6, "name": "訟", "upper": "坎", "lower": "乾", "summary": "意見衝突。宜留證據、講規則，避免情緒化對抗。"}, "坎-兌": {"number": 47, "name": "困", "upper": "坎", "lower": "兌", "summary": "受限與疲憊。先守住核心，避免在壓力下做極端決定。"}, "坎-離": {"number": 64, "name": "未濟", "upper": "坎", "lower": "離", "summary": "尚未完成。仍有調整空間，不宜太早下定論。"}, "坎-震": {"number": 40, "name": "解", "upper": "坎", "lower": "震", "summary": "壓力解除。適合處理善後並重新安排下一步。"}, "坎-巽": {"number": 59, "name": "渙", "upper": "坎", "lower": "巽", "summary": "化解隔閡。適合打開心結、重建連結與流動。"}, "坎-坎": {"number": 29, "name": "坎", "upper": "坎", "lower": "坎", "summary": "反覆風險。提高警覺，建立備案，不宜僥倖。"}, "坎-艮": {"number": 4, "name": "蒙", "upper": "坎", "lower": "艮", "summary": "學習與啟蒙。先釐清問題，避免在資訊不足時下結論。"}, "坎-坤": {"number": 7, "name": "師", "upper": "坎", "lower": "坤", "summary": "組織與紀律。需要明確目標、分工與一致行動。"}, "艮-乾": {"number": 33, "name": "遯", "upper": "艮", "lower": "乾", "summary": "適時退讓。暫退是策略，不一定代表失敗。"}, "艮-兌": {"number": 31, "name": "咸", "upper": "艮", "lower": "兌", "summary": "互相感應。關係中的吸引與互動正在形成。"}, "艮-離": {"number": 56, "name": "旅", "upper": "艮", "lower": "離", "summary": "流動與暫居。環境未穩，保持彈性比重押更重要。"}, "艮-震": {"number": 62, "name": "小過", "upper": "艮", "lower": "震", "summary": "小事可為，大事宜慎。細節處理比擴張更關鍵。"}, "艮-巽": {"number": 53, "name": "漸", "upper": "艮", "lower": "巽", "summary": "循序漸進。關係與事業都適合一步一步建立。"}, "艮-坎": {"number": 39, "name": "蹇", "upper": "艮", "lower": "坎", "summary": "前進受阻。改道、求助、延後都可能比硬闖更好。"}, "艮-艮": {"number": 52, "name": "艮", "upper": "艮", "lower": "艮", "summary": "停止與界線。暫停行動、重新定位有其必要。"}, "艮-坤": {"number": 15, "name": "謙", "upper": "艮", "lower": "坤", "summary": "謙和低調。適合穩健累積，讓成果自然被看見。"}, "坤-乾": {"number": 12, "name": "否", "upper": "坤", "lower": "乾", "summary": "阻塞與隔閡。先保存實力，避免勉強推進失衡局面。"}, "坤-兌": {"number": 45, "name": "萃", "upper": "坤", "lower": "兌", "summary": "聚集資源。適合整合人脈與力量，但要有共同中心。"}, "坤-離": {"number": 35, "name": "晉", "upper": "坤", "lower": "離", "summary": "逐步上升。適合曝光、爭取機會與擴大影響。"}, "坤-震": {"number": 16, "name": "豫", "upper": "坤", "lower": "震", "summary": "氣勢與動員。可以啟動計畫，但要避免只靠情緒熱度。"}, "坤-巽": {"number": 20, "name": "觀", "upper": "坤", "lower": "巽", "summary": "觀察與檢視。先看全局，再決定是否投入。"}, "坤-坎": {"number": 8, "name": "比", "upper": "坤", "lower": "坎", "summary": "親近與合作。適合尋找可靠夥伴，也要確認彼此立場。"}, "坤-艮": {"number": 23, "name": "剝", "upper": "坤", "lower": "艮", "summary": "剝落、減弱。適合止損、簡化、去除不必要負擔。"}, "坤-坤": {"number": 2, "name": "坤", "upper": "坤", "lower": "坤", "summary": "包容、承載、配合。適合穩定累積，不宜過度躁進。"}};

// 原始表格的 key 實際順序為「下卦-上卦」，這裡統一正規化成「上卦-下卦」。
const HEXAGRAMS = Object.fromEntries(
  Object.entries(HEXAGRAMS_RAW).map(([key, h]) => {
    const [lower, upper] = key.split("-");
    return [`${upper}-${lower}`, {...h, upper, lower}];
  })
);

function trigramFromCode(code) {
  for (const [name, meta] of Object.entries(TRIGRAMS)) {
    if (meta.code === code) return name;
  }
  return "坤";
}

function hexagramFromLines(lines) {
  const lowerCode = lines.slice(0,3).map(v => v ? "1" : "0").join("");
  const upperCode = lines.slice(3,6).map(v => v ? "1" : "0").join("");
  const lower = trigramFromCode(lowerCode);
  const upper = trigramFromCode(upperCode);
  const h = HEXAGRAMS[`${upper}-${lower}`];
  return {...h, upperMeta:TRIGRAMS[upper], lowerMeta:TRIGRAMS[lower], lines:[...lines]};
}

function cryptoInt(max) {
  if (window.crypto && crypto.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return Math.floor((a[0] / 4294967296) * max);
  }
  return Math.floor(Math.random() * max);
}

function coinLine() {
  // 三枚銅錢法的機率：6/7/8/9 = 1/8、3/8、3/8、1/8。
  let sum = 0;
  for (let i=0;i<3;i++) sum += cryptoInt(2) ? 3 : 2;
  return sum;
}

const LINE_POSITIONS = [
  {pos:1, yin:"初六", yang:"初九", stage:"事情剛開始、根基與第一步", advice:"先看起點與基礎是否穩，不宜只因一時衝動就急著定局。"},
  {pos:2, yin:"六二", yang:"九二", stage:"開始發展、互動與合作", advice:"重點在配合與實際互動，先確認彼此條件是否真的接得上。"},
  {pos:3, yin:"六三", yang:"九三", stage:"壓力上升、進退取捨與轉折前段", advice:"容易出現用力過猛或進退兩難，最好先修正方法，不要只靠硬撐。"},
  {pos:4, yin:"六四", yang:"九四", stage:"從內轉外、環境變化與臨門一腳", advice:"外部條件開始成為關鍵，行動前要多看環境、時機與他人的反應。"},
  {pos:5, yin:"六五", yang:"九五", stage:"核心位置、主導權與成熟結果", advice:"這一爻通常最接近事情核心，適合抓住真正關鍵，不要被枝節帶走。"},
  {pos:6, yin:"上六", yang:"上九", stage:"事情走到極端、收尾或下一輪開始前", advice:"已到一個階段的頂點，最重要的是避免過頭，並思考下一步怎麼轉。"}
];

const TOPICS = [
  {id:"love", re:/感情|愛情|桃花|曖昧|復合|分手|交往|對象|喜歡|婚姻|伴侶|單身/, name:"感情", focus:"雙方互動、距離、時機與彼此真實態度"},
  {id:"work", re:/工作|職場|求職|面試|離職|轉職|升遷|主管|同事|公司/, name:"工作", focus:"職場位置、機會成熟度、合作關係與下一步行動"},
  {id:"business", re:/創業|事業|生意|合作|客戶|訂單|專案|開店|公司經營/, name:"事業／合作", focus:"資源、合作條件、風險承擔與推進節奏"},
  {id:"money", re:/財運|投資|股票|買進|賣出|賺錢|金錢|收入|資金|理財/, name:"財務／投資", focus:"風險、資金節奏、可承受度與是否適合躁進"},
  {id:"choice", re:/選擇|要不要|是否|該不該|哪個|決定|抉擇/, name:"選擇決策", focus:"目前條件、真正阻力、可控因素與決策代價"},
  {id:"study", re:/考試|學業|讀書|進修|學習|錄取|升學/, name:"學業／考試", focus:"準備程度、節奏、盲點與臨場穩定度"},
  {id:"relationship", re:/朋友|人際|家人|家庭|親子|同學|關係|相處/, name:"人際／家庭", focus:"溝通、界線、角色位置與關係中的互相影響"}
];

const POSITIVE = /順|成長|增加|上升|接近|合作|喜悅|完成|化解|回到正軌|資源充足|旺盛|發展|交流順暢|誠信|轉化|重新開始|逐步上升|聚集資源|親近/;
const CAUTION = /阻|困|閉塞|受限|風險|衝突|壓力|減弱|剝落|艱難|未完成|等待|謹慎|不宜|暫退|停止|低調|修補|不同|不對等|過重|突發/;

function topicFromQuestion(question="") {
  const q = String(question || "").trim();
  return TOPICS.find(t => t.re.test(q)) || {id:"general", name:"一般事件", focus:"目前局勢、主要阻力、轉折與可採取的行動"};
}

function lineLabel(value, pos) {
  const meta = LINE_POSITIONS[pos-1];
  const yang = value === 7 || value === 9;
  return yang ? meta.yang : meta.yin;
}

function lineChangeText(value) {
  if (value === 6) return "老陰動，陰轉陽：原本偏被動、保守或承接的力量，開始轉向主動與推進。";
  if (value === 9) return "老陽動，陽轉陰：原本偏主動、強勢或外放的力量，需要收斂、調整或換一種方式。";
  return "靜爻：這一層目前不是主要轉折點。";
}

function movementPattern(moving) {
  if (!moving.length) return {title:"靜卦", text:"六爻皆靜，表示這件事目前的主題相對集中。本卦本身就是最重要的訊息，不必急著把局勢想得過度複雜。"};
  if (moving.length === 1) return {title:"單爻動", text:"只有一爻變動，轉折點相對清楚。這一爻可視為目前最值得注意的關鍵位置。"};
  if (moving.length === 2) return {title:"兩爻動", text:"有兩個層面同時變化，事情不是單一原因造成；要把兩個動爻放在一起看，避免只抓其中一點。"};
  if (moving.length === 3) return {title:"三爻動", text:"變動幅度已經明顯，本卦與變卦都要重視。可理解為舊狀態正在鬆動，而新狀態還在形成。"};
  if (moving.length === 4) return {title:"四爻動", text:"大部分結構都在改變，變卦的重要性提高。與其死守原本模式，更適合看清哪些條件已經不能照舊。"};
  if (moving.length === 5) return {title:"五爻動", text:"整體局勢接近重組，只剩少數條件仍維持原狀。此時重點不是微調，而是重新定位與安排。"};
  return {title:"六爻皆動", text:"六爻全部變動，代表舊局幾乎全面翻轉。這類卦最忌用原本的方法硬撐，應把它視為一個完整週期結束、另一個週期開始。"};
}

function valence(h) {
  const s = h.summary || "";
  if (POSITIVE.test(s) && !CAUTION.test(s)) return "up";
  if (CAUTION.test(s) && !POSITIVE.test(s)) return "down";
  return "mixed";
}

function trendText(base, changed, moving) {
  if (!moving.length) return `目前沒有動爻，局勢暫時以「${base.name}」的主題為主。短期更像是把現況看清楚，而不是立刻出現劇烈翻轉。`;
  const b = valence(base), c = valence(changed);
  if (b === "down" && c === "up") return `本卦較有壓力，變卦轉向較有利的訊號，代表事情雖然現在卡住，但只要調整方法，後面有逐步打開的可能。`;
  if (b === "up" && c === "down") return `本卦原本有推進條件，但變卦提醒後續風險增加。現在最重要的不是一味樂觀，而是提早處理會讓局勢轉差的因素。`;
  if (c === "up") return `變卦的方向較偏開展，代表改變本身可能帶來新的空間；但仍要按動爻提示的節奏走，不宜把「有機會」理解成「一定成功」。`;
  if (c === "down") return `變卦的警示較強，後續若沿用原本模式，阻力可能加重。這時宜先防守、修正或延後，而不是硬把事情推過去。`;
  return `本卦到變卦不是單純的吉或凶，而是條件重組。真正的重點在於：哪些部分正在變、你是否願意跟著局勢修正。`;
}

function adviceForTopic(topic, base, changed, moving) {
  const out = [];
  const combined = `${base.summary} ${changed.summary}`;
  if (/等待|暫退|停止|低調|不宜|阻|困|閉塞|受限/.test(combined)) out.push("先不要硬衝：目前卦意有等待、受阻或收斂訊號，先把風險與阻力處理掉。 ");
  if (/合作|交流|誠信|親近|同道|聚集|溝通/.test(combined)) out.push("把關係說清楚：這件事的突破點和溝通、合作或彼此立場是否一致有關。 ");
  if (/累積|穩步|循序|養成|蓄積|準備/.test(combined)) out.push("用累積取代躁進：短期不一定立刻見效，但穩定準備比一次押大更有利。 ");
  if (/變革|轉化|重新|修補|改道|化解/.test(combined)) out.push("願意換方法：局勢要求調整，與其證明原本做法沒錯，不如先讓事情重新流動。 ");
  if (topic.id === "love") out.push("感情上先觀察互動是否雙向；若只有你單方面用力，應把注意力放回界線與真實回應。 ");
  else if (topic.id === "money") out.push("財務／投資上要把風險控制放在預測前面；卦象只能協助整理局勢，不應取代部位與停損規劃。 ");
  else if (topic.id === "work") out.push("工作上先分清楚是能力問題、環境問題，還是時機問題，再決定要撐、談、換或等。 ");
  else if (topic.id === "choice") out.push("做決定時，優先選擇能降低不可逆風險、又保留後續調整空間的方案。 ");
  else out.push("先處理你能控制的條件，再觀察外部局勢是否真的跟著改變。 ");
  if (moving.length >= 4) out.push("變動爻很多：這不是小修小補的局，最好把原本假設重新檢查一次。 ");
  return [...new Set(out.map(s=>s.trim()))].slice(0,6);
}

function buildReading(question, values) {
  const baseLines = values.map(v => v === 7 || v === 9);
  const changedLines = values.map((v,i) => (v === 6 || v === 9) ? !baseLines[i] : baseLines[i]);
  const moving = values.map((v,i) => (v === 6 || v === 9) ? i+1 : 0).filter(Boolean);
  const base = hexagramFromLines(baseLines);
  const changed = hexagramFromLines(changedLines);
  const topic = topicFromQuestion(question);
  const pattern = movementPattern(moving);
  const lines = moving.map(pos => {
    const value = values[pos-1];
    const meta = LINE_POSITIONS[pos-1];
    return {
      pos,
      value,
      label: lineLabel(value,pos),
      stage: meta.stage,
      change: lineChangeText(value),
      advice: meta.advice
    };
  });
  const advice = adviceForTopic(topic, base, changed, moving);
  const trend = trendText(base, changed, moving);
  const questionText = String(question || "").trim() || "目前這件事最需要注意什麼？";
  const movingNames = lines.length ? lines.map(x=>x.label).join("、") : "無動爻";
  const changedName = moving.length ? `第 ${changed.number} 卦・${changed.name}` : `無變卦（六爻皆靜）`;
  const summary = moving.length
    ? `${base.name}之${changed.name}：目前先看「${base.summary.replace(/。.*$/,'')}」的現況，再看局勢往「${changed.summary.replace(/。.*$/,'')}」轉變。${pattern.text}`
    : `${base.name}為靜卦：${base.summary}${pattern.text}`;

  return {
    question: questionText,
    topic,
    values,
    base,
    changed,
    baseLines,
    changedLines,
    movingLines:moving,
    movingNames,
    changedName,
    lineReadings:lines,
    pattern,
    trend,
    advice,
    summary,
    createdAt:new Date().toISOString()
  };
}

function draw(question="") {
  const values = Array.from({length:6}, coinLine);
  return buildReading(question, values);
}

function buildPrompt(reading) {
  const r = reading;
  const movingText = r.lineReadings.length
    ? r.lineReadings.map(x=>`${x.label}動（${x.value}，${x.change}）`).join("\n- ")
    : "無動爻，為靜卦";
  return `請你扮演一位熟悉《易經》六十四卦與動爻判讀、但不過度斷言的專業解卦老師，使用繁體中文解讀以下已經起出的卦。\n\n【重要】不要重新起卦、不要更換本卦、變卦或動爻，也不要假裝知道未提供的月建、日辰、世應、六親。若無法從這組資料確定的內容，請明確說明。\n\n【我的問題】\n${r.question}\n\n【卦象】\n本卦：第 ${r.base.number} 卦・${r.base.name}（上${r.base.upper}${r.base.upperMeta.symbol}／下${r.base.lower}${r.base.lowerMeta.symbol}）\n變卦：${r.movingLines.length ? `第 ${r.changed.number} 卦・${r.changed.name}（上${r.changed.upper}${r.changed.upperMeta.symbol}／下${r.changed.lower}${r.changed.lowerMeta.symbol}）` : "無變卦，六爻皆靜"}\n動爻：${r.movingNames}\n- ${movingText}\n\n【請依照這個順序回答】\n一、先看整體象義：本卦、變卦、動爻各代表什麼。\n二、解釋本卦真正的核心，不要只列關鍵字。\n三、如果有變卦，說明從本卦走到變卦代表什麼變化。\n四、逐一解釋每個動爻，並連回我的問題；若沒有動爻則說明靜卦應如何看。\n五、直接回答我的問題：目前最重要的局勢、阻力、機會各是什麼。\n六、給我 3～6 個具體可執行建議。\n七、最後用一句話總結。\n\n語氣請像有經驗的命理老師：白話、具體、有邏輯，但不要把卦象說成百分之百注定。`;
}

function buildTxt(reading) {
  const r = reading;
  const lineBlock = r.lineReadings.length ? r.lineReadings.map((x,i)=>`${i+1}. ${x.label}動（${x.value}）\n   位置：${x.stage}\n   變化：${x.change}\n   解讀：${x.advice}`).join("\n\n") : "本次六爻皆靜，沒有動爻。重點以本卦為主。";
  const adviceBlock = r.advice.map((x,i)=>`${i+1}. ${x}`).join("\n");
  return `易經六十四卦｜本次網站解卦\n================================\n\n問題：${r.question}\n主題判定：${r.topic.name}\n\n本卦：第 ${r.base.number} 卦・${r.base.name}\n上卦：${r.base.upper} ${r.base.upperMeta.symbol}（${r.base.upperMeta.image}／${r.base.upperMeta.element}）\n下卦：${r.base.lower} ${r.base.lowerMeta.symbol}（${r.base.lowerMeta.image}／${r.base.lowerMeta.element}）\n本卦提示：${r.base.summary}\n\n變卦：${r.movingLines.length ? `第 ${r.changed.number} 卦・${r.changed.name}` : "無變卦（六爻皆靜）"}\n${r.movingLines.length ? `變卦提示：${r.changed.summary}` : ""}\n動爻：${r.movingNames}\n\n一、先看整體象義\n--------------------------------\n本卦代表現在的主要狀態：${r.base.summary}\n${r.movingLines.length ? `變卦代表事情改變後較可能呈現的方向：${r.changed.summary}` : "因為沒有動爻，現在不需要另外追變卦。"}\n動爻型態：${r.pattern.title}\n${r.pattern.text}\n\n二、這一卦如何回答你的問題\n--------------------------------\n你的問題屬於「${r.topic.name}」，解讀時重點放在：${r.topic.focus}。\n\n本卦「${r.base.name}」先告訴你：${r.base.summary}\n${r.movingLines.length ? `變卦「${r.changed.name}」再補充：${r.changed.summary}` : "本卦為靜卦，現況本身就是最主要訊息。"}\n\n三、動爻逐一解讀\n--------------------------------\n${lineBlock}\n\n四、後續發展與轉折\n--------------------------------\n${r.trend}\n\n五、網站給你的具體建議\n--------------------------------\n${adviceBlock}\n\n六、一句話總結\n--------------------------------\n${r.summary}\n\n================================\n說明：本工具採三枚銅錢機率產生六爻，提供本卦、動爻、變卦與白話整理，作為自我思考與易經學習參考；不把卦象視為百分之百確定的未來。\n`;
}

window.YijingCore = Object.freeze({
  draw,
  buildPrompt,
  buildTxt,
  hexagramFromLines,
  count:Object.keys(HEXAGRAMS).length,
  version:"2.0-six-line-reading"
});
})();
