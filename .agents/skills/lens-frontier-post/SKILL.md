---
name: lens-frontier-post
description: Draft, validate, and prepare Lens Frontier blog article pull requests. Use when Codex or Claude Code is asked to add, edit, submit, or review a Lens Frontier Markdown post, choose between papers/benchmarks/opinions, handle author avatars or post images, run checks, create branches, or open PRs for this blog.
---

# Lens Frontier Post

Use this skill inside the `Lens-Frontier/blog` repository when helping someone create or edit an article PR.

## Workflow

1. Inspect `git status --short` first. Do not overwrite unrelated user changes.
2. Read the relevant local docs before editing:
   - `README.md`
   - `CONTRIBUTING.md`
   - `src/content.config.ts`
   - the matching file in `templates/`
3. Choose the collection:
   - `src/content/papers/<slug>.md` for reading-share notes about papers.
   - `src/content/benchmarks/<slug>.md` for benchmark observations.
   - `src/content/opinions/<slug>.md` for benchmark-facing opinions.
4. Use lowercase kebab-case slugs. Prefer `post/<slug>` for the branch name.
5. Copy the relevant template structure manually into the new Markdown file and complete frontmatter.
6. Keep `authors` as site authors, not paper authors. For recurring authors, prefer `id` from `src/data/authors.ts`. If the author is not in the registry, either add them there or include at least `name` or `github` inline. Do not add `avatar` by default because the site automatically uses `https://github.com/<github>.png?size=96` when `github` exists. Add `avatar` only when a custom image is needed.
7. Put post images under `src/assets/posts/<collection>/<slug>/`. Put author avatars under `public/assets/authors/`.
8. Run `pnpm check` before proposing or opening a PR. It includes Markdown lint, content rules, asset hard-limit checks, image recommendation warnings, Astro type checks, production build, and built-page link checks.
9. If the user asks to open the PR and credentials are available, push the branch and use `gh pr create`.

## Required Article Standards

- The article should not be a copied abstract. It needs a question, observation, judgment, doubt, or replay of discussion.
- Explain evidence and limits. Views can be shallow; claims should still be traceable.
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
- Keep screenshots at or below `1600 px` wide when possible.
- Run `pnpm images:check` to surface image recommendations. Recommendation warnings do not block CI; hard limits from `check:assets` do. Run `pnpm images:optimize` before PR when images are large or wider than `1600 px`.
- Every Markdown image needs meaningful alt text.
- Avoid committing large videos, animated images, or datasets. Mention the need in the PR instead.

## PR Behavior

Every PR runs CI with `pnpm check`. After CI succeeds, the PR Preview workflow publishes a commit-scoped preview at:

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
