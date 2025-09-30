# flutterspecialists.eu

Astro + Tailwind site with Contentful CMS (static export for GitHub Pages). Newsletter via Mailchimp, analytics via Plausible.

Stack
- Astro (static-first) + Tailwind CSS
- Contentful (headless CMS) fetched at build time
- GitHub Actions deploy to GitHub Pages
- Mailchimp newsletter form (env-driven action URL)
- Plausible analytics (respect Do Not Track)

Project structure
- `src/components` — UI building blocks (Header, Footer, SEO, Analytics, NewsletterForm)
- `src/layouts` — `BaseLayout`
- `src/pages` — Routes (home, articles, article detail, pagination, tag filters, newsletter, services, training, about, contact, privacy, 404, rss.xml, robots.txt)
- `src/lib` — CMS client ([src/lib/cms.ts](src/lib/cms.ts:1))
- `public` — static assets, favicon, OG images, CNAME
- `.github/workflows/deploy.yml` — GitHub Pages workflow

Local development
1) Prereqs:
- Node 20+, npm 10+
2) Install deps:
```bash
npm install
```
3) Copy envs and fill values:
```bash
cp .env.example .env
# Set:
# PUBLIC_MAILCHIMP_FORM_ACTION
# CONTENTFUL_SPACE_ID
# CONTENTFUL_ENVIRONMENT (usually "master")
# CONTENTFUL_DELIVERY_TOKEN (Content Delivery API token)
```
4) Run dev:
```bash
npm run dev
```

Contentful setup
Create a Contentful space and a Content Type named `article` with fields:
- slug (Short text, required, unique)
- title (Short text, required)
- description (Long text, required)
- date (Date & time, required)
- tags (Short text list, optional)
- heroImage (Media, optional)
- canonical (Short text, optional)
- body (Rich text, optional)

Publishing flow
- Authors create/publish articles in Contentful
- On push to `main`, GitHub Actions builds the site, fetching published entries from Contentful Delivery API
- GitHub Pages serves the static site

Environment variables
- `PUBLIC_MAILCHIMP_FORM_ACTION` — Mailchimp embedded form action URL
- `CONTENTFUL_SPACE_ID` — Contentful Space ID
- `CONTENTFUL_ENVIRONMENT` — Contentful Environment (default "master")
- `CONTENTFUL_DELIVERY_TOKEN` — Contentful Delivery API token

GitHub Actions configuration
Add repository secrets in GitHub:
- Settings → Secrets and variables → Actions → New repository secret:
  - `CONTENTFUL_SPACE_ID`
  - `CONTENTFUL_ENVIRONMENT` (e.g. `master`)
  - `CONTENTFUL_DELIVERY_TOKEN`

The workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml:1) already reads these secrets.

Routes
- `/` — Home with latest 3 articles (from Contentful)
- `/articles/` — Article list (page 1, from Contentful)
- `/articles/page/[page]/` — Pagination
- `/articles/tag/[tag]/page/[page]/` — Tag filtering + pagination
- `/articles/[slug]/` — Article detail rendered from Contentful rich text
- `/newsletter`, `/services`, `/training`, `/about`, `/contact`, `/privacy`
- `/rss.xml` — RSS feed generated from Contentful
- `/robots.txt` — Robots with sitemap

Analytics
- Plausible is included in [src/components/Analytics.astro](src/components/Analytics.astro:1) and respects Do Not Track.

Newsletter
- Form is ENV-driven in [src/components/NewsletterForm.astro](src/components/NewsletterForm.astro:1) using `PUBLIC_MAILCHIMP_FORM_ACTION`.

Notes
- Markdown content under `src/content/articles` is no longer used; articles are sourced from Contentful at build time.
- If Contentful env vars are missing locally, pages render with empty lists and no article paths are generated (fail-soft). CI must have secrets configured for production builds.