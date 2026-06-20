# Snow Travel

以雪地旅遊為主題的 React 電商作品，整合商品瀏覽、收藏、購物車、結帳與後台商品管理，前後端皆部署於 Vercel。

## 線上展示

- 網站：[https://snow-travel.vercel.app](https://snow-travel.vercel.app)
- API 健康檢查：[https://snow-travel.vercel.app/api/health](https://snow-travel.vercel.app/api/health)

## 核心功能

- 商品列表、分類篩選、關鍵字搜尋與分頁
- 商品詳情、數量選擇與加入購物車
- 收藏清單與 Redux 狀態管理
- 購物車數量調整、刪除與結帳表單驗證
- 訂單建立與訂單完成頁
- 管理員登入與商品管理
- Vercel Serverless Functions 後端端點

## 技術棧

- React 19、Vite
- React Router、Redux Toolkit
- React Hook Form、Axios
- Bootstrap、React Bootstrap、SCSS
- Vercel Functions、Vercel Git Deployment

## 本機開發

### 第一次安裝

```bash
npm install
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel dev
```

執行 `vercel link` 時，選擇 `Snow-Travel` team 與既有的 `snow-travel` project。完成後開啟 `http://localhost:3000`。

### 後續開發

```bash
vercel dev
```

`vercel dev` 會同時執行 Vite 前端與 `/api/*` 後端。若只需開發前端，可執行 `npm run dev`。Vercel 環境變數更新後，重新執行 `vercel env pull .env.local` 再啟動服務。

必要環境變數：

```env
VITE_API_BASE=your_api_base
VITE_API_PATH=your_api_path
```

請勿提交 `.env*`、`.vercel` 或任何金流密鑰。

## 常用指令

```bash
npm run dev      # 啟動 Vite 前端
npm run build    # 建立 production bundle
npm run preview  # 預覽 production bundle
npm run lint     # 執行 ESLint
```

## 專案結構

```text
api/              Vercel 後端函式
public/           靜態資源
src/components/   共用元件
src/views/        前台與後台頁面
src/slice/        Redux Toolkit slices
src/router/       路由設定
src/assets/       樣式與圖片資源
```

## 部署

推送至 GitHub `main` 分支後，Vercel 會自動建置並更新正式網站：

```bash
git push origin main
```

> 此專案目前使用測試訂單流程，正式金流尚未接入。
