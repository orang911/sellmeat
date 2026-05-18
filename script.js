// ========================================
// 游戏美术作品集 — 交互逻辑
// ========================================

// ========== 作品数据 ==========
const works = Array.isArray(window.portfolioWorks) ? window.portfolioWorks : [];

let publishedSettings = normalizeSettings(
  window.portfolioSettings && typeof window.portfolioSettings === 'object'
    ? window.portfolioSettings
    : {}
);

// ========== 编辑模式（?edit） ==========
const editMode = new URLSearchParams(window.location.search).has('edit');

// ========== 本地草稿 ==========
const DRAFT_KEY = 'portfolio-editor-draft-v1';
const LEGACY_SORT_KEY = 'portfolio-work-order';
const LEGACY_HIDE_KEY = 'portfolio-hidden';
const LEGACY_BILI_KEY = 'portfolio-bilibili';

let draftSettings = editMode ? loadDraftSettings() : null;
let sortMode = false;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(value) {
  return [...new Set(asArray(value).filter(item => typeof item === 'string' && item.trim()))];
}

function normalizeBilibili(value) {
  return asArray(value)
    .filter(item => item && typeof item === 'object' && typeof item.src === 'string' && item.src)
    .map(item => ({
      src: item.src,
      type: 'bilibili',
      title: typeof item.title === 'string' && item.title ? item.title : 'B站视频',
      bvid: typeof item.bvid === 'string' ? item.bvid : undefined
    }));
}

function normalizeSettings(value) {
  return {
    order: uniqueStrings(value && value.order),
    hidden: uniqueStrings(value && value.hidden),
    bilibili: normalizeBilibili(value && value.bilibili)
  };
}

function cloneSettings(value) {
  return normalizeSettings(JSON.parse(JSON.stringify(value || {})));
}

function parseStoredJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadLegacyDraft() {
  const order = parseStoredJson(LEGACY_SORT_KEY);
  const hidden = parseStoredJson(LEGACY_HIDE_KEY);
  const bilibili = parseStoredJson(LEGACY_BILI_KEY);
  if (!Array.isArray(order) && !Array.isArray(hidden) && !Array.isArray(bilibili)) return null;

  return normalizeSettings({
    order: Array.isArray(order) ? order : publishedSettings.order,
    hidden: Array.isArray(hidden) ? hidden : publishedSettings.hidden,
    bilibili: Array.isArray(bilibili) ? bilibili : publishedSettings.bilibili
  });
}

function loadDraftSettings() {
  const stored = parseStoredJson(DRAFT_KEY);
  if (stored) return normalizeSettings(stored);

  const legacyDraft = loadLegacyDraft();
  if (legacyDraft) return legacyDraft;

  return cloneSettings(publishedSettings);
}

function saveDraftSettings() {
  if (!editMode) return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draftSettings));
  updateEditorStatus();
}

function getCurrentSettings() {
  return editMode ? draftSettings : publishedSettings;
}

function settingsEqual(a, b) {
  return JSON.stringify(normalizeSettings(a)) === JSON.stringify(normalizeSettings(b));
}

function getAllWorkSrcs() {
  return works.map(work => work.src).concat(getCurrentSettings().bilibili.map(work => work.src));
}

function completeOrder(order) {
  const seen = new Set();
  const valid = new Set(getAllWorkSrcs());
  const next = [];

  order.forEach(src => {
    if (valid.has(src) && !seen.has(src)) {
      seen.add(src);
      next.push(src);
    }
  });

  getAllWorkSrcs().forEach(src => {
    if (!seen.has(src)) next.push(src);
  });

  return next;
}

function saveOrder(order) {
  draftSettings.order = completeOrder(order);
  saveDraftSettings();
}

function saveHidden(set) {
  draftSettings.hidden = [...set];
  saveDraftSettings();
}

function saveBilibili(list) {
  draftSettings.bilibili = normalizeBilibili(list);
  draftSettings.order = completeOrder(draftSettings.order);
  saveDraftSettings();
}

function getHiddenSet() {
  return new Set(getCurrentSettings().hidden);
}

function getVisible(list) {
  const hidden = getHiddenSet();
  return list.filter(work => !hidden.has(work.src));
}

function applyOrder(list) {
  const saved = getCurrentSettings().order;
  if (!saved.length) return list;

  const orderMap = new Map(saved.map((src, i) => [src, i]));
  return [...list].sort((a, b) => {
    const ai = orderMap.has(a.src) ? orderMap.get(a.src) : Infinity;
    const bi = orderMap.has(b.src) ? orderMap.get(b.src) : Infinity;
    return ai - bi;
  });
}

