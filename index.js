// 台灣記者
// 把聊天裡的一句話做成圖卡：背景是說話者的頭像，疊上那句話和名字。
// 兩個入口：反白文字後，第一個字左上方會出現圖示；或從訊息的「⋯」選單逐句挑。
// 圖是在瀏覽器裡用 canvas 畫的，不呼叫任何 API；只有字型從 Google Fonts 載入。

const BTN = 30; // 反白圖示的大小（px）
const MODULE = 'taiwanReporter';

// 只收台灣正體字齊全的字型（2026-11-05 逐一抽字檢查過；日文字型會缺「會」這類字，不收）
const FONTS = [
    ['Noto Sans TC', '思源黑體'],
    ['Noto Serif TC', '思源宋體'],
    ['LXGW WenKai TC', '霞鶩文楷'],
    ['Iansui', '芫荽'],
    ['Chiron Hei HK', '昭源黑體'],
    ['Chiron Sung HK', '昭源宋體'],
    ['Cactus Classical Serif', '仙人掌明體'],
    ['Huninn', '粉圓'],
];
const FALLBACK = '"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif';

// 色調：頭像先轉灰階，再用 color 混合上漸層色（名稱在下面的 STR 裡）
const THEMES = {
    none: null,
    sunset: ['#ff7e5f', '#feb47b'],
    forest: ['#134e5e', '#71b280'],
    crimson: ['#8e0e00', '#3a1c1c'],
    midnight: ['#2b1055', '#7597de'],
    sea: ['#0f2027', '#2c7da0'],
    sepia: ['#704214', '#c9a66b'],
    hanami: ['#f8a5c2', '#c9a0dc'],
    cotton: ['#a1c4fd', '#fbc2eb'],
};

// split：直幅是遮罩濃度，其他是遮罩佔整張的比例（也是照片區的預設大小）；fade：虛化過渡佔整張的比例（直幅沒有）
const LAYOUTS = {
    portrait: { W: 1080, H: 1920, split: 0.6, fade: 0 },
    classic: { W: 1600, H: 900, split: 0.4375, fade: 0.375 },
    card: { W: 1080, H: 1440, split: 0.25, fade: 0.45 },
};

const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
// 上次選的樣式記下來，下次開卡沿用；位置、字級每次重來
const saved = extensionSettings[MODULE] = Object.assign(
    { enabled: true, lang: 'auto', layout: 'portrait', light: false, mono: false, flip: false, bold: false, font: 'Noto Sans TC', theme: 'none', footer: 0, customFonts: [] },
    extensionSettings[MODULE]);

// ---------- 介面文字（中文、英文各一份） ----------

const STR = {
    'zh-tw': {
        name: '台灣記者', tagline: '那傢伙剛剛說那句話了！', enable: '啟用', language: '語言', langAuto: '跟著 ST',
        fonts: '自訂字體', upload: '上傳字體', uploadHint: '支援 TTF、OTF、WOFF、WOFF2。上傳後會出現在做卡面板「字體」清單的最後面。',
        uploading: '上傳中…', uploaded: '已加入字體：', badFont: '這個檔案不是能用的字體', uploadFail: '上傳失敗：',
        remove: '刪除', removeAsk: f => `要刪除字體「${f}」嗎？`, removed: '已刪除字體：', noFonts: '還沒有上傳字體',
        send: '交給台灣記者', breakEdit: '換行編輯', breakHint: '只能換行：在想斷的地方按換行', hint: '拖動圖片可以調整背景位置', hintSave: '長按圖片，選「加入照片」', back: '返回編輯',
        layouts: { portrait: '直幅', classic: '橫幅', card: '卡片' },
        light: '白底', mono: '黑白', bold: '粗體', flip: '左右側',
        font: '字體：', theme: '色調：', footer: '標語：', footerNone: '不加', model: '（模型）',
        themes: { none: '原色', sunset: '夕陽', forest: '森林', crimson: '緋月', midnight: '午夜紫', sea: '深海', sepia: '舊照片', hanami: '櫻花', cotton: '棉花糖' },
        sliders: { tx: '文字左右', ty: '文字上下', scale: '字級', bx: '背景左右', by: '背景上下', zoom: '背景縮放', splitPortrait: '遮罩濃度', split: '遮罩佔比', fade: '過渡寬度' },
        reset: '重設位置', share: '存到相簿', save: '下載', close: '關閉',
        pickTitle: '點選要放進卡片的句子（可以選好幾句）', make: '做成卡片', cancel: '取消',
        noSentence: '這則訊息裡沒有可以挑的句子', pickOne: '先點選至少一句',
        footers: ['', '沒有這樣說過。', '此內容純屬虛構，如有雷同，那就雷同。', 'Silly Tavern．{model}．Roleplay', 'AI RP，你值得擁有。'],
    },
    en: {
        name: 'Taiwan Reporter', tagline: 'They just said it!', enable: 'Enabled', language: 'Language', langAuto: 'Follow ST',
        fonts: 'Custom fonts', upload: 'Upload font', uploadHint: 'TTF, OTF, WOFF or WOFF2. Uploaded fonts appear at the end of the Font list in the card panel.',
        uploading: 'Uploading…', uploaded: 'Font added: ', badFont: 'This file is not a usable font', uploadFail: 'Upload failed: ',
        remove: 'Delete', removeAsk: f => `Delete the font “${f}”?`, removed: 'Font deleted: ', noFonts: 'No fonts uploaded yet',
        send: 'Send to Taiwan Reporter', breakEdit: 'Line breaks', breakHint: 'Line breaks only: press Enter where you want a new line', hint: 'Drag the image to move the background', hintSave: 'Long-press the image and choose “Save to Photos”', back: 'Back to editing',
        layouts: { portrait: 'Portrait', classic: 'Wide', card: 'Card' },
        light: 'Light', mono: 'B&W', bold: 'Bold', flip: 'Flip',
        font: 'Font:', theme: 'Tint:', footer: 'Tagline:', footerNone: 'None', model: '(model)',
        themes: { none: 'Original', sunset: 'Sunset', forest: 'Forest', crimson: 'Crimson Moon', midnight: 'Midnight', sea: 'Deep Sea', sepia: 'Old Photo', hanami: 'Sakura', cotton: 'Cotton Candy' },
        sliders: { tx: 'Text X', ty: 'Text Y', scale: 'Text size', bx: 'Image X', by: 'Image Y', zoom: 'Image zoom', splitPortrait: 'Mask opacity', split: 'Mask size', fade: 'Fade width' },
        reset: 'Reset', share: 'Save to Photos', save: 'Download', close: 'Close',
        pickTitle: 'Tap the sentences to put on the card (you can pick several)', make: 'Make card', cancel: 'Cancel',
        noSentence: 'No sentences to pick in this message', pickOne: 'Pick at least one sentence first',
        footers: ['', 'They never said that.', 'Any resemblance is purely coincidental. Or not.', 'Silly Tavern · {model} · Roleplay', 'AI RP. You’re worth it.'],
    },
};
// 「跟著 ST」：ST 介面是中文就用中文，其他語言一律英文
function lang() {
    if (STR[saved.lang]) return saved.lang;
    const loc = String(SillyTavern.getContext().getCurrentLocale?.() || navigator.language || '').toLowerCase();
    return loc.startsWith('zh') ? 'zh-tw' : 'en';
}
const T = key => STR[lang()][key];

