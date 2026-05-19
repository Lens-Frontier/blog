import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import YAML from 'yaml';

const root = process.cwd();
const collections = ['papers', 'benchmarks', 'opinions'];
const tagPattern = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/;
const imagePattern = /!\[[^\]\n]+\]\(([^)\n]+)\)/g;
const remotePattern = /^(?:https?:|mailto:|#)/i;

async function filesIn(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	return entries.filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name)).map((entry) => entry.name);
}

function parseFrontmatter(text, file) {
	if (!text.startsWith('---\n')) {
		throw new Error(`${file} must start with YAML frontmatter.`);
	}

	const end = text.indexOf('\n---', 4);
	if (end === -1) {
		throw new Error(`${file} has no closing frontmatter marker.`);
	}

	return {
		data: YAML.parse(text.slice(4, end)) ?? {},
		body: text.slice(end + 4).trim(),
	};
}

function markdownImageTargets(text) {
	return [...text.matchAll(imagePattern)].map((match) => match[1].trim().replace(/^<|>$/g, '').split(/\s+/)[0]);
}

const errors = [];

for (const collection of collections) {
	const contentDir = join(root, 'src', 'content', collection);
	for (const filename of await filesIn(contentDir)) {
		const slug = filename.replace(/\.(md|mdx)$/, '');
		const file = join(contentDir, filename);
		const relFile = relative(root, file);
		const text = await readFile(file, 'utf8');
		let parsed;

		try {
			parsed = parseFrontmatter(text, relFile);
		} catch (error) {
			errors.push(error.message);
			continue;
		}

		const { data, body } = parsed;
		if (!body) {
			errors.push(`Article body is empty: ${relFile}`);
		}
		if (!/^##\s+\S/m.test(body)) {
			errors.push(`Article should include at least one level-2 section heading: ${relFile}`);
		}
		if (typeof data.title === 'string' && data.title.trim().length > 80) {
			errors.push(`Title is too long (${data.title.trim().length} chars > 80): ${relFile}`);
		}
		if (typeof data.summary === 'string') {
			const length = data.summary.trim().length;
			if (length < 12 || length > 220) {
				errors.push(`Summary should be 12-220 chars (${length} chars): ${relFile}`);
			}
		}
		if (Array.isArray(data.tags)) {
			for (const tag of data.tags) {
				if (typeof tag !== 'string' || !tagPattern.test(tag)) {
					errors.push(`Tag must use lowercase kebab-case or dotted form: ${tag} in ${relFile}`);
				}
			}
		}

		const expectedAssetDir = resolve(root, 'src', 'assets', 'posts', collection, slug);
		for (const target of markdownImageTargets(text)) {
			if (remotePattern.test(target)) continue;
			if (target.startsWith('/')) {
				errors.push(`Article image should use a relative path, not an absolute path: ${target} in ${relFile}`);
				continue;
			}

			const resolved = resolve(dirname(file), decodeURIComponent(target));
			if (!existsSync(resolved)) {
				errors.push(`Article image does not exist: ${target} in ${relFile}`);
				continue;
			}
			if (!resolved.startsWith(`${expectedAssetDir}/`)) {
				errors.push(
					`Article image should live under src/assets/posts/${collection}/${slug}/: ${target} in ${relFile}`,
				);
			}
		}
	}
}

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exit(1);
}

console.log('Content checks passed.');
