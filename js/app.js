const COLORS = ['#e63946', '#ff4d6d', '#ff8500', '#ffd60a', '#2a9d3e', '#118ab2', '#5e548e', '#ffffff', '#1a1a1a'];

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const state = {
  mode: 'template',
  templateId: TEMPLATES[0].id,
  photoImg: null,
  quote: QUOTE_GROUPS[0].items[0],
  customText: '',
  font: document.getElementById('fontSelect').value,
  color: COLORS[0],
  position: 'middle',
  showDate: true,
};

function wrapText(measureCtx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  paragraphs.forEach((p) => {
    if (p === '') { lines.push(''); return; }
    let line = '';
    for (const ch of p) {
      const test = line + ch;
      if (measureCtx.measureText(test).width > maxWidth && line !== '') {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  });
  return lines;
}

function fitText(measureCtx, text, maxWidth, maxHeight, fontFamily) {
  let fontSize = 100;
  const minFontSize = 30;
  let lines = [text];
  let lineHeight = fontSize * 1.35;
  while (fontSize >= minFontSize) {
    measureCtx.font = `900 ${fontSize}px ${fontFamily}`;
    lines = wrapText(measureCtx, text, maxWidth);
    lineHeight = fontSize * 1.35;
    const fitsWidth = lines.every((l) => measureCtx.measureText(l).width <= maxWidth);
    if (lines.length * lineHeight <= maxHeight && fitsWidth) break;
    fontSize -= 4;
  }
  return { fontSize, lines, lineHeight };
}

function drawImageCover(img) {
  const imgRatio = img.width / img.height;
  const canvasRatio = W / H;
  let sx, sy, sw, sh;
  if (imgRatio > canvasRatio) {
    sh = img.height;
    sw = sh * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0.18)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawDateStamp() {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const label = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`;
  ctx.font = "700 30px 'Noto Sans TC', sans-serif";
  const textW = ctx.measureText(label).width;
  const padX = 22;
  const boxW = textW + padX * 2;
  const boxH = 56;
  const x = W / 2 - boxW / 2;
  const y = 34;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  roundRect(ctx, x, y, boxW, boxH, boxH / 2);
  ctx.fill();
  ctx.fillStyle = '#3a2e2a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, y + boxH / 2 + 2);
  ctx.restore();
}

function currentText() {
  return (state.customText && state.customText.trim()) ? state.customText.trim() : state.quote;
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (state.mode === 'upload' && state.photoImg) {
    drawImageCover(state.photoImg);
  } else {
    const tpl = TEMPLATES.find((t) => t.id === state.templateId) || TEMPLATES[0];
    tpl.draw(ctx, W, H);
  }

  const text = currentText();
  const maxWidth = W * 0.82;
  const maxHeight = H * 0.5;
  const { fontSize, lines, lineHeight } = fitText(ctx, text, maxWidth, maxHeight, state.font);

  const totalTextHeight = lines.length * lineHeight;
  let startY;
  if (state.position === 'top') startY = H * 0.16 + lineHeight * 0.5;
  else if (state.position === 'bottom') startY = H * 0.88 - totalTextHeight + lineHeight * 0.5;
  else startY = H / 2 - totalTextHeight / 2 + lineHeight * 0.5;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    ctx.font = `900 ${fontSize}px ${state.font}`;
    ctx.lineWidth = fontSize * 0.16;
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeText(line, W / 2, y);
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = state.color;
    ctx.fillText(line, W / 2, y);
    ctx.shadowColor = 'transparent';
  });

  if (state.showDate) drawDateStamp();
}

function buildTemplateGrid() {
  const grid = document.getElementById('templateGrid');
  TEMPLATES.forEach((tpl, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'template-card' + (idx === 0 ? ' active' : '');
    card.dataset.id = tpl.id;

    const thumb = document.createElement('canvas');
    thumb.width = 220;
    thumb.height = 220;
    tpl.draw(thumb.getContext('2d'), 220, 220);

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = tpl.name;

    card.appendChild(thumb);
    card.appendChild(label);
    card.addEventListener('click', () => {
      state.templateId = tpl.id;
      state.mode = 'template';
      document.querySelectorAll('.template-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      render();
    });
    grid.appendChild(card);
  });
}

function buildQuoteSelect() {
  const sel = document.getElementById('quoteSelect');
  QUOTE_GROUPS.forEach((group) => {
    const og = document.createElement('optgroup');
    og.label = group.label;
    group.items.forEach((q) => {
      const opt = document.createElement('option');
      opt.value = q;
      opt.textContent = q;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
  sel.addEventListener('change', () => {
    state.quote = sel.value;
    state.customText = '';
    document.getElementById('customText').value = '';
    render();
  });
}

function buildColorSwatches() {
  const wrap = document.getElementById('colorSwatches');
  COLORS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch' + (i === 0 ? ' active' : '');
    btn.style.background = c;
    btn.title = c;
    btn.addEventListener('click', () => {
      state.color = c;
      document.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
    wrap.appendChild(btn);
  });
}

function wireControls() {
  document.getElementById('customText').addEventListener('input', (e) => {
    state.customText = e.target.value;
    render();
  });

  document.getElementById('fontSelect').addEventListener('change', async (e) => {
    state.font = e.target.value;
    try { await document.fonts.load(`900 80px ${state.font}`); } catch (err) { /* ignore */ }
    render();
  });

  document.getElementById('posToggle').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-pos]');
    if (!btn) return;
    state.position = btn.dataset.pos;
    document.querySelectorAll('#posToggle button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });

  document.getElementById('showDate').addEventListener('change', (e) => {
    state.showDate = e.target.checked;
    render();
  });

  document.querySelectorAll('.bg-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.bg-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isTemplates = tab.dataset.tab === 'templates';
      document.getElementById('templatesPanel').hidden = !isTemplates;
      document.getElementById('uploadPanel').hidden = isTemplates;
      state.mode = isTemplates ? 'template' : (state.photoImg ? 'upload' : 'template');
      render();
    });
  });

  document.getElementById('photoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photoImg = img;
        state.mode = 'upload';
        render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('downloadBtn').addEventListener('click', () => {
    if (isInAppBrowser()) {
      showToast('LINE／FB 內建瀏覽器可能無法下載，請改用右上角「⋯」在瀏覽器中開啟');
    }
    const link = document.createElement('a');
    link.download = '早安圖.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    if (isInAppBrowser()) {
      showToast('LINE／FB 內建瀏覽器可能無法分享，請改用右上角「⋯」在瀏覽器中開啟');
    }
    canvas.toBlob(async (blob) => {
      const file = new File([blob], '早安圖.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '早安圖', text: currentText() });
        } catch (err) { /* user cancelled */ }
      } else {
        showToast('此瀏覽器不支援直接分享圖片，已為您下載，請從相簿分享');
        document.getElementById('downloadBtn').click();
      }
    }, 'image/png');
  });

  document.getElementById('lineBtn').addEventListener('click', () => {
    const homeUrl = buildPlainShareUrl();
    canvas.toBlob(async (blob) => {
      const file = new File([blob], '早安圖.png', { type: 'image/png' });
      const shareText = `早安！這是我用早安圖產生器做的 🌅\n也來做一張：${homeUrl}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '早安圖', text: shareText });
          return;
        } catch (err) { return; /* user cancelled */ }
      }
      showToast('此瀏覽器不支援直接分享圖片，已為您下載，並開啟 LINE 分享連結');
      document.getElementById('downloadBtn').click();
      window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(homeUrl)}`, '_blank');
    }, 'image/png');
  });

  document.getElementById('shareAppBtn').addEventListener('click', async () => {
    const url = buildPlainShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: '早安圖產生器', text: '幫你做一張長輩最愛的早安圖！', url });
        return;
      } catch (err) { return; /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('已複製連結！');
    } catch (err) {
      showToast('複製失敗，請手動複製網址列連結');
    }
  });
}

function buildPlainShareUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('openExternalBrowser', '1');
  return url.toString();
}

function isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return /Line\//i.test(ua) || /FBAN|FBAV|FB_IAB/i.test(ua) || /Instagram/i.test(ua);
}

function initInAppBanner() {
  if (!isInAppBrowser()) return;
  const banner = document.getElementById('inappBanner');
  banner.hidden = false;
  document.getElementById('inappBannerClose').addEventListener('click', () => {
    banner.hidden = true;
  });
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

async function init() {
  initInAppBanner();
  buildQuoteSelect();
  buildColorSwatches();
  buildTemplateGrid();
  wireControls();

  try {
    await Promise.all([
      document.fonts.load("900 80px 'Noto Sans TC'"),
      document.fonts.load("900 80px 'Noto Serif TC'"),
      document.fonts.load("900 80px 'LXGW WenKai TC'"),
      document.fonts.load("900 80px 'Ma Shan Zheng'"),
    ]);
  } catch (err) { /* fall back to system font if webfont fails */ }

  render();
}

init();
