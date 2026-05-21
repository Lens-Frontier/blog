import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const smokeSlug = 'analytics-smoke';
const smokeFile = join(root, 'src', 'content', 'opinions', `${smokeSlug}.md`);
const smokeOutput = join(root, 'dist', 'zh', 'opinions', smokeSlug, 'index.html');
const analyticsEnv = {
	PUBLIC_GTM_CONTAINER_ID: 'GTM-KQ8R2LJ7',
	PUBLIC_PAGEVIEW_ENDPOINT: 'https://example.test/pageview',
	PUBLIC_PAGEVIEW_COUNT_ENDPOINT: 'https://example.test/views',
	PUBLIC_PAGEVIEW_SITE_ID: 'lens-frontier',
};

const smokeArticle = `---
title: "Analytics Smoke"
lang: "zh"
date: 2026-05-21
summary: "Temporary article used only by CI to verify analytics output."
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
		throw new Error(`Analytics smoke page is missing ${label}: ${needle}`);
	}
}

if (existsSync(smokeFile)) {
	throw new Error(`Refusing to overwrite existing smoke file: ${smokeFile}`);
}

try {
	await mkdir(join(root, 'src', 'content', 'opinions'), { recursive: true });
	await writeFile(smokeFile, smokeArticle);

	run('pnpm', ['clean:astro']);
	run('pnpm', ['build'], analyticsEnv);

	const html = await readFile(smokeOutput, 'utf8');
	assertIncludes(html, 'googletagmanager.com/gtm.js', 'GTM script');
	assertIncludes(html, 'googletagmanager.com/ns.html', 'GTM noscript fallback');
	assertIncludes(html, 'GTM-KQ8R2LJ7', 'GTM container id');
	assertIncludes(html, 'data-article-views', 'article read-count markup');
	assertIncludes(html, 'data-view-count', 'article read-count value target');
assertIncludes(html, 'https://example.test/views', 'pageview count endpoint');
assertIncludes(html, 'https://example.test/pageview', 'pageview event endpoint');
assertIncludes(html, 'opinions/analytics-smoke', 'article id');
assertIncludes(html, 'lens-frontier:pageview:', 'client-side pageview dedupe key');

	run('pnpm', ['check:dist'], analyticsEnv);
} finally {
	await rm(smokeFile, { force: true });
}

console.log('Analytics smoke checks passed.');
