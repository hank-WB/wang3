# 钓明白前端公开测试版部署说明

这套前端原型是纯静态页面，所以最适合部署到：

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## 你要改的唯一关键项

部署前先改：

- `config.js`

把里面的：

```js
window.DIAOMINGBAI_API_BASE = "http://127.0.0.1:3000/api/v1";
```

改成你的公网后端地址，比如：

```js
window.DIAOMINGBAI_API_BASE = "https://your-backend.onrender.com/api/v1";
```

## 本地验证公网地址的方法

如果你不想直接改文件，也可以临时这样打开：

```text
http://127.0.0.1:3001/?apiBase=https://your-backend.onrender.com/api/v1
```

或者在浏览器控制台执行：

```js
localStorage.setItem("diaomingbai_api_base", "https://your-backend.onrender.com/api/v1");
location.reload();
```

## 最简单部署方式

把这个目录整体上传到静态托管平台即可：

- `index.html`
- `styles.css`
- `script.js`
- `config.js`

目录位置：

- `outputs/diaomingbai-prototype/`

## 部署完成后的检查

打开线上地址后，看右上角：

- 如果显示 `接口模式：已连接后端`，说明前后端联通
- 如果显示 `接口模式：演示数据`，说明前端没有连上公网后端
