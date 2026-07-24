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

function drawImageCover(targetCtx, img, w = W, h = H) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
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
  targetCtx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  const g = targetCtx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0.18)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  targetCtx.fillStyle = g;
  targetCtx.fillRect(0, 0, w, h);
}

function drawDateStamp(targetCtx) {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const label = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`;
  targetCtx.font = "700 30px 'Noto Sans TC', sans-serif";
  const textW = targetCtx.measureText(label).width;
  const padX = 22;
  const boxW = textW + padX * 2;
  const boxH = 56;
  const x = W / 2 - boxW / 2;
  const y = 34;
  targetCtx.save();
  targetCtx.fillStyle = 'rgba(255,255,255,0.88)';
  roundRect(targetCtx, x, y, boxW, boxH, boxH / 2);
  targetCtx.fill();
  targetCtx.fillStyle = '#3a2e2a';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(label, W / 2, y + boxH / 2 + 2);
  targetCtx.restore();
}

function drawWatermark(targetCtx) {
  const label = 'goodmorning.onlineqrcode.app';
  targetCtx.font = "600 22px 'Noto Sans TC', sans-serif";
  const textW = targetCtx.measureText(label).width;
  const padX = 16;
  const boxW = textW + padX * 2;
  const boxH = 36;
  const x = W / 2 - boxW / 2;
  const y = H - boxH - 22;
  targetCtx.save();
  targetCtx.fillStyle = 'rgba(255,255,255,0.75)';
  roundRect(targetCtx, x, y, boxW, boxH, boxH / 2);
  targetCtx.fill();
  targetCtx.fillStyle = '#3a2e2a';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(label, W / 2, y + boxH / 2 + 1);
  targetCtx.restore();
}

function drawPhotoCredit(targetCtx, credit) {
  const label = `📷 ${credit}`;
  targetCtx.font = "600 20px 'Noto Sans TC', sans-serif";
  const textW = targetCtx.measureText(label).width;
  const padX = 14;
  const boxH = 32;
  const boxW = textW + padX * 2;
  const x = W - boxW - 20;
  const y = H - boxH - 22;
  targetCtx.save();
  targetCtx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(targetCtx, x, y, boxW, boxH, boxH / 2);
  targetCtx.fill();
  targetCtx.fillStyle = '#ffffff';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(label, x + boxW / 2, y + boxH / 2 + 1);
  targetCtx.restore();
}

function currentText() {
  return (state.customText && state.customText.trim()) ? state.customText.trim() : state.quote;
}

function renderTo(targetCtx, withWatermark) {
  targetCtx.clearRect(0, 0, W, H);
  let activeTpl = null;
  if (state.mode === 'upload' && state.photoImg) {
    drawImageCover(targetCtx, state.photoImg);
  } else {
    activeTpl = activeTemplates.find((t) => t.id === state.templateId) || activeTemplates[0];
    activeTpl.draw(targetCtx, W, H);
  }

  const text = currentText();
  const maxWidth = W * 0.82;
  const maxHeight = H * 0.5;
  const { fontSize, lines, lineHeight } = fitText(targetCtx, text, maxWidth, maxHeight, state.font);

  const totalTextHeight = lines.length * lineHeight;
  let startY;
  if (state.position === 'top') startY = H * 0.16 + lineHeight * 0.5;
  else if (state.position === 'bottom') startY = H * 0.88 - totalTextHeight + lineHeight * 0.5;
  else startY = H / 2 - totalTextHeight / 2 + lineHeight * 0.5;

  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    targetCtx.font = `900 ${fontSize}px ${state.font}`;
    targetCtx.lineWidth = fontSize * 0.16;
    targetCtx.strokeStyle = 'rgba(255,255,255,0.92)';
    targetCtx.strokeText(line, W / 2, y);
    targetCtx.shadowColor = 'rgba(0,0,0,0.25)';
    targetCtx.shadowBlur = 8;
    targetCtx.shadowOffsetY = 3;
    targetCtx.fillStyle = state.color;
    targetCtx.fillText(line, W / 2, y);
    targetCtx.shadowColor = 'transparent';
  });

  if (state.showDate) drawDateStamp(targetCtx);
  if (withWatermark) {
    drawWatermark(targetCtx);
    if (activeTpl && activeTpl.credit) drawPhotoCredit(targetCtx, activeTpl.credit);
  }
}

function render() {
  renderTo(ctx, false);
}

function getExportCanvas() {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = W;
  exportCanvas.height = H;
  renderTo(exportCanvas.getContext('2d'), true);
  return exportCanvas;
}

let activeTemplates = TEMPLATES;

async function loadPhotoTemplates() {
  try {
    const res = await fetch('images/flowers/manifest.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const manifest = await res.json();
    if (!Array.isArray(manifest) || manifest.length === 0) return null;

    const picked = manifest.sort(() => Math.random() - 0.5).slice(0, 9);
    const loaded = await Promise.all(
      picked.map((entry) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ entry, img });
        img.onerror = () => resolve(null);
        img.src = `images/flowers/${entry.file}`;
      })),
    );

    const templates = loaded
      .filter(Boolean)
      .map(({ entry, img }, i) => ({
        id: `flower-${i}`,
        name: `花卉 ${i + 1}`,
        credit: entry.photographer || null,
        draw(targetCtx, w, h) { drawImageCover(targetCtx, img, w, h); },
      }));

    return templates.length > 0 ? templates : null;
  } catch (err) {
    return null;
  }
}

function buildTemplateGrid() {
  const grid = document.getElementById('templateGrid');
  grid.innerHTML = '';
  activeTemplates.forEach((tpl, idx) => {
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

  function downloadExportCanvas() {
    const link = document.createElement('a');
    link.download = '早安圖.png';
    link.href = getExportCanvas().toDataURL('image/png');
    link.click();
  }

  document.getElementById('downloadBtn').addEventListener('click', () => {
    if (isInAppBrowser()) {
      showToast('LINE／FB 內建瀏覽器可能無法下載，請改用右上角「⋯」在瀏覽器中開啟');
    }
    downloadExportCanvas();
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    if (isInAppBrowser()) {
      showToast('LINE／FB 內建瀏覽器可能無法分享，請改用右上角「⋯」在瀏覽器中開啟');
    }
    getExportCanvas().toBlob(async (blob) => {
      const file = new File([blob], '早安圖.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '早安圖', text: currentText() });
        } catch (err) { /* user cancelled */ }
      } else {
        showToast('此瀏覽器不支援直接分享圖片，已為您下載，請從相簿分享');
        downloadExportCanvas();
      }
    }, 'image/png');
  });

  document.getElementById('lineBtn').addEventListener('click', () => {
    const url = buildPlainShareUrl();
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank');
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

const UPLOAD_ENDPOINT = '/api/upload-photo';
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLScePLdSBb3J38GWKHO-inl05wYYh-db0fdjrA-ZALGOwWJOpA/formResponse';
const FORM_ENTRY = {
  name: 'entry.1523346825',
  platform: 'entry.168244351',
  handle: 'entry.1447683410',
  email: 'entry.1270478801',
  agree: 'entry.1564492846',
  photoId: 'entry.1329828469',
};
const AGREE_VALUE = '我同意';
const SUBMIT_MAX_DIMENSION = 1600;
const SUBMIT_JPEG_QUALITY = 0.85;

const UPLOAD_ERROR_MESSAGES = {
  file_too_large: '照片檔案太大，請換一張較小的照片',
  unsupported_file_type: '不支援這種檔案格式，請上傳 JPG／PNG／WebP 圖片',
  missing_photo: '請先選擇一張照片',
  storage_cap_reached: '目前投稿空間已滿，請稍後再試',
  invalid_form_data: '上傳失敗，請重新選擇照片後再試一次',
};

function resizeImageForSubmission(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > SUBMIT_MAX_DIMENSION || height > SUBMIT_MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round(height * (SUBMIT_MAX_DIMENSION / width));
          width = SUBMIT_MAX_DIMENSION;
        } else {
          width = Math.round(width * (SUBMIT_MAX_DIMENSION / height));
          height = SUBMIT_MAX_DIMENSION;
        }
      }
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      c.getContext('2d').drawImage(img, 0, 0, width, height);
      c.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) resolve(blob); else reject(new Error('encode failed'));
      }, 'image/jpeg', SUBMIT_JPEG_QUALITY);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('decode failed'));
    };
    img.src = objectUrl;
  });
}

function setSubmitStatus(message, kind) {
  const el = document.getElementById('submitStatus');
  el.textContent = message;
  el.className = 'submit-status' + (kind ? ` ${kind}` : '');
}

function wireSubmitPanel() {
  const photoInput = document.getElementById('submitPhotoInput');
  const preview = document.getElementById('submitPreview');
  const previewImg = document.getElementById('submitPreviewImg');
  const submitBtn = document.getElementById('submitPhotoBtn');
  const nameInput = document.getElementById('submitName');
  const platformSelect = document.getElementById('submitPlatform');
  const handleInput = document.getElementById('submitHandle');
  const emailInput = document.getElementById('submitEmail');
  const agreeInput = document.getElementById('submitAgree');

  let resizedBlob = null;

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    resizedBlob = null;
    if (!file) {
      preview.hidden = true;
      return;
    }
    setSubmitStatus('處理照片中…');
    try {
      resizedBlob = await resizeImageForSubmission(file);
      previewImg.src = URL.createObjectURL(resizedBlob);
      preview.hidden = false;
      setSubmitStatus('');
    } catch (err) {
      resizedBlob = null;
      preview.hidden = true;
      setSubmitStatus('無法讀取這張照片，請換一張', 'error');
    }
  });

  submitBtn.addEventListener('click', async () => {
    if (!resizedBlob) { setSubmitStatus('請先選擇一張照片', 'error'); return; }
    if (!nameInput.value.trim()) { setSubmitStatus('請填寫顯示名稱', 'error'); return; }
    if (!emailInput.value.trim() || !emailInput.checkValidity()) {
      setSubmitStatus('請填寫正確的聯絡 Email', 'error');
      return;
    }
    if (!agreeInput.checked) { setSubmitStatus('請先勾選同意投稿條款', 'error'); return; }

    submitBtn.disabled = true;
    setSubmitStatus('上傳中…');

    try {
      const formData = new FormData();
      formData.append('photo', resizedBlob, 'photo.jpg');
      const uploadRes = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        setSubmitStatus(UPLOAD_ERROR_MESSAGES[uploadData.error] || '上傳失敗，請稍後再試', 'error');
        submitBtn.disabled = false;
        return;
      }

      const params = new URLSearchParams();
      params.set(FORM_ENTRY.name, nameInput.value.trim());
      params.set(FORM_ENTRY.platform, platformSelect.value);
      params.set(FORM_ENTRY.handle, handleInput.value.trim());
      params.set(FORM_ENTRY.email, emailInput.value.trim());
      params.set(FORM_ENTRY.agree, AGREE_VALUE);
      params.set(FORM_ENTRY.photoId, uploadData.id);

      await fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body: params });

      setSubmitStatus('已收到你的投稿，感謝分享！審核通過後就會出現在範本清單中 🌸', 'success');
      photoInput.value = '';
      resizedBlob = null;
      preview.hidden = true;
      nameInput.value = '';
      handleInput.value = '';
      emailInput.value = '';
      agreeInput.checked = false;
    } catch (err) {
      setSubmitStatus('網路連線有問題，請稍後再試', 'error');
    } finally {
      submitBtn.disabled = false;
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
  wireControls();
  wireSubmitPanel();

  try {
    await Promise.all([
      document.fonts.load("900 80px 'Noto Sans TC'"),
      document.fonts.load("900 80px 'Noto Serif TC'"),
      document.fonts.load("900 80px 'LXGW WenKai TC'"),
      document.fonts.load("900 80px 'Ma Shan Zheng'"),
    ]);
  } catch (err) { /* fall back to system font if webfont fails */ }

  const photoTemplates = await loadPhotoTemplates();
  if (photoTemplates) {
    activeTemplates = photoTemplates;
    state.templateId = activeTemplates[0].id;
  }
  buildTemplateGrid();

  render();
}

init();
