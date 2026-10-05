# 南一國小成語學習階梯

依照學校課堂進度（南一版）設計的國小成語互動學習網頁，可在電腦、平板（iPad）與手機上使用。

## 學習流程

1. **認識成語**：逐字顯示釋義，並可語音朗讀成語與釋義。
2. **第一關－拖拉填空**：把詞語卡拖到釋義中的空格（iPad 可「點詞卡 → 點空格」）。
3. **第二關－重組釋義**：把打散的釋義片段排回正確順序。
4. **第三關－情境運用**：閱讀情境例句，選出最適合的成語。每個成語有 3 句以上的例句，不同天複習會出不同的例句（同一天重玩則沿用同一句）。
5. **成果頁**：顯示金幣、星星、等級與錯題紀錄，並自動儲存成果、產生「成果代碼」。這次得到的金幣會存進學生的皮克敏錢包。

目前收錄：

- 五年級上學期：第一課～第十二課
- 三年級上學期：第一課～第十二課

## 我的皮克敏：用金幣買裝備

首頁輸入姓名後按 **🌱 我的皮克敏**：

1. **選一隻自己的皮克敏**：目前開放羽翅、黃、岩石三種（都有 3D 模型），之後可以隨時更換，已買的裝備會保留。以前選了其他種類的學生，打開時會請他重新選一隻。
2. **累積金幣**：每完成一課，得到的金幣會存進該學生的錢包（每答對一題 10 枚，一課最多 150 枚）。第一次打開時，這台裝置上該學生以前完成課程的金幣也會算進去。
3. **買裝備**：共 20 件，價格 50～600 枚金幣，分成帽子、臉部、脖子、衣服、手上、頭頂、背後 7 個部位。買了之後可以隨時穿上或脫下，同一個部位只能穿一件。
4. 點一下皮克敏，牠會跳起來，說出學生學過的成語。
5. **羽翅、黃、岩石皮克敏有 3D 模型**：在商店頁按「🧊 3D 模式」，可以左右拖曳旋轉。3D 模式目前不顯示裝備，按「👕 換裝模式」可看穿上裝備的樣子。3D 使用 three.js（`assets/three.min.js`，MIT 授權），只在打開 3D 模式時才載入；模型程式在 `assets/pikmin3d.js`。

錢包和裝備依「姓名」存在那台裝置的瀏覽器中：同一台裝置要用同一個姓名，才會是同一隻皮克敏；換裝置或清除瀏覽器資料，金幣不會跟著過去。皮克敏的造型與裝備圖案參考自 english_book_test 專案的皮克敏換裝系統。

## 線上使用（GitHub Pages）

整個網站只有一個檔案 `index.html`，不需要任何建置步驟。

啟用方式：

1. 到 GitHub 儲存庫的 **Settings → Pages**。
2. 在 **Build and deployment → Source** 選擇 **Deploy from a branch**。
3. **Branch** 選擇放有 `index.html` 的分支，資料夾選 `/ (root)`，按 **Save**。
4. 約一分鐘後，網站會出現在：
   `https://joehuang1980.github.io/chinese-idiom-ladder/`

## 教師專區：檢查學習成果

首頁按 **👩‍🏫 教師專區** 進入。第一次使用時要設定教師密碼（至少 4 碼），之後每次進入都需要輸入。

教師專區可以：

- 依 **年級／學期、課次、學生姓名** 篩選紀錄。
- 看到每筆紀錄的完成時間、星星、**一次答對率**、錯誤次數、等級，按「錯題」可展開錯題明細。
- 看到 **最常錯的成語** 排行（前 10 名），以及錯在哪一關。
- **匯出 Excel（CSV）**：匯出目前篩選到的紀錄，可用 Excel 或 Google 試算表開啟。
- **匯入成果代碼**、刪除單筆紀錄、清除全部紀錄、修改密碼。

### 成果存在哪裡？

這個網站沒有後端伺服器，成果存在**學生完成課程那台裝置的瀏覽器**裡：

- **全班共用同一台電腦／iPad**：老師直接在那台裝置打開教師專區即可看到所有人的紀錄。
- **學生用各自的裝置**：學生完成後在成果頁按「📋 複製成果代碼」，貼給老師（Google Classroom、LINE 等）。老師把代碼貼到教師專區的「匯入成果代碼」，一次可以貼很多個，重複的會自動略過。

