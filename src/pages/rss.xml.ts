import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { path, site } from '../lib/site';

export async function GET(context: any) {
	const feedSite = new URL(import.meta.env.BASE_URL, context.site).toString();
	const collectionNames = ['papers', 'benchmarks', 'opinions'] as const;
	const grouped = await Promise.all(
		collectionNames.map(async (collection) => ({
			collection,
			entries: (await getCollection(collection)).filter((entry) => !entry.data.draft),
		})),
	);
	const items = grouped
		.flatMap(({ collection, entries }) =>
			entries.map((entry) => ({
				title: entry.data.title,
				description: entry.data.summary,
				pubDate: entry.data.date,
				link: path(`/${collection}/${entry.id}/`),
			})),
		)
		.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

	return rss({
		title: site.title,
		description: site.description,
		site: feedSite,
		items,
	});
}
