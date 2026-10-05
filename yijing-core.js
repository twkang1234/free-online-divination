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
  {pos:1, yin:"初六", yang:"初九", stage:"事情剛開始、根基與第一步", layer:"起點與根基", advice:"先確認起點、動機與基本條件是否站得住；初爻最怕還沒看清局勢就急著把結果做大。"},
  {pos:2, yin:"六二", yang:"九二", stage:"開始發展、實際互動與承接", layer:"互動與落地", advice:"第二爻已從想法走到實際互動，重點是彼此能不能接得上，而不是只看單方面期待。"},
  {pos:3, yin:"六三", yang:"九三", stage:"壓力上升、進退拉扯與第一次考驗", layer:"壓力與取捨", advice:"第三爻常是容易用力過猛的位置；要分清楚堅持與硬撐，不要因焦慮而把局勢推向極端。"},
  {pos:4, yin:"六四", yang:"九四", stage:"由內轉外、環境介入與臨門一腳", layer:"外部環境與時機", advice:"第四爻開始受到外部條件影響，是否行動不能只看自己的意願，也要看時機與對方能否承接。"},
  {pos:5, yin:"六五", yang:"九五", stage:"核心位置、主導權與成熟判斷", layer:"核心與主導", advice:"第五爻通常最接近事情真正的核心；比起枝節，應抓住最關鍵的原則、關係或決策標準。"},
  {pos:6, yin:"上六", yang:"上九", stage:"事情走到極端、收尾或下一輪之前", layer:"頂點與收尾", advice:"上爻代表一個階段已接近極限。此時最重要的不是再加碼，而是避免過頭並準備下一個週期。"}
];

