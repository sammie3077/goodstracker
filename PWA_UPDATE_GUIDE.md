# PWA 更新功能使用指南

## 📱 功能說明

已實作基礎版 PWA 更新通知功能，當網站有新版本時會自動提示用戶更新。

## ✅ 已實作的功能

1. **Service Worker 快取策略**
   - 網路優先（Network First）
   - 離線時使用快取
   - 自動清理舊版本快取

2. **版本檢測**
   - 自動檢測新版本
   - 在背景下載更新

3. **更新提示 UI**
   - 右下角顯示更新提示
   - 用戶可以選擇立即更新或稍後提醒
   - 點擊「更新」按鈕會自動刷新頁面

## 🔄 如何測試更新功能

### 方法 1：修改版本號測試

1. **修改版本號：**
   ```bash
   # 編輯 public/manifest.json
   "version": "2.1.0" -> "2.2.0"

   # 編輯 public/sw.js
   const CACHE_NAME = 'goodstracker-v2.1.0'; -> 'goodstracker-v2.2.0'
   const APP_VERSION = '2.1.0'; -> '2.2.0'
   ```

2. **重新建置：**
   ```bash
   npm run build
   ```

3. **測試：**
   - 打開已安裝的 PWA
   - 等待 10-30 秒
   - 應該會看到右下角彈出更新提示

### 方法 2：使用 Chrome DevTools 測試

1. 打開 Chrome DevTools (F12)
2. 前往 **Application** 標籤
3. 左側點擊 **Service Workers**
4. 勾選 **Update on reload**
5. 修改代碼後重新整理
6. 觀察 Service Worker 狀態變化

### 方法 3：手動觸發更新

1. 在 Chrome DevTools -> Application -> Service Workers
2. 點擊 **skipWaiting** 按鈕
3. 觀察更新流程

## 📋 版本更新檢查清單

每次發佈新版本時：

- [ ] 更新 `public/manifest.json` 中的 `version`
- [ ] 更新 `public/sw.js` 中的 `CACHE_NAME` 和 `APP_VERSION`
- [ ] 執行 `npm run build`
- [ ] 部署到生產環境
- [ ] 測試更新提示是否正常顯示

## 🔍 除錯技巧

### 查看 Service Worker 狀態
```javascript
// 在瀏覽器 Console 執行
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered Service Workers:', registrations);
});
```

### 查看快取內容
```javascript
// 在瀏覽器 Console 執行
caches.keys().then(keys => {
  console.log('Cache names:', keys);
});
```

### 清除 Service Worker（重置）
```javascript
// 在瀏覽器 Console 執行
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```

## ⚠️ 注意事項

1. **開發環境：**
   - Service Worker 在 localhost 可以正常運作
   - 確保使用 `npm run build` 建置後測試

2. **生產環境：**
   - 必須使用 HTTPS（localhost 例外）
   - 確保 Service Worker 文件可被正確訪問

3. **更新時機：**
   - Service Worker 會在頁面關閉後自動更新
   - 或用戶點擊「更新」按鈕時立即更新

4. **快取策略：**
   - 採用「網路優先」策略
   - 確保用戶總是能看到最新內容
   - 離線時才使用快取

## 🎯 風險評估

- **技術風險：** 極低（使用瀏覽器標準 API）
- **用戶體驗：** 優秀（用戶可選擇更新時機）
- **穩定性：** 非常穩定（業界標準做法）

## 📚 相關資源

- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Progressive Web Apps - Google](https://web.dev/progressive-web-apps/)
- [Workbox - Google](https://developers.google.com/web/tools/workbox)