// ========== 合并B站视频 ==========
function getFullList(filter) {
  const settings = getCurrentSettings();
  let list = filter === 'all' ? [...works] : works.filter(work => work.type === filter);
  if (filter === 'all' || filter === 'bilibili') {
    list = list.concat(settings.bilibili);
  }
  return list;
}

// ========== 类型映射 ==========
const badgeMap = { video: '视频', image: '静帧', gif: 'GIF动效', game: '网页游戏', bilibili: 'B站视频' };

// ========== DOM ==========
const sortToggle = document.getElementById('sortToggle');
const addPanel = document.getElementById('addPanel');
const addBilibiliBtn = document.getElementById('addBilibiliBtn');
const biliUrl = document.getElementById('biliUrl');
const biliTitle = document.getElementById('biliTitle');
const biliAdd = document.getElementById('biliAdd');
const addMsg = document.getElementById('addMsg');
const filterBar = document.querySelector('.filter-bar');

function getActiveFilter() {
  const btn = document.querySelector('.filter-btn.active');
  return btn ? btn.dataset.filter : 'all';
}

function setActiveFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
}

// ========== 排序模式 ==========
sortToggle.addEventListener('click', () => {
  if (!editMode) return;

  sortMode = !sortMode;
  sortToggle.classList.toggle('active', sortMode);
  sortToggle.textContent = sortMode ? '完成' : '排序';

  if (sortMode) {
    setActiveFilter('all');
    closeAddPanel();
  }

  renderGallery(sortMode ? 'all' : getActiveFilter());
});

// ========== B站链接添加面板 ==========
addBilibiliBtn.addEventListener('click', () => {
  if (!editMode) return;
  const isOpen = addPanel.classList.toggle('open');
  addBilibiliBtn.textContent = isOpen ? '收起' : '＋添加B站';
  if (isOpen) biliUrl.focus();
});

function closeAddPanel() {
  addPanel.classList.remove('open');
  addBilibiliBtn.textContent = '＋添加B站';
  biliUrl.value = '';
  biliTitle.value = '';
  addMsg.textContent = '';
  addMsg.className = 'add-msg';
}

function parseBilibiliUrl(url) {
  url = url.trim();
  if (!url) return null;
  const bv = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bv) return { kind: 'bvid', id: bv[1] };
  const av = url.match(/bilibili\.com\/video\/[aA][vV](\d+)/);
  if (av) return { kind: 'aid', id: av[1] };
  return null;
}

biliAdd.addEventListener('click', () => {
  const url = biliUrl.value.trim();
  const title = biliTitle.value.trim();
  if (!url) { showMsg('请粘贴B站链接', true); return; }

  const parsed = parseBilibiliUrl(url);
  if (!parsed) { showMsg('链接格式不正确，请粘贴 bilibili.com/video/ 开头的链接', true); return; }

  const src = parsed.kind === 'bvid'
    ? 'https://player.bilibili.com/player.html?bvid=' + parsed.id
    : 'https://player.bilibili.com/player.html?aid=' + parsed.id;
  const autoTitle = parsed.kind === 'bvid' ? 'B站 ' + parsed.id : 'B站 av' + parsed.id;

  const list = [...draftSettings.bilibili];
  if (list.some(work => work.src === src)) { showMsg('该视频已添加过了', true); return; }

  list.push({ src, type: 'bilibili', title: title || autoTitle, bvid: parsed.kind === 'bvid' ? parsed.id : undefined });
  saveBilibili(list);
  showMsg('已添加到草稿');
  biliUrl.value = '';
  biliTitle.value = '';
  setActiveFilter('all');
  renderGallery('all');
});

function showMsg(text, isErr) {
  addMsg.textContent = text;
  addMsg.className = 'add-msg' + (isErr ? ' err' : '');
  if (!isErr) setTimeout(() => { addMsg.textContent = ''; addMsg.className = 'add-msg'; }, 2500);
}

