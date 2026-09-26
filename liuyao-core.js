(() => {
"use strict";

const TRIGRAMS = {"乾": {"code": "111", "symbol": "☰", "element": "金", "image": "天"}, "兌": {"code": "110", "symbol": "☱", "element": "金", "image": "澤"}, "離": {"code": "101", "symbol": "☲", "element": "火", "image": "火"}, "震": {"code": "100", "symbol": "☳", "element": "木", "image": "雷"}, "巽": {"code": "011", "symbol": "☴", "element": "木", "image": "風"}, "坎": {"code": "010", "symbol": "☵", "element": "水", "image": "水"}, "艮": {"code": "001", "symbol": "☶", "element": "土", "image": "山"}, "坤": {"code": "000", "symbol": "☷", "element": "土", "image": "地"}};
const TRIGRAM_ORDER = ["乾", "兌", "離", "震", "巽", "坎", "艮", "坤"];
const HEXAGRAMS = {"乾-乾": {"number": 1, "name": "乾", "upper": "乾", "lower": "乾", "summary": "主動、創造、推進。適合先確立方向，再持續行動。"}, "乾-兌": {"number": 43, "name": "夬", "upper": "乾", "lower": "兌", "summary": "需要明確表態。該說清楚的事情不宜再拖。"}, "乾-離": {"number": 14, "name": "大有", "upper": "乾", "lower": "離", "summary": "資源充足。適合善用已有優勢，但勿因順利而自滿。"}, "乾-震": {"number": 34, "name": "大壯", "upper": "乾", "lower": "震", "summary": "力量正在增加。可以行動，但不要用力過猛。"}, "乾-巽": {"number": 9, "name": "小畜", "upper": "乾", "lower": "巽", "summary": "小幅累積。暫時難以大突破，但細節改善會有作用。"}, "乾-坎": {"number": 5, "name": "需", "upper": "乾", "lower": "坎", "summary": "等待時機。條件尚未完全成熟，準備比硬衝重要。"}, "乾-艮": {"number": 26, "name": "大畜", "upper": "乾", "lower": "艮", "summary": "蓄積實力。先把能力、資源與紀律準備好。"}, "乾-坤": {"number": 11, "name": "泰", "upper": "乾", "lower": "坤", "summary": "交流順暢、上下相通。適合推進合作與整合資源。"}, "兌-乾": {"number": 10, "name": "履", "upper": "兌", "lower": "乾", "summary": "謹慎而行。尊重規則與界線，避免踩到敏感地帶。"}, "兌-兌": {"number": 58, "name": "兌", "upper": "兌", "lower": "兌", "summary": "交流與喜悅。溝通有利，但要避免過度迎合。"}, "兌-離": {"number": 38, "name": "睽", "upper": "兌", "lower": "離", "summary": "立場不同。可以求同存異，不必強迫完全一致。"}, "兌-震": {"number": 54, "name": "歸妹", "upper": "兌", "lower": "震", "summary": "角色與條件不對等。需要認清位置與現實限制。"}, "兌-巽": {"number": 61, "name": "中孚", "upper": "兌", "lower": "巽", "summary": "誠信與內在一致。真實溝通比技巧更重要。"}, "兌-坎": {"number": 60, "name": "節", "upper": "兌", "lower": "坎", "summary": "節制與規則。設定合理邊界，才能長期維持。"}, "兌-艮": {"number": 41, "name": "損", "upper": "兌", "lower": "艮", "summary": "做減法。縮小、節制、放下某些東西反而有利。"}, "兌-坤": {"number": 19, "name": "臨", "upper": "兌", "lower": "坤", "summary": "接近、發展。機會正在靠近，宜主動準備並建立關係。"}, "離-乾": {"number": 13, "name": "同人", "upper": "離", "lower": "乾", "summary": "同道合作。共同目標比私人好惡更重要。"}, "離-兌": {"number": 49, "name": "革", "upper": "離", "lower": "兌", "summary": "變革時機。舊方法已不適用，需要有計畫地轉換。"}, "離-離": {"number": 30, "name": "離", "upper": "離", "lower": "離", "summary": "清楚與依附。看見重點，也要確認你依賴的是什麼。"}, "離-震": {"number": 55, "name": "豐", "upper": "離", "lower": "震", "summary": "旺盛與高峰。把握機會，也要為高峰後做準備。"}, "離-巽": {"number": 37, "name": "家人", "upper": "離", "lower": "巽", "summary": "內部秩序。先把團隊、家庭或核心關係整理好。"}, "離-坎": {"number": 63, "name": "既濟", "upper": "離", "lower": "坎", "summary": "事情接近完成。越到最後越要注意細節與後續。"}, "離-艮": {"number": 22, "name": "賁", "upper": "離", "lower": "艮", "summary": "外在修飾有用，但本質仍是核心。不要只看表面。"}, "離-坤": {"number": 36, "name": "明夷", "upper": "離", "lower": "坤", "summary": "光被遮蔽。低調保護自己，暫時不要逞強。"}, "震-乾": {"number": 25, "name": "無妄", "upper": "震", "lower": "乾", "summary": "保持真誠與自然。避免過度算計與不必要的控制。"}, "震-兌": {"number": 17, "name": "隨", "upper": "震", "lower": "兌", "summary": "順勢而為。觀察環境變化後調整，比僵守原案有效。"}, "震-離": {"number": 21, "name": "噬嗑", "upper": "震", "lower": "離", "summary": "需要處理障礙。把模糊問題明確化，才能真正解開。"}, "震-震": {"number": 51, "name": "震", "upper": "震", "lower": "震", "summary": "突發震動。先穩住情緒，再處理事件本身。"}, "震-巽": {"number": 42, "name": "益", "upper": "震", "lower": "巽", "summary": "增加與成長。投入正確資源，有機會形成正循環。"}, "震-坎": {"number": 3, "name": "屯", "upper": "震", "lower": "坎", "summary": "起步艱難但可成長。先處理混亂，再談快速前進。"}, "震-艮": {"number": 27, "name": "頤", "upper": "震", "lower": "艮", "summary": "養成與供給。注意你持續餵養的是什麼習慣與關係。"}, "震-坤": {"number": 24, "name": "復", "upper": "震", "lower": "坤", "summary": "回到正軌。重新開始的力量正在形成。"}, "巽-乾": {"number": 44, "name": "姤", "upper": "巽", "lower": "乾", "summary": "突然相遇或誘惑。先觀察，不宜太快投入過深。"}, "巽-兌": {"number": 28, "name": "大過", "upper": "巽", "lower": "兌", "summary": "壓力過重。需要調整結構，否則容易超出承載能力。"}, "巽-離": {"number": 50, "name": "鼎", "upper": "巽", "lower": "離", "summary": "轉化與成器。適合提升品質、角色或制度層級。"}, "巽-震": {"number": 32, "name": "恆", "upper": "巽", "lower": "震", "summary": "持續與耐力。真正有效的是穩定，而不是短期爆發。"}, "巽-巽": {"number": 57, "name": "巽", "upper": "巽", "lower": "巽", "summary": "滲透與溝通。以柔和、持續方式影響局勢。"}, "巽-坎": {"number": 48, "name": "井", "upper": "巽", "lower": "坎", "summary": "共享資源與根本。改善制度與基礎，比表面補救重要。"}, "巽-艮": {"number": 18, "name": "蠱", "upper": "巽", "lower": "艮", "summary": "修補舊問題。先處理累積已久的漏洞，再開新局。"}, "巽-坤": {"number": 46, "name": "升", "upper": "巽", "lower": "坤", "summary": "穩步上升。靠累積與耐心，長期比短期更有利。"}, "坎-乾": {"number": 6, "name": "訟", "upper": "坎", "lower": "乾", "summary": "意見衝突。宜留證據、講規則，避免情緒化對抗。"}, "坎-兌": {"number": 47, "name": "困", "upper": "坎", "lower": "兌", "summary": "受限與疲憊。先守住核心，避免在壓力下做極端決定。"}, "坎-離": {"number": 64, "name": "未濟", "upper": "坎", "lower": "離", "summary": "尚未完成。仍有調整空間，不宜太早下定論。"}, "坎-震": {"number": 40, "name": "解", "upper": "坎", "lower": "震", "summary": "壓力解除。適合處理善後並重新安排下一步。"}, "坎-巽": {"number": 59, "name": "渙", "upper": "坎", "lower": "巽", "summary": "化解隔閡。適合打開心結、重建連結與流動。"}, "坎-坎": {"number": 29, "name": "坎", "upper": "坎", "lower": "坎", "summary": "反覆風險。提高警覺，建立備案，不宜僥倖。"}, "坎-艮": {"number": 4, "name": "蒙", "upper": "坎", "lower": "艮", "summary": "學習與啟蒙。先釐清問題，避免在資訊不足時下結論。"}, "坎-坤": {"number": 7, "name": "師", "upper": "坎", "lower": "坤", "summary": "組織與紀律。需要明確目標、分工與一致行動。"}, "艮-乾": {"number": 33, "name": "遯", "upper": "艮", "lower": "乾", "summary": "適時退讓。暫退是策略，不一定代表失敗。"}, "艮-兌": {"number": 31, "name": "咸", "upper": "艮", "lower": "兌", "summary": "互相感應。關係中的吸引與互動正在形成。"}, "艮-離": {"number": 56, "name": "旅", "upper": "艮", "lower": "離", "summary": "流動與暫居。環境未穩，保持彈性比重押更重要。"}, "艮-震": {"number": 62, "name": "小過", "upper": "艮", "lower": "震", "summary": "小事可為，大事宜慎。細節處理比擴張更關鍵。"}, "艮-巽": {"number": 53, "name": "漸", "upper": "艮", "lower": "巽", "summary": "循序漸進。關係與事業都適合一步一步建立。"}, "艮-坎": {"number": 39, "name": "蹇", "upper": "艮", "lower": "坎", "summary": "前進受阻。改道、求助、延後都可能比硬闖更好。"}, "艮-艮": {"number": 52, "name": "艮", "upper": "艮", "lower": "艮", "summary": "停止與界線。暫停行動、重新定位有其必要。"}, "艮-坤": {"number": 15, "name": "謙", "upper": "艮", "lower": "坤", "summary": "謙和低調。適合穩健累積，讓成果自然被看見。"}, "坤-乾": {"number": 12, "name": "否", "upper": "坤", "lower": "乾", "summary": "阻塞與隔閡。先保存實力，避免勉強推進失衡局面。"}, "坤-兌": {"number": 45, "name": "萃", "upper": "坤", "lower": "兌", "summary": "聚集資源。適合整合人脈與力量，但要有共同中心。"}, "坤-離": {"number": 35, "name": "晉", "upper": "坤", "lower": "離", "summary": "逐步上升。適合曝光、爭取機會與擴大影響。"}, "坤-震": {"number": 16, "name": "豫", "upper": "坤", "lower": "震", "summary": "氣勢與動員。可以啟動計畫，但要避免只靠情緒熱度。"}, "坤-巽": {"number": 20, "name": "觀", "upper": "坤", "lower": "巽", "summary": "觀察與檢視。先看全局，再決定是否投入。"}, "坤-坎": {"number": 8, "name": "比", "upper": "坤", "lower": "坎", "summary": "親近與合作。適合尋找可靠夥伴，也要確認彼此立場。"}, "坤-艮": {"number": 23, "name": "剝", "upper": "坤", "lower": "艮", "summary": "剝落、減弱。適合止損、簡化、去除不必要負擔。"}, "坤-坤": {"number": 2, "name": "坤", "upper": "坤", "lower": "坤", "summary": "包容、承載、配合。適合穩定累積，不宜過度躁進。"}};

function trigramFromCode(code) {
  for (const [name, meta] of Object.entries(TRIGRAMS)) {
    if (meta.code === code) return name;
  }
  return "坤";
}

function hexagramFromLines(lines) {
  // lines are bottom -> top, true=yang, false=yin
  const lowerCode = lines.slice(0,3).map(v => v ? "1" : "0").join("");
  const upperCode = lines.slice(3,6).map(v => v ? "1" : "0").join("");
  const lower = trigramFromCode(lowerCode);
  const upper = trigramFromCode(upperCode);
  const h = HEXAGRAMS[`${upper}-${lower}`];
  return {...h, upperMeta:TRIGRAMS[upper], lowerMeta:TRIGRAMS[lower]};
}

function cryptoInt(max) {
  if (window.crypto && crypto.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return Math.floor((a[0] / 4294967296) * max);
  }
  return Math.floor(Math.random() * max);
}

function mod1(n, base) {
  const r = Number(n) % base;
  return r === 0 ? base : r;
}


function tossCoin() {
  // 3 = 正面, 2 = 反面；三枚合計 6/7/8/9
  return cryptoInt(2) === 0 ? 2 : 3;
}

function tossLine() {
  const coins = [tossCoin(), tossCoin(), tossCoin()];
  const value = coins.reduce((a,b) => a+b, 0);
  return {
    coins,
    value,
    yang: value === 7 || value === 9,
    moving: value === 6 || value === 9,
    label: value === 6 ? "老陰" : value === 7 ? "少陽" : value === 8 ? "少陰" : "老陽"
  };
}

function cast() {
  const lineObjects = [];
  for (let i=0;i<6;i++) lineObjects.push(tossLine());

  const lines = lineObjects.map(x => x.yang);
  const changedLines = lineObjects.map(x => x.moving ? !x.yang : x.yang);

  return {
    lineObjects,
    lines,
    changedLines,
    original:hexagramFromLines(lines),
    changed:hexagramFromLines(changedLines),
    movingLines:lineObjects.map((x,i)=>x.moving ? i+1 : null).filter(Boolean)
  };
}

window.LiuyaoCore = Object.freeze({
  cast,
  version:"1.0-three-coin-basic"
});
})();
