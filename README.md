# 游戏美术作品集静态站

这是一个可以直接发布到 GitHub Pages 的静态作品集网站，支持图片、GIF、MP4 视频和网页游戏。

## 目录

```text
index.html
style.css
script.js
media/
  images/   图片、游戏封面图
  gifs/     GIF 动效
  videos/   MP4 视频
  games/    网页游戏，每个游戏一个子目录
```

## 添加作品

1. 原始素材先放到 `media/source/`。
2. 用 `tools/compress-media.ps1` 压缩到公开目录，或手动放到 `media/images/`、`media/gifs/`、`media/videos/`。
3. 运行 `tools/rebuild-works.ps1` 生成 `media/works.js`。
4. 提交并推送到 GitHub。

如果手动维护 `media/works.js`，条目格式如下。

图片：

```js
{ src: "media/images/render01.png", type: "image", title: "3D场景渲染" }
```

GIF：

```js
{ src: "media/gifs/skill.gif", type: "gif", title: "角色连招动效" }
```

视频：

```js
{ src: "media/videos/demo.mp4", type: "video", title: "3D技能特效演示" }
```

网页游戏：

```js
{
  src: "media/games/demo/index.html",
  type: "game",
  title: "网页小游戏 Demo",
  thumbnail: "media/images/game-demo-cover.jpg"
}
```

网页游戏建议每个游戏一个文件夹，例如：

```text
media/games/demo/
  index.html
  main.js
  style.css
  assets/
```

## 发布到 GitHub Pages

仓库地址是 `https://github.com/orang911/sellmeat.git` 时，项目站点通常会发布到：

```text
https://orang911.github.io/sellmeat/
```

在 GitHub 仓库页面打开：

```text
Settings -> Pages -> Build and deployment
```

选择：

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

保存后，之后每次推送到 `main` 分支都会自动更新网站。

## 媒体体积建议

GitHub Pages 更适合作品集展示，不适合放大量超大视频。建议：

- MP4 单个文件尽量压到几十 MB 以内。
- GIF 如果很大，优先转成 MP4。
- 大型游戏资源可以考虑单独压缩、分包，或改用专门的对象存储/CDN。

当前仓库的详细命名和压缩流程见 `MEDIA_WORKFLOW.md`。
