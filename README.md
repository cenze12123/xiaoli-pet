# 小栗 · 陪你一会儿

一个可以直接部署到 GitHub Pages 的互动宠物网页，无需服务器、账号系统或构建步骤。

## 互动

- 移动鼠标：16 个方向的视线跟随。
- 单击小栗：挥手；双击：跳跃。
- 拖动小栗：在小屋内移动；触屏也可使用。
- 开启「自己走走」：自动散步。
- 六个动作按钮：挥手、跳跃、思考、等待、查看、失落。
- 支持身影大小调整、昼夜切换、动画暂停。
- 键盘：Tab 聚焦小栗，Enter 挥手，空格跳跃，方向键移动。
- 系统开启减少动态效果时默认暂停，可手动继续。

## GitHub Pages

将本目录内容上传到 GitHub 仓库的 `main` 分支，然后打开：

**Settings → Pages → Deploy from a branch → main → /(root) → Save**

项目页面地址通常为 `https://<用户名>.github.io/<仓库名>/`。全部素材引用采用相对路径，兼容项目子路径。

## 本地运行和检查

从本目录运行任意静态 HTTP 服务，例如 `python -m http.server 8000`，打开 `http://localhost:8000`。不要直接双击 HTML，以免浏览器阻止 ES 模块。

无需安装 npm 包。若有 Node.js，可运行：

```sh
node --check app.js
node --test tests/engine.test.js
```

## 素材

`assets/xiaoli.png` 是透明的 1536×2288 精灵图。每格 192×208，前九行是九组动作，最后两行是顺时针 16 个视线方向。网页只包含制作好的精灵图，不包含原始参考照片。