// 64 卦的「核心—陰影—破局」層。這不是把卦分成好壞，而是用來讓網站能把卦意寫成完整情境。
const HEXAGRAM_DEPTH = {
  "乾":{core:"主動創造、建立方向、持續推進。真正的力量不是一味強硬，而是知道自己要往哪裡走，並能長期自我要求。",shadow:"容易因自信與推進力過強而忽略他人的節奏，也可能把『我能做到』變成『我一定要現在做到』。",action:"把主導力用在定方向與穩定執行，不必靠壓迫或逞強證明自己。"},
  "坤":{core:"承載、包容、配合與讓事情慢慢成形。它不是沒有力量，而是以柔、穩、持續來接住局勢。",shadow:"太會等待、配合或忍耐時，容易把真正需求藏起來，久了會形成被動與模糊。",action:"保持柔軟，但不能失去自己的界線；該等待時等待，該讓立場被看見時也要清楚表達。"},
  "屯":{core:"事情正在出生，方向有了，但環境、資源與秩序還很混亂。難不是代表不能成，而是仍處在建立規則的早期。",shadow:"急著證明成果，容易在基礎未穩時同時處理太多問題。",action:"先把最基本的秩序、角色與下一步整理好，一步一步讓混亂變成可管理。"},
  "蒙":{core:"資訊不足、經驗不足或問題本身尚未被問清楚。它要求先學、先問、先理解，再做判斷。",shadow:"容易因急著得到答案而反覆求證，最後資訊越多反而越亂。",action:"先縮小問題，找可靠資訊或有經驗的人，把不知道的部分說清楚。"},
  "需":{core:"不是不能前進，而是條件尚未成熟。等待的價值在準備，不在消極拖延。",shadow:"等待久了可能變成焦慮，或為了擺脫焦慮而提早出手。",action:"把等待期用來補條件、做備案、觀察訊號，等真正能承擔結果時再推進。"},
  "訟":{core:"立場、權益或說法出現衝突，需要規則、證據與界線來處理。",shadow:"越想證明自己完全正確，越容易把可協調的問題變成輸贏。",action:"先保留證據、確認規則與底線；能談就談，無法談再考慮退出或正式處理。"},
  "師":{core:"局勢需要組織、紀律與共同目標，靠單打獨鬥很難長期支撐。",shadow:"缺乏一致指揮時容易各做各的；控制過強又會造成反彈。",action:"先定目標、角色與責任，再談速度；秩序比一時氣勢重要。"},
  "比":{core:"親近、合作與建立可靠連結。重點不是人多，而是彼此是否真正同心。",shadow:"為了融入而過度迎合，或只看表面關係而忽略價值是否一致。",action:"確認誰是真正可靠的夥伴，關係應建立在互惠與一致立場上。"},
  "小畜":{core:"力量正在累積，但暫時不足以一次突破。小幅調整、耐心準備會比硬闖有效。",shadow:"因進展太慢而焦躁，反覆改方向反而讓累積失效。",action:"把注意力放在可控制的小改進，等條件累積到足以突破。"},
  "履":{core:"身處有風險或有界線的環境，需要謹慎前進。不是不能走，而是每一步都要知道自己踩在哪裡。",shadow:"過度自信容易踩線；過度害怕又會失去應有的行動力。",action:"尊重規則與對方界線，穩穩走、不要冒進，反而能通過敏感階段。"},
  "泰":{core:"上下相通、資源交流、彼此能接得上，是適合推進與整合的局。",shadow:"順境容易讓人放鬆警覺，以為好的狀態會自動永久維持。",action:"趁通順時建立制度與信任，同時保留對轉折的敏感度。"},
  "否":{core:"彼此方向、環境或條件沒有交會，事情容易卡在『各有各的道理，但接不起來』。",shadow:"越急著強行打通，越可能耗掉自己；也容易把暫時的不通誤認成自己的價值不足。",action:"先保存實力、找出真正斷點，必要時換圈子、換方法或等待條件改變。"},
  "同人":{core:"共同目標與價值一致能把不同的人連在一起。",shadow:"若只靠私人好惡、小圈圈或表面和氣，合作很快會失去中心。",action:"把共同目的說清楚，讓合作建立在公開、可共同承擔的原則上。"},
  "大有":{core:"手上有資源、有位置或有機會，重點轉為『怎麼使用已有優勢』。",shadow:"容易因順利而高估自己，或資源太多卻缺乏優先順序。",action:"把資源集中在真正重要的目標，保持謙遜與節制。"},
  "謙":{core:"有實力而不張揚，懂得留空間給別人，反而能走得更穩。",shadow:"謙虛若變成自我壓低或不敢表達，會讓真正能力被埋沒。",action:"低調但不隱形，穩定交付成果，該承擔時要站出來。"},
  "豫":{core:"氣勢、期待與動員力正在形成，適合讓人心動起來。",shadow:"容易只有熱度沒有結構，情緒高點過後迅速失速。",action:"把熱情轉成具體安排，確認資源、時間與責任都有落地。"},
  "隨":{core:"順著局勢調整，不執著原本劇本。真正的隨不是沒主見，而是知道什麼值得跟、什麼不值得。",shadow:"過度迎合環境會失去自己的原則。",action:"保留核心原則，但允許方法與節奏跟著現實變化。"},
  "蠱":{core:"累積已久的舊問題需要被整理、修補與清除。",shadow:"如果只想開新局而不處理舊漏洞，同樣問題會再次出現。",action:"先找根因、補制度與責任，再談新的開始。"},
  "臨":{core:"機會正在靠近，彼此距離縮短，適合主動準備與建立關係。",shadow:"因為看到機會就太快投入，可能忽略後續管理。",action:"把握靠近的窗口，但要同時建立規則、節奏與長期安排。"},
  "觀":{core:"先拉高視角觀察全局，暫時不急著表態。",shadow:"看太久、想太多會錯過真正該行動的時機。",action:"蒐集關鍵訊號並設定決策點，觀察是為了更準確地行動。"},
  "噬嗑":{core:"中間有明確障礙需要咬開、處理，不能只靠模糊協調。",shadow:"把處理問題變成情緒懲罰，反而製造新的衝突。",action:"把問題具體化，依規則處理該處理的部分，完成後不要反覆追打。"},
  "賁":{core:"形式、表達與包裝能讓事情更容易被理解，但本質仍是核心。",shadow:"只修表面、不處理實質，短期好看但無法長久。",action:"先確保內容站得住，再用合宜方式呈現與溝通。"},
  "剝":{core:"某些支撐正在一層層減弱，現在更適合保護核心，而不是擴張。",shadow:"不願承認結構已鬆動，可能繼續投入到無法回收。",action:"做減法、止損、保存最有價值的部分，等新的根基形成。"},
  "復":{core:"走偏之後重新回到正軌，小小的回轉已經是重要訊號。",shadow:"剛看到轉機就想一次追回全部，容易再度偏離。",action:"從最小但正確的行動開始，穩定重建節奏。"},
  "無妄":{core:"回到真實與自然，不靠過度算計控制結果。",shadow:"自以為『真心就一定有好結果』也可能忽略現實條件。",action:"做自己該做且正當的事，同時接受有些結果不能完全控制。"},
  "大畜":{core:"蓄積能力、資源與紀律，先把力量收住，等待更大的用途。",shadow:"把準備變成拖延，或只累積卻不願真正上場。",action:"設定清楚的出手條件，能力準備好後就要用出去。"},
  "頤":{core:"你持續餵養什麼，最後就會長成什麼。它關乎輸入、習慣、資源與照顧。",shadow:"錯誤的資訊、關係或習慣會在不知不覺中消耗自己。",action:"重新檢查每天在吸收、投入與供給什麼，把資源放回真正滋養你的地方。"},
  "大過":{core:"結構承受的重量已超過平常範圍，需要特殊調整。",shadow:"再靠意志硬撐，可能讓本來可修的問題變成斷裂。",action:"減重、分工、換支點；先保結構，再談成果。"},
  "坎":{core:"風險不是一次，而是反覆出現，因此真正考驗的是風險管理與穩定心性。",shadow:"僥倖、焦慮或急著逃離風險都可能讓人做出更差決定。",action:"建立備案、控制暴露程度，一次處理一個危險點。"},
  "離":{core:"看清楚、被看見、依附某個核心而發光。",shadow:"容易只看表面明亮，或過度依賴某個人、身份、資訊來源。",action:"確認你所依附的核心是否可靠，讓清晰帶來判斷，而不是執著。"},
  "咸":{core:"互相感應、吸引與回應正在形成，重點是雙向。",shadow:"把一時感覺當成完整承諾，容易過度投射。",action:"看彼此是否都有實際回應，讓關係由感覺慢慢變成可確認的互動。"},
  "恆":{core:"真正有效的不是短期爆發，而是能不能長期維持。",shadow:"把『堅持』變成僵化，明明環境已改變仍不調整。",action:"守住核心原則，同時允許方法更新。"},
  "遯":{core:"退不是失敗，而是避開不利位置，保存下一步的主動權。",shadow:"退得太晚會變成被迫撤退；退得太早又可能錯失可處理的機會。",action:"分清楚什麼值得守、什麼應該撤，主動調整位置。"},
  "大壯":{core:"力量與動能很強，已具備推進能力。",shadow:"力量越大越容易用力過頭，碰到界線反而受傷。",action:"把力量放在正確方向，用規則和分寸約束衝勁。"},
  "晉":{core:"被看見、向上發展與取得更多機會。",shadow:"為了曝光或進度而忽略品質，容易後繼無力。",action:"把握上升期，但要讓能力與承擔同步增加。"},
  "明夷":{core:"光暫時被遮住，不代表能力消失，而是環境不適合完全外露。",shadow:"逞強或急著證明自己，可能在不利環境中受傷。",action:"低調保護核心、保存實力，等條件改善再重新出手。"},
  "家人":{core:"內部秩序、角色與責任要先整理好，外在才容易穩。",shadow:"角色模糊、界線不清或只要求別人，會讓關係內耗。",action:"先從自己的責任與溝通方式開始，建立可預期的秩序。"},
  "睽":{core:"彼此有差異、不同步或看法相反，不一定要硬求完全一致。",shadow:"把差異解讀成敵意，容易讓可合作的部分也消失。",action:"先找可共識的小事，保留差異但建立最低合作基礎。"},
  "蹇":{core:"路確實不好走，現在的答案可能不是更用力，而是改道、求助或延後。",shadow:"把困難當成意志測驗，越撞越傷。",action:"重新評估路線與資源，尋找能協助你的人或替代路徑。"},
  "解":{core:"壓力開始鬆動，有機會解除卡點、善後與重新安排。",shadow:"剛鬆綁就急著開新局，可能讓舊問題沒有真正收尾。",action:"先清理後果與誤會，再把釋放出的空間用在下一步。"},
  "損":{core:"主動做減法，短期少一點，反而保住長期真正重要的東西。",shadow:"不分好壞地削減，可能把核心也一起犧牲。",action:"只減掉低效、過量與不必要負擔，把資源留給核心。"},
  "益":{core:"增加、投入與成長，有機會形成正循環。",shadow:"什麼都想加，最後資源被稀釋；也可能只看短期增量。",action:"把增加的資源投到真正能放大效果的地方。"},
  "夬":{core:"事情到了必須說清楚、做決定或切開模糊的階段。",shadow:"表態若變成情緒宣戰，會讓本來可處理的問題失控。",action:"清楚、公開、有原則地說明立場，但不要靠羞辱或逼迫。"},
  "姤":{core:"突然出現的人事物帶來強烈吸引或變化，先觀察其長期性。",shadow:"新鮮、誘惑或強烈感受容易讓人過早投入。",action:"保留空間與界線，先看對方或機會能否經得起時間。"},
  "萃":{core:"人、資源與注意力正在聚集，需要共同中心才能形成力量。",shadow:"只聚集不整合，容易人多意見多、資源互相抵消。",action:"明確共同目標與誰負責整合，讓聚集轉成可用力量。"},
  "升":{core:"一步一步向上，不靠暴衝，而靠累積、信任與持續。",shadow:"嫌速度慢而跨越必要步驟，容易根基跟不上。",action:"按階段前進，每一次上升都要有新的能力或條件承接。"},
  "困":{core:"資源、情緒或行動被限制，最重要的是在壓力中守住核心。",shadow:"越想立刻脫困越容易做極端決定，甚至耗掉最後的選擇權。",action:"先停止無效消耗，辨認真正限制在哪裡，再找可以慢慢鬆動的出口。"},
  "井":{core:"問題在根本資源、制度與長期供給，不是一次性的表面補救。",shadow:"資源其實存在，但取用方式壞了，會形成『明明有卻用不到』。",action:"修好渠道、制度與基礎，讓資源能穩定被使用。"},
  "革":{core:"舊方式已難以繼續，需要有計畫地改變。",shadow:"為了改而改、太早改或沒有共識就改，都會增加成本。",action:"確認改變的理由、時機與支持條件，再一次把新規則立穩。"},
  "鼎":{core:"把原料變成成品，代表品質、角色或制度進入升級。",shadow:"只想升級外觀與名義，內部能力卻沒有跟上。",action:"把資源重新組合成更成熟的結構，讓升級有實質內容。"},
  "震":{core:"突發變動打破原有節奏，第一件事是穩住，不要被第一波反應帶走。",shadow:"驚慌、衝動或把一次震動想成全面崩壞。",action:"先確認實際影響，再按優先順序處理；穩住後反而更容易看清。"},
  "艮":{core:"停止、界線與重新定位。有時不動就是必要的行動。",shadow:"停止若變成僵住、拒絕溝通，就會把保護變成隔絕。",action:"清楚說明界線與暫停原因，等方向重新確定再啟動。"},
  "漸":{core:"循序漸進、關係或成果需要時間建立，不能跳過中間階段。",shadow:"因速度不夠快就否定進展，或過度催促成熟。",action:"觀察每一階段是否真的比前一步更穩，穩定比快速重要。"},
  "歸妹":{core:"角色、時機或權力條件不完全對等，先認清自己所處的位置。",shadow:"只靠情感、衝動或急著取得名分，容易忽略現實限制。",action:"先看條件是否對等、承諾是否真實，再決定投入程度。"},
  "豐":{core:"能量、資訊或成果正處高峰，適合把握，但高峰本身也意味著後續會變。",shadow:"在最旺時誤以為可以無限延續，容易過度擴張。",action:"利用高峰完成重要事情，同時預先準備降溫與收斂。"},
  "旅":{core:"目前環境仍在流動或過渡，尚未真正安定。",shadow:"在暫時狀態下做過度長期承諾，或因沒有歸屬而焦躁。",action:"保持彈性、守基本規則，等落腳點更清楚再重押。"},
  "巽":{core:"柔和、持續、滲透式地影響局勢，重點在累積而非正面硬碰。",shadow:"太迂迴會讓立場不清，也可能一直試探卻不真正決定。",action:"用柔軟方式持續推進，但目標與底線要清楚。"},
  "兌":{core:"交流、愉悅與彼此願意開口，是透過溝通促成連結的卦。",shadow:"為了維持好氣氛而過度討好，會讓重要問題被掩蓋。",action:"保持友善與真誠，同時敢於談真正需要談的事情。"},
  "渙":{core:"原本凝結、隔閡或僵硬的東西開始散開，適合重新流動。",shadow:"只把問題沖散卻沒有重新建立中心，容易變成更鬆散。",action:"先化解心結與阻塞，再建立新的連結方式與共同中心。"},
  "節":{core:"限制、規則與適度節制能讓事情長久。",shadow:"規則太多會窒息，完全沒規則又會失控。",action:"建立清楚但合理的界線，讓彼此知道什麼可以、什麼不可以。"},
  "中孚":{core:"真誠、可信與內外一致。很多問題不是技巧不足，而是彼此是否真正相信。",shadow:"嘴上說真誠但行動不一致，反而更傷信任。",action:"讓承諾與行動對得上，用可驗證的行動建立信任。"},
  "小過":{core:"小事可以調整，大動作則需謹慎，現在是修細節而非擴張的時候。",shadow:"把局部問題放大成全面翻盤，或忽略小問題最後累積成大問題。",action:"先修最具體的小地方，避免做不可逆的大決定。"},
  "既濟":{core:"事情看似完成或接近完成，但真正考驗是如何維持，不讓完成後再亂。",shadow:"因為『已經好了』就放鬆細節，後續容易反覆。",action:"把最後收尾、維護與風險管理做好，越接近成功越要謹慎。"},
  "未濟":{core:"尚未完成，局勢仍在最後調整。這不是失敗，而是不能太早宣布結果。",shadow:"心急跨過最後一步，常在快完成時出錯。",action:"確認最後的條件、順序與風險，完成前保持耐心。"}
};

