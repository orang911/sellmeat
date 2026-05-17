// ========================================
// 游戏美术作品集 — 交互逻辑
// ========================================

// ========== 作品数据 ==========
// 把你的作品文件放进 media/images/、media/videos/、media/gifs/、media/games/ 文件夹
// 然后在这里添加对应的条目
const works = [
  // === 视频 ===
  // { src: "media/videos/demo.mp4", type: "video", title: "3D技能特效演示" },
  // { src: "media/videos/ui.mp4", type: "video", title: "UI动效合集" },

  // === GIF ===
  // { src: "media/gifs/skill.gif", type: "gif", title: "角色连招动效" },
  // { src: "media/gifs/particle.gif", type: "gif", title: "粒子特效" },

  // === 图片 ===
  // { src: "media/images/render01.png", type: "image", title: "3D场景渲染" },
  // { src: "media/images/char01.png", type: "image", title: "角色设计" },

  // === 网页游戏 ===
  // {
  //   src: "media/games/demo/index.html",
  //   type: "game",
  //   title: "网页小游戏 Demo",
  //   thumbnail: "media/images/game-demo-cover.jpg"
  // },
];

// ========== 类型映射 ==========
const badgeMap = { video: '视频', image: '静帧', gif: 'GIF动效', game: '网页游戏' };

// ========== 渲染作品 ==========
function renderGallery(filter = 'all') {
  const gallery = document.getElementById('gallery');
  const filtered = filter === 'all' ? works : works.filter(w => w.type === filter);

  if (filtered.length === 0) {
    gallery.innerHTML = `
      <div class="gallery-empty">
        <p style="font-size:48px;">🎬</p>
        <p>暂无作品展示</p>
        <p style="font-size:13px;margin-top:8px;">把你的图片/GIF/视频/网页游戏放进 media 文件夹<br>然后在 script.js 里添加作品条目即可</p>
      </div>`;
    return;
  }

  gallery.innerHTML = filtered.map((w, i) => {
    const badge = badgeMap[w.type];
    const isVideo = w.type === 'video';
    const isGame = w.type === 'game';
    return `
      <div class="gallery-item" data-type="${w.type}" data-index="${i}" onclick="openLightbox('${w.src}', '${w.type}')">
        ${isGame
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

// ========== 筛选按钮 ==========
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGallery(btn.dataset.filter);
  });
});

// ========== 灯箱 ==========
function openLightbox(src, type) {
  const lb = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  if (type === 'video') {
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

// ========== 初始渲染 ==========
renderGallery();
