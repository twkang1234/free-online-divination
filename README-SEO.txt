免費線上占卜｜SEO 最終整理包
================================

上傳位置：
GitHub repository：twkang1234/free-online-divination
請把需要上傳的檔案放在 repository 根目錄。

【需要覆蓋的既有檔案】
1. index.html
   - 本包中的 index-seo-final.html 請上傳後命名為 index.html
   - 只修改 <head> 與 JSON-LD SEO 資訊
   - 首頁視覺、正文、動畫、互動與工具入口內容沒有修改
   - 新增／調整：
     * robots 補 max-snippet / max-video-preview
     * og:site_name
     * twitter:title / twitter:description
     * WebSite 名稱統一為「免費線上占卜」
     * WebPage 補 description
     * WebPage 與 7 工具 ItemList 建立 mainEntity 關聯

【需要新增的檔案】
2. sitemap.xml
   - 新增 8 個正式索引網址：
     首頁 + 奇門 + 塔羅 + 八字 + 紫微 + 梅花 + 六爻 + 易經64卦
   - 不加入 JS、API、LICENSE 等非內容頁

3. 404.html
   - GitHub Pages 自訂 404 頁
   - 設定 noindex,follow
   - 提供回首頁與 7 個工具頁的正常導覽

【不需要修改／不要覆蓋的既有工具頁】
- qimen.html
- tarot.html
- bazi.html
- ziwei.html
- meihua.html
- liuyao.html
- yijing.html

這 7 個工具頁目前已經是最新 SEO 版，本次整理包完全沒有更動。

【也不需要修改的核心檔案】
- qimen2.standalone.min.js
- tarot-core.js
- bazi-core.js
- ziwei-core.js
- meihua-core.js
- liuyao-core.js
- yijing-core.js
- 各 LICENSE / API 文件

【這次沒有加入 robots.txt 的原因】
目前網站是 GitHub Pages Project Site：
https://twkang1234.github.io/free-online-divination/

標準 robots.txt 需要位於網域根目錄：
https://twkang1234.github.io/robots.txt

放在 /free-online-divination/robots.txt 並不是這個 hostname 的正式 robots.txt，
因此這次不在目前 repository 內新增，以免造成「有放但其實不生效」的誤解。

【上傳後要做的事】
1. 確認：
   https://twkang1234.github.io/free-online-divination/sitemap.xml
   可以正常開啟。
2. 到 Google Search Console 對這個網站提交 sitemap.xml。
3. 使用 URL 檢查：
   - 首頁
   - qimen.html
   - tarot.html
   - bazi.html
   - ziwei.html
   - meihua.html
   - liuyao.html
   - yijing.html
4. 不要因為剛換版就頻繁改 title / H1 / canonical，先讓 Google 重新抓取與評估。

注意：
Search Console 的驗證 HTML 檔案或 meta token 是帳號專屬資訊，
本包沒有自行虛構，等你提供 Google 給你的驗證碼後再加入。
