import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { fetchArticles } from '@lib/cms';
import type { Article } from '@lib/cms';

export async function GET(context: APIContext) {
  const { items }: { items: Article[] } = await fetchArticles({ limit: 1000 });
  return rss({
    title: 'Flutter Specialists — Articles',
    description: 'Consulting, training and insights for Flutter teams.',
    site: context.site ?? 'https://flutterspecialists.eu',
    items: items.map((post) => ({
      title: post.title,
      pubDate: post.date,
      description: post.description,
      link: `/articles/${post.slug}/`,
    })),
    customData: `<language>en</language>`,
  });
}