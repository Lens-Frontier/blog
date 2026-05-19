# Lens Frontier Blog

一个简洁克制的 paper / benchmark / opinion blog，用来沉淀大家平时阅读分享的论文，并输出一些围绕 benchmark 的浅薄观点。

## 本地开发

```sh
pnpm install
pnpm dev
```

## 投稿

默认通过 Pull Request 投稿。完整规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)，文章模板在 [templates](./templates)。

PR 会自动运行 CI，覆盖 Markdown、内容规范、资产、图片建议、Astro 类型、生产构建和构建产物检查。CI 成功后，机器人会在 PR comment 里输出带 commit hash 的预览链接。

如果使用 Codex 或 Claude Code 辅助投稿，可以让它读取仓库内的 `.agents/skills/lens-frontier-post` skill，按统一流程创建文章、检查内容和资产、运行 CI 前校验并准备 PR。

## 内容目录

```txt
src/content/papers       # 论文阅读分享
src/content/benchmarks   # benchmark 观察
src/content/opinions     # 围绕 benchmark 的观点文章
```

每篇文章使用 Markdown frontmatter 管理元数据。字段 schema 在 `src/content.config.ts`。

常写作者可以登记在 `src/data/authors.ts`，文章里用 `authors: [{ id: "author-id" }]` 复用作者资料；一次性投稿也可以继续在文章 frontmatter 里直接写 `name` / `github`。

仓库使用 `.github/CODEOWNERS` 自动请求 `@Lens-Frontier/blog-maintainers` review 文章、站点、CI 和发布流程改动。

站点导航里，`Timeline` 会按时间汇总全部内容，`Tags` 用来按主题索引，`RSS` 输出订阅源。

## 部署到 GitHub Pages

项目已经包含 `.github/workflows/deploy.yml`。推到 GitHub 后，在仓库设置里把 Pages source 设为 `Deploy from a branch`，分支选择 `gh-pages` / root。

如果仓库名不是 `<username>.github.io`，配置会在 GitHub Actions 中自动把 `base` 设置为 `/<repo-name>`。

自定义域名时：

1. 在 `public/CNAME` 写入域名。
2. 在 GitHub Actions workflow 里把 `SITE_URL` 改成你的域名。

## 命令

```sh
pnpm dev              # 本地开发
pnpm check            # Markdown + 内容规范 + 资产 + 类型 + 构建产物检查
pnpm check:markdown   # Markdown 格式检查
pnpm check:content    # 文章结构、tag、图片引用检查
pnpm check:types      # Astro 类型和模板检查
pnpm check:dist       # 构建后页面元信息和内部链接检查
pnpm images:check     # 图片大小、宽度、格式提示
pnpm images:optimize  # 压缩文章图片并生成 WebP
pnpm build            # 生产构建
pnpm preview          # 预览 dist
```
