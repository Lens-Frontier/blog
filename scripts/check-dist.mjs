import { appendFileSync, existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const siteUrl = process.env.SITE_URL;
const siteBase = normalizeBase(process.env.SITE_BASE ?? '/');
const gaMeasurementId = process.env.PUBLIC_GA_MEASUREMENT_ID;
const pageviewEndpoint = process.env.PUBLIC_PAGEVIEW_ENDPOINT;
const requiredFiles = [
	'index.html',
	'zh/index.html',
	'en/index.html',
	'about/index.html',
	'zh/about/index.html',
	'en/about/index.html',
	'papers/index.html',
	'zh/papers/index.html',
	'en/papers/index.html',
	'benchmarks/index.html',
	'zh/benchmarks/index.html',
	'en/benchmarks/index.html',
	'opinions/index.html',
	'zh/opinions/index.html',
	'en/opinions/index.html',
	'timeline/index.html',
	'zh/timeline/index.html',
	'en/timeline/index.html',
	'tags/index.html',
	'zh/tags/index.html',
	'en/tags/index.html',
	'rss.xml',
	'zh/rss.xml',
	'en/rss.xml',
	'sitemap-index.xml',
];

const skippedProtocols = /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i;
const unsafeInternalPath = /(?:^|\/)(?:src|node_modules)\//;
const localizedHtmlLang = new Map([
	['zh', 'zh-CN'],
	['en', 'en'],
]);
const errors = [];
const warnings = [];
const renderedMarkdownPatterns = [
	{
		name: 'strong emphasis marker',
		regex: /\*\*[^*\n]{1,160}\*\*/g,
	},
	{
		name: 'underscore emphasis marker',
		regex: /__[^_\n]{1,160}__/g,
	},
	{
		name: 'Markdown image syntax',
		regex: /!\[[^\]\n]{1,120}\]\([^\s)\n][^)\n]{0,240}\)/g,
	},
	{
		name: 'Markdown link syntax',
		regex: /(?<!!)\[[^\]\n]{1,120}\]\([^\s)\n][^)\n]{0,240}\)/g,
	},
];

function normalizeBase(base) {
	if (!base || base === '/') return '/';
	const withLeading = base.startsWith('/') ? base : `/${base}`;
	return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

async function walk(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(full)));
		} else {
			files.push(full);
		}
	}
	return files;
}

function stripBase(pathname) {
	if (siteBase === '/') return pathname;
	if (pathname === siteBase.slice(0, -1)) return '/';
	if (pathname.startsWith(siteBase)) return `/${pathname.slice(siteBase.length)}`;
	return pathname;
}

function localFileFor(pathname) {
	const localPath = decodeURIComponent(stripBase(pathname));
	if (!localPath.startsWith('/')) return undefined;
	if (localPath.endsWith('/')) return join(dist, localPath, 'index.html');
	if (extname(localPath)) return join(dist, localPath);
	return join(dist, localPath, 'index.html');
}

function parseLocalReference(value, currentFile) {
	if (!value || value.startsWith('#') || skippedProtocols.test(value) || value.startsWith('//')) return undefined;

	try {
		const base = new URL(`file://${currentFile}`);
		const url = value.startsWith('/') ? new URL(value, 'https://local.test') : new URL(value, base);
		if (url.protocol !== 'file:' && url.hostname !== 'local.test') return undefined;
		const pathname = url.protocol === 'file:' ? url.pathname.replace(dist, '') || '/' : url.pathname;
		return { pathname, hash: url.hash };
	} catch {
		return undefined;
	}
}

function pageIds($) {
	const ids = new Set();
	$('[id]').each((_, element) => {
		const id = $(element).attr('id');
		if (id) ids.add(id);
	});
	return ids;
}

function annotationValue(value) {
	return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/:/g, '%3A').replace(/,/g, '%2C');
}

