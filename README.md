# HKUST(GZ) Frontier AI Club Website

香港科技大学前沿人工智能社团 / HKUST(GZ) Frontier AI Club 双语静态网站。

## 推荐部署：GitHub Actions

1. 新建一个 GitHub 仓库。
2. 将本目录中的**所有文件与隐藏目录**上传到仓库根目录，尤其包括：
   - `index.html`
   - `styles.css`
   - `site.js`
   - `.nojekyll`
   - `.github/workflows/pages.yml`
3. 确保默认分支名为 `main`，然后推送代码。
4. 打开仓库 `Settings → Pages`。
5. 在 `Build and deployment → Source` 中选择 `GitHub Actions`。
6. 打开 `Actions`，等待 `Deploy static site to GitHub Pages` 完成。

## 不使用 Actions 的部署方式

1. 将所有网站文件放在仓库根目录，确保 `index.html` 位于根目录。
2. 打开 `Settings → Pages`。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，Folder 选择 `/(root)`，保存。

## 注意

- 不要把 ZIP 文件本身上传后期待 GitHub 自动解压。
- 不要让目录结构变成 `仓库根目录/hkustgz-frontier-ai-club/index.html`，除非 Pages 发布目录正好指向该目录；GitHub Pages 的分支发布界面仅支持根目录或 `/docs`。
- 项目站点地址通常是 `https://<用户名>.github.io/<仓库名>/`。
- 若希望地址为 `https://<用户名>.github.io/`，仓库必须命名为 `<用户名>.github.io`。
