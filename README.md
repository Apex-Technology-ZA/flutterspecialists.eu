# flutterspecialists.eu

Astro + Tailwind static site with Markdown articles (Astro Content Collections). Newsletter via Mailchimp, analytics via Plausible. Deployed with GitHub Pages.

Stack
- Astro (static-first) + Tailwind CSS
- Markdown articles in `src/content/articles`
- GitHub Actions deploy to GitHub Pages
- Mailchimp newsletter form (env-driven action URL)
- Plausible analytics (respect Do Not Track)

Project structure
- `src/components` — UI building blocks (Header, Footer, SEO, Analytics, NewsletterForm)
- `src/layouts` — `BaseLayout`
- `src/pages` — Routes (home, articles, article detail, newsletter, services, training, about, contact, privacy, 404, rss.xml, robots.txt)
- `src/content` — Content Collections config and Markdown files
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
```
4) Run dev:
```bash
npm run dev
```

Writing articles (Markdown)
- Add `.md` files to `src/content/articles/` with frontmatter:
```yaml
title: String
description: String (<=160 chars)
date: ISO date
tags: [String]
heroImage: String (optional, path under /public or absolute)
draft: Boolean (default false)
canonical: URL (optional)
```
- Example: [src/content/articles/hello-flutter-architecture.md](src/content/articles/hello-flutter-architecture.md:1)
- Articles are listed on [/articles](src/pages/articles/index.astro:1) with optional tag filter `?tag=` and pagination via `?page=`.

Deployment (GitHub Pages)
- Workflow is already committed: [.github/workflows/deploy.yml](.github/workflows/deploy.yml:1)
- Repo → Settings → Pages → Build & deployment → Source: GitHub Actions
- Custom domain: flutterspecialists.eu (DNS must point to GitHub Pages)
- After DNS propagates, enable “Enforce HTTPS”

DNS at xneelo (konsoleH)
- A (apex @):
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153
- AAAA (apex @):
  - 2606:50c0:8000::153
  - 2606:50c0:8001::153
  - 2606:50c0:8002::153
  - 2606:50c0:8003::153
- CNAME (www): flutterspecialists.eu
- Keep existing MX records for email. TTL 3600 is fine.

Routes
- `/` — Home with latest 3 Markdown articles
- `/articles/` — Article list with tag and pagination query params
- `/articles/[slug]/` — Article detail rendered from Markdown
- `/newsletter`, `/services`, `/training`, `/about`, `/contact`, `/privacy`
- `/rss.xml` — RSS feed from Markdown
- `/robots.txt` — robots with sitemap

Analytics
- Plausible is included in [src/components/Analytics.astro](src/components/Analytics.astro:1) and respects Do Not Track.

Newsletter
- Form is ENV-driven in [src/components/NewsletterForm.astro](src/components/NewsletterForm.astro:1) using `PUBLIC_MAILCHIMP_FORM_ACTION`.