function summaryValue(value) {
	return value.replace(/`/g, '\\`');
}

function excerpt(text, index, length) {
	const start = Math.max(0, index - 54);
	const end = Math.min(text.length, index + length + 54);
	return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function renderedMarkdownWarnings($, rel) {
	const found = [];

	for (const element of $('.article-body').toArray()) {
		const article = $(element).clone();
		article.find('pre, code, kbd, samp, script, style, svg').remove();
		const text = article.text();

		for (const pattern of renderedMarkdownPatterns) {
			for (const match of text.matchAll(pattern.regex)) {
				found.push({
					rel,
					message: `${pattern.name} may not have rendered: "${excerpt(text, match.index ?? 0, match[0].length)}"`,
				});
				if (found.length >= 5) break;
			}
			if (found.length >= 5) break;
		}

		const lines = text.split(/\n/);
		for (let index = 0; index < lines.length - 1 && found.length < 5; index += 1) {
			const current = lines[index];
			const next = lines[index + 1];
			const hasTableRow = current.includes('|') && current.split('|').length >= 3;
			const hasSeparator = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(next);
			if (hasTableRow && hasSeparator) {
				found.push({
					rel,
					message: `Markdown table may not have rendered near: "${excerpt(`${current} ${next}`, 0, current.length + next.length)}"`,
				});
			}
		}
	}

	return found;
}

function emitWarnings(items) {
	if (!items.length) return;

	console.warn('\nRendered Markdown warnings (non-blocking):');
	for (const item of items) {
		console.warn(`- ${item.rel}: ${item.message}`);
		if (process.env.GITHUB_ACTIONS === 'true') {
			console.warn(`::warning file=${annotationValue(item.rel)},title=Possible unrendered Markdown::${annotationValue(item.message)}`);
		}
	}

	if (process.env.GITHUB_STEP_SUMMARY) {
		const rows = items
			.map((item) => `- \`${summaryValue(item.rel)}\`: \`${summaryValue(item.message)}\``)
			.join('\n');
		appendFileSync(
			process.env.GITHUB_STEP_SUMMARY,
			`\n## Rendered Markdown Warnings\n\nNon-blocking warnings for article text that may contain Markdown syntax which did not render as intended.\n\n${rows}\n`,
		);
	}
}

for (const file of requiredFiles) {
	if (!existsSync(join(dist, file))) {
		errors.push(`Required build output is missing: dist/${file}`);
	}
}

const files = await walk(dist);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
	const rel = relative(root, file);
	const distRel = relative(dist, file).split('\\').join('/');
	const html = await readFile(file, 'utf8');
	const $ = cheerio.load(html);
	const ids = pageIds($);
	const firstSegment = distRel.split('/')[0];

	if (!$('title').text().trim()) {
		errors.push(`Missing page title: ${rel}`);
	}
	if (!$('meta[name="description"]').attr('content')?.trim()) {
		errors.push(`Missing meta description: ${rel}`);
	}

	if (siteUrl) {
		const canonical = $('link[rel="canonical"]').attr('href');
		if (!canonical?.startsWith(new URL(siteBase, siteUrl).toString())) {
			errors.push(`Canonical URL does not match SITE_URL/SITE_BASE: ${rel}`);
		}
	}
	if (localizedHtmlLang.has(firstSegment)) {
		const expectedLang = localizedHtmlLang.get(firstSegment);
		if ($('html').attr('lang') !== expectedLang) {
			errors.push(`Localized page has wrong html lang (${expectedLang} expected): ${rel}`);
		}
		if ($('link[rel="alternate"][hreflang]').length < 2) {
			errors.push(`Localized page should expose zh/en alternate links: ${rel}`);
		}
	}
	if (html.includes('googletagmanager.com/gtm.js') || html.includes('googletagmanager.com/ns.html')) {
		errors.push(`Legacy Google Tag Manager should not be emitted: ${rel}`);
	}
	if (gaMeasurementId) {
		const hasGaScript = html.includes('googletagmanager.com/gtag/js') && html.includes(gaMeasurementId);
		if (!hasGaScript || !html.includes("gtag('config'")) {
			errors.push(`Missing Google Analytics measurement ${gaMeasurementId}: ${rel}`);
		}
	} else if (html.includes('googletagmanager.com/gtag/js') || html.includes("gtag('config'")) {
		errors.push(`Google Analytics should not be emitted without PUBLIC_GA_MEASUREMENT_ID: ${rel}`);
	}
	if (!pageviewEndpoint && (html.includes('lens-frontier:pageview') || html.includes('data-article-views'))) {
		errors.push(`Pageview tracking should not be emitted without PUBLIC_PAGEVIEW_ENDPOINT: ${rel}`);
	}
	warnings.push(...renderedMarkdownWarnings($, rel));

	for (const element of $('a[href], link[href], script[src], img[src]').toArray()) {
		const attr = element.tagName === 'script' || element.tagName === 'img' ? 'src' : 'href';
		const value = $(element).attr(attr)?.trim();
		const label = `${element.tagName}[${attr}]`;

		if (!value) {
			errors.push(`Empty ${label}: ${rel}`);
			continue;
		}
		if (value.endsWith('.md') || unsafeInternalPath.test(value)) {
			errors.push(`Build output links to source-only path: ${value} in ${rel}`);
		}

		const local = parseLocalReference(value, file);
		if (!local) continue;

		const targetFile = localFileFor(local.pathname);
		if (!targetFile || !existsSync(targetFile)) {
			errors.push(`Broken internal ${label}: ${value} in ${rel}`);
			continue;
		}
		if (local.hash && targetFile === file) {
			const id = decodeURIComponent(local.hash.slice(1));
			if (id && !ids.has(id)) {
				errors.push(`Broken same-page anchor: ${value} in ${rel}`);
			}
		}
	}
}

const rss = join(dist, 'rss.xml');
if (existsSync(rss)) {
	const text = await readFile(rss, 'utf8');
	if (!text.includes('<rss') || !text.includes('<channel>')) {
		errors.push('RSS output is not a valid RSS channel: dist/rss.xml');
	}
}

emitWarnings(warnings);

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exit(1);
}

console.log(warnings.length ? `Dist checks passed with ${warnings.length} non-blocking rendered Markdown warning(s).` : 'Dist checks passed.');
