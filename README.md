# HKUST(GZ) Frontier AI Club Website

香港科技大学前沿人工智能社团 / HKUST(GZ) Frontier AI Club 双语静态网站。

## 推荐部署：GitHub Actions

1. 将本目录中的网站文件推送到仓库根目录（默认分支 `main`）。
2. 打开仓库 `Settings → Pages`。
3. 在 `Build and deployment → Source` 中选择 `GitHub Actions`。
4. 打开 `Actions`，等待 `Deploy static content to Pages` 完成。

发布目录只包含公开网页文件，不会上传 `.git` 或工作流配置。

## 更新 Talk 内容

编辑 `js/talks-data.js`：

- `presenter`、`affiliation`、`bio`、`title`、`abstract`、`tags` 均可直接填写
- `video.driveUrl` 可填 Google Drive 分享链接或 file id
- `status` 为 `past` 时出现在往期分享，为 `upcoming` 时出现在近期活动

Talks 页面可切换播放方式：

- **页面窗口**：在当前页打开独立分享页
- **右下角视频**：只保留右下角浮窗

独立页面地址形如 `talk.html?id=affordance-learning`。

Google Drive 视频需设置为「知道链接的任何人可查看」。

## 本地预览

请在网站目录下启动本地静态服务器，不要直接用 `file://`，也不要用 `https://`（`http.server` 只支持 HTTP）：

```bash
cd homepage/HAI-HKUST.github.io
python3 -m http.server 8080
```

浏览器打开 **http://127.0.0.1:8080/**（必须是 `http`，不能是 `https`）。