注意：

- 清除瀏覽器資料或使用「無痕模式」會讓紀錄消失，請定期匯出 CSV 備份。
- 教師密碼只是防止學生誤入，存放在瀏覽器中，並不是嚴格的資安保護。

### 自動上傳到 Google 試算表

設定好之後，學生完成課程時，成果會自動新增一列到老師的 Google 試算表：

- 成果頁會顯示上傳狀態（上傳中／已上傳／無法上傳）。
- 上傳失敗（例如沒有網路）時，成果會先保存在那台裝置，下次開啟網站或恢復連線時自動重新上傳，也可以按「重新上傳」。
- 每筆紀錄都有「紀錄ID」，重新上傳時試算表會自動略過已存在的紀錄，不會重複。

設定步驟：

1. 新增一份 Google 試算表，選 **擴充功能 → Apps Script**，貼上以下程式並儲存：

   ```js
   const HEAD = ['完成時間', '測驗日期', '學生', '年級學期', '課次', '金幣', '星星', '滿分星星', '一次答對率', '錯誤次數', '等級', '錯題明細', '紀錄ID'];

   function doPost(e) {
     const lock = LockService.getScriptLock();
     lock.waitLock(20000);
     try {
       const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
       const r = JSON.parse(e.postData.contents);
       const safe = v => { v = String(v ?? ''); return /^[=+\-@]/.test(v) ? "'" + v : v; };
       if (sheet.getLastRow() === 0) sheet.appendRow(HEAD);
       if (sheet.getRange(1, HEAD.length).getValue() === '') sheet.getRange(1, HEAD.length).setValue('紀錄ID');
       const last = sheet.getLastRow();
       const ids = last > 1 ? sheet.getRange(2, HEAD.length, last - 1, 1).getValues().map(x => String(x[0])) : [];
       if (r.id && ids.includes(String(r.id))) return ContentService.createTextOutput('ok');
       sheet.appendRow([
         new Date(r.finishedAt), safe(r.date), safe(r.student), safe(r.grade), safe(r.lesson),
         r.coins, r.stars, r.max, r.max ? Math.round(r.stars / r.max * 100) + '%' : '',
         (r.mistakes || []).length, safe(r.level),
         safe((r.mistakes || []).map(m => m.stage + '｜' + m.word + '｜' + m.detail).join('；')),
         safe(r.id)
       ]);
       return ContentService.createTextOutput('ok');
     } finally {
       lock.releaseLock();
     }
   }
   ```

2. 按 **部署 → 新增部署作業**，類型選 **網頁應用程式**，「執行身分」選自己，「誰可以存取」選 **所有人**，按部署並複製網址。
3. 在 `index.html` 中找到 `const SHEET_URL=`，把網址貼進引號中，例如：
   `const SHEET_URL='https://script.google.com/macros/s/xxxx/exec';`
4. 儲存並推送到 GitHub，之後學生完成課程時成果就會自動新增到試算表。

**已經用舊版程式設定過的話**：把 Apps Script 換成上面的新程式並儲存，再到 **部署 → 管理部署作業**，按鉛筆圖示編輯，「版本」選 **新版本** 後按部署。這樣網址不會改變，不用修改 `index.html`。新程式會在原本的表格最後加上「紀錄ID」欄。

## 本機使用

直接用瀏覽器開啟 `index.html` 即可。

## 新增或修改課程

成語資料位於 `index.html` 內的 `courses` 物件，格式如下：

```js
"年級／學期": {
  "第一課": [
    {
      "w": "成語",
      "z": ["注", "音", "符", "號"],
      "m": "釋義。",
      "chunks": ["釋義", "片段。"],
      "q": [
        "情境例句一，用 ____ 表示成語位置。",
        "情境例句二……",
        "情境例句三……"
      ]
    }
  ]
}
```

`q` 是第三關的例句題庫，每個成語至少 3 句，每句只能有一個 `____`。

新增年級時，也要在 `setup()` 函式的年級下拉選單中加入對應的 `<option>`。