// ---------- 說話者：名字與原尺寸頭像 ----------

// 訊息上的頭像是縮圖網址（/thumbnail?type=avatar&file=xxx），換成原圖路徑
function speakerOf(mesEl) {
    const id = Number(mesEl.getAttribute('mesid'));
    const msg = SillyTavern.getContext().chat[id];
    const name = msg?.name || mesEl.querySelector('.name_text')?.textContent?.trim() || '';
    let url = '';
    const src = mesEl.querySelector('.avatar img')?.getAttribute('src') || '';
    try {
        const u = new URL(src, location.href);
        const file = u.searchParams.get('file');
        const type = u.searchParams.get('type');
        if (file && type === 'avatar') url = `/characters/${encodeURIComponent(file)}`;
        else if (file && type === 'persona') url = `/User Avatars/${encodeURIComponent(file)}`;
        else url = src;
    } catch { url = src; }
    // 標語裡的模型名：用這則訊息記下的模型；使用者的訊息沒有，就往前找最近一則角色訊息
    const chat = SillyTavern.getContext().chat;
    let model = '';
    for (let i = id; i >= 0 && !model; i--) model = chat[i]?.extra?.model || '';
    return { name, url, model };
}

// ---------- 字型 ----------

// 自己上傳的字體：family 是內部代號（TRFont_時間），label 是上傳時的檔名，path 是 ST 檔案區的位置
const customFont = family => saved.customFonts.find(f => f.family === family);
const allFonts = () => [...FONTS, ...saved.customFonts.map(f => [f.family, f.label])];

