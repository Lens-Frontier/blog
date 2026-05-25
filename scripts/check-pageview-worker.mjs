import worker from '../workers/pageviews/worker.js';

const state = {
	events: new Set(),
	views: new Map(),
};

function key(siteId, articleId) {
	return `${siteId}\u0000${articleId}`;
}

function createEnv() {
	return {
		VIEW_SALT: 'test-salt',
		DB: {
			prepare(sql) {
				return {
					bind(...args) {
						return {
							async run() {
								if (sql.includes('INSERT OR IGNORE INTO article_view_events')) {
									const id = args[0];
									const fresh = !state.events.has(id);
									state.events.add(id);
									return { meta: { changes: fresh ? 1 : 0 } };
								}

								if (sql.includes('INSERT INTO article_views')) {
									const [siteId, articleId, , createdAt] = args;
									const viewKey = key(siteId, articleId);
									const current = state.views.get(viewKey);
									state.views.set(viewKey, {
										viewCount: (current?.viewCount || 0) + 1,
										firstSeenAt: current?.firstSeenAt || createdAt,
										lastSeenAt: createdAt,
									});
									return { meta: { changes: 1 } };
								}

								throw new Error(`Unexpected run SQL: ${sql}`);
							},
							async first() {
								if (sql.includes('FROM article_views')) {
									const [siteId, articleId] = args;
									return state.views.get(key(siteId, articleId)) || null;
								}

								throw new Error(`Unexpected first SQL: ${sql}`);
							},
						};
					},
				};
			},
		},
	};
}

function pageviewRequest(articleId = 'opinions/pageview-worker-smoke') {
	return new Request('https://worker.test/pageview', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Origin: 'https://lens-frontier.github.io',
			'User-Agent': 'pageview-worker-smoke',
		},
		body: JSON.stringify({
			siteId: 'lens-frontier',
			articleId,
			path: `/blog/zh/${articleId}/`,
		}),
	});
}

function viewsRequest(articleId = 'opinions/pageview-worker-smoke') {
	return new Request(`https://worker.test/views?siteId=lens-frontier&articleId=${encodeURIComponent(articleId)}`, {
		headers: { Origin: 'https://lens-frontier.github.io' },
	});
}

async function expectJson(response, expectedStatus) {
	const body = await response.json();
	if (response.status !== expectedStatus) {
		throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(body)}`);
	}
	return body;
}

function assertEqual(actual, expected, label) {
	if (actual !== expected) {
		throw new Error(`${label}: expected ${expected}, got ${actual}`);
	}
}

const env = createEnv();

const first = await expectJson(await worker.fetch(pageviewRequest(), env), 202);
assertEqual(first.viewCount, 1, 'first pageview count');
assertEqual(first.uniqueDailyVisitorRecorded, true, 'first unique visitor marker');

const second = await expectJson(await worker.fetch(pageviewRequest(), env), 202);
assertEqual(second.viewCount, 2, 'second pageview count');
assertEqual(second.uniqueDailyVisitorRecorded, false, 'second unique visitor marker');
assertEqual(state.events.size, 1, 'unique backend event count');

const read = await expectJson(await worker.fetch(viewsRequest(), env), 200);
assertEqual(read.viewCount, 2, 'read endpoint pageview count');

await expectJson(await worker.fetch(pageviewRequest('invalid/Article'), env), 400);
await expectJson(await worker.fetch(viewsRequest('invalid/Article'), env), 400);

console.log('Pageview Worker behavior checks passed.');
