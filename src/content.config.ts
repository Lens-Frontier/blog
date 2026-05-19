import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { hasAuthorId } from './data/authors';

const author = z.object({
	id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
	name: z.string().optional(),
	github: z.string().optional(),
	avatar: z.string().optional(),
	url: z.string().url().optional(),
}).refine((value) => value.id || value.name || value.github, {
	message: 'Author needs id, name, or github.',
}).refine((value) => !value.id || hasAuthorId(value.id), {
	message: 'Unknown author id. Add it to src/data/authors.ts or use inline name/github.',
});

const shared = z.object({
	title: z.string(),
	date: z.coerce.date(),
	summary: z.string(),
	authors: z.array(author).min(1),
	tags: z.array(z.string()).min(1),
	draft: z.boolean().default(false),
});

const papers = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/papers' }),
	schema: shared.extend({
		paperAuthors: z.array(z.string()).default([]),
		venue: z.string().optional(),
		paperUrl: z.string().url().optional(),
		codeUrl: z.string().url().optional(),
		benchmarks: z.array(z.string()).default([]),
		tasks: z.array(z.string()).default([]),
		status: z.enum(['queued', 'reading', 'read', 'revisit']).default('read'),
	}),
});

const benchmarks = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/benchmarks' }),
	schema: shared.extend({
		area: z.string(),
		metric: z.string(),
		version: z.string().optional(),
		risk: z.enum(['low', 'medium', 'high']).default('medium'),
		status: z.enum(['active', 'aging', 'saturated', 'watch']).default('active'),
	}),
});

const opinions = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/opinions' }),
	schema: shared.extend({
		stance: z.string().optional(),
	}),
});

export const collections = { papers, benchmarks, opinions };
