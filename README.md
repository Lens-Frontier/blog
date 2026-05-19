# Lens Frontier Blog

一个简洁克制的 research / opinion blog，用来记录论文阅读、技术观点、评测观察和自己的判断。

## 本地开发

```sh
pnpm install
pnpm dev
```

## 投稿

默认通过 Pull Request 投稿。完整规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)，文章模板在 [templates](./templates)。

PR 会自动运行 CI，检查资产大小和生产构建是否通过。CI 成功后，机器人会在 PR comment 里输出带 commit hash 的预览链接。

## 内容目录

```txt
src/content/papers       # 论文阅读笔记
src/content/benchmarks   # benchmark 档案
src/content/opinions     # 观点文章
```

每篇文章使用 Markdown frontmatter 管理元数据。字段 schema 在 `src/content.config.ts`。

## 部署到 GitHub Pages

项目已经包含 `.github/workflows/deploy.yml`。推到 GitHub 后，在仓库设置里把 Pages source 设为 `GitHub Actions`。

如果仓库名不是 `<username>.github.io`，配置会在 GitHub Actions 中自动把 `base` 设置为 `/<repo-name>`。

自定义域名时：

1. 在 `public/CNAME` 写入域名。
2. 在 GitHub Actions workflow 里把 `SITE_URL` 改成你的域名。

## 命令

```sh
pnpm dev      # 本地开发
pnpm check    # 资产检查 + 生产构建
pnpm build    # 生产构建
pnpm preview  # 预览 dist
```
