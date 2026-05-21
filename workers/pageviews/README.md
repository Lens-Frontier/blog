# Pageview Worker

Optional first-party article read counting for Lens Frontier.

Article pages send a small pageview event when `PUBLIC_PAGEVIEW_ENDPOINT` is configured during the Astro build. The site displays read counts when the Worker read endpoint is available.

## Behavior

- Counts only article pages.
- Uses `articleId` such as `papers/swe-bench-verified`.
- Deduplicates one anonymous visitor per article per day.
- Stores a salted hash, not raw IP addresses.
- Receives only `siteId`, `articleId`, and page path from the site.
- Exposes `GET /views?articleId=<collection>/<slug>` for article read-count display.

## Deploy

```sh
cd workers/pageviews
cp wrangler.toml.example wrangler.toml
wrangler d1 create lens-frontier-pageviews
wrangler d1 execute lens-frontier-pageviews --file schema.sql
wrangler secret put VIEW_SALT
wrangler deploy
```

Set the production build variable:

```txt
PUBLIC_PAGEVIEW_ENDPOINT=https://<worker-domain>/pageview
PUBLIC_PAGEVIEW_COUNT_ENDPOINT=https://<worker-domain>/views
PUBLIC_PAGEVIEW_SITE_ID=lens-frontier
```

`PUBLIC_PAGEVIEW_COUNT_ENDPOINT` is optional when the read endpoint is the same Worker with `/views`; the site can derive it from `/pageview`.

Do not configure these variables for PR previews unless preview traffic should also be counted.

For a custom production domain, set `ALLOWED_ORIGIN` in the Worker environment.
