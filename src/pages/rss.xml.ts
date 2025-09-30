import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('articles'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Flutter Specialists — Articles',
    description: 'Consulting, training and insights for Flutter teams.',
    site: context.site ?? 'https://flutterspecialists.eu',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/articles/${post.slug}/`,
    })),
    customData: `<language>en</language>`,
  });
}