// 經典爻辭：先收進最常用、且本版已有可靠校對來源的卦。沒有資料時仍會用完整的爻位＋卦意解讀，不會空白。
const CLASSIC_YAO = {
  "乾":{"初九":"潛龍勿用。","九二":"見龍在田，利見大人。","九三":"君子終日乾乾，夕惕若厲，無咎。","九四":"或躍在淵，無咎。","九五":"飛龍在天，利見大人。","上九":"亢龍有悔。"},
  "坤":{"初六":"履霜，堅冰至。","六二":"直方大，不習無不利。","六三":"含章可貞，或從王事，無成有終。","六四":"括囊，無咎無譽。","六五":"黃裳，元吉。","上六":"龍戰於野，其血玄黃。"},
  "困":{"初六":"臀困於株木，入於幽谷，三歲不覿。","九二":"困於酒食，朱紱方來，利用享祀；征凶，無咎。","六三":"困於石，據於蒺藜；入於其宮，不見其妻，凶。","九四":"來徐徐，困於金車，吝，有終。","九五":"劓刖，困於赤紱；乃徐有說，利用祭祀。","上六":"困於葛藟，於臲卼，曰動悔；有悔，征吉。"},
  "泰":{"初九":"拔茅茹，以其彙，征吉。","九二":"包荒，用馮河，不遐遺，朋亡，得尚於中行。","九三":"無平不陂，無往不復；艱貞無咎，勿恤其孚，於食有福。","六四":"翩翩，不富以其鄰，不戒以孚。","六五":"帝乙歸妹，以祉元吉。","上六":"城復於隍，勿用師；自邑告命，貞吝。"},
  "復":{"初九":"不遠復，無祇悔，元吉。","六二":"休復，吉。","六三":"頻復，厲，無咎。","六四":"中行獨復。","六五":"敦復，無悔。","上六":"迷復，凶，有災眚；用行師，終有大敗。"},
  "蹇":{"初六":"往蹇，來譽。","六二":"王臣蹇蹇，匪躬之故。","九三":"往蹇，來反。","六四":"往蹇，來連。","九五":"大蹇，朋來。","上六":"往蹇，來碩，吉，利見大人。"},
  "屯":{"初九":"磐桓，利居貞，利建侯。","六二":"屯如邅如，乘馬班如；匪寇，婚媾。","六三":"即鹿無虞，惟入於林中；君子幾，不如舍，往吝。","六四":"乘馬班如，求婚媾，往吉，無不利。","九五":"屯其膏，小貞吉，大貞凶。","上六":"乘馬班如，泣血漣如。"},
  "既濟":{"初九":"曳其輪，濡其尾，無咎。","六二":"婦喪其茀，勿逐，七日得。","九三":"高宗伐鬼方，三年克之，小人勿用。","六四":"繻有衣袽，終日戒。","九五":"東鄰殺牛，不如西鄰之禴祭，實受其福。","上六":"濡其首，厲。"},
  "未濟":{"初六":"濡其尾，吝。","九二":"曳其輪，貞吉。","六三":"未濟，征凶，利涉大川。","九四":"貞吉，悔亡；震用伐鬼方，三年有賞於大國。","六五":"貞吉，無悔；君子之光，有孚，吉。","上九":"有孚於飲酒，無咎；濡其首，有孚失是。"},
  "革":{"初九":"鞏用黃牛之革。","六二":"巳日乃革之，征吉，無咎。","九三":"征凶，貞厲；革言三就，有孚。","九四":"悔亡，有孚改命，吉。","九五":"大人虎變，未占有孚。","上六":"君子豹變，小人革面；征凶，居貞吉。"},
  "鼎":{"初六":"鼎顛趾，利出否；得妾以其子，無咎。","九二":"鼎有實，我仇有疾，不我能即，吉。","九三":"鼎耳革，其行塞；雉膏不食，方雨虧悔，終吉。","九四":"鼎折足，覆公餗，其形渥，凶。","六五":"鼎黃耳金鉉，利貞。","上九":"鼎玉鉉，大吉，無不利。"},
  "咸":{"初六":"咸其拇。","六二":"咸其腓，凶，居吉。","九三":"咸其股，執其隨，往吝。","九四":"貞吉，悔亡；憧憧往來，朋從爾思。","九五":"咸其脢，無悔。","上六":"咸其輔頰舌。"}
};

