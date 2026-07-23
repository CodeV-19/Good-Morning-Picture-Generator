# 早安圖產生器

台灣長輩最愛分享的「早安圖」線上產生器。純前端網站，圖片在瀏覽器內即時合成，不上傳任何伺服器。

## 功能

- 背景範本每天自動從 Pexels 隨機抽 9 張花卉照片（見下方「花卉背景自動更新」），若當次還沒有照片可用則自動退回 8 款程式繪製的經典範本（玫瑰花園、荷花池、日出朝陽、瀑布山林、閃亮金邊、彩虹光暈、節慶祝福、田園小徑），也可以上傳自己的照片當背景
- 內建常用早安問候語庫，也可自訂文字
- 4 種中文字體、9 種文字顏色、3 種文字位置
- 自動加上今日日期與星期
- 下載圖片、透過 Web Share API 分享圖片（含圖檔）、分享到 LINE（直接開啟 LINE 分享畫面，純連結）、分享早安圖產生器連結給好朋友（系統分享選單）
- 匯出的圖片會加上網站網址浮水印，即時預覽畫面則不會顯示

## 開發 / 本機預覽

不需要任何建置工具，純 HTML/CSS/JS。用任一支靜態伺服器開啟 `index.html` 即可，例如：

```bash
python3 -m http.server 8000
```

然後開啟 http://localhost:8000

## 部署

任何靜態網站託管服務皆可，例如 GitHub Pages：Settings → Pages → 選擇分支與根目錄即可上線。

## 花卉背景自動更新

`.github/workflows/refresh-flowers.yml` 每天會自動呼叫 Pexels API，抓 20 張花卉照片存進 `images/flowers/`，並隨機挑 9 張供網站當背景使用，圖片與清單（`manifest.json`）都會直接 commit 進 repo，前端只讀取這些本機檔案，執行時不會呼叫 Pexels、也不會暴露 API Key。

要啟用這個功能，需要在 repo 設定一組 Secret：

1. 到 [pexels.com/api](https://www.pexels.com/api/) 免費註冊並取得 API Key
2. GitHub repo → Settings → Secrets and variables → Actions → New repository secret
3. Name 填 `PEXELS_API_KEY`，Value 貼上你的 key

設定好之後可以到 Actions 分頁手動觸發一次 `Refresh flower background photos` 工作流程，不用等到排程時間。

## 檔案結構

```
index.html                              頁面結構
css/style.css                            樣式
js/quotes.js                             早安問候語庫
js/templates.js                          8 款程式繪製範本的 Canvas 繪製邏輯（花卉照片用不到時的備援）
js/app.js                                UI 互動、文字排版、下載/分享邏輯
scripts/fetch-flowers.mjs                向 Pexels 抓花卉照片並寫入 images/flowers/ 的腳本
images/flowers/                          自動更新的花卉照片與 manifest.json（首次排程執行前不存在）
.github/workflows/deploy-pages.yml       推送時部署到 GitHub Pages
.github/workflows/refresh-flowers.yml    每日排程更新花卉照片並重新部署
```