const fontLinks = new Set();
async function ensureFont(family, text, bold) {
    const custom = customFont(family);
    if (custom) {
        if (!fontLinks.has(family)) {
            fontLinks.add(family);
            const face = new FontFace(family, `url("${custom.path}")`);
            document.fonts.add(face);
            await Promise.race([face.load().catch(() => {}), new Promise(r => setTimeout(r, 15000))]);
        }
        return;
    }
    if (!fontLinks.has(family)) {
        fontLinks.add(family);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;700&display=swap`;
        const loaded = new Promise(r => { link.onload = r; link.onerror = r; setTimeout(r, 4000); });
        document.head.appendChild(link);
        await loaded;
    }
    // 中文字型是按字切片下載的，要指定用到的字才會抓對的那幾片
    const load = document.fonts.load(`${bold ? 700 : 400} 40px "${family}"`, text).catch(() => {});
    await Promise.race([load, new Promise(r => setTimeout(r, 6000))]);
}

// ---------- 排字 ----------

const isCJK = ch => /[⺀-鿿豈-﫿＀-￯　-〿]/.test(ch);
const NO_LINE_START = '，。、！？；：」』）》〉…—,.!?;:)"\'”’';
const NO_LINE_END = '「『（《〈(“‘';

// 中文一個字一段、英文一個詞一段，排成不超過 maxW 的行
function wrap(ctx, text, maxW) {
    const tokens = text.match(/[A-Za-z0-9'’\-]+[ \t]*|[ \t]+|\n|./gu) || [];
    const lines = [];
    let line = '';
    for (const t of tokens) {
        if (t === '\n') { lines.push(line); line = ''; continue; }
        const next = line + t;
        if (ctx.measureText(next.trimEnd()).width > maxW && line && !NO_LINE_START.includes(t[0])) {
            // 開引號、開括號不留在行尾，跟著下一個字換行
            let carry = '';
            while (line && NO_LINE_END.includes(line.at(-1))) { carry = line.at(-1) + carry; line = line.slice(0, -1); }
            lines.push(line.trimEnd());
            line = carry + t.trimStart();
        } else {
            line = next;
        }
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines;
}

// 台詞框只准動換行：可見的字要跟原文一模一樣（不然回傳 null）；
// 每個字縫用原文的間隔，使用者在那裡打了換行才換成換行；把原文的換行刪掉時，中文接起來、英文補一個空格
function onlyBreaks(original, typed) {
    const split = s => {
        const chars = [], seps = [];
        let sep = '';
        for (const ch of s) {
            if (/\s/.test(ch)) { sep += ch; continue; }
            chars.push(ch); seps.push(sep); sep = '';
        }
        return { chars, seps };
    };
    const o = split(original), t = split(typed);
    if (o.chars.join('') !== t.chars.join('')) return null;
    let out = '';
    o.chars.forEach((ch, i) => {
        if (i) {
            const breaks = (t.seps[i].match(/\n/g) || []).length;
            if (breaks) out += '\n'.repeat(breaks);
            else if (o.seps[i].includes('\n')) out += isCJK(o.chars[i - 1]) || isCJK(ch) ? '' : ' ';
            else out += o.seps[i];
        }
        out += ch;
    });
    return out;
}

const fontOf = (st, size, weight) => `${weight ?? (st.opts.bold ? 700 : 400)} ${size}px "${st.opts.font}", ${FALLBACK}`;

// 字太多就縮小，直到不超過 maxLines 行；
// 使用者在台詞框自己斷過行，還要縮到每一行都放得下、不被自動折開（縮到最小還放不下才折）
function layoutText(ctx, st, size, maxW, maxLines) {
    const manual = st.manualBreaks && st.quote.includes('\n');
    const want = st.quote.split('\n').length;
    let lines;
    for (;;) {
        ctx.font = fontOf(st, size);
        lines = wrap(ctx, st.quote, maxW);
        if ((lines.length <= maxLines && (!manual || lines.length === want)) || size <= 28) break;
        size -= 4;
    }
    return { lines, size, lh: Math.round(size * 1.5) };
}

// ---------- 頭像 ----------

function grayscaleOf(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    // 不用 ctx.filter：舊一點的 iPhone Safari 不支援，直接改像素比較穩
    const d = x.getImageData(0, 0, c.width, c.height);
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
        const g = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114;
        p[i] = p[i + 1] = p[i + 2] = g;
    }
    x.putImageData(d, 0, 0);
    return c;
}

function avatarSource(st) {
    if (!st.img) return null;
    const tint = THEMES[st.opts.theme];
    if (!st.opts.mono && !tint) return st.img;
    st.gray ??= grayscaleOf(st.img);
    if (!tint) return st.gray;
    const c = document.createElement('canvas');
    c.width = st.gray.width; c.height = st.gray.height;
    const x = c.getContext('2d');
    x.drawImage(st.gray, 0, 0);
    const g = x.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, tint[0]); g.addColorStop(1, tint[1]);
    x.globalCompositeOperation = 'color';
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    return c;
}

// 頭像鋪滿「版型預設的照片區」，大小只看這一區和縮放，遮罩怎麼調都不影響；
// view.x / view.y：-1～1，單位是半張畫布，可以推到照片區外面（露出來的地方是底色）
function drawCover(ctx, src, rx, ry, rw, rh, view) {
    const s = Math.max(rw / src.width, rh / src.height) * view.zoom;
    const dw = src.width * s, dh = src.height * s;
    const { width: W, height: H } = ctx.canvas;
    const x = rx + (rw - dw) / 2 + view.x * W / 2;
    const y = ry + (rh - dh) / 2 + view.y * H / 2;
    ctx.drawImage(src, x, y, dw, dh);
}

// 淡出用的漸層：線性漸層起點會看到一條折線，改成慢慢起步的曲線
function fade(ctx, x0, y0, x1, y1, rgb) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    [[0, 0], [0.25, 0.08], [0.5, 0.3], [0.75, 0.68], [1, 1]].forEach(([at, a]) => g.addColorStop(at, `rgba(${rgb},${a})`));
    return g;
}

// ---------- 三種版型 ----------

function draw(canvas, st) {
    const o = st.opts;
    const { W, H } = LAYOUTS[o.layout];
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const rgb = o.light ? '255,255,255' : '0,0,0';
    const fg = o.light ? '#141414' : '#ffffff';
    const muted = o.light ? 'rgba(20,20,20,0.6)' : 'rgba(255,255,255,0.7)';
    const src = avatarSource(st);
    const k = st.scale;
    const { split, fade: fadeLen } = st.vals[o.layout];
    ctx.fillStyle = `rgb(${rgb})`; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'middle';

    if (o.layout === 'portrait') {
        // 直幅：頭像鋪滿整張、整片壓暗（白底就是整片刷白），左邊一條直線
        if (src) drawCover(ctx, src, 0, 0, W, H, st.view);
        ctx.fillStyle = `rgba(${rgb},${split})`; ctx.fillRect(0, 0, W, H);
        const left = 170 + st.tx, maxW = W - 170 - 130;
        const t = layoutText(ctx, st, 64 * k, maxW, 10);
        const blockH = t.lines.length * t.lh;
        const top = Math.round(H * 0.44 - blockH / 2) + st.ty;
        ctx.fillStyle = muted;
        ctx.fillRect(left - 42, top + t.lh * 0.12, 5, blockH - t.lh * 0.24);
        ctx.fillStyle = fg; ctx.textAlign = 'left';
        if (!o.light) { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; }
        t.lines.forEach((l, i) => ctx.fillText(l, left, top + t.lh * i + t.lh / 2));
        if (st.name) {
            ctx.font = fontOf(st, 42 * k);
            ctx.textAlign = 'right';
            const ny = top + blockH + 80 * k, right = left + maxW;
            ctx.fillText(st.name, right, ny);
            const nw = ctx.measureText(st.name).width;
            ctx.fillRect(right - nw - 30 * k - 110 * k, ny - 1, 110 * k, 3);
        }
        ctx.shadowBlur = 0;
    } else if (o.layout === 'classic') {
        // 橫幅：頭像在一側、往文字那側淡出，文字置中在另一側
        // 照片照預設的區域擺，遮罩（實心＋過渡）另外疊上去；漸層超出兩端會延用端點顏色，所以整張填一次就好
        const pw = Math.round(W * (1 - LAYOUTS.classic.split));
        if (src) drawCover(ctx, src, o.flip ? W - pw : 0, 0, pw, H, st.view);
        const aw = Math.round(W * (1 - split)), fw = W * fadeLen;
        ctx.fillStyle = o.flip ? fade(ctx, W - aw + fw, 0, W - aw, 0, rgb) : fade(ctx, aw - fw, 0, aw, 0, rgb);
        ctx.fillRect(0, 0, W, H);
        // 文字放在「過渡中段到另一邊」的正中間
        const from = aw - fw / 2;
        const half = (W - from) / 2;
        const cx = (o.flip ? W - from - half : from + half) + st.tx;
        const t = layoutText(ctx, st, 60 * k, Math.max(320, Math.min(680, half * 2 - 120)), 8);
        const nameH = st.name ? 80 * k : 0;
        const textH = t.lines.length * t.lh;
        const top = Math.round(H / 2 - (textH + nameH) / 2) + st.ty;
        ctx.fillStyle = fg; ctx.textAlign = 'center';
        t.lines.forEach((l, i) => ctx.fillText(l, cx, top + t.lh * i + t.lh / 2));
        if (st.name) {
            ctx.font = fontOf(st, 34 * k);
            ctx.fillStyle = muted;
            ctx.fillText(`— ${st.name}`, cx, top + textH + nameH / 2);
        }
    } else {
        // 卡片：頭像在上半、往下淡出，下面是大引號、置中的字、一條線和名字
        const ph = Math.round(H * (1 - LAYOUTS.card.split));
        if (src) drawCover(ctx, src, 0, 0, W, ph, st.view);
        const ah = Math.round(H * (1 - split)), fh = H * fadeLen;
        ctx.fillStyle = fade(ctx, 0, ah - fh, 0, ah, rgb);
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2 + st.tx;
        const t = layoutText(ctx, st, 72 * k, W - 200, 6);
        const markH = 120 * k, nameH = st.name ? 120 * k : 0;
        const textH = t.lines.length * t.lh;
        // 文字放在「過渡後段到底部」的正中間
        const mid = (ah - fh * 0.6 + H) / 2;
        const top = Math.round(mid - (markH + textH + nameH) / 2) + st.ty;
        ctx.fillStyle = fg; ctx.textAlign = 'center';
        ctx.font = `700 ${150 * k}px Georgia, "Times New Roman", serif`;
        ctx.fillText('“ ”', cx, top + markH * 0.6);
        ctx.font = fontOf(st, t.size);
        t.lines.forEach((l, i) => ctx.fillText(l, cx, top + markH + t.lh * i + t.lh / 2));
        if (st.name) {
            const ly = top + markH + textH + 30 * k;
            ctx.fillStyle = muted;
            ctx.fillRect(cx - 180 * k, ly, 360 * k, 3);
            ctx.font = fontOf(st, 38 * k);
            ctx.fillText(st.name, cx, ly + 60 * k);
        }
    }
    drawFooter(ctx, st, fg, muted);
}

// 底部標語：位置固定、字級固定成各版型名字的預設大小，不跟著文字拉霸和字級走；文字跟著介面語言
// 沒有模型名時，連同前面的分隔號一起拿掉
function footerText(st) {
    const f = T('footers')[st.opts.footer] || '';
    return f.replace(/(．| · )\{model\}/, (m, sep) => (st.model ? sep + st.model : ''));
}
function drawFooter(ctx, st, fg, muted) {
    const text = footerText(st);
    if (!text) return;
    const o = st.opts;
    const { W, H } = LAYOUTS[o.layout];
    // 顏色跟該版型的名字一樣（黑底是白字）
    const spec = {
        portrait: { size: 42, color: fg, x: W / 2, y: H - 80, align: 'center' },
        classic: o.flip
            ? { size: 34, color: muted, x: 60, y: H - 50, align: 'left' }
            : { size: 34, color: muted, x: W - 60, y: H - 50, align: 'right' },
        card: { size: 38, color: muted, x: W / 2, y: H - 60, align: 'center' },
    }[o.layout];
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.font = fontOf(st, spec.size);
    ctx.fillStyle = spec.color;
    ctx.textAlign = spec.align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, spec.x, spec.y);
    ctx.restore();
}

function loadImage(url) {
    return new Promise(resolve => {
        if (!url) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

// ---------- 預覽視窗 ----------

function closeOverlay() {
    const ov = document.getElementById('taiwanreporter_overlay');
    if (!ov) return;
    if (ov.open) ov.close();
    ov.remove();
}

// 用 <dialog> 開在最上層：ST 手機版把 body 設成 position: fixed、html 加了 transform，
// 一般的 position: fixed 遮罩在 iPhone 上高度會算錯、擠在畫面頂端
function overlay(inner) {
    closeOverlay();
    const ov = document.createElement('dialog');
    ov.id = 'taiwanreporter_overlay';
    // 焦點先給面板本身：不然 <dialog> 會自動聚焦到第一個下拉選單，iPhone 一聚焦就跳出選單
    ov.innerHTML = `<div class="taiwanreporter_panel" tabindex="-1" autofocus>${inner}</div>`;
    ov.addEventListener('click', e => { if (e.target === ov) closeOverlay(); });
    ov.addEventListener('cancel', e => { e.preventDefault(); closeOverlay(); });
    document.body.appendChild(ov);
    // 反白圖示是按下就開，手指放開那一下會點到剛開好的面板；開頭一小段時間先不收點擊
    ov.style.pointerEvents = 'none';
    setTimeout(() => { ov.style.pointerEvents = ''; }, 450);
    ov.showModal();
    return ov;
}

// 拉霸：標籤和範圍跟著版型變；回傳 null 的就在那個版型藏起來
const SLIDERS = ['tx', 'ty', 'scale', 'bx', 'by', 'zoom', 'split', 'fade'];
function sliderSpec(key, layout) {
    const L = T('sliders');
    switch (key) {
        case 'tx': return [L.tx, -400, 400, 1];
        case 'ty': return [L.ty, -600, 600, 1];
        case 'scale': return [L.scale, 0.6, 1.6, 0.01];
        case 'bx': return [L.bx, -1, 1, 0.01];
        case 'by': return [L.by, -1, 1, 0.01];
        case 'zoom': return [L.zoom, 1, 2.5, 0.01];
        case 'split': return layout === 'portrait' ? [L.splitPortrait, 0, 0.9, 0.01] : [L.split, 0.1, 0.85, 0.01];
        case 'fade': return layout === 'portrait' ? null : [L.fade, 0.02, 0.9, 0.01];
    }
}
const freshVals = () => Object.fromEntries(Object.entries(LAYOUTS).map(([key, l]) => [key, { split: l.split, fade: l.fade }]));
const getVal = (st, key) => ({
    tx: st.tx, ty: st.ty, scale: st.scale, bx: st.view.x, by: st.view.y, zoom: st.view.zoom,
    split: st.vals[st.opts.layout].split, fade: st.vals[st.opts.layout].fade,
})[key];
function setVal(st, key, v) {
    if (key === 'bx') st.view.x = v;
    else if (key === 'by') st.view.y = v;
    else if (key === 'zoom') st.view.zoom = v;
    else if (key === 'split' || key === 'fade') st.vals[st.opts.layout][key] = v;
    else st[key] = v;
}

async function openCard(quote, mesEl) {
    quote = quote.replace(/\s*\n\s*/g, '\n').trim();
    if (!quote) return;
    const { name, url, model } = speakerOf(mesEl);
    // 字型名稱：中文介面用中文名，英文介面用字型本來的英文名；自己上傳的一律用檔名
    const fontLabel = (f, l) => (lang() === 'zh-tw' || customFont(f) ? l : f);
    const ov = overlay(`
        <canvas class="taiwanreporter_canvas"></canvas>
        <img class="taiwanreporter_saveimg" style="display:none" alt="${T('name')}">
        <div class="taiwanreporter_hint">${T('hint')}</div>
        <div class="taiwanreporter_back_row taiwanreporter_buttons" style="display:none"><div class="menu_button taiwanreporter_back">${T('back')}</div></div>
        <div class="taiwanreporter_edit">
        <div class="taiwanreporter_row"><div class="menu_button taiwanreporter_break_btn" title="${T('breakHint')}">${T('breakEdit')}</div></div>
        <textarea class="text_pole taiwanreporter_text" rows="3" placeholder="${T('breakHint')}" style="display:none"></textarea>
        <div class="taiwanreporter_row taiwanreporter_toggles">
            ${Object.keys(LAYOUTS).map(key => `<div class="menu_button taiwanreporter_toggle" data-layout="${key}">${T('layouts')[key]}</div>`).join('')}
            ${['light', 'mono', 'bold', 'flip'].map(k => `<div class="menu_button taiwanreporter_toggle" data-opt="${k}">${T(k)}</div>`).join('')}
        </div>
        <div class="taiwanreporter_row taiwanreporter_selects">
            <span>${T('font')}</span>
            <select class="text_pole taiwanreporter_font">${allFonts().map(([f, l]) => `<option value="${f}">${fontLabel(f, l)}</option>`).join('')}</select>
            <span>${T('theme')}</span>
            <select class="text_pole taiwanreporter_theme">${Object.keys(THEMES).map(key => `<option value="${key}">${T('themes')[key]}</option>`).join('')}</select>
        </div>
        <div class="taiwanreporter_row taiwanreporter_selects">
            <span>${T('footer')}</span>
            <select class="text_pole taiwanreporter_footer">${T('footers').map((f, i) => `<option value="${i}">${i ? f.replace('{model}', T('model')) : T('footerNone')}</option>`).join('')}</select>
        </div>
        ${SLIDERS.map(key => `<label class="taiwanreporter_slider" data-key="${key}"><span></span><input type="range" data-k="${key}"></label>`).join('')}
        </div>
        <div class="taiwanreporter_buttons">
            <div class="menu_button taiwanreporter_reset taiwanreporter_edit">${T('reset')}</div>
            <div class="menu_button taiwanreporter_share taiwanreporter_edit">${T('share')}</div>
            <div class="menu_button taiwanreporter_save taiwanreporter_edit">${T('save')}</div>
            <div class="menu_button taiwanreporter_close">${T('close')}</div>
        </div>`);
    const panel = ov.querySelector('.taiwanreporter_panel');
    const canvas = ov.querySelector('canvas');
    const st = {
        quote, name, model, img: await loadImage(url), gray: null,
        opts: { ...saved }, view: { x: 0, y: 0, zoom: 1 }, tx: 0, ty: 0, scale: 1, vals: freshVals(),
    };
    if (!allFonts().some(([f]) => f === st.opts.font)) st.opts.font = FONTS[0][0];

    // 預覽照版型比例縮到畫面內
    const fit = () => {
        const { W, H } = LAYOUTS[st.opts.layout];
        const s = Math.min((panel.clientWidth - 24) / W, (window.innerHeight * 0.42) / H);
        canvas.style.width = `${Math.round(W * s)}px`;
        canvas.style.height = `${Math.round(H * s)}px`;
    };
    const syncControls = () => {
        ov.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('active', b.dataset.layout === st.opts.layout));
        ov.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('active', !!st.opts[b.dataset.opt]));
        ov.querySelector('[data-opt="flip"]').style.display = st.opts.layout === 'classic' ? '' : 'none';
        ov.querySelector('.taiwanreporter_font').value = st.opts.font;
        ov.querySelector('.taiwanreporter_theme').value = st.opts.theme;
        ov.querySelector('.taiwanreporter_footer').value = st.opts.footer;
        syncSliders();
    };
    const syncSliders = () => ov.querySelectorAll('.taiwanreporter_slider').forEach(lab => {
        const spec = sliderSpec(lab.dataset.key, st.opts.layout);
        lab.style.display = spec ? '' : 'none';
        if (!spec) return;
        const [label, min, max, step] = spec;
        const inp = lab.querySelector('input');
        lab.querySelector('span').textContent = label;
        Object.assign(inp, { min, max, step });
        inp.value = getVal(st, lab.dataset.key);
    });
    let fontKey = '';
    const render = () => {
        draw(canvas, st);
        fit();
        const key = `${st.opts.font}|${st.opts.bold}|${st.opts.footer}|${lang()}|${st.quote}`;
        if (key !== fontKey) {
            fontKey = key;
            ensureFont(st.opts.font, `${st.quote}${st.name}${footerText(st)}`, st.opts.bold).then(() => { if (fontKey === key) draw(canvas, st); });
        }
    };
    const setOpt = (k, v) => {
        st.opts[k] = v;
        Object.assign(saved, st.opts);
        saveSettingsDebounced();
        syncControls();
        render();
    };

    ov.querySelectorAll('[data-layout]').forEach(b => b.addEventListener('click', () => {
        st.view = { x: 0, y: 0, zoom: st.view.zoom };
        setOpt('layout', b.dataset.layout);
    }));
    ov.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => setOpt(b.dataset.opt, !st.opts[b.dataset.opt])));
    // 台詞框只能加、刪換行，字一個都不能動：打字、刪字、貼上都退回上一個樣子
    const textBox = ov.querySelector('.taiwanreporter_text');
    textBox.value = quote;
    // 「換行編輯」按一下打開台詞框、再按一下收起來
    const breakBtn = ov.querySelector('.taiwanreporter_break_btn');
    breakBtn.addEventListener('click', () => {
        const open = textBox.style.display === 'none';
        textBox.style.display = open ? '' : 'none';
        breakBtn.classList.toggle('active', open);
        if (open) textBox.focus();
    });
    let last = { value: quote, start: 0, end: 0 };
    const remember = () => { last = { value: textBox.value, start: textBox.selectionStart, end: textBox.selectionEnd }; };
    const checkText = () => {
        const fixed = onlyBreaks(quote, textBox.value);
        if (fixed === null) {
            textBox.value = last.value;
            textBox.setSelectionRange(last.start, last.end);
            return;
        }
        if (fixed !== textBox.value) {
            // 多打的空白拿掉後，游標放回同一個字後面
            const pos = textBox.selectionStart;
            const nth = textBox.value.slice(0, pos).replace(/\s/g, '').length;
            textBox.value = fixed;
            let at = 0;
            for (let n = 0; n < nth; at++) if (!/\s/.test(fixed[at])) n++;
            textBox.setSelectionRange(at, at);
        }
        remember();
        st.quote = fixed;
        st.manualBreaks = true;
        render();
    };
    ['keyup', 'pointerup', 'select', 'focus'].forEach(ev => textBox.addEventListener(ev, () => { if (textBox.value === last.value) remember(); }));
    // 注音、拼音選字中不要動它，選完字再檢查（選出來的字一樣會被退回）
    textBox.addEventListener('input', e => { if (!e.isComposing) checkText(); });
    textBox.addEventListener('compositionend', checkText);
    ov.querySelector('.taiwanreporter_font').addEventListener('change', e => setOpt('font', e.target.value));
    ov.querySelector('.taiwanreporter_theme').addEventListener('change', e => setOpt('theme', e.target.value));
    ov.querySelector('.taiwanreporter_footer').addEventListener('change', e => setOpt('footer', Number(e.target.value)));
    ov.querySelectorAll('.taiwanreporter_slider input').forEach(inp => inp.addEventListener('input', () => {
        setVal(st, inp.dataset.k, Number(inp.value));
        draw(canvas, st);
    }));
    ov.querySelector('.taiwanreporter_reset').addEventListener('click', () => {
        st.tx = 0; st.ty = 0; st.scale = 1; st.view = { x: 0, y: 0, zoom: 1 }; st.vals = freshVals();
        syncSliders();
        draw(canvas, st);
    });

    // 拖動調整背景位置：圖片跟著手指走
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, vx: st.view.x, vy: st.view.y }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
        if (!drag || !st.img) return;
        const r = canvas.getBoundingClientRect();
        const clamp = v => Math.max(-1, Math.min(1, v));
        st.view.x = clamp(drag.vx + (e.clientX - drag.x) / r.width * 2);
        st.view.y = clamp(drag.vy + (e.clientY - drag.y) / r.height * 2);
        ov.querySelector('[data-k="bx"]').value = st.view.x;
        ov.querySelector('[data-k="by"]').value = st.view.y;
        draw(canvas, st);
    });
    canvas.addEventListener('pointerup', () => { drag = null; });

    const fileName = () => `${name || T('name')}_${Date.now()}.png`;
    const toFile = () => new Promise(r => canvas.toBlob(b => r(new File([b], fileName(), { type: 'image/png' })), 'image/png'));
    // 存到相簿：有分享面板（HTTPS 才有）就用分享面板；沒有就把成品換成一張圖，長按「加入照片」
    const saveImg = ov.querySelector('.taiwanreporter_saveimg');
    const editBox = ov.querySelectorAll('.taiwanreporter_edit');
    const showSaveImg = on => {
        saveImg.style.display = on ? '' : 'none';
        canvas.style.display = on ? 'none' : '';
        editBox.forEach(el => { el.style.display = on ? 'none' : ''; });
        ov.querySelector('.taiwanreporter_back_row').style.display = on ? '' : 'none';
        ov.querySelector('.taiwanreporter_hint').textContent = on ? T('hintSave') : T('hint');
        if (!on) syncSliders();
    };
    ov.querySelector('.taiwanreporter_share').addEventListener('click', async () => {
        const file = await toFile();
        if (navigator.canShare?.({ files: [file] })) {
            try { await navigator.share({ files: [file] }); } catch { /* 使用者取消 */ }
            return;
        }
        saveImg.src = canvas.toDataURL('image/png');
        saveImg.style.width = canvas.style.width;
        saveImg.style.height = canvas.style.height;
        showSaveImg(true);
    });
    ov.querySelector('.taiwanreporter_back').addEventListener('click', () => showSaveImg(false));
    ov.querySelector('.taiwanreporter_save').addEventListener('click', async () => {
        const file = await toFile();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file); a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    });
    ov.querySelector('.taiwanreporter_close').addEventListener('click', closeOverlay);

    syncControls();
    render();
}

// ---------- 入口一：反白後第一個字左上方的圖示 ----------

const selBtn = document.createElement('div');
selBtn.id = 'taiwanreporter_sel_btn';
selBtn.title = T('send');
document.body.appendChild(selBtn);
let picked = null; // { text, mesEl }

function hideSelBtn() { selBtn.style.display = 'none'; picked = null; }

function updateSelBtn() {
    if (!saved.enabled) return hideSelBtn();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return hideSelBtn();
    const range = sel.getRangeAt(0);
    const startEl = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    const mesText = startEl?.closest?.('#chat .mes_text');
    const text = sel.toString().trim();
    if (!mesText || !text) return hideSelBtn();
    const rect = [...range.getClientRects()].find(r => r.width > 0 && r.height > 0);
    if (!rect) return hideSelBtn();
    picked = { text, mesEl: mesText.closest('.mes') };
    // 浮在第一個字的左上方（壓到上一行沒關係），避開 iPhone 反白起點的拖曳把手
    selBtn.style.left = `${Math.max(4, rect.left - 20 - BTN / 2)}px`;
    selBtn.style.top = `${Math.max(4, rect.top - 22 - BTN / 2)}px`;
    selBtn.style.display = 'block';
}

let selTimer = null;
document.addEventListener('selectionchange', () => { clearTimeout(selTimer); selTimer = setTimeout(updateSelBtn, 120); });
document.getElementById('chat')?.addEventListener('scroll', () => { if (picked) updateSelBtn(); }, { passive: true });

// 按下去的當下就開，免得手機上一碰圖示、反白先被取消
selBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!picked) return;
    const { text, mesEl } = picked;
    window.getSelection()?.removeAllRanges();
    hideSelBtn();
    openCard(text, mesEl);
});

// ---------- 入口二：訊息「⋯」選單裡逐句挑 ----------

function sentencesOf(mesEl) {
    const box = mesEl.querySelector('.mes_text')?.cloneNode(true);
    if (!box) return [];
    box.querySelectorAll('pre, code, details, style, script').forEach(n => n.remove());
    const blocks = [...box.querySelectorAll('p, li, blockquote, h1, h2, h3, h4')].filter(b => !b.querySelector('p, li'));
    const texts = (blocks.length ? blocks : [box]).map(b => b.textContent.trim()).filter(Boolean);
    const out = [];
    for (const t of texts) {
        const parts = t.match(/[^。！？!?.…\n]+(?:[。！？!?.…]+["」』”’)）]*)?/gu) || [t];
        parts.map(s => s.trim()).filter(s => s && !/^[-—*#|>`~]+$/.test(s)).forEach(s => out.push(s));
    }
    return out;
}