const YAO_EXPLAIN = {
  "坤:六二":"『直方大』的重點是正直、方正、能承載，不必靠套路。放到現實問題裡，就是可以誠實、清楚，但不用用力逼迫；把自己的真實立場穩穩放出來，通常比反覆猜測更有利。",
  "坤:六四":"『括囊』像把袋口收住，重點是知道什麼話現在可以說、什麼還不適合一次全攤。這不是虛假，而是分寸：資訊、情緒與承諾要讓對方有能力接住。",
  "坤:六五":"『黃裳，元吉』重點在中正、內斂與合宜。真正有利的不是討好，也不是強勢，而是『我尊重你，也尊重我自己』的穩定姿態。",
  "乾:初九":"『潛龍勿用』不是叫你永遠不做，而是提醒力量還在水下。現在最有價值的是準備與等待適合的出場時點。",
  "乾:九二":"『見龍在田』表示力量開始被看見，也開始能與外界形成連結。此時適合接觸人、資源與更有經驗的協助。",
  "乾:九三":"『終日乾乾』提醒高度自我要求與警覺。努力本身沒有錯，但過度緊繃、想把所有結果都控制住，會變成額外消耗。",
  "乾:九五":"『飛龍在天』是能力與位置相配的階段，但越接近核心位置，越需要把力量用在正確目標，而不是自我證明。",
  "乾:上九":"『亢龍有悔』提醒任何力量走到極端都可能反轉；最強的時候反而要知道收。"
};

const TOPICS = [
  {id:"love", re:/感情|愛情|桃花|曖昧|復合|分手|交往|對象|喜歡|婚姻|伴侶|單身/, name:"感情關係", focus:"雙方互動、距離、時機、關係阻力與彼此是否往同一方向走"},
  {id:"work", re:/工作|職場|求職|面試|離職|轉職|升遷|主管|同事|公司/, name:"工作職場", focus:"職場位置、環境阻力、機會成熟度、去留與下一步行動"},
  {id:"business", re:/創業|事業|生意|合作|客戶|訂單|專案|開店|公司經營/, name:"創業事業", focus:"資源是否到位、合作條件、發展阻力、推進節奏與擴張時機"},
  {id:"finance", re:/財運|投資|股票|買進|賣出|賺錢|金錢|收入|資金|理財|支出/, name:"財運金錢", focus:"現金流、資源配置、風險承受、投入節奏與需要先守住的地方"},
  {id:"choice", re:/選擇|要不要|是否|該不該|哪個|決定|抉擇|A|B/, name:"選擇決策", focus:"真正卡點、時機、不可逆風險、進退代價與最應優先的判斷原則"},
  {id:"self", re:/自己|內在|情緒|盲點|卡住|成長|方向/, name:"自我探索", focus:"目前內在狀態、慣性、盲點、真正需要調整的地方與下一階段方向"},
  {id:"people", re:/朋友|人際|家人|家庭|親子|同學|關係|相處/, name:"人際關係", focus:"溝通、界線、彼此立場、信任與關係接下來的變化"},
  {id:"fortune", re:/近期|一週|一個月|未來|接下來/, name:"近期發展", focus:"短期局勢、最可能出現的轉折、需要避免的風險與值得把握的時機"}
];

