import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const siteUrl = process.env.SITE_URL;
const siteBase = normalizeBase(process.env.SITE_BASE ?? '/');
const gtmContainerId = process.env.PUBLIC_GTM_CONTAINER_ID;
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
	if (gtmContainerId) {
		const hasGtmScript = html.includes('googletagmanager.com/gtm.js') && html.includes(gtmContainerId);
		const hasGtmNoscript = html.includes('googletagmanager.com/ns.html') && html.includes(gtmContainerId);
		if (!hasGtmScript || !hasGtmNoscript) {
			errors.push(`Missing Google Tag Manager container ${gtmContainerId}: ${rel}`);
		}
	} else if (html.includes('googletagmanager.com/gtm.js') || html.includes('googletagmanager.com/ns.html')) {
		errors.push(`Google Tag Manager should not be emitted without PUBLIC_GTM_CONTAINER_ID: ${rel}`);
	}
	if (!pageviewEndpoint && (html.includes('lens-frontier:pageview') || html.includes('data-article-views'))) {
		errors.push(`Pageview tracking should not be emitted without PUBLIC_PAGEVIEW_ENDPOINT: ${rel}`);
	}

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

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exit(1);
}

console.log('Dist checks passed.');
