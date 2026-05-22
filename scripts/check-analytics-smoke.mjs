import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const smokeSlug = 'analytics-smoke';
const smokeTranslationSlug = 'analytics-smoke-en';
const smokeFile = join(root, 'src', 'content', 'opinions', `${smokeSlug}.md`);
const smokeTranslationFile = join(root, 'src', 'content', 'opinions', `${smokeTranslationSlug}.md`);
const smokeOutput = join(root, 'dist', 'zh', 'opinions', smokeSlug, 'index.html');
const smokeTranslationOutput = join(root, 'dist', 'en', 'opinions', smokeTranslationSlug, 'index.html');
const analyticsEnv = {
	PUBLIC_GA_MEASUREMENT_ID: 'G-ZK42116ZXB',
	PUBLIC_PAGEVIEW_ENDPOINT: 'https://example.test/pageview',
	PUBLIC_PAGEVIEW_COUNT_ENDPOINT: 'https://example.test/views',
	PUBLIC_PAGEVIEW_SITE_ID: 'lens-frontier',
};

const smokeArticle = `---
title: "Analytics Smoke"
lang: "zh"
translationKey: "analytics-smoke"
date: 2026-05-21
summary: "Temporary article used only by CI to verify analytics output."
authors:
  - github: "mattheliu"
stance: "Temporary smoke test."
tags: ["evaluation"]
---

## Smoke

This temporary article is created by CI and removed before the final production build.

| Metric | What It Means | Caveat |
| --- | --- | --- |
| Win rate | Pairwise preference | Sensitive to prompt mix |
| Pass rate | Task completion | Can hide partial failures |

> A short quote used to verify blockquote rendering.

- Evidence
- Limit

1. Build
2. Inspect

\`inline code\`

\`\`\`txt
model: example
score: 0.73
\`\`\`

---
`;

const smokeTranslation = `---
title: "Analytics Smoke EN"
lang: "en"
translationKey: "analytics-smoke"
date: 2026-05-21
summary: "Temporary English article used only by CI to verify translated language switching."
authors:
  - github: "mattheliu"
stance: "Temporary smoke test."
tags: ["evaluation"]
---

## Smoke

This temporary article is created by CI and removed before the final production build.
`;

function run(command, args, env = {}) {
	const result = spawnSync(command, args, {
		cwd: root,
		env: { ...process.env, ...env },
		stdio: 'inherit',
	});

	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
	}
}

function assertIncludes(html, needle, label) {
	if (!html.includes(needle)) {
		throw new Error(`Smoke article is missing ${label}: ${needle}`);
	}
}

if (existsSync(smokeFile)) {
	throw new Error(`Refusing to overwrite existing smoke file: ${smokeFile}`);
}

if (existsSync(smokeTranslationFile)) {
	throw new Error(`Refusing to overwrite existing smoke file: ${smokeTranslationFile}`);
}

try {
	await mkdir(join(root, 'src', 'content', 'opinions'), { recursive: true });
	await writeFile(smokeFile, smokeArticle);
	await writeFile(smokeTranslationFile, smokeTranslation);

	run('pnpm', ['clean:astro']);
	run('pnpm', ['build'], analyticsEnv);

	const html = await readFile(smokeOutput, 'utf8');
	const translationHtml = await readFile(smokeTranslationOutput, 'utf8');
	assertIncludes(html, 'googletagmanager.com/gtag/js', 'Google Analytics script');
	assertIncludes(html, 'G-ZK42116ZXB', 'Google Analytics measurement id');
	assertIncludes(html, "gtag('config'", 'Google Analytics config call');
	assertIncludes(html, 'data-article-views', 'article read-count markup');
	assertIncludes(html, 'data-view-count', 'article read-count value target');
	assertIncludes(html, 'https://example.test/views', 'pageview count endpoint');
	assertIncludes(html, 'https://example.test/pageview', 'pageview event endpoint');
	assertIncludes(html, 'opinions/analytics-smoke', 'article id');
	assertIncludes(html, 'lens-frontier:pageview:', 'client-side pageview dedupe key');
	assertIncludes(html, '<table>', 'Markdown table rendering');
	assertIncludes(html, '<thead>', 'Markdown table header rendering');
	assertIncludes(html, '<blockquote>', 'Markdown blockquote rendering');
	assertIncludes(html, '<pre', 'Markdown fenced code rendering');
	assertIncludes(html, '<hr', 'Markdown thematic break rendering');
	assertIncludes(html, '/en/opinions/analytics-smoke-en/', 'translated English language switch path');
	assertIncludes(translationHtml, '/zh/opinions/analytics-smoke/', 'translated Chinese language switch path');

	run('pnpm', ['check:dist'], analyticsEnv);
} finally {
	await rm(smokeFile, { force: true });
	await rm(smokeTranslationFile, { force: true });
}

console.log('Analytics smoke checks passed.');