function joinParts(parts) {
    return parts.reduce((acc, s) => {
        if (!acc) return s;
        return isCJK(acc.at(-1)) || isCJK(s[0]) ? acc + s : `${acc} ${s}`;
    }, '');
}

function openPicker(mesEl) {
    const list = sentencesOf(mesEl);
    if (!list.length) return toastr.info(T('noSentence'));
    const ov = overlay(`
        <div class="taiwanreporter_title">${T('pickTitle')}</div>
        <div class="taiwanreporter_list">${list.map((s, i) => `<div class="taiwanreporter_item" data-i="${i}"></div>`).join('')}</div>
        <div class="taiwanreporter_buttons">
            <div class="menu_button taiwanreporter_make">${T('make')}</div>
            <div class="menu_button taiwanreporter_close">${T('cancel')}</div>
        </div>`);
    ov.querySelectorAll('.taiwanreporter_item').forEach(el => { el.textContent = list[Number(el.dataset.i)]; });
    ov.querySelector('.taiwanreporter_list').addEventListener('click', e => e.target.closest('.taiwanreporter_item')?.classList.toggle('selected'));
    ov.querySelector('.taiwanreporter_close').addEventListener('click', closeOverlay);
    ov.querySelector('.taiwanreporter_make').addEventListener('click', () => {
        const chosen = [...ov.querySelectorAll('.taiwanreporter_item.selected')].map(el => list[Number(el.dataset.i)]);
        if (!chosen.length) return toastr.info(T('pickOne'));
        openCard(joinParts(chosen), mesEl);
    });
}