const POSITIVE = /順|成長|增加|上升|接近|合作|喜悅|完成|化解|回到正軌|資源充足|旺盛|發展|交流順暢|誠信|轉化|重新開始|逐步上升|聚集資源|親近/;
const CAUTION = /阻|困|閉塞|受限|風險|衝突|壓力|減弱|剝落|艱難|未完成|等待|謹慎|不宜|暫退|停止|低調|修補|不同|不對等|過重|突發/;

function topicFromQuestion(question="") {
  const q = String(question || "").trim();
  return TOPICS.find(t => t.re.test(q)) || {id:"general", name:"一般事件", focus:"目前局勢、主要阻力、轉折、機會與可採取的行動"};
}

function lineLabel(value, pos) {
  const meta = LINE_POSITIONS[pos-1];
  const yang = value === 7 || value === 9;
  return yang ? meta.yang : meta.yin;
}

function lineChangeText(value) {
  if (value === 6) return "老陰動，陰轉陽：原本偏被動、保守、承接或等待的力量開始轉向主動，表示這一層已經不容易繼續維持原狀。";
  if (value === 9) return "老陽動，陽轉陰：原本偏主動、強勢、外放或推進的力量需要收斂，表示方法、速度或姿態到了必須調整的階段。";
  return "靜爻：這一層目前不是主要轉折點。";
}

function movementPattern(moving) {
  if (!moving.length) return {title:"靜卦", text:"六爻皆靜，表示目前局勢的主題相對集中，短期不一定有劇烈翻轉。本卦本身就是主要訊息，重點是把現在看清楚，而不是為了想看變化而勉強追變卦。"};
  if (moving.length === 1) return {title:"單爻動", text:"只有一爻變動，轉折點相對集中。這一爻像整個局裡最明顯的鉸鏈：先把它處理好，往往比同時改很多事情更有效。"};
  if (moving.length === 2) return {title:"兩爻動", text:"兩個層面同時改變，事情通常不是單一原因造成。兩爻之間要互相參照：一個可能指出內在原因，另一個則顯示外部條件或後續反應。"};
  if (moving.length === 3) return {title:"三爻動", text:"變動幅度已經明顯。本卦代表的舊狀態正在鬆動，而變卦代表的新狀態還在形成，因此不能只看其中一邊；真正重要的是理解『為什麼會從本卦走向變卦』。"};
  if (moving.length === 4) return {title:"四爻動", text:"大部分結構都在改變，表示現在不是小修小補的階段。變卦的重要性明顯提高，原本的相處方式、策略或判斷框架很可能已經不夠用了。"};
  if (moving.length === 5) return {title:"五爻動", text:"整體局勢接近重組，只剩少數條件仍維持原狀。與其執著『怎樣回到以前』，更值得問『新的局面要怎麼站穩』。"};
  return {title:"六爻皆動", text:"六爻全部變動，代表舊局幾乎全面翻轉。這類卦不適合用原本的方法硬撐，應視為一個完整週期結束、另一個週期開始，重新檢查角色、目標與方法。"};
}

function valence(h) {
  const s = h.summary || "";
  if (POSITIVE.test(s) && !CAUTION.test(s)) return "up";
  if (CAUTION.test(s) && !POSITIVE.test(s)) return "down";
  return "mixed";
}

function depthFor(h){
  return HEXAGRAM_DEPTH[h.name] || {core:h.summary,shadow:"如果只抓住卦象的一面而忽略現實條件，容易把提醒變成過度解讀。",action:"把卦意轉成可觀察、可驗證的行動，再看現實是否跟著改變。"};
}

function topicFromContext(context, question="") {
  const t = context && context.topic;
  if (t && t.name) return {id:t.id||"guided", name:t.name, focus:t.focus||"目前局勢、主要阻力、轉折、機會與可採取的行動"};
  return topicFromQuestion(question);
}

function scenarioFromContext(context) {
  const s = context && context.scenario;
  return s && s.name ? {id:s.id||"", name:s.name, desc:s.desc||""} : null;
}

