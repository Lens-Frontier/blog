import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const defaultRoots = [join(root, 'src', 'assets', 'posts')];
const args = process.argv.slice(2);
const write = args.includes('--write');
const explicitRoots = args.filter((arg) => !arg.startsWith('--'));
const roots = explicitRoots.length ? explicitRoots.map((arg) => resolve(root, arg)) : defaultRoots;

const supportedInputExts = new Set(['.jpeg', '.jpg', '.png', '.webp']);
const preferredOutputExts = new Set(['.avif', '.webp']);
const targetPostWidth = 1600;
const targetPostImageBytes = 1 * 1024 * 1024;
const webpQuality = 82;

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

function outputPath(file) {
	const ext = extname(file);
	return ext.toLowerCase() === '.webp' ? file : `${file.slice(0, -ext.length)}.webp`;
}

async function inspectImage(file) {
	const ext = extname(file).toLowerCase();
	if (!supportedInputExts.has(ext) && !preferredOutputExts.has(ext)) return null;

	const size = (await stat(file)).size;
	const metadata = await sharp(file).metadata();
	return { ext, size, width: metadata.width ?? 0, height: metadata.height ?? 0 };
}

async function optimizeImage(file, image) {
	if (!supportedInputExts.has(image.ext)) return null;

	const nextPath = outputPath(file);
	let pipeline = sharp(file).rotate();
	if (image.width > targetPostWidth) {
		pipeline = pipeline.resize({ width: targetPostWidth, withoutEnlargement: true });
	}

	const optimized = await pipeline.webp({ quality: webpQuality, effort: 4 }).toBuffer();
	if (nextPath === file && optimized.length >= image.size && image.width <= targetPostWidth) {
		return { skipped: true, reason: 'already smaller than optimized output' };
	}

	await mkdir(dirname(nextPath), { recursive: true });
	await writeFile(nextPath, optimized);

	return {
		output: nextPath,
		before: image.size,
		after: optimized.length,
	};
}

const warnings = [];
const changes = [];
let seen = 0;

for (const start of roots) {
	for (const file of await walk(start)) {
		let image;
		try {
			image = await inspectImage(file);
		} catch (error) {
			warnings.push(`${relative(root, file)} could not be inspected: ${error.message}`);
			continue;
		}

		if (!image) continue;
		seen += 1;

		const rel = relative(root, file);
		if (image.size > targetPostImageBytes) {
			warnings.push(`${rel} is ${displayBytes(image.size)}; recommended target is <= 1.00 MB.`);
		}
		if (image.width > targetPostWidth) {
			warnings.push(`${rel} is ${image.width}px wide; recommended max width is ${targetPostWidth}px.`);
		}
		if (!preferredOutputExts.has(image.ext)) {
			warnings.push(`${rel} is ${image.ext.slice(1).toUpperCase()}; WebP or AVIF is preferred for post images.`);
		}

		if (write) {
			const result = await optimizeImage(file, image);
			if (result?.output) {
				changes.push(
					`${rel} -> ${relative(root, result.output)} (${displayBytes(result.before)} -> ${displayBytes(
						result.after,
					)})`,
				);
			}
		}
	}
}

if (!seen) {
	console.log('No post images found.');
} else if (warnings.length) {
	console.warn(warnings.map((warning) => `Warning: ${warning}`).join('\n'));
} else {
	console.log('Post image recommendations passed.');
}

if (write) {
	if (changes.length) {
		console.log(['Optimized images:', ...changes.map((change) => `- ${change}`)].join('\n'));
	} else {
		console.log('No images needed optimization.');
	}
}