const MES_BTN = '<div class="mes_button taiwanreporter_mes_btn"></div>';
document.querySelector('#message_template .extraMesButtons')?.insertAdjacentHTML('afterbegin', MES_BTN);
document.querySelectorAll('#chat .mes .extraMesButtons').forEach(el => {
    if (!el.querySelector('.taiwanreporter_mes_btn')) el.insertAdjacentHTML('afterbegin', MES_BTN);
});
$(document).on('click', '.taiwanreporter_mes_btn', function () { openPicker(this.closest('.mes')); });

// ---------- 擴充頁面裡的設定欄：開關、語言 ----------

const settingsPanel = document.getElementById('extensions_settings2') ?? document.getElementById('extensions_settings');
settingsPanel?.insertAdjacentHTML('beforeend', `
<div class="taiwanreporter_settings">
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b class="taiwanreporter_s_name"></b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <small class="taiwanreporter_s_tagline"></small>
            <label class="checkbox_label" for="taiwanreporter_enabled">
                <input type="checkbox" id="taiwanreporter_enabled">
                <span class="taiwanreporter_s_enable"></span>
            </label>
            <label class="taiwanreporter_s_lang_row" for="taiwanreporter_lang">
                <span class="taiwanreporter_s_language"></span>
                <select id="taiwanreporter_lang" class="text_pole">
                    <option value="auto"></option>
                    <option value="zh-tw">繁體中文</option>
                    <option value="en">English</option>
                </select>
            </label>
            <b class="taiwanreporter_s_fonts"></b>
            <div class="taiwanreporter_s_font_list"></div>
            <div class="menu_button taiwanreporter_s_upload"></div>
            <input type="file" class="taiwanreporter_s_file" accept=".ttf,.otf,.woff,.woff2" hidden>
            <small class="taiwanreporter_s_upload_hint"></small>
        </div>
    </div>
</div>`);

