# 社群照片投稿：基礎建設設定規格

這份文件列出「社群照片投稿」功能需要哪些外部設定，以及每個步驟由誰完成。程式碼（Worker 腳本、送出表單的前端邏輯）我這邊會準備好，但帳號層級的建立/綁定動作只有你能做。

## 整體流程

```
使用者填表單 + 選照片
        │
        ├─► 照片：瀏覽器內先用 canvas 重繪一次（順便去除 EXIF/GPS），
        │    再 POST 給 Cloudflare Worker → 存進 R2「pending/」資料夾
        │
        └─► 表單文字欄位（顯示名稱、平台、同意條款等）：
             背景 POST 給 Google 表單 → 自動存成一列 Google Sheet
             （其中一欄會帶上面 Worker 回傳的照片 ID，兩邊資料靠這個 ID 對起來）

你的審核 app（在自己電脦上）
        │
        ├─► 讀 Google Sheet 拿待審清單
        ├─► 用 R2 API 讀對應照片，跑 SafeSearch + Face Detection
        ├─► 人工看過，決定通過/退件
        └─► 通過的話，把照片搬到 images/community/，
             連同顯示名稱、平台一起寫進 manifest.json（跟現在 Pexels 那套一樣）
```

## 你需要做的事

### 1. 建立 Cloudflare R2 Bucket
- Cloudflare Dashboard → R2 → Create bucket
- 名稱例如 `goodmorning-community-photos`
- 不用開啟 Public Access（保持私有，審核前不該被任何人看到）

### 2. 更新既有的 Cloudflare Worker
- 用 `scripts/worker/site-worker.js`（已經寫好，在這次 commit 裡）**取代**你現有 Worker（`goodmorning-proxy`）裡的全部程式碼
- 這個新版本除了原本的反向代理功能，多了一個 `/api/upload-photo` 路由，專門接收照片上傳
- Worker 的 **Settings → Bindings → Add binding → R2 Bucket**：
  - Variable name 填 `PHOTOS_BUCKET`
  - 選剛剛建立的 bucket
- 存檔並 Deploy

### 3. 建立 Google 表單
欄位建議如下：

| 欄位 | 類型 | 必填 |
|---|---|---|
| 顯示名稱 | 簡答 | 是 |
| 顯示方式 | 選擇題：純文字／Instagram／Facebook／Threads | 是 |
| 社群帳號或連結（選填） | 簡答 | 否 |
| 聯絡 Email | 簡答 | 是 |
| 我已閱讀並同意投稿條款 | 核取方塊：我同意 | 是 |
| 照片參考碼 | 簡答 | 是（這欄使用者看不到值，由網站自動帶入 Worker 回傳的 ID） |

建立好之後：
1. 表單編輯頁右上角「⋮」→ **取得預先填寫的連結**
2. 每個欄位隨便填一個測試值，點「取得連結」
3. 產生的網址裡會有一串 `entry.123456=xxx`，每個欄位對應一組數字，把整組網址複製給我（或直接把每個欄位名稱對應的 `entry.` 數字整理給我）
4. 把表單的網址列裡 `/viewform` 的那串 ID（`https://docs.google.com/forms/d/e/`**`這一串`**`/viewform`）也給我

### 4.（你自己的審核 app 用）R2 API Token
- Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token
- 權限選 **Object Read & Write**，範圍限定到剛剛那個 bucket
- 這組 Access Key ID / Secret Access Key 是給你「自己電腦上的審核 app」用 S3 相容 API 讀寫 R2，不會進到網站程式碼裡，也不用給我

## 我這邊會準備的部分（等你把上面 3. 的資訊給我之後）
- 網站上的投稿表單 UI（照片選擇、顯示名稱、平台、同意條款勾選）
- 前端上傳邏輯：canvas 重繪去 EXIF → 傳給 Worker → 拿到 ID → 背景送出 Google 表單
- 條款文字串接（等你確認 `docs/community-photo-policy-draft.md` 的內容）
