# Lens Frontier Blog 投稿规范

Lens Frontier Blog 默认通过 Pull Request 投稿。维护者可以为紧急修复直接提交，但论文阅读分享、benchmark 观察和观点文章都建议走 PR，这样方便讨论、预览和留下修改记录。

## 投稿流程

1. Fork 仓库，或在组织仓库中新建分支。
2. 从 `main` 拉新分支，分支名建议使用 `post/<slug>`。
3. 在对应内容目录中新建 Markdown：
   - `src/content/papers/<slug>.md`
   - `src/content/benchmarks/<slug>.md`
   - `src/content/opinions/<slug>.md`
4. 如需文章图片，在 `src/assets/posts/<collection>/<slug>/` 创建同名资源目录。
5. 如需作者头像，放在 `public/assets/authors/`。
6. 本地运行 `pnpm check`，确认构建和资产检查通过。
7. 提交 PR，填写 PR 模板。

每个 PR 都会自动触发 GitHub Actions CI。CI 会运行 `pnpm check`，只有资产检查和生产构建都通过，PR 才适合进入 review/merge。

CI 成功后，机器人会在 PR comment 中写入预览链接。预览地址格式为：

```txt
https://lens-frontier.github.io/blog/pr-preview/pr-<PR 编号>/<commit short hash>/
```

PR 更新时会生成新的 commit 快照链接，并更新同一条 bot comment；PR 关闭后，整个 `pr-<PR 编号>` 预览目录会被自动清理。

## 文件命名

文章文件名就是 URL slug。统一使用小写 kebab-case：

```txt
good: swe-bench-verified.md
bad: SWE_bench Verified.md
```

如果文章文件是：

```txt
src/content/papers/swe-bench-verified.md
```

文章图片目录就是：

```txt
src/assets/posts/papers/swe-bench-verified/
```

## Markdown Frontmatter

所有文章都需要包含 `title`、`date`、`summary`、`authors`、`tags`。`authors` 是本站作者，不是论文原作者。

论文阅读分享示例：

```md
---
title: "SWE-bench Verified"
date: 2026-05-19
summary: "一句话说明这篇分享的重点。"
authors:
  - name: "Your Name"
    github: "your-github-id"
    avatar: "/assets/authors/your-github-id.webp"
paperAuthors: ["Author A", "Author B"]
venue: "ICLR 2026"
paperUrl: "https://arxiv.org/abs/xxxx.xxxxx"
codeUrl: "https://github.com/example/repo"
benchmarks: ["SWE-bench"]
tasks: ["coding-agent"]
tags: ["evaluation", "coding-agent"]
status: "read"
---
```

Benchmark 观察示例：

```md
---
title: "Benchmark Name"
date: 2026-05-19
summary: "说明这个 benchmark 测什么，以及主要风险。"
authors:
  - name: "Your Name"
    github: "your-github-id"
area: "software engineering"
metric: "% resolved"
version: "v1"
risk: "medium"
status: "active"
tags: ["benchmark", "evaluation"]
---
```

观点文章示例：

```md
---
title: "Benchmark 会变老，但不是突然失效"
date: 2026-05-19
summary: "一句话概括观点。"
authors:
  - name: "Your Name"
    github: "your-github-id"
stance: "benchmarks need versioned trust"
tags: ["benchmark-design", "evaluation"]
---
```

## 头像规范

头像用于作者署名展示。

- 目录：`public/assets/authors/`
- 命名：`<github-id>.webp`，如 `alice.webp`
- 推荐尺寸：`256x256` 或 `512x512`
- 推荐格式：WebP，其次 PNG/JPG
- 单个头像大小：不超过 `512 KB`
- 如果不提供 `avatar`，但填写了 `github`，站点会自动使用 GitHub 头像

## 文章图片规范

文章内图片放在 `src/assets/posts/<collection>/<slug>/`，不要放在 Markdown 文件旁边，也不要直接放仓库根目录。

示例：

```txt
src/content/papers/eval-is-not-a-number.md
src/assets/posts/papers/eval-is-not-a-number/figure-1.webp
```

在 Markdown 中使用相对路径引用：

```md
![不同评测协议下的结果差异](../../assets/posts/papers/eval-is-not-a-number/figure-1.webp)
```

图片限制：

- 单张文章图片不超过 `1 MB`
- 单篇文章图片总量不超过 `5 MB`
- 推荐格式：WebP 或 AVIF
- 截图宽度建议不超过 `1600 px`
- 必须写有意义的 alt text，不使用 `![](...)`
- 大型视频、动图、数据文件不要直接提交，先在 PR 中说明需求

这些限制会被 `pnpm check:assets` 自动检查。

## 本地开发

```sh
pnpm install
pnpm dev
```

提交 PR 前运行：

```sh
pnpm check
```

`pnpm check` 会执行：

- 资产大小检查
- Astro 生产构建

## 内容质量检查

发 PR 前请确认：

- 标题清楚，不只是论文名或营销式标题。
- `summary` 能独立说明文章价值。
- 外部链接可以打开。
- 论文类文章区分了论文作者和本站作者。
- benchmark 文章说明了 task、metric、version、known issues。
- 图片有来源或是自己绘制/截图，且没有版权风险。
- 文章不是简单搬运摘要，包含个人判断、疑问或复盘。

## Review 规则

PR 至少需要一位维护者 review 后合并。维护者主要看：

- 内容是否符合 Lens Frontier 的主题：论文阅读分享、benchmark 相关观察，以及围绕这些问题的一些浅薄观点。
- 事实、引用和链接是否可靠。
- 图片和资产是否合规。
- Markdown frontmatter 是否能通过构建。
- 观点是否清楚地区分事实、推断和个人判断。

如果仓库开启了 main 分支保护，建议把 `CI / check` 设为 required status check。
