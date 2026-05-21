import { getCollection } from 'astro:content';
import { byDateDesc, type Language } from './site';

export const collectionNames = ['papers', 'benchmarks', 'opinions'] as const;
export type CollectionName = (typeof collectionNames)[number];

export async function publishedCollection(collection: CollectionName, lang: Language) {
	return (await getCollection(collection))
		.filter((entry) => !entry.data.draft && entry.data.lang === lang)
		.sort(byDateDesc);
}

export async function publishedEntries(lang: Language) {
	const grouped = await Promise.all(
		collectionNames.map(async (collection) => ({
			collection,
			entries: await publishedCollection(collection, lang),
		})),
	);

	return grouped
		.flatMap(({ collection, entries }) => entries.map((entry) => ({ collection, entry })))
		.sort((a, b) => byDateDesc(a.entry, b.entry));
}

export async function tagsForLanguage(lang: Language) {
	const entries = await publishedEntries(lang);
	return [...new Set(entries.flatMap(({ entry }) => entry.data.tags ?? []))].sort();
}