function topicSentence(topic, type){
  const id=topic.id;
  const map={
    love:{obstacle:"感情題最重要的是看互動是否雙向、彼此是否真的往同一方向走；單方面的期待不能代替對方實際行動。",opportunity:"真正的機會通常出現在對方願意回應、願意安排時間、願意讓關係更具體時。",risk:"最大的風險是把自己的期待當成對方的承諾，或用猜測填補沒有被說清楚的地方。"},
    work:{obstacle:"工作題要分清楚：是能力不足、環境不合、權責不清，還是時機尚未成熟。不同原因需要完全不同的處理方式。",opportunity:"真正的機會會伴隨可見的資源、責任、職位或合作條件，而不只是口頭期待。",risk:"最大的風險是因一時情緒做不可逆決定，卻沒有先把下一步的現實條件準備好。"},
    business:{obstacle:"事業題不能只看熱情，還要看資源、合作、現金流與執行能力是否互相承接。",opportunity:"機會在於找到能形成正循環的核心投入，而不是每個方向都同時加碼。",risk:"最大的風險是過度擴張、責任不清或把尚未驗證的期待當成已確定的需求。"},
    finance:{obstacle:"金錢題要先看風險承受與現金流，再看可能收益；能不能承擔錯誤，比猜中一次更重要。",opportunity:"真正有利的機會通常具備可驗證條件，並且不需要你用超出承受能力的方式下注。",risk:"最大的風險是把卦象當成投資保證、追高、借貸加碼或忽略停損與部位管理。"},
    choice:{obstacle:"選擇題最容易被『我希望哪一個比較好』干擾，應把不可逆風險、代價與後續調整空間分開看。",opportunity:"好的選擇通常不是完美無缺，而是風險可控、方向一致，並且保留修正空間。",risk:"最大的風險是在資訊不足或情緒最高點時，逼自己立刻做永久決定。"},
    people:{obstacle:"人際題常卡在界線、角色與沒有說清楚的期待。",opportunity:"機會在於讓彼此立場更透明，觀察對方是否也願意修正與承擔。",risk:"最大的風險是為了維持表面和平而長期壓抑，最後一次爆發。"},
    self:{obstacle:"自我探索題真正要找的不是『哪裡不好』，而是目前哪一種慣性讓你重複消耗。",opportunity:"機會在於把抽象感受轉成一個可以實際調整的習慣、界線或行動。",risk:"最大的風險是把卦象當成對自己的負面標籤，而不是用來看見可改變的模式。"},
    fortune:{obstacle:"近期發展不適合解成每件事都會固定發生，而是看接下來哪一種局勢最值得注意。",opportunity:"機會通常出現在卦象所提示的條件真正出現時，而不是單靠日期等待。",risk:"最大的風險是把趨勢當成必然，忽略自己的行動仍會改變結果。"},
    general:{obstacle:"先分清楚哪些是你能控制的，哪些是外部條件；很多卡點來自把兩者混在一起。",opportunity:"機會在於先處理最關鍵、最可控的那一項，讓局勢開始流動。",risk:"最大的風險是因為想一次得到確定答案，而忽略現實正在變化。"}
  };
  return (map[id]||map.general)[type];
}

function specialYaoExplain(baseName,label){ return YAO_EXPLAIN[`${baseName}:${label}`] || ""; }

function yaoTopicAdvice(topic,pos,value){
  const direction=value===6?"從被動轉主動":"從主動轉收斂";
  const id=topic.id;
  const byPos={
    1:`先處理起點：${direction}時，最重要的是確認動機與基本條件，不要讓一時衝動替你做決定。`,
    2:`先看實際互動：${direction}會直接反映在彼此能否接得上；觀察行動、回應與資源交換，比猜測更可靠。`,
    3:`這裡是壓力點：${direction}時尤其容易焦慮或過度用力，應先修正節奏，再決定是否繼續推。`,
    4:`外部條件開始重要：${direction}不能只靠自己的意願，還要看環境、時機與他人的承接能力。`,
    5:`抓住核心：${direction}表示真正關鍵已浮出來，應把注意力從枝節拉回最重要的原則與目標。`,
    6:`已到階段頂點：${direction}代表該收尾或換週期，繼續用原本方法加碼，邊際效益會迅速下降。`
  };
  let extra="";
  if(id==="love") extra=" 感情上要特別觀察對方是否有同等程度的回應，不要只用自己的投入判斷關係。";
  else if(id==="work") extra=" 工作上要把職位、資源、主管回應與實際條件放進來，不要只靠情緒決定去留。";
  else if(id==="finance") extra=" 金錢上應優先控制風險與部位，任何卦象都不能替代現實數據。";
  else if(id==="choice") extra=" 選擇上要保留可回頭的空間，避免在這一爻的壓力下做不可逆決定。";
  return byPos[pos]+extra;
}

function buildLineReading(base,changed,topic,value,pos){
  const meta=LINE_POSITIONS[pos-1];
  const label=lineLabel(value,pos);
  const classic=CLASSIC_YAO[base.name]?.[label]||"";
  const special=specialYaoExplain(base.name,label);
  const d=depthFor(base);
  const change=lineChangeText(value);
  const bridge=`放回本卦「${base.name}」來看，這一爻不是孤立的一句話，而是在「${d.core}」的整體背景下發生變化。`;
  const classicalMeaning=special || (classic?`經文放在這個爻位，重點可以先抓成：不要只看字面吉凶，而要看它在提醒你如何拿捏「${meta.layer}」的分寸。`:`這一爻目前先依爻位、陰陽變化與本卦整體結構解讀；網站不會假裝補上未校對的古典爻辭。`);
  const integration=`${yaoTopicAdvice(topic,pos,value)} 若這一層處理得好，局勢比較有機會往變卦「${changed.name}」中較可用的一面發展；若處理失當，則容易先碰到「${depthFor(changed).shadow}」所描述的問題。`;
  return {pos,value,label,stage:meta.stage,layer:meta.layer,change,classical:classic,classicalMeaning,bridge,integration,advice:meta.advice};
}

function transitionStory(base,changed,moving){
  if(!moving.length) return `這次是靜卦，因此不需要硬把局勢想成一定要『變到哪裡』。本卦「${base.name}」已足以代表目前最主要的課題：${depthFor(base).core} 短期真正值得觀察的是，你是否能把「${depthFor(base).action}」落實，而不是為了得到另一個答案反覆起卦。`;
  const b=depthFor(base), c=depthFor(changed);
  let middle="";
  const bv=valence(base), cv=valence(changed);
  if(bv==="up"&&cv==="down") middle="這是一種『原本有條件，但若處理失當會逐步轉差』的結構，所以現在越順，越要提早看風險。";
  else if(bv==="down"&&cv==="up") middle="這是一種『現在卡，但改對方法後有機會慢慢打開』的結構，重點不是硬撐，而是讓改變發生在對的位置。";
  else if(cv==="down") middle="變卦的限制感較強，說明原本模式若不調整，壓力可能逐步累積。";
  else if(cv==="up") middle="變卦提供較多開展空間，表示這次變動本身可能帶來新的出口。";
  else middle="這不是單純由吉變凶或由凶變吉，而是處理方式與條件正在重新組合。";
  return `從「${base.name}」走到「${changed.name}」，不是兩個互不相干的卦，而是一段前後關係。現在的底色是：${b.core} 但如果本卦的陰影面——${b.shadow}——持續累積，就會把事情推向新的結構。變卦「${changed.name}」所呈現的是：${c.core} ${middle} 因此真正的轉折點不是『等它自己變』，而是你能不能在動爻指出的位置調整，讓變卦走向它可用的一面：${c.action}`;
}

