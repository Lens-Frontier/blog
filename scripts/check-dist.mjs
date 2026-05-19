import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const siteUrl = process.env.SITE_URL;
const siteBase = normalizeBase(process.env.SITE_BASE ?? '/');
const requiredFiles = [
	'index.html',
	'about/index.html',
	'papers/index.html',
	'benchmarks/index.html',
	'opinions/index.html',
	'timeline/index.html',
	'tags/index.html',
	'rss.xml',
	'sitemap-index.xml',
];

const skippedProtocols = /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i;
const unsafeInternalPath = /(?:^|\/)(?:src|node_modules)\//;
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
	const html = await readFile(file, 'utf8');
	const $ = cheerio.load(html);
	const ids = pageIds($);

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
