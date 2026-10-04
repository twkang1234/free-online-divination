(() => {
  "use strict";

  const majorArcana = [["0", "愚者", "The Fool", "新開始、自由、冒險、相信直覺", "魯莽、停滯、逃避承諾、準備不足"], ["I", "魔術師", "The Magician", "行動力、資源整合、創造、把想法落地", "操控、分心、能力未發揮、說多做少"], ["II", "女祭司", "The High Priestess", "直覺、秘密、內在智慧、等待答案浮現", "忽略直覺、資訊不明、壓抑感受、祕密曝光"], ["III", "皇后", "The Empress", "豐盛、滋養、創造力、關係成長", "過度付出、依賴、停滯、缺乏照顧"], ["IV", "皇帝", "The Emperor", "秩序、權威、穩定、建立規則", "僵化、控制、權威衝突、缺乏彈性"], ["V", "教皇", "The Hierophant", "傳統、學習、制度、尋求指引", "打破傳統、質疑制度、教條、價值衝突"], ["VI", "戀人", "The Lovers", "關係、選擇、價值一致、合作", "失衡、誘惑、價值衝突、關係不一致"], ["VII", "戰車", "The Chariot", "意志、推進、勝利、自我掌控", "失控、急進、方向分散、挫折"], ["VIII", "力量", "Strength", "勇氣、耐心、柔性掌控、內在力量", "自我懷疑、失去耐性、情緒失控、消耗"], ["IX", "隱者", "The Hermit", "沉澱、獨處、尋找答案、深度思考", "孤立、封閉、過度退縮、拒絕建議"], ["X", "命運之輪", "Wheel of Fortune", "轉折、機會、循環改變、時機來臨", "延遲、失控、重複舊循環、時機未到"], ["XI", "正義", "Justice", "公平、因果、責任、理性判斷", "偏頗、逃避責任、不公平、資訊失衡"], ["XII", "倒吊人", "The Hanged Man", "暫停、換角度、放下、等待轉機", "拖延、無效犧牲、抗拒改變、卡住"], ["XIII", "死神", "Death", "結束、轉化、斷捨離、新階段", "抗拒結束、停滯、放不下、轉變延遲"], ["XIV", "節制", "Temperance", "平衡、整合、療癒、循序漸進", "失衡、過量、急躁、協調失敗"], ["XV", "惡魔", "The Devil", "執著、慾望、束縛、看見陰影", "脫離束縛、覺醒、戒除依賴、重新掌控"], ["XVI", "高塔", "The Tower", "突變、真相揭露、舊結構崩解、重建", "避免危機、壓抑變化、延後爆發、內在震盪"], ["XVII", "星星", "The Star", "希望、療癒、願景、重新相信", "失望、信心不足、理想落空、需要休息"], ["XVIII", "月亮", "The Moon", "不確定、潛意識、直覺、迷霧", "真相浮現、恐懼減弱、混亂、誤判"], ["XIX", "太陽", "The Sun", "成功、清晰、活力、喜悅與肯定", "延遲的成功、過度樂觀、疲憊、快樂打折"], ["XX", "審判", "Judgement", "覺醒、回顧、重大決定、重新出發", "自我否定、逃避召喚、猶豫、舊事牽制"], ["XXI", "世界", "The World", "完成、整合、成果、階段圓滿", "尚未完成、缺一塊、延遲、需要收尾"]];
  const suitDefs = {"權杖": {"en": "Wands", "symbol": "✦", "domain": "行動、企圖、創造與推進"}, "聖杯": {"en": "Cups", "symbol": "◒", "domain": "感情、關係、直覺與情緒"}, "寶劍": {"en": "Swords", "symbol": "◇", "domain": "思考、決斷、壓力與溝通"}, "錢幣": {"en": "Pentacles", "symbol": "⬡", "domain": "金錢、工作、資源與現實基礎"}};
  const rankDefs = [["Ace", "王牌", "新的起點、機會萌芽、能量開始集中", "能量受阻、機會延遲、準備不足"], ["2", "二", "選擇、平衡、兩股力量並存", "猶豫、失衡、難以取捨"], ["3", "三", "擴張、合作、成果開始成形", "合作不順、進展放慢、期待落差"], ["4", "四", "穩定、休整、建立基礎", "僵化、停滯、需要調整結構"], ["5", "五", "競爭、摩擦、重新定位", "內耗、衝突延長、難以協調"], ["6", "六", "進展、回饋、局勢改善", "延遲、自我懷疑、成果未被看見"], ["7", "七", "堅持、防守、考驗立場", "疲憊、退縮、策略失衡"], ["8", "八", "快速推進、節奏加快、事情成形", "阻礙、延誤、節奏失控"], ["9", "九", "韌性、守成、接近完成", "壓力過重、過度防備、能量不足"], ["10", "十", "完成、責任、階段性結果", "負擔過重、收尾困難、需要放下"], ["Page", "侍者", "消息、學習、好奇、初步嘗試", "不成熟、消息混亂、缺乏經驗"], ["Knight", "騎士", "行動、追求、推進、明確動機", "衝動、方向失衡、過度急進"], ["Queen", "皇后", "成熟掌握、滋養、內在穩定", "情緒化、依賴、內耗、界線模糊"], ["King", "國王", "領導、掌控、成熟決策、承擔責任", "僵化、專斷、控制過度、判斷失衡"]];

  const deck = [];

  majorArcana.forEach((c, index) => {
    deck.push({
      id: `major-${index}`,
      arcana: "major",
      suit: "大阿爾克那",
      number: c[0],
      name: c[1],
      en: c[2],
      symbol: "✺",
      domain: "人生主題、轉折與核心課題",
      upright: c[3],
      reversed: c[4]
    });
  });

  Object.entries(suitDefs).forEach(([suit, meta]) => {
    rankDefs.forEach((r, index) => {
      deck.push({
        id: `${meta.en.toLowerCase()}-${index + 1}`,
        arcana: "minor",
        suit,
        number: r[0],
        name: `${suit}${r[1]}`,
        en: `${r[0]} of ${meta.en}`,
        symbol: meta.symbol,
        domain: meta.domain,
        upright: `${meta.domain}：${r[2]}`,
        reversed: `${meta.domain}：${r[3]}`
      });
    });
  });

  const spreads = {
    one: {
      name: "一張牌｜此刻訊息",
      description: "適合快速聚焦一個問題，觀察目前最重要的提醒。",
      positions: ["此刻的核心訊息"]
    },
    three: {
      name: "三張牌｜過去・現在・未來",
      description: "用三個時間切面觀察事件如何形成、目前狀態與可能的發展方向。",
      positions: ["過去／成因", "現在／核心", "未來／趨勢"]
    },
    five: {
      name: "五張牌｜情境解析",
      description: "適合較複雜的問題，從現況、阻力、資源、建議到可能結果依序展開。",
      positions: ["現況", "主要阻力", "可運用的資源", "行動建議", "可能結果"]
    }
  };

  function randomInt(max) {
    if (window.crypto && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return Math.floor((buf[0] / 4294967296) * max);
    }
    return Math.floor(Math.random() * max);
  }

  function shuffle(input = deck) {
    const arr = input.map(card => ({...card}));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function draw(spreadKey = "three") {
    const spread = spreads[spreadKey] || spreads.three;
    const shuffled = shuffle(deck);
    return spread.positions.map((position, index) => {
      const card = shuffled[index];
      const reversed = randomInt(2) === 1;
      return {
        ...card,
        position,
        reversed,
        meaning: reversed ? card.reversed : card.upright
      };
    });
  }

  function drawPositions(positions = ["目前狀態", "核心因素", "近期趨勢"]) {
    const safePositions = Array.isArray(positions) && positions.length ? positions.slice(0, 7) : ["核心訊息"];
    const shuffled = shuffle(deck);
    return safePositions.map((position, index) => {
      const card = shuffled[index];
      const reversed = randomInt(2) === 1;
      return {
        ...card,
        position,
        reversed,
        meaning: reversed ? card.reversed : card.upright
      };
    });
  }

  function getCardById(id) {
    const card = deck.find(item => item.id === id);
    return card ? {...card} : null;
  }

  window.TarotCore = Object.freeze({
    deck,
    spreads,
    shuffle,
    draw,
    drawPositions,
    getCardById,
    CARD_COUNT: deck.length,
    ENGINE_VERSION: "3.0"
  });
})();
