const DEFAULT_ALLOWED_ORIGIN = 'https://lens-frontier.github.io';
const ARTICLE_ID_PATTERN = /^(papers|benchmarks|opinions)\/[a-z0-9]+(?:[-/][a-z0-9]+)*$/;

function corsHeaders(env, request) {
	const allowedOrigin = env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN;
	const origin = request.headers.get('Origin');
	const value = origin === allowedOrigin ? origin : allowedOrigin;

	return {
		'Access-Control-Allow-Origin': value,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Max-Age': '86400',
		'Vary': 'Origin',
	};
}

function jsonResponse(body, init = {}, env, request) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			...corsHeaders(env, request),
			...(init.headers || {}),
		},
	});
}

async function sha256(input) {
	const bytes = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readClientIp(request) {
	return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

function normalizePayload(payload) {
	const siteId = typeof payload.siteId === 'string' && payload.siteId.trim() ? payload.siteId.trim() : 'lens-frontier';
	const articleId = typeof payload.articleId === 'string' ? payload.articleId.trim() : '';
	const path = typeof payload.path === 'string' ? payload.path.slice(0, 512) : '';

	if (!ARTICLE_ID_PATTERN.test(articleId)) {
		throw new Error('Invalid articleId.');
	}

	return { siteId, articleId, path };
}

async function handlePageview(request, env) {
	if (!env.DB) {
		return jsonResponse({ error: 'D1 binding DB is not configured.' }, { status: 500 }, env, request);
	}
	if (!env.VIEW_SALT) {
		return jsonResponse({ error: 'VIEW_SALT is not configured.' }, { status: 500 }, env, request);
	}

	let payload;
	try {
		payload = await request.json();
	} catch {
		return jsonResponse({ error: 'Invalid JSON.' }, { status: 400 }, env, request);
	}

	let normalized;
	try {
		normalized = normalizePayload(payload);
	} catch (error) {
		return jsonResponse({ error: error.message }, { status: 400 }, env, request);
	}

	const now = new Date();
	const day = now.toISOString().slice(0, 10);
	const createdAt = now.toISOString();
	const salt = env.VIEW_SALT;
	const userAgent = request.headers.get('User-Agent') || 'unknown';
	const visitorHash = await sha256(`${salt}:${readClientIp(request)}:${userAgent}:${day}`);
	const eventId = await sha256(`${normalized.siteId}:${normalized.articleId}:${day}:${visitorHash}`);

	const insert = await env.DB.prepare(
		`INSERT OR IGNORE INTO article_view_events
			(id, site_id, article_id, day, visitor_hash, path, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(eventId, normalized.siteId, normalized.articleId, day, visitorHash, normalized.path, createdAt)
		.run();

	if (insert.meta.changes > 0) {
		await env.DB.prepare(
			`INSERT INTO article_views (site_id, article_id, view_count, first_seen_at, last_seen_at)
				VALUES (?, ?, 1, ?, ?)
				ON CONFLICT(site_id, article_id) DO UPDATE SET
					view_count = view_count + 1,
					last_seen_at = excluded.last_seen_at`,
		)
			.bind(normalized.siteId, normalized.articleId, createdAt, createdAt)
			.run();
	}

	return jsonResponse({ ok: true }, { status: 202 }, env, request);
}

async function handleReadCount(request, env) {
	if (!env.DB) {
		return jsonResponse({ error: 'D1 binding DB is not configured.' }, { status: 500 }, env, request);
	}

	const url = new URL(request.url);
	const siteId = url.searchParams.get('siteId') || 'lens-frontier';
	const articleId = url.searchParams.get('articleId') || '';

	if (!ARTICLE_ID_PATTERN.test(articleId)) {
		return jsonResponse({ error: 'Invalid articleId.' }, { status: 400 }, env, request);
	}

	const row = await env.DB.prepare(
		`SELECT view_count AS viewCount, first_seen_at AS firstSeenAt, last_seen_at AS lastSeenAt
			FROM article_views
			WHERE site_id = ? AND article_id = ?`,
	)
		.bind(siteId, articleId)
		.first();

	return jsonResponse(
		{
			siteId,
			articleId,
			viewCount: row?.viewCount || 0,
			firstSeenAt: row?.firstSeenAt || null,
			lastSeenAt: row?.lastSeenAt || null,
		},
		{ status: 200, headers: { 'Cache-Control': 'no-store' } },
		env,
		request,
	);
}

export default {
	async fetch(request, env) {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders(env, request) });
		}

		const url = new URL(request.url);

		if (request.method === 'POST' && url.pathname === '/pageview') {
			return handlePageview(request, env);
		}

		if (request.method === 'GET' && url.pathname === '/views') {
			return handleReadCount(request, env);
		}

		return jsonResponse({ error: 'Not found.' }, { status: 404 }, env, request);
	},
};
