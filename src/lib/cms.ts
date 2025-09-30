import contentful, { type Asset, type Entry } from 'contentful';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import type { Document as RichTextDocument } from '@contentful/rich-text-types';

const { createClient } = contentful;

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: Date;
  tags: string[];
  heroImageUrl?: string;
  canonical?: string;
  body?: RichTextDocument;
}

type Maybe<T> = T | undefined | null;

function env(name: string): string | undefined {
  // Prefer Vite/ Astro env during dev/build, fall back to process.env in CI
  return (import.meta as any)?.env?.[name] ?? process.env[name];
}

function getClientOrNull() {
  const space = env('CONTENTFUL_SPACE_ID');
  const environment = env('CONTENTFUL_ENVIRONMENT') || 'master';
  const accessToken = env('CONTENTFUL_DELIVERY_TOKEN');
  if (!space || !accessToken) return null;
  return createClient({ space, environment, accessToken });
}

function assetUrl(asset?: Maybe<Asset>): string | undefined {
  const url = (asset as any)?.fields?.file?.url as string | undefined;
  if (!url) return undefined;
  return url.startsWith('http') ? url : `https:${url}`;
}

function mapArticle(entry: Entry): Article {
  const f = (entry as any).fields ?? {};
  return {
    slug: f.slug,
    title: f.title,
    description: f.description,
    date: new Date(f.date || entry.sys.updatedAt || entry.sys.createdAt),
    tags: Array.isArray(f.tags) ? f.tags : [],
    heroImageUrl: assetUrl(f.heroImage),
    canonical: f.canonical || undefined,
    body: f.body as RichTextDocument | undefined,
  };
}

/**
 * Fetch paginated articles. Optionally filter by tag.
 */
export async function fetchArticles(params?: {
  tag?: string;
  limit?: number;
  skip?: number;
}): Promise<{ items: Article[]; total: number; limit: number; skip: number }> {
  const client = getClientOrNull();
  const limit = params?.limit ?? 20;
  const skip = params?.skip ?? 0;

  if (!client) {
    // Soft-fail locally if env not configured
    return { items: [], total: 0, limit, skip };
  }

  const query: any = {
    content_type: 'article',
    order: '-fields.date',
    include: 2,
    limit,
    skip,
  };
  if (params?.tag) {
    query['fields.tags[in]'] = params.tag;
  }

  const res = await client.getEntries(query);
  return {
    items: res.items.map(mapArticle),
    total: res.total,
    limit: res.limit,
    skip: res.skip,
  };
}

/**
 * Fetch a single article by slug.
 */
export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const client = getClientOrNull();
  if (!client) return null;

  const res = await client.getEntries({
    content_type: 'article',
    'fields.slug': slug,
    limit: 1,
    include: 2,
  });

  return res.items.length ? mapArticle(res.items[0]) : null;
}

/**
 * Compute the set of all tags across articles.
 */
export async function fetchAllTags(): Promise<string[]> {
  const client = getClientOrNull();
  if (!client) return [];

  const res = await client.getEntries({
    content_type: 'article',
    select: ['fields.tags'],
    limit: 1000,
  });

  const set = new Set<string>();
  for (const it of res.items as any[]) {
    const tags: string[] = Array.isArray(it.fields?.tags) ? it.fields.tags : [];
    tags.forEach((t) => set.add(t));
  }
  return Array.from(set).sort();
}

/**
 * Render Contentful Rich Text to HTML string.
 */
export function renderRichText(doc?: RichTextDocument): string {
  if (!doc) return '';
  return documentToHtmlString(doc, {
    renderNode: {
      // Customize node rendering as needed
    },
  });
}