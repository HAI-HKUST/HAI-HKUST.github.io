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

## 维护推荐资源

资源保留在 `links.html`，中英文名称和简介在 `js/i18n.js`。继续使用静态卡片；新增资源时复制同类卡片，并添加对应的中英文翻译键，不需要修改渲染脚本。

按主要用途归类，同一资源只收录一次：

| 分类 | 收录范围 | 页面锚点 |
| --- | --- | --- |
| 学生必备 | 与本校学生具体学习、考试和办事需求直接相关的工具与入口，例如 ELPA 备考；不代表官方推荐或人人必用 | `links.html#student-essentials` |
| 学术与科研 | 论文阅读、会议投稿、研究检索等科研工具 | `links.html#academic-research` |
| 经验指南 | 学习、科研与校园生活的经验总结、手册和长篇指南 | `links.html#experience-guides` |

新增资源时：

1. 按主要用途放入现有分类，优先使用可直接使用的网站地址，核对站点名称、适用人群及功能描述。
2. 添加不重复的翻译键；新键使用可读名称，例如 `elpaTitle`、`elpaDesc`，已有键无需为了改名而迁移。
3. 外部链接使用 `target="_blank" rel="noopener noreferrer"`，保留域名和简短简介；准确注明非官方资源的性质。卡片统一使用文字，不添加装饰图标或单独维护各站 Logo。
4. 检查中英文、桌面和手机显示，以及链接能否访问。变更静态资源时更新对应缓存版本参数。

不为单个新资源增设分类。只有出现现有分类无法覆盖的明确用途时再讨论新增分类，并同步更新 Banner 的分类跳转入口；资源维护时同步检查失效链接与过时说明。

资源区标题下的「通过 GitHub 推荐资源」链接打开本仓库的 GitHub 新建 Issue 页面，预填资源名称、链接、适用人群、使用心得及付费/注册要求；用户仍需登录并自行提交。维护者核对推荐后按上述规则收录，不自动发布。若仓库地址或 Issues 设置改变，同步更新此入口。

## 本地预览

请在网站目录下启动本地静态服务器，不要直接用 `file://`，也不要用 `https://`（`http.server` 只支持 HTTP）：

```bash
cd homepage/HAI-HKUST.github.io
python3 -m http.server 8080
```

浏览器打开 **http://127.0.0.1:8080/**（必须是 `http`，不能是 `https`）。
