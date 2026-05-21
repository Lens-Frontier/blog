CREATE TABLE IF NOT EXISTS article_views (
	site_id TEXT NOT NULL,
	article_id TEXT NOT NULL,
	view_count INTEGER NOT NULL DEFAULT 0,
	first_seen_at TEXT NOT NULL,
	last_seen_at TEXT NOT NULL,
	PRIMARY KEY (site_id, article_id)
);

CREATE TABLE IF NOT EXISTS article_view_events (
	id TEXT PRIMARY KEY,
	site_id TEXT NOT NULL,
	article_id TEXT NOT NULL,
	day TEXT NOT NULL,
	visitor_hash TEXT NOT NULL,
	path TEXT,
	created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS article_view_events_unique_daily
	ON article_view_events (site_id, article_id, day, visitor_hash);