// 換語言或開關時，設定欄、提示文字、訊息按鈕一起更新
function applySettings() {
    const set = (sel, text) => document.querySelectorAll(sel).forEach(el => { el.textContent = text; });
    set('.taiwanreporter_s_name', T('name'));
    set('.taiwanreporter_s_tagline', T('tagline'));
    set('.taiwanreporter_s_enable', T('enable'));
    set('.taiwanreporter_s_language', T('language'));
    set('#taiwanreporter_lang option[value="auto"]', T('langAuto'));
    set('.taiwanreporter_s_fonts', T('fonts'));
    set('.taiwanreporter_s_upload', T('upload'));
    set('.taiwanreporter_s_upload_hint', T('uploadHint'));
    renderFontList();
    selBtn.title = T('send');
    // 包含訊息範本裡那一顆，之後新出現的訊息就會帶著新的提示文字
    document.querySelectorAll('.taiwanreporter_mes_btn').forEach(el => { el.title = T('send'); });
    document.body.classList.toggle('taiwanreporter_off', !saved.enabled);
    if (!saved.enabled) { hideSelBtn(); closeOverlay(); }
}

const enabledBox = document.getElementById('taiwanreporter_enabled');
const langSelect = document.getElementById('taiwanreporter_lang');
if (enabledBox && langSelect) {
    enabledBox.checked = saved.enabled;
    langSelect.value = saved.lang;
    enabledBox.addEventListener('change', () => { saved.enabled = enabledBox.checked; saveSettingsDebounced(); applySettings(); });
    langSelect.addEventListener('change', () => { saved.lang = langSelect.value; saveSettingsDebounced(); applySettings(); });
}
applySettings();

