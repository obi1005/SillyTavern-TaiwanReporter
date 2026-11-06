# 台灣記者

> 那傢伙剛剛說那句話了！

SillyTavern 擴充。把聊天裡角色說的一句話，配上說話者的頭像，做成一張台詞卡。

## 安裝

SillyTavern →「擴充功能」→「安裝擴充功能」，貼上：

```
https://github.com/obi1005/SillyTavern-TaiwanReporter
```

## 使用

兩種做法：

1. **反白**：在聊天裡反白一段文字，第一個字的左上方會出現圖示，點下去就開始做卡。
2. **從訊息選單挑**：訊息的「⋯」選單裡有台灣記者的按鈕，點開後一句一句挑，可以選好幾句。

做卡的面板裡可以調：

- **換行編輯**：按下去會展開台詞框，可以自己決定在哪裡換行，字本身不能改。在想斷的地方按換行；如果某一行太長，字會自動縮小，讓每一行都照你斷的排。再按一次收起來
- **版型**：直幅（1080×1920）、橫幅（1600×900）、卡片（1080×1440）
- **選項**：白底、黑白、粗體、左右側（只有橫幅有，照片換到另一邊）
- **字體**：思源黑體、思源宋體、霞鶩文楷、芫荽、昭源黑體、昭源宋體、仙人掌明體、粉圓，以及自己上傳的字體
- **色調**：原色、夕陽、森林、緋月、午夜紫、深海、舊照片、櫻花、棉花糖
- **標語**：印在圖片最下面的一行小字，位置和大小固定
  - 沒有這樣說過。
  - 此內容純屬虛構，如有雷同，那就雷同。
  - Silly Tavern．（模型）．Roleplay（「模型」會換成那則訊息實際用的模型名稱）
  - AI RP，你值得擁有。
- **拉霸**：文字左右、上下、字級，背景左右、上下、縮放，遮罩和過渡寬度
- 直接拖動預覽圖，也可以移動背景

做好之後：

- **存到相簿**：網址是 HTTPS 時會跳出分享面板；不是 HTTPS 時，會把成品換成一張圖，長按圖片選「加入照片」。
- **下載**：存成 PNG 檔。

上次選的版型、字體、色調、標語會記住，下次沿用。

## 設定

在「擴充功能」頁面的「台灣記者」裡：

- **啟用**：關掉後，反白不會出現圖示，訊息選單也不會有按鈕。
- **語言**：跟著 ST、繁體中文、English。選「跟著 ST」時，ST 介面是中文就用中文，其他語言一律英文。
- **自訂字體**：按「上傳字體」選 TTF、OTF、WOFF 或 WOFF2 檔，就會加到做卡面板「字體」清單的最後面。字體檔存在 ST 的 `data/<使用者>/user/files/`；按垃圾桶可以刪除。

## 配合主題的顏色

在主題的自訂 CSS 裡，於 `:root` 定義下面這些變數，面板就會換成主題的顏色。沒定義的就用 ST 本身的主題色。

| 變數 | 用在 |
|---|---|
| `--tr-panel` | 視窗底色 |
| `--tr-border` | 視窗、句子框的細框 |
| `--tr-text` | 視窗文字 |
| `--tr-muted` | 提示小字 |
| `--tr-active` | 選中的按鈕、句子底色 |
| `--tr-active-border` | 選中的按鈕、句子框線 |
| `--tr-backdrop` | 視窗後面的遮罩 |
| `--tr-sel-btn` | 反白圖示的底圓 |
| `--tr-sel-btn-ring` | 反白圖示的外圈 |
| `--tr-radius` | 視窗圓角 |

## 注意

- 圖是在瀏覽器裡畫的，不呼叫任何 API，頭像和台詞都不會傳到別的地方。
- 字型從 Google Fonts 載入，第一次用某個字型時需要連網。
- 目前只在 iPhone 實測過。

## English

**Taiwan Reporter** — *They just said it!*

Turns a line from your SillyTavern chat into a quote card, with the speaker's avatar as the background.

- **Select text** in a message and tap the icon that appears above it, or open a message's **⋯** menu and pick one or more sentences.
- Tap **Line breaks** to open the quote box and choose where the lines break (the words themselves can’t be edited); the text shrinks so each of your lines fits.
- Three layouts (portrait, wide, card), light background, black & white, bold, flip, 8 fonts, 9 tints, and an optional tagline at the bottom.
- **Save to Photos** uses the share sheet over HTTPS; otherwise the finished image is shown so you can long-press it and choose “Save to Photos”.
- In the extension settings you can turn it off, switch the language (Follow ST / 繁體中文 / English), and upload your own fonts (TTF, OTF, WOFF, WOFF2). Uploaded fonts are stored in SillyTavern’s `data/<user>/user/files/` and appear at the end of the Font list.
- Everything is drawn in the browser. Nothing is sent anywhere except font requests to Google Fonts.

## 授權

MIT