function directAnswer(base,changed,topic,moving,pattern){
  const b=depthFor(base), c=depthFor(changed);
  const has=!!moving.length;
  const situation=`目前最重要的局勢是「${base.name}」：${b.core} ${has?`而且現在有 ${moving.length} 個動爻，表示這個狀態不是完全靜止，${pattern.text}`:`六爻皆靜，代表短期更重要的是看清現況，而不是急著追求劇烈變化。`}`;
  const obstacle=`目前最大的阻力，一部分來自本卦的陰影面：${b.shadow} ${topicSentence(topic,"obstacle")}`;
  const opportunity=has?`目前的機會在於，局勢已經開始鬆動。變卦「${changed.name}」不是保證結果，而是告訴你：如果動爻所指的問題被妥善處理，下一階段可以朝「${c.action}」發展。${topicSentence(topic,"opportunity")}`:`目前的機會不是外界突然翻盤，而是把「${b.action}」做紮實。${topicSentence(topic,"opportunity")}`;
  const risk=`需要警惕的是：${has?c.shadow:b.shadow} ${topicSentence(topic,"risk")}`;
  const signal=has?`接下來可以觀察的訊號是：現實是否開始出現與「${changed.summary}」相符的具體變化。若只有想像、期待或口頭說法，卻沒有行動與條件改變，就先不要把變卦當成已經發生。`:`接下來可以觀察的訊號是：本卦所要求的核心條件是否變得更穩。如果外在條件沒有明顯改變，就不必因短期情緒而反覆改判。`;
  return {situation,obstacle,opportunity,risk,signal};
}

function adviceForTopic(topic, base, changed, moving, lines) {
  const b=depthFor(base), c=depthFor(changed);
  const out=[];
  out.push(`先處理本卦的核心課題：${b.action} 這是目前最直接、也最能由你控制的部分。`);
  if(moving.length){
    const key=lines.slice(0,2).map(x=>`${x.label}的「${x.layer}」`).join("、");
    out.push(`把動爻當成優先順序：本次尤其先處理 ${key}${lines.length>2?" 等層面":""}，不要一次想把所有問題全部解完。`);
    out.push(`用變卦當作『條件改變後的方向』而不是保證：你可以觀察現實是否逐漸出現「${changed.summary}」的具體訊號，再決定下一步加碼或收斂。`);
  } else out.push(`這次沒有動爻，不必為了想看到變化而強行製造行動；先把本卦要求的事情做穩，再等現實條件真的改變。`);
  if(topic.id==="love"){
    out.push("感情上把『對方的實際行動』放在『自己的猜測』前面：是否主動聯絡、安排見面、回應靠近、願不願意把關係說得更清楚，都是比想像更可靠的訊號。");
    out.push("可以表達，但不要一次把所有情緒與期待全押上去。用分段式靠近，給對方回應空間，也讓自己保留界線。");
    out.push("替自己設定觀察期限與底線；等待可以是策略，但無限期的模糊通常會轉成消耗。");
  } else if(topic.id==="work"){
    out.push("工作上先列出三件可驗證的事：職責是否合理、成長／報酬是否有改善空間、下一個選項是否已準備。不要只用『想走／想留』二分法判斷。");
    out.push("若要改變，先建立下一步的現實條件，例如履歷、面試、談判籌碼或內部調整方案，再做不可逆決定。");
  } else if(topic.id==="finance"){
    out.push("財務與投資先把風險上限寫清楚，包括可承受損失、部位大小與退出條件；卦象只用來整理決策，不用來取代數據與風控。");
    out.push("若變卦偏警示，優先縮小暴露與等待確認；若變卦偏開展，也仍需等現實條件成立再逐步投入。");
  } else if(topic.id==="business"){
    out.push("先找出目前最卡的單一瓶頸，是客源、產品、資金、合作、交付還是組織；一次只突破最關鍵的一個。");
    out.push("任何擴張都先用小規模測試驗證，不要讓卦象的正面訊號變成過度投入的理由。");
  } else if(topic.id==="choice"){
    out.push("把每個選項拆成：最壞代價、可逆程度、需要的資源、三個月後最可能後悔什麼。先排除不可承受的方案，再談哪一個最好。");
    out.push("如果資訊不足，延後決定本身也可以是一個選項；不要把『現在還不能確定』誤解成『一定要立刻選』。");
  } else {
    out.push("把卦象轉成一個可以在現實中驗證的行動，做完後觀察回饋；若現實沒有改變，就不要只靠想像把解讀越說越滿。");
    out.push("先處理自己能控制的部分，再判斷外部條件是否真的跟著鬆動，這比反覆起卦更有價值。");
  }
  if(moving.length>=4) out.push("本次動爻很多，代表結構變化大。不要只修一個表面細節，建議把原本的假設、角色與做法重新檢查一次。");
  out.push(`最後記住變卦的底線：${c.action} 這可以作為你後續判斷是否走在正確方向上的檢查點。`);
  return [...new Set(out)].slice(0,7);
}

function buildReading(question, values, context={}) {
  const baseLines = values.map(v => v === 7 || v === 9);
  const changedLines = values.map((v,i) => (v === 6 || v === 9) ? !baseLines[i] : baseLines[i]);
  const moving = values.map((v,i) => (v === 6 || v === 9) ? i+1 : 0).filter(Boolean);
  const base = hexagramFromLines(baseLines);
  const changed = hexagramFromLines(changedLines);
  const topic = topicFromContext(context, question);
  const scenario = scenarioFromContext(context);
  const pattern = movementPattern(moving);
  const lines = moving.map(pos => buildLineReading(base,changed,topic,values[pos-1],pos));
  const transition = transitionStory(base,changed,moving);
  const direct = directAnswer(base,changed,topic,moving,pattern);
  const advice = adviceForTopic(topic,base,changed,moving,lines);
  const questionText = String(question || "").trim() || "目前這件事最需要注意什麼？";
  const movingNames = lines.length ? lines.map(x=>x.label).join("、") : "無動爻";
  const baseDepth=depthFor(base), changedDepth=depthFor(changed);
  const summary = moving.length
    ? `${base.name}之${changed.name}：目前真正的課題不是單看吉凶，而是先處理「${baseDepth.action}」。局勢正在改變，若能把動爻指出的關鍵處理好，才有機會把變化導向「${changedDepth.action}」；若仍沿用本卦的陰影模式，則要小心走進「${changedDepth.shadow}」的消耗。`
    : `${base.name}為靜卦：目前局勢仍以「${baseDepth.core}」為主。先把「${baseDepth.action}」做穩，比急著尋找另一個答案更重要。`;

  return {
    question:questionText,topic,scenario,questionIntent:context?.questionIntent||"",values,base,changed,baseLines,changedLines,
    movingLines:moving,movingNames,lineReadings:lines,pattern,baseDepth,changedDepth,transition,direct,advice,summary,createdAt:new Date().toISOString()
  };
}

