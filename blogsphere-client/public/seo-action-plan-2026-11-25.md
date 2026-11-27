# SEO Action Plan from Search Console + GA4 data (25 Nov 2026)

## The data (Search Console, 3 months, Web text)
- Total clicks: 8 | Impressions: 475 | CTR: 1.7% | Average position: 14.6
- 41 distinct queries, 24 pages receiving impressions.
- GA4 linked to Search Console on 25 Nov 2026 (queries report now live).

## Finding 1 (highest value): "is compost bin worth it 2026"
- 147 impressions (31% of ALL search impressions), position 10.1, **0 clicks**.
- The exact article exists as an import file (`public/imports/is-compost-bin-worth-it-2026.json`,
  title: "Is a Compost Bin Worth It in 2026? Costs, Benefits, and What to Know") but is **NOT
  published** to the API. Only 22 articles are published; this one is not among them.
- Its URL returns HTTP 200 via the React SPA fallback, but serves the generic homepage
  `<title>` and meta description, which is why nobody clicks.
- **Action (needs approval):** publish this article through Writer Studio, or fold its
  "is a bin worth it" angle into the existing published `composting-at-home-a-beginners-guide-for-2026`
  article and update its title/meta. This is the single biggest traffic opportunity on the site.

## Finding 2: strong health-content cluster with impressions but no clicks
- insulin plant benefits (10 imp), side effects of insulin plant (10 imp), china rose benefits
  (7 imp), costus igneus benefits (6 imp), butterfly pea flower benefits (4 imp).
- These all map to published articles with correct titles and metas. They rank but don't
  get clicks, likely because positions are low and the snippets are weak.
- **Action:** improve title tags and meta descriptions to directly answer the query, and
  add a short answer paragraph at the top. No re-publish of structure needed if content
  is edited in Writer Studio.

## Finding 3: gardening content is gaining impressions
- "gardening tips for digital nomads" (19 imp), "how to gardening for digital nomads" (6 imp),
  "composting tips 2026" (23 imp). The gardening article is published but the compost-bin
  article that would capture the biggest related query is not.
- **Action:** interlink the gardening and composting articles once Finding 1 is published.

## What the GA4-Search Console link adds going forward
- GA4 Report -> Search Console -> Queries / Google organic search traffic now shows query
  data joined with on-site behaviour (engagement, next page). Use it in a few days to see
  which clicked queries actually lead to reading time, not just impressions.
- Note: GA4 imported data currently shows 0 clicks / 282 impressions because it lagged the
  link and applies a web-stream filter; Search Console's own numbers (8 / 475) are authoritative.

## Immediate next step
Approve Finding 1 and I will load `is-compost-bin-worth-it-2026.json` into Writer Studio
and publish it, then re-check the query in 1-2 weeks for clicks.


## Outcome (25 Nov 2026)
Finding 1 implemented via option (b): folded the "is a bin worth it" angle into the
published composting guide. New title: "Is a Compost Bin Worth It in 2026? A Home Composting
Guide"; new SEO title: "Is a Compost Bin Worth It in 2026? Costs and Benefits". Added a quick
answer, a cost comparison table with ₹ and $ prices, and two new FAQs. Replaced a broken
inline image with a verified Commons photo (Joe Hoover, CC BY 4.0). Updated in place via
Writer Studio import+edit; API confirms the slug is unchanged and article count remains 22.
A fresh frontend build is required so the prerendered <title> matches the new API title.


## Internal linking fix (27 Nov 2026)
Added same-category related article links to the prerendered static HTML so crawlers can see
internal links. 14 of 24 articles have them; 10 are singletons in their category. Pushed in 9924cf8.
