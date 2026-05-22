---
name: lens-frontier-post
description: Draft, validate, and prepare Lens Frontier blog article pull requests. Use when Codex or Claude Code is asked to add, edit, submit, or review a Lens Frontier Markdown post, choose between papers/benchmarks/opinions, handle author avatars or post images, run checks, create branches, or open PRs for this blog.
---

# Lens Frontier Post

Use this skill inside the `Lens-Frontier/blog` repository when helping someone create or edit an article PR.

## Workflow

1. Inspect `git status --short` first. Do not overwrite unrelated user changes.
2. Use fork-based PRs for normal article and site changes, even when the user has write access to `Lens-Frontier/blog`. Push topic branches to the contributor fork, then open a PR back to `Lens-Frontier/blog`.
3. Before pushing to an existing branch or updating an existing PR, check the PR state with `gh pr view <number> --json state,headRefName,baseRefName,headRefOid`. If the PR is `MERGED` or `CLOSED`, do not keep pushing to that old branch as if the PR were still active. Create a fresh branch from the latest `origin/main`, carry the intended changes there, and open a new PR from the fork.
4. Read the relevant local docs before editing:
   - `README.md`
   - `CONTRIBUTING.md`
   - `src/content.config.ts`
   - the matching file in `templates/`
5. Choose the collection:
   - `src/content/papers/<slug>.md` for reading-share notes about papers.
   - `src/content/benchmarks/<slug>.md` for benchmark observations.
   - `src/content/opinions/<slug>.md` for benchmark-facing opinions.
6. Use lowercase kebab-case slugs. Prefer `post/<slug>` for the branch name.
7. Copy the relevant template structure manually into the new Markdown file and complete frontmatter.
8. Set `lang: "zh"` or `lang: "en"` in frontmatter. Single-language publication is allowed; do not invent a translation just to fill both routes. If a translated counterpart exists later, give both posts the same `translationKey` so the language switch can stay on the matching article.
9. Keep `authors` as site authors, not paper authors. For recurring authors, prefer `id` from `src/data/authors.ts`. If the author is not in the registry, either add them there or include at least `name` or `github` inline. Do not add `avatar` by default because the site automatically uses `https://github.com/<github>.png?size=96` when `github` exists. Add `avatar` only when a custom image is needed.
10. Put post images under `src/assets/posts/<collection>/<slug>/` only; do not duplicate them under `public/assets/posts/`. Put author avatars under `public/assets/authors/`.
11. Run `pnpm check` before proposing or opening a PR. It includes syntax checks, Markdown lint, content rules, blocking Chinese quote-pair checks, sensitive-content checks, asset hard-limit checks, image recommendation warnings, production build, built-page link/i18n checks, and non-blocking warnings for likely unrendered Markdown markers. When it fails, read the final `Failed checks` summary first.
12. If the user asks to open the PR and credentials are available, push the branch to the fork and use `gh pr create --repo Lens-Frontier/blog`. Use a clear title prefix: `post: <article title>` for articles, `docs:`, `site:`, or `chore:` for non-article changes.

## Required Article Standards

- Prefer quality over cadence. The blog should build long-term influence through stable content quality, careful judgment, and taste.
- The article should not be a copied abstract. It needs a question, observation, judgment, doubt, or replay of discussion.
- Explain evidence and limits. Views can be shallow; claims should still be traceable.
- Avoid overclaiming from a single paper, benchmark, leaderboard, or anecdote. Narrow the conclusion when evidence is narrow.
- Keep the writing readable and restrained: clear structure, useful figures, no title bait, no material dumping.
- Do not commit secrets, tokens, private keys, unpublished materials, or private meeting/customer information.
- For paper posts, distinguish paper authors from site authors.
- For benchmark posts, include task, metric, version or status, risks, and known misreadings when available.
- For opinion posts, separate facts, inferences, uncertainty, and personal judgment.

## Author Registry

- Recurring authors live in `src/data/authors.ts`.
- A post can use `authors: [{ id: "author-id" }]` when the author is registered.
- Inline author fields can still be used for one-off contributors or temporary overrides.
- Unknown author ids fail CI; add the author to the registry or use inline `name` / `github`.

## Assets

- Post image recommended target: `1 MB` each.
- Post image hard max: `2 MB` each.
- Total post asset folder hard max: `10 MB`.
- Author avatar max: `512 KB`.
- Prefer WebP or AVIF for post images; WebP for avatars.
- Reference post images with relative Markdown paths. Do not use `/assets/posts/...` absolute paths, which point at `public/` and can lead to duplicate assets.
- Keep screenshots at or below `1600 px` wide when possible.
- Run `pnpm images:check` to surface image recommendations. Recommendation warnings do not block CI; hard limits from `check:assets` do. Run `pnpm images:optimize` before PR when images are large or wider than `1600 px`.
- Every Markdown image needs meaningful alt text.
- Avoid committing large videos, animated images, or datasets. Mention the need in the PR instead.

## PR Behavior

Every PR runs CI with two required jobs:

- `syntax`: workflow lint plus Astro / TypeScript / Worker syntax checks.
- `check`: content, blocking Chinese quote pairs, assets, image recommendations, production build, and dist checks.

After CI succeeds, the PR Preview workflow publishes a commit-scoped preview at:

```txt
https://lens-frontier.github.io/blog/pr-preview/pr-<PR number>/<commit short hash>/
```

The bot keeps one preview comment updated to the latest commit. Closing the PR triggers cleanup for the whole `pr-preview/pr-<PR number>` directory.

## Final Response

When finished, summarize:

- article path and collection
- author display choice, including GitHub avatar or custom avatar
- image/asset paths, if any
- `pnpm check` result
- PR URL or the exact command the user should run next