// ========== 渲染作品 ==========
function renderGallery(filter = 'all') {
  const gallery = document.getElementById('gallery');
  let list = getFullList(filter);
  list = getVisible(list);
  list = applyOrder(list);

  gallery.classList.toggle('sort-mode', sortMode);

  if (list.length === 0) {
    gallery.innerHTML = `
      <div class="gallery-empty">
        <p style="font-size:48px;">🎬</p>
        <p>暂无作品展示</p>
      </div>`;
    updateRestoreBtn();
    updateEditorStatus();
    return;
  }

  gallery.innerHTML = (sortMode ? '<div class="sort-hint">拖拽排序 · 点 × 删除 · 完成后点「完成」</div>' : '')
    + list.map((work, i) => {
      const badge = badgeMap[work.type];
      const isVideo = work.type === 'video';
      const isGame = work.type === 'game';
      const isBili = work.type === 'bilibili';
      return `
        <div class="gallery-item" draggable="${sortMode}" data-type="${work.type}" data-src="${work.src}" data-index="${i}"
             ${sortMode ? '' : `onclick="openLightbox('${work.src.replace(/'/g, "\\'")}', '${work.type}')"`}>
          ${sortMode ? '<button class="delete-btn" title="从草稿中删除此作品">&times;</button>' : ''}
          ${sortMode ? '<div class="drag-handle">⠿</div>' : ''}
          ${isBili
            ? renderBiliCover(work)
            : isGame
            ? renderGameCover(work)
            : isVideo
            ? `<video src="${work.src}" muted loop preload="metadata"></video>`
            : `<img src="${work.src}" alt="${work.title}" loading="lazy">`
          }
          <div class="badge">${badge}</div>
          <div class="overlay"><span>查看</span></div>
        </div>`;
    }).join('');

  gallery.querySelectorAll('video').forEach(video => {
    video.parentElement.addEventListener('mouseenter', () => { video.play().catch(() => {}); });
    video.parentElement.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
  });

  gallery.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      deleteFromDraft(btn.parentElement.dataset.src);
    });
  });

  if (sortMode) setupDrag(gallery);

  updateRestoreBtn();
  updateEditorStatus();
}

function renderBiliCover(work) {
  return `
    <div class="bili-cover">
      <div class="play-icon"></div>
      <span>${work.title}</span>
    </div>`;
}

function renderGameCover(work) {
  if (work.thumbnail) {
    return `<img src="${work.thumbnail}" alt="${work.title}" loading="lazy">`;
  }
  return `
    <div class="game-cover">
      <span>${work.title}</span>
    </div>`;
}

function deleteFromDraft(src) {
  const biliIndex = draftSettings.bilibili.findIndex(work => work.src === src);
  if (biliIndex !== -1) {
    draftSettings.bilibili.splice(biliIndex, 1);
  } else {
    const hidden = new Set(draftSettings.hidden);
    hidden.add(src);
    draftSettings.hidden = [...hidden];
  }

  draftSettings.order = draftSettings.order.filter(item => item !== src);
  saveDraftSettings();
  renderGallery('all');
}

// ========== 拖拽排序 ==========
function setupDrag(gallery) {
  let dragSrc = null;

  gallery.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('dragstart', event => {
      dragSrc = item.dataset.src;
      item.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', dragSrc);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      gallery.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (item.dataset.src !== dragSrc) item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', event => {
      event.preventDefault();
      item.classList.remove('drag-over');

      const targetSrc = item.dataset.src;
      if (!dragSrc || dragSrc === targetSrc) return;

      const newOrder = [...gallery.querySelectorAll('.gallery-item')].map(el => el.dataset.src);
      const fromIdx = newOrder.indexOf(dragSrc);
      const toIdx = newOrder.indexOf(targetSrc);
      if (fromIdx === -1 || toIdx === -1) return;

      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, dragSrc);
      saveOrder(newOrder);
      renderGallery('all');
    });
  });
}

// ========== 筛选按钮 ==========
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (sortMode) return;
    closeAddPanel();
    setActiveFilter(btn.dataset.filter);
    renderGallery(btn.dataset.filter);
  });
});

// ========== 灯箱 ==========
function openLightbox(src, type) {
  const lb = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  if (type === 'bilibili') {
    content.innerHTML = `<iframe class="game-frame" src="${src}" title="B站视频" allow="fullscreen; autoplay; encrypted-media"></iframe>`;
  } else if (type === 'video') {
    content.innerHTML = `<video src="${src}" controls autoplay style="max-width:90vw;max-height:85vh;border-radius:8px;"></video>`;
  } else if (type === 'game') {
    content.innerHTML = `<iframe class="game-frame" src="${src}" title="网页游戏" allow="fullscreen; gamepad; autoplay"></iframe>`;
  } else {
    content.innerHTML = `<img src="${src}" alt="">`;
  }
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('lightbox-content').innerHTML = '';
}

document.getElementById('lightbox').addEventListener('click', function(event) {
  if (event.target === this) closeLightbox();
});
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') closeLightbox();
});

// ========== 编辑工具 ==========
function updateRestoreBtn() {
  if (!editMode) return;

  const hidden = new Set(draftSettings.hidden);
  let btn = document.getElementById('restoreHidden');
  if (hidden.size > 0) {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'restoreHidden';
      btn.className = 'sort-toggle';
      btn.textContent = '恢复删除 (' + hidden.size + ')';
      btn.title = '恢复草稿中被删除的作品';
      btn.addEventListener('click', () => {
        saveHidden(new Set());
        renderGallery(getActiveFilter());
      });
      sortToggle.after(btn);
    } else {
      btn.textContent = '恢复删除 (' + hidden.size + ')';
    }
  } else if (btn) {
    btn.remove();
  }
}

function getPublishSettings() {
  return normalizeSettings({
    order: completeOrder(draftSettings.order),
    hidden: draftSettings.hidden,
    bilibili: draftSettings.bilibili
  });
}

function getSettingsCode(settings) {
  return 'window.portfolioSettings = ' + JSON.stringify(settings, null, 2) + ';\n';
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    return true;
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function showExportPanel(text) {
  let panel = document.getElementById('exportPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'exportPanel';
    panel.className = 'export-panel';
    panel.innerHTML = `
      <p>当前页面不是本地编辑服务，不能直接写入文件。把下面内容放进 media/settings.js 后再发布。</p>
      <textarea id="exportSettingsText" readonly></textarea>`;
    addPanel.after(panel);
  }
  const textarea = document.getElementById('exportSettingsText');
  textarea.value = text;
  panel.classList.add('open');
  textarea.focus();
  textarea.select();
}

async function publishDraft(button) {
  const settings = getPublishSettings();
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = '发布中';
  updateEditorStatus('正在写入正式配置...');

  try {
    const response = await fetch('/__portfolio-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    if (!response.ok) throw new Error('publish failed');

    publishedSettings = cloneSettings(settings);
    draftSettings = cloneSettings(settings);
    saveDraftSettings();
    updateEditorStatus('已发布到正式版');
    button.textContent = '已发布';
  } catch {
    const code = getSettingsCode(settings);
    const copied = navigator.clipboard
      ? await navigator.clipboard.writeText(code).then(() => true).catch(() => fallbackCopy(code))
      : fallbackCopy(code);
    showExportPanel(code);
    updateEditorStatus(copied ? '没有连接本地编辑服务，已复制正式配置' : '没有连接本地编辑服务，请手动复制配置');
    button.textContent = copied ? '已复制配置' : '手动复制配置';
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.textContent = oldText;
      updateEditorStatus();
    }, 1800);
  }
}

function resetDraftFromPublished() {
  draftSettings = cloneSettings(publishedSettings);
  saveDraftSettings();
  sortMode = false;
  sortToggle.classList.remove('active');
  sortToggle.textContent = '排序';
  setActiveFilter('all');
  closeAddPanel();
  renderGallery('all');
  updateEditorStatus('草稿已重置为正式版');
}

function updateEditorStatus(message) {
  if (!editMode) return;
  const status = document.getElementById('editorStatus');
  if (!status) return;

  if (message) {
    status.textContent = message;
    return;
  }

  status.textContent = settingsEqual(draftSettings, publishedSettings)
    ? '草稿与正式版一致'
    : '有未发布修改';
}

function setupEditorControls() {
  if (!editMode) return;

  const publishBtn = document.createElement('button');
  publishBtn.id = 'publishDraft';
  publishBtn.className = 'sort-toggle publish-toggle';
  publishBtn.textContent = '发布正式版';
  publishBtn.title = '把当前草稿写入 media/settings.js';
  publishBtn.addEventListener('click', () => publishDraft(publishBtn));
  addBilibiliBtn.after(publishBtn);

  const resetBtn = document.createElement('button');
  resetBtn.id = 'resetDraft';
  resetBtn.className = 'sort-toggle';
  resetBtn.textContent = '重置草稿';
  resetBtn.title = '丢弃本地草稿，恢复到当前正式版';
  resetBtn.addEventListener('click', resetDraftFromPublished);
  publishBtn.after(resetBtn);

  const status = document.createElement('span');
  status.id = 'editorStatus';
  status.className = 'editor-status';
  resetBtn.after(status);
  updateEditorStatus();
}

// ========== 初始渲染 ==========
if (!editMode) {
  sortToggle.style.display = 'none';
  addBilibiliBtn.style.display = 'none';
  addPanel.style.display = 'none';
} else {
  setupEditorControls();
}

renderGallery();