function draw(question="", context={}) {
  const values = Array.from({length:6}, coinLine);
  return buildReading(question, values, context);
}

function buildPrompt(r) {
  const movingText = r.lineReadings.length ? r.lineReadings.map(x=>`${x.label}動（${x.value}）${x.classical?`｜爻辭：${x.classical}`:""}`).join("\n- ") : "無動爻，為靜卦";
  return `請你扮演一位熟悉《易經》六十四卦與動爻判讀、但不過度斷言的專業解卦老師，使用繁體中文解讀以下已經起出的卦。\n\n【重要】不要重新起卦、不要更換本卦、變卦或動爻；沒有提供月建、日辰、世應、六親，所以不要假裝能用完整文王六爻規則判旺衰或斷定對方一定怎麼想。\n\n【主題】${r.topic.name}\n${r.scenario?.name?`【目前情境】${r.scenario.name}\n`:""}【我的問題】\n${r.question}\n\n【卦象】\n本卦：第 ${r.base.number} 卦・${r.base.name}（上${r.base.upper}${r.base.upperMeta.symbol}／下${r.base.lower}${r.base.lowerMeta.symbol}）\n變卦：${r.movingLines.length?`第 ${r.changed.number} 卦・${r.changed.name}（上${r.changed.upper}${r.changed.upperMeta.symbol}／下${r.changed.lower}${r.changed.lowerMeta.symbol}）`:"無變卦，六爻皆靜"}\n動爻：${r.movingNames}\n- ${movingText}\n\n【請完整回答，不要刻意縮短篇幅】\n一、先看整體象義：本卦、變卦、動爻各在說什麼。\n二、解釋本卦真正的核心、它的優勢與陰影面，不要只列關鍵字。\n三、有變卦時，完整說明『為什麼會從本卦走到變卦』，把兩卦串成一段因果，而不是分開介紹。\n四、逐一解釋每個動爻；有爻辭時請解釋爻辭，不要只講第幾爻代表哪個階段。\n五、直接回答我的問題，分成：目前局勢、最大阻力、目前機會、主要風險、接下來值得觀察的訊號。\n六、給 5～7 個具體、可執行的建議；不要只寫『順其自然』『保持耐心』這種空泛句子。\n七、最後用一段話總結。\n\n語氣像有經驗的命理老師：白話、有層次、把卦理與問題真正連起來，但不要把卦象說成百分之百注定。`;
}

function buildTxt(r) {
  const lines=r.lineReadings.length?r.lineReadings.map((x,i)=>`${i+1}. ${x.label}動（爻值 ${x.value}）\n   爻位：${x.stage}\n${x.classical?`   爻辭：${x.classical}\n`:""}   陰陽變化：${x.change}\n   放回本卦：${x.bridge}\n   爻意白話：${x.classicalMeaning}\n   對本題的解讀：${x.integration}`).join("\n\n"):"本次六爻皆靜，沒有動爻。這時不需要硬追變卦，重點放在本卦本身與現實條件是否改變。";
  return `易經六十四卦｜本次網站完整解卦\n================================\n\n問題：${r.question}\n主題：${r.topic.name}\n${r.scenario?.name?`目前情境：${r.scenario.name}\n`:""}\n本卦：第 ${r.base.number} 卦・${r.base.name}\n上卦：${r.base.upper} ${r.base.upperMeta.symbol}（${r.base.upperMeta.image}／${r.base.upperMeta.element}）\n下卦：${r.base.lower} ${r.base.lowerMeta.symbol}（${r.base.lowerMeta.image}／${r.base.lowerMeta.element}）\n本卦基礎提示：${r.base.summary}\n\n變卦：${r.movingLines.length?`第 ${r.changed.number} 卦・${r.changed.name}`:"無變卦（六爻皆靜）"}\n${r.movingLines.length?`變卦基礎提示：${r.changed.summary}\n`:""}動爻：${r.movingNames}\n\n一、先看整體象義\n--------------------------------\n本卦「${r.base.name}」代表目前主要狀態。${r.baseDepth.core}\n\n它的陰影面是：${r.baseDepth.shadow}\n\n${r.movingLines.length?`變卦「${r.changed.name}」代表條件改變後可能形成的新局。${r.changedDepth.core}\n\n變卦要注意的陰影面是：${r.changedDepth.shadow}`:"這次六爻皆靜，因此不另外追變卦；本卦本身就是最主要訊息。"}\n\n動爻型態：${r.pattern.title}\n${r.pattern.text}\n\n二、本卦真正的核心\n--------------------------------\n${r.baseDepth.core}\n\n這個卦不是單純告訴你『好或不好』。真正值得注意的是：${r.baseDepth.action}\n\n如果沒有處理好，它容易走向：${r.baseDepth.shadow}\n\n三、從本卦走到變卦：局勢為什麼會這樣變\n--------------------------------\n${r.transition}\n\n四、動爻逐一解讀\n--------------------------------\n${lines}\n\n五、直接回答你的問題\n--------------------------------\n【目前局勢】\n${r.direct.situation}\n\n【最大阻力】\n${r.direct.obstacle}\n\n【目前機會】\n${r.direct.opportunity}\n\n【主要風險】\n${r.direct.risk}\n\n【接下來值得觀察的訊號】\n${r.direct.signal}\n\n六、網站給你的具體建議\n--------------------------------\n${r.advice.map((x,i)=>`${i+1}. ${x}`).join("\n\n")}\n\n七、整體總結\n--------------------------------\n${r.summary}\n\n================================\n說明：本工具採三枚銅錢機率產生六爻，提供本卦、動爻、變卦與白話整理，作為自我思考與易經學習參考。網站不會在缺少月建、日辰、世應、六親等資料時假裝進行完整文王六爻旺衰判斷，也不把卦象視為百分之百確定的未來。\n`;
}

window.YijingCore = Object.freeze({
  draw,buildReading,buildPrompt,buildTxt,hexagramFromLines,count:Object.keys(HEXAGRAMS).length,version:"4.0-deep-reading"
});
})();
