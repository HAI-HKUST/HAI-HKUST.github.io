# HKUST Frontier AI Community Website

香港科技大学前沿人工智能社区 / HKUST Frontier AI Community 双语静态网站。

## 项目结构与验证

- 根目录保留八个 HTML 页面，现有地址、锚点及语言切换保持不变。
- assets/css/、assets/js/、assets/images/、assets/favicon/ 统一管理网页资源。
- 共享导航、页脚继续由单一 ES Module 生成；双语词条及 Talks 保留各自权威数据源。
- scripts/build_site.py 验证完整静态资源并输出 _site/；tests/ 验证重要工程契约。
- 不引入前端框架、npm 构建工具或额外 Python 依赖。

本地检查并生成与线上相同的静态网站：

    python3 -m unittest discover -s tests -p 'test_*.py' -v
    python3 scripts/build_site.py --build

直接启动静态服务器可查看源码；_site/ 为可部署产物。资源统一使用发布时生成的内容指纹版本。
## 推荐部署：GitHub Actions

1. 将本目录中的网站文件推送到仓库根目录（默认分支 `main`）。
2. 打开仓库 `Settings → Pages`。
3. 在 `Build and deployment → Source` 中选择 `GitHub Actions`。
4. 打开 `Actions`，等待 `Deploy static content to Pages` 完成。

GitHub Actions 仅上传 _site/ 中的公开 HTML、assets 和 .nojekyll，不会发布开发脚本、测试、工作流或仓库元数据。

## 更新 Talk 内容

编辑 `assets/js/talks-data.js`：

- `presenter`、`affiliation`、`bio`、`title`、`abstract`、`tags` 均可直接填写
- `video.driveUrl` 可填 Google Drive 分享链接或 file id
- `video.tencentUrl` 可填腾讯会议录制分享链接；请先核对内容，并测试站内播放与外部打开入口
- `cover` 可填本地横版讲座海报路径；没有海报时自动使用统一主题封面。个人照片 `photo` 在详情页的讲者简介旁按原比例显示；没有照片时不留占位。
- `status` 为 `past` 时出现在学术分享页的往期分享，为 `upcoming` 时出现在独立的近期活动页 `events.html`

Talks 卡片的封面和标题进入详情页；点击“回放”在当前页展开播放窗口，也可以通过窗口内的外部链接打开原始录播。“待回放”表示录播链接尚未补充。

独立页面地址形如 `talk.html?id=affordance-learning`。

Google Drive 视频需设置为「知道链接的任何人可查看」。

## 维护推荐资源

资源保留在 `links.html`，中英文名称和简介在 `assets/js/i18n.js`。继续使用静态卡片；新增资源时复制同类卡片，并添加对应的中英文翻译键，不需要修改渲染脚本。

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
4. 检查中英文、桌面和手机显示，以及链接能否访问。静态资源的缓存版本由发布构建统一生成，无须逐个维护。

同一资源有备用站点时，在原卡片底部并列显示主站和备用入口，不重复新增卡片。参考 ELPA 卡片的 `article` 结构和独立链接，避免在链接内嵌套链接；卡片空白处仍进入主站，备用入口单独点击。

不为单个新资源增设分类。只有出现现有分类无法覆盖的明确用途时再讨论新增分类，并同步更新 Banner 的分类跳转入口；资源维护时同步检查失效链接与过时说明。

资源区标题下的「通过 GitHub 推荐资源」链接打开本仓库的 GitHub 新建 Issue 页面，预填资源名称、链接、适用人群、使用心得及付费/注册要求；用户仍需登录并自行提交。维护者核对推荐后按上述规则收录，不自动发布。若仓库地址或 Issues 设置改变，同步更新此入口。

## 维护社区成员与初创成员

成员卡片保存在 `team.html`，头像位于 `assets/images/team/`，页面文案在 `assets/js/i18n.js`。按成员表填写姓名、专业、年级、研究兴趣及已提供的个人主页；没有头像时使用姓名缩写，不虚构职务。新增成员可在列表末尾复制现有 `member-card`。三行随机分配不同成员，初创成员单独随机排序；顺序在加载时确定，不复制成员。下方初创成员为固定历史名单，新增社区成员不加入该名单。初创成员按钮的 `data-member-index` 对应原始成员卡片顺序。

社区成员使用整行可用宽度，保持三行、相邻行方向相反；里程碑每届一行。所有成员均以每秒 36 像素连续匀速滚动，不设置启动等待，也不做重心补偿或变速重排。初创成员循环回到右侧时先向内移动 40 像素，再用 44 像素的距离渐入；初次展示不使用该入场延迟。两处均随机排列，不复制成员。鼠标悬停、键盘聚焦或查看详情时暂停。详情包含研究方向和个人主页，支持 Esc、关闭按钮、点击遮罩关闭与焦点恢复。系统启用减少动态效果时显示静态列表。

当前上方包含 60 个明确标注“待加入成员”的展示占位，使用 `member-placeholder` 类和独立翻译键；替换为真实成员时填写实际资料并移除该类。占位成员不会加入初创名单，也不虚构学历、研究方向或链接。

下方“社区里程碑”使用可折叠的纵向里程碑，初创成员默认展开。新增届别时复制 `milestone` 区块，填写实际届别标题和成员头像，保持相同结构；为新标题设置唯一 id 并同步 `aria-labelledby`。编号与左侧展开箭头统一放在 `summary` 标题行中。通过 `details` 的 `open` 属性控制默认展开状态。成员按钮的 `data-member-index` 对应上方原始成员卡片顺序。不要添加未经确认的年份、职务或纪念式说明。

## 移动端显示规范

手机和平板在 `1050px` 及以下使用共享阅读尺度，集中维护在 `assets/css/site.css` 的 `Shared reading scale` 区块：区块标题 26–32px、卡片标题 20px、正文以 15px 和约 1.75 行高为主、卡片内边距 20px、功能图标 48px，按钮高度至少 44px。辅助标签与域名可使用较小字号，标题和正文不通过整体缩放来缩小。

新增卡片复用现有组件类；有特殊布局时只补充必要差异。检查 320px 手机、768px 平板和桌面宽度的中英文换行，避免固定卡片高度和大块装饰留白。

## 本地预览

请在网站目录下启动本地静态服务器，不要直接用 `file://`，也不要用 `https://`（`http.server` 只支持 HTTP）：

```bash
cd homepage/HAI-HKUST.github.io
python3 -m http.server 8080
```

浏览器打开 **http://127.0.0.1:8080/**（必须是 `http`，不能是 `https`）。
