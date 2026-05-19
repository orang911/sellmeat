# H5 游戏接入规范

本文档记录作品集网站后续添加 H5 小游戏的约定、操作步骤和验证思路。当前网站是静态站，目标是让游戏在发布到 GitHub Pages 或 Cloudflare Pages 后可以直接点击运行。

## 目录约定

所有可运行的网页游戏放在：

```text
media/games/<game-slug>/
```

每个游戏一个独立子目录，目录名使用英文小写、数字和短横线，例如：

```text
media/games/tetris1010/
media/games/zuma-demo/
media/games/coin-pusher/
```

游戏目录里必须包含可直接访问的入口：

```text
media/games/<game-slug>/index.html
```

Cocos Creator 构建产物要复制完整的构建输出目录，不要只复制 `index.html`。通常需要包含：

```text
index.html
main.js
cocos2d-js-min.js
src/
res/
style-mobile.css
style-desktop.css
logo.png
splash.png
```

## 标准接入步骤

1. 找到游戏的 Web 构建产物。

   Cocos Creator 项目一般在：

   ```text
   <game-project>/build/<game-name>/
   ```

   这次 `game_tetris1010` 的来源是：

   ```text
   D:\卖肉\h5games\game_tetris1010\build\game_tetris1010\
   ```

2. 复制到网站公开目录。

   示例：

   ```powershell
   $target = "D:\卖肉\sellmeat\media\games\tetris1010"
   New-Item -ItemType Directory -Force -Path $target | Out-Null
   Copy-Item -Path "D:\卖肉\h5games\game_tetris1010\build\game_tetris1010\*" -Destination $target -Recurse -Force
   ```

3. 在 `media/works.js` 顶部或合适位置添加作品项。

   ```js
   {
     src: 'media/games/tetris1010/index.html',
     type: 'game',
     title: '1010 方块小游戏',
     thumbnail: 'media/games/tetris1010/splash.png'
   },
   ```

4. 在 `media/settings.js` 的 `order` 里加入游戏入口路径。

   如果希望游戏显示在作品区第一位，把路径放在数组开头：

   ```js
   order: ["media/games/tetris1010/index.html", ...]
   ```

5. 更新 `index.html` 的静态资源版本号，避免浏览器缓存旧的 `works.js`、`settings.js`、`script.js` 或 `style.css`。

   示例：

   ```html
   <link rel="stylesheet" href="style.css?v=20260518-game1">
   <script src="media/works.js?v=20260518-game1"></script>
   <script src="media/settings.js?v=20260518-game1"></script>
   <script src="script.js?v=20260518-game1"></script>
   ```

## 入口交互规范

游戏作品项使用 `type: 'game'`。

当前约定是：游戏卡片渲染为原生链接 `<a>`，点击后在新标签页打开独立游戏页面，而不是嵌入灯箱 iframe。

原因：

- Cocos、Unity WebGL 等游戏对 canvas、音频、焦点、全屏和触摸事件更敏感，独立页面比 iframe 稳定。
- 出问题时可以直接访问游戏 URL 排查资源加载。
- 手机上新页面运行比在小尺寸灯箱里运行更接近真实体验。

普通图片、GIF、视频仍保留灯箱预览。

## 本地运行规范

不要用 `file:///D:/.../index.html` 直接打开网站或游戏。H5 游戏通常需要通过 HTTP 加载脚本、JSON、纹理、音频等资源。

启动本地服务：

```powershell
cd D:\卖肉\sellmeat
.\tools\start-editor.ps1
```

普通查看地址：

```text
http://127.0.0.1:8765/index.html#works
```

编辑模式地址：

```text
http://127.0.0.1:8765/index.html?edit
```

游戏直达地址：

```text
http://127.0.0.1:8765/media/games/<game-slug>/index.html
```

## 验证清单

每次添加新游戏后至少检查：

1. `media/games/<game-slug>/index.html` HTTP 状态是 `200`。
2. 游戏目录下核心资源可以访问，例如 `main.js`、`src/settings.js`、`res/...`。
3. 首页作品区出现“网页游戏”卡片。
4. 游戏卡片是链接，`href` 指向 `media/games/<game-slug>/index.html`。
5. 点击卡片后新标签页能打开游戏。
6. 游戏能从加载页进入实际场景。
7. 浏览器控制台没有影响运行的 `404`、`Uncaught`、`TypeError`、`ReferenceError`。

可用 PowerShell 做基础 HTTP 检查：

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8765/media/games/tetris1010/index.html" -UseBasicParsing
Invoke-WebRequest -Uri "http://127.0.0.1:8765/media/games/tetris1010/src/settings.js" -UseBasicParsing
```

可用 Chrome headless 做快速加载检查：

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless=new `
  --disable-gpu `
  --no-first-run `
  --disable-background-networking `
  --enable-logging=stderr `
  --v=0 `
  --virtual-time-budget=30000 `
  --dump-dom `
  "http://127.0.0.1:8765/media/games/tetris1010/index.html" 2>&1 |
  Select-String -Pattern "Error|Failed|404|Uncaught|TypeError|ReferenceError|Success|Scene"
```

Cocos Creator 正常加载时，通常能看到类似：

```text
Success to load scene: db://assets/loadingScene.fire
```

如果进一步确认已进入正式场景，可以用 Chrome DevTools Protocol 读取 `cc.director.getScene().name`。这次 `tetris1010` 验证结果是 `Scene`。

## 常见问题

### 点了游戏打不开

先直接访问：

```text
http://127.0.0.1:8765/media/games/<game-slug>/index.html
```

如果直达能打开，问题通常在作品卡片渲染或缓存。检查 `media/works.js`、`media/settings.js` 和 `index.html` 的版本号。

### 直达游戏也打不开

检查是否复制了完整构建目录，尤其是 `src/`、`res/`、引擎 JS 和样式文件。

用 HTTP 检查资源是否 `404`：

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8765/media/games/<game-slug>/main.js" -UseBasicParsing
Invoke-WebRequest -Uri "http://127.0.0.1:8765/media/games/<game-slug>/src/settings.js" -UseBasicParsing
```

### 游戏停在加载页

优先看浏览器控制台和网络请求。常见原因：

- 某个 `res/import` 或 `res/raw-assets` 文件缺失。
- 游戏依赖的构建目录没有完整复制。
- `settings.js` 中的资源路径和实际目录不匹配。
- 通过 `file://` 打开导致跨域或资源加载失败。

### 有音频警告

Chrome 可能提示：

```text
The AudioContext was not allowed to start.
```

这通常是浏览器自动播放策略导致，用户点击页面后音频会恢复，不一定影响游戏运行。

### favicon 404

`favicon.ico` 404 不影响游戏运行。需要消除时，可以在站点根目录补一个 favicon。

## 发布前检查

提交前确认：

```powershell
git status --short
```

应该包含：

- `media/games/<game-slug>/` 新游戏目录
- `media/works.js`
- `media/settings.js`
- 必要时包含 `index.html`、`script.js`、`style.css`

如果游戏文件较大，先检查总大小：

```powershell
Get-ChildItem -Recurse -File media\games\<game-slug> |
  Measure-Object -Property Length -Sum
```

GitHub Pages 更适合中小型静态游戏。超大 WebGL 包或大量音视频资源，后续可以考虑 CDN 或对象存储。