// ---------- 自訂字體：上傳到 ST 的檔案區（user/files），設定裡只記名字和位置 ----------

function renderFontList() {
    const box = document.querySelector('.taiwanreporter_s_font_list');
    if (!box) return;
    box.innerHTML = '';
    if (!saved.customFonts.length) {
        box.innerHTML = '<small class="taiwanreporter_s_empty"></small>';
        box.firstChild.textContent = T('noFonts');
        return;
    }
    for (const f of saved.customFonts) {
        const row = document.createElement('div');
        row.className = 'taiwanreporter_s_font_row';
        row.innerHTML = '<span></span><div class="menu_button fa-solid fa-trash-can"></div>';
        row.querySelector('span').textContent = f.label;
        row.querySelector('.menu_button').title = T('remove');
        row.querySelector('.menu_button').addEventListener('click', () => removeFont(f));
        box.appendChild(row);
    }
}

const fileToBase64 = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
});

async function uploadFont(file) {
    const btn = document.querySelector('.taiwanreporter_s_upload');
    const ext = (file.name.match(/\.(ttf|otf|woff2?)$/i)?.[1] || '').toLowerCase();
    if (!ext) return toastr.error(T('badFont'));
    const family = `TRFont_${Date.now()}`;
    // 先在瀏覽器裡試載一次，不是字體的檔案就不上傳
    try {
        const face = new FontFace(family, await file.arrayBuffer());
        await face.load();
    } catch {
        return toastr.error(T('badFont'));
    }
    btn.textContent = T('uploading');
    btn.classList.add('disabled');
    try {
        const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: SillyTavern.getContext().getRequestHeaders(),
            body: JSON.stringify({ name: `taiwanreporter_${family}.${ext}`, data: await fileToBase64(file) }),
        });
        if (!res.ok) throw new Error(await res.text() || res.status);
        const { path } = await res.json();
        const label = file.name.replace(/\.[^.]+$/, '');
        saved.customFonts.push({ family, label, path: `/${String(path).replace(/^\/+/, '')}` });
        saveSettingsDebounced();
        toastr.success(T('uploaded') + label);
    } catch (e) {
        toastr.error(T('uploadFail') + (e?.message || e));
    } finally {
        btn.classList.remove('disabled');
        applySettings();
    }
}

async function removeFont(f) {
    const { callGenericPopup, POPUP_TYPE, getRequestHeaders } = SillyTavern.getContext();
    if (!await callGenericPopup(T('removeAsk')(f.label), POPUP_TYPE.CONFIRM)) return;
    // 檔案已經不在也照樣從清單拿掉
    await fetch('/api/files/delete', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ path: f.path.replace(/^\//, '') }),
    }).catch(() => {});
    saved.customFonts = saved.customFonts.filter(x => x !== f);
    if (saved.font === f.family) saved.font = FONTS[0][0];
    saveSettingsDebounced();
    toastr.info(T('removed') + f.label);
    renderFontList();
}

document.querySelector('.taiwanreporter_s_upload')?.addEventListener('click', () => document.querySelector('.taiwanreporter_s_file').click());
document.querySelector('.taiwanreporter_s_file')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) uploadFont(file);
});
renderFontList();
