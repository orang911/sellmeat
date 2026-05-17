// ========================================
// 游戏美术作品集 — 交互逻辑
// ========================================

// ========== 作品数据 ==========
const works = Array.isArray(window.portfolioWorks) ? window.portfolioWorks : [];

// ========== 编辑模式（?edit） ==========
const editMode = (() => {
  const params = new URLSearchParams(window.location.search);
  return params.has('edit');
})();

// ========== 本地存储 ==========
const SORT_KEY = 'portfolio-work-order';
const HIDE_KEY = 'portfolio-hidden';
const BILI_KEY = 'portfolio-bilibili';

function loadOrder() {
  try { const raw = localStorage.getItem(SORT_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function saveOrder(order) { localStorage.setItem(SORT_KEY, JSON.stringify(order)); }

function loadHidden() {
  try { const raw = localStorage.getItem(HIDE_KEY); return raw ? new Set(JSON.parse(raw)) : new Set(); }
  catch { return new Set(); }
}
function saveHidden(set) { localStorage.setItem(HIDE_KEY, JSON.stringify([...set])); }

function loadBilibili() {
  try { const raw = localStorage.getItem(BILI_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function saveBilibili(list) { localStorage.setItem(BILI_KEY, JSON.stringify(list)); }

function getVisible(list) {
  const hidden = loadHidden();
  return list.filter(w => !hidden.has(w.src));
}

function applyOrder(list) {
  const saved = loadOrder();
  if (!saved || !saved.length) return list;
  const orderMap = new Map(saved.map((src, i) => [src, i]));
  const sorted = [...list].sort((a, b) => {
    const ai = orderMap.has(a.src) ? orderMap.get(a.src) : Infinity;
    const bi = orderMap.has(b.src) ? orderMap.get(b.src) : Infinity;
    return ai - bi;
  });
  return sorted;
}

// ========== 合并B站视频 ==========
function getFullList(filter) {
  let list = filter === 'all' ? [...works] : works.filter(w => w.type === filter);
  if (filter === 'all' || filter === 'bilibili') {
    list = list.concat(loadBilibili());
  }
  return list;
}

// ========== 类型映射 ==========
const badgeMap = { video: '视频', image: '静帧', gif: 'GIF动效', game: '网页游戏', bilibili: 'B站视频' };

// ========== 排序模式 ==========
let sortMode = false;
const sortToggle = document.getElementById('sortToggle');

sortToggle.addEventListener('click', () => {
  if (!editMode) return;
  sortMode = !sortMode;
  sortToggle.classList.toggle('active', sortMode);
  sortToggle.textContent = sortMode ? '完成' : '排序';
  if (sortMode) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    closeAddPanel();
  }
  renderGallery(sortMode ? 'all' : getActiveFilter());
});

function getActiveFilter() {
  const btn = document.querySelector('.filter-btn.active');
  return btn ? btn.dataset.filter : 'all';
}

// ========== B站链接添加面板 ==========
const addPanel = document.getElementById('addPanel');
const addBilibiliBtn = document.getElementById('addBilibiliBtn');
const biliUrl = document.getElementById('biliUrl');
const biliTitle = document.getElementById('biliTitle');
const biliAdd = document.getElementById('biliAdd');
const addMsg = document.getElementById('addMsg');

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
  // 支持 bilibili.com/video/BV... 和 bilibili.com/video/av...
  const bv = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bv) return { kind: 'bvid', id: bv[1] };
  const av = url.match(/bilibili\.com\/video\/[aA][vV](\d+)/);
  if (av) return { kind: 'aid', id: av[1] };
  // 短链 b23.tv 暂不支持
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

  const list = loadBilibili();
  // 去重
  if (list.some(w => w.src === src)) { showMsg('该视频已添加过了', true); return; }
  list.push({ src, type: 'bilibili', title: title || autoTitle, bvid: parsed.kind === 'bvid' ? parsed.id : undefined });
  saveBilibili(list);
  showMsg('已添加');
  biliUrl.value = '';
  biliTitle.value = '';
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
    return;
  }

  gallery.innerHTML = (sortMode ? '<div class="sort-hint">拖拽排序 · 点 × 隐藏 · 完成后点「完成」</div>' : '')
    + list.map((w, i) => {
    const badge = badgeMap[w.type];
    const isVideo = w.type === 'video';
    const isGame = w.type === 'game';
    const isBili = w.type === 'bilibili';
    return `
      <div class="gallery-item" draggable="${sortMode}" data-type="${w.type}" data-src="${w.src}" data-index="${i}"
           ${sortMode ? '' : `onclick="openLightbox('${w.src.replace(/'/g, "\\'")}', '${w.type}')"`}>
        ${sortMode ? '<button class="delete-btn" title="隐藏此作品">&times;</button>' : ''}
        ${sortMode ? '<div class="drag-handle">⠿</div>' : ''}
        ${isBili
          ? renderBiliCover(w)
          : isGame
          ? renderGameCover(w)
          : isVideo
          ? `<video src="${w.src}" muted loop preload="metadata"></video>`
          : `<img src="${w.src}" alt="${w.title}" loading="lazy">`
        }
        <div class="badge">${badge}</div>
        <div class="overlay"><span>查看</span></div>
      </div>`;
  }).join('');

  // 鼠标悬停时预览视频/GIF
  gallery.querySelectorAll('video').forEach(v => {
    v.parentElement.addEventListener('mouseenter', () => { v.play().catch(() => {}); });
    v.parentElement.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
  });

  // 删除按钮
  gallery.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const src = btn.parentElement.dataset.src;

      // 如果是B站视频，从 bilibili 列表移除
      const biliList = loadBilibili();
      const idx = biliList.findIndex(w => w.src === src);
      if (idx !== -1) {
        biliList.splice(idx, 1);
        saveBilibili(biliList);
      } else {
        const hidden = loadHidden();
        hidden.add(src);
        saveHidden(hidden);
      }

      // 同时从排序中移除
      const order = loadOrder();
      if (order) {
        saveOrder(order.filter(s => s !== src));
      }
      renderGallery('all');
    });
  });

  // 拖拽事件
  if (sortMode) setupDrag(gallery, list);

  updateRestoreBtn();
}

function renderBiliCover(w) {
  return `
    <div class="bili-cover">
      <div class="play-icon"></div>
      <span>${w.title}</span>
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

// ========== 拖拽排序 ==========
function setupDrag(gallery, list) {
  let dragSrc = null;

  gallery.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item.dataset.src;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragSrc);
    });

    item.addEventListener('dragend', e => {
      item.classList.remove('dragging');
      gallery.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (item.dataset.src !== dragSrc) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const targetSrc = item.dataset.src;
      if (dragSrc && dragSrc !== targetSrc) {
        const order = gallery.querySelectorAll('.gallery-item');
        const newOrder = [];
        order.forEach(el => newOrder.push(el.dataset.src));
        const fromIdx = newOrder.indexOf(dragSrc);
        const toIdx = newOrder.indexOf(targetSrc);
        if (fromIdx !== -1 && toIdx !== -1) {
          newOrder.splice(fromIdx, 1);
          newOrder.splice(toIdx, 0, dragSrc);
        }
        saveOrder(newOrder);
        renderGallery(getActiveFilter());
      }
    });
  });
}

// ========== 筛选按钮 ==========
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (sortMode) return;
    closeAddPanel();
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
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

document.getElementById('lightbox').addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
});

// ========== 恢复隐藏 ==========
function updateRestoreBtn() {
  if (!editMode) return;
  const hidden = loadHidden();
  let btn = document.getElementById('restoreHidden');
  if (hidden.size > 0) {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'restoreHidden';
      btn.className = 'sort-toggle';
      btn.textContent = '恢复全部 (' + hidden.size + ')';
      btn.title = '恢复所有已隐藏的作品';
      btn.addEventListener('click', () => {
        localStorage.removeItem(HIDE_KEY);
        renderGallery(getActiveFilter());
      });
      sortToggle.after(btn);
    } else {
      btn.textContent = '恢复全部 (' + hidden.size + ')';
    }
  } else if (btn) {
    btn.remove();
  }
}

// ========== 初始渲染 ==========
if (!editMode) {
  sortToggle.style.display = 'none';
  addBilibiliBtn.style.display = 'none';
  addPanel.style.display = 'none';
}
renderGallery();
