import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const collections = ['papers', 'benchmarks', 'opinions'];
const allowedImageExts = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const contentFilePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(md|mdx)$/;
const maxPostImageBytes = 2 * 1024 * 1024;
const maxPostFolderBytes = 10 * 1024 * 1024;
const maxAuthorAvatarBytes = 512 * 1024;

async function walk(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		if (entry.name === '.DS_Store' || entry.name === '.gitkeep') continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(full)));
		} else {
			files.push(full);
		}
	}
	return files;
}

function displayBytes(bytes) {
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function contentSlugs(collection) {
	const dir = join(root, 'src', 'content', collection);
	if (!existsSync(dir)) return new Set();
	const entries = await readdir(dir, { withFileTypes: true });
	return new Set(
		entries
			.filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name))
			.map((entry) => entry.name.replace(/\.(md|mdx)$/, '')),
	);
}

const errors = [];

for (const collection of collections) {
	const dir = join(root, 'src', 'content', collection);
	if (!existsSync(dir)) continue;
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (!entry.isFile() || !/\.(md|mdx)$/.test(entry.name)) continue;
		const file = join(dir, entry.name);
		if (!contentFilePattern.test(entry.name)) {
			errors.push(`Article filename must use lowercase kebab-case: ${file}`);
		}
		const text = await readFile(file, 'utf8');
		if (/!\[\s*\]\s*\(/.test(text)) {
			errors.push(`Markdown images must include alt text: ${file}`);
		}
	}
}

for (const file of await walk(join(root, 'public', 'assets', 'authors'))) {
	const ext = extname(file).toLowerCase();
	const size = (await stat(file)).size;
	if (!allowedImageExts.has(ext)) {
		errors.push(`Author avatar must be an image: ${file}`);
	}
	if (size > maxAuthorAvatarBytes) {
		errors.push(`Author avatar is too large: ${file} (${displayBytes(size)} > 0.50 MB)`);
	}
}

for (const collection of collections) {
	const slugs = await contentSlugs(collection);
	const collectionAssetDir = join(root, 'src', 'assets', 'posts', collection);
	if (!existsSync(collectionAssetDir)) continue;
	const dirs = await readdir(collectionAssetDir, { withFileTypes: true });
	for (const dir of dirs) {
		if (!dir.isDirectory()) continue;
		if (!slugs.has(dir.name)) {
			errors.push(`Asset folder has no matching article: src/assets/posts/${collection}/${dir.name}`);
		}
		const files = await walk(join(collectionAssetDir, dir.name));
		let total = 0;
		for (const file of files) {
			const ext = extname(file).toLowerCase();
			const size = (await stat(file)).size;
			total += size;
			if (!allowedImageExts.has(ext)) {
				errors.push(`Post asset must be an image: ${file}`);
			}
			if (size > maxPostImageBytes) {
				errors.push(`Post image is too large: ${file} (${displayBytes(size)} > 2.00 MB)`);
			}
		}
		if (total > maxPostFolderBytes) {
			errors.push(
				`Post asset folder is too large: src/assets/posts/${collection}/${dir.name} (${displayBytes(
					total,
				)} > 10.00 MB)`,
			);
		}
	}
}

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exit(1);
}

console.log('Asset checks passed.');
