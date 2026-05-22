# Lens Frontier Blog

一个简洁克制的 paper / benchmark / opinion blog，用来沉淀大家平时阅读分享的论文，并输出一些围绕 benchmark 的浅薄观点。

## 本地开发

```sh
pnpm install
pnpm dev
```

## 投稿

默认通过 Pull Request 投稿。完整规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)，文章模板在 [templates](./templates)。

PR 会自动运行 CI，分成 `syntax` 和 `check` 两个 job：`syntax` 覆盖 workflow / Astro / TypeScript / Worker 语法，`check` 覆盖 Markdown、内容规范、资产硬限制、图片建议提示、analytics smoke、生产构建和构建产物检查。CI 成功后，机器人会在 PR comment 里输出带 commit hash 的预览链接。

如果使用 Codex 或 Claude Code 辅助投稿，可以让它读取仓库内的 `.agents/skills/lens-frontier-post` skill，按统一流程创建文章、检查内容和资产、运行 CI 前校验并准备 PR。

## 内容目录

```txt
src/content/papers       # 论文阅读分享
src/content/benchmarks   # benchmark 观察
src/content/opinions     # 围绕 benchmark 的观点文章
```

每篇文章使用 Markdown frontmatter 管理元数据。字段 schema 在 `src/content.config.ts`。站点支持 `/zh/` 和 `/en/` 两套语言路由，文章通过 `lang: "zh"` 或 `lang: "en"` 决定展示在哪个语言下；允许单语发布，不要求同步翻译。后续补译文时，两篇文章可以使用同一个 `translationKey`，中英切换会优先留在同一篇文章。

常写作者可以登记在 `src/data/authors.ts`，文章里用 `authors: [{ id: "author-id" }]` 复用作者资料；一次性投稿也可以继续在文章 frontmatter 里直接写 `name` / `github`。

仓库使用 `.github/CODEOWNERS` 自动请求 `@Lens-Frontier/blog-maintainers` review 文章、站点、CI 和发布流程改动。

顶部导航保留主要阅读入口：`Papers`、`Benchmarks`、`Opinions` 和 `Tags`。`Timeline`、`About` 和 `RSS` 放在页脚，避免顶部导航过重。

## 部署到 GitHub Pages

项目已经包含 `.github/workflows/deploy.yml`。推到 GitHub 后，在仓库设置里把 Pages source 设为 `Deploy from a branch`，分支选择 `gh-pages` / root。

如果仓库名不是 `<username>.github.io`，配置会在 GitHub Actions 中自动把 `base` 设置为 `/<repo-name>`。

自定义域名时：

1. 在 `public/CNAME` 写入域名。
2. 在 GitHub Actions workflow 里把 `SITE_URL` 改成你的域名。

## 阅读量统计

文章页支持 first-party 稳定阅读量展示。默认不启用；生产环境配置后，文章标题下方会显示阅读量。

如需开启，先部署 `workers/pageviews` 里的 Cloudflare Worker + D1，再在生产构建中配置：

```txt
PUBLIC_PAGEVIEW_ENDPOINT=https://<worker-domain>/pageview
PUBLIC_PAGEVIEW_COUNT_ENDPOINT=https://<worker-domain>/views
PUBLIC_PAGEVIEW_SITE_ID=lens-frontier
```

不要在 PR preview 配置这些变量，避免预览流量进入正式阅读量。`PUBLIC_PAGEVIEW_COUNT_ENDPOINT` 可省略，站点会从 `/pageview` 自动推导 `/views`。

## Google Analytics

站点通过 GA4 的 Google tag 接入站点统计。当前生产部署 workflow 使用：

```txt
PUBLIC_GA_MEASUREMENT_ID=G-ZK42116ZXB
```

没有配置 Measurement ID 时不会加载 Google Analytics。PR preview 不配置这个变量，避免预览流量进入正式统计。站点只保留这一处 Google tag，不再同时接入 Google Tag Manager，避免重复 pageview。

## 命令

```sh
pnpm dev              # 本地开发
pnpm check            # Markdown + 内容规范 + 敏感信息 + 资产 + 图片建议 + 语法 + analytics smoke + 构建产物检查
pnpm check:markdown   # Markdown 格式检查
pnpm check:content    # 文章结构、tag、图片引用检查
pnpm check:sensitive  # 常见 token、私钥和敏感文件检查
pnpm check:syntax     # Astro/TypeScript 模板 + Worker 语法检查
pnpm check:quality    # 内容、敏感信息、资产、图片建议、analytics smoke、构建和 dist 检查
pnpm check:analytics  # 临时文章验证 GA4、阅读量脚本和关键 Markdown 渲染
pnpm check:types      # Astro 类型和模板检查
pnpm check:worker     # 阅读量 Worker 语法检查
pnpm check:dist       # 构建后页面元信息和站内链接检查
pnpm images:check     # 图片大小、宽度、格式提示
pnpm images:optimize  # 压缩文章图片并生成 WebP
pnpm build            # 生产构建
pnpm preview          # 预览 dist
```

`pnpm check`、`pnpm check:syntax` 和 `pnpm check:quality` 会尽量跑完同组内可独立执行的检查，并在最后汇总失败项；构建失败时，依赖构建产物的 dist 检查会跳过，避免读取旧产物。
