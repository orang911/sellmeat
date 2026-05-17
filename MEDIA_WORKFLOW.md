# 媒体命名和压缩流程

## 公开目录

公开目录只放已经能上站的成品：

```text
media/images/   静帧图，命名为 shot-001.jpg/png/webp
media/gifs/     小体积 GIF，命名为 anim-001.gif
media/videos/   MP4/WebM 视频，命名为 clip-001.mp4
media/games/    网页游戏，每个游戏一个文件夹，例如 game-001/index.html
```

原始大文件放到本地目录：

```text
media/source/
```

`media/source/` 不提交、不部署，用来保存待压缩素材。

## 大小规则

- 单个公开文件控制在 24 MiB 以内，避免触发 Cloudflare Workers 静态资源限制。
- GIF 超过 5 MiB 时，优先转成 MP4 放到 `media/videos/`。
- MP4 建议宽度不超过 1280，短动效可以去掉声音。
- 图片建议转成 WebP 或压缩后的 JPG/PNG。

## 常用命令

压缩 `media/source/` 里的素材：

```powershell
.\tools\compress-media.ps1 -InputDir media\source
```

重新生成网页作品列表：

```powershell
.\tools\rebuild-works.ps1
```

提交发布：

```powershell
git add -A
git commit -m "Update portfolio media"
git push origin main
```

Cloudflare 会从 GitHub 自动重新部署。
