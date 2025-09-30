import type { APIContext } from 'astro';

export function GET({ site }: APIContext) {
  const base = site ?? 'https://flutterspecialists.eu';
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${base}/sitemap-index.xml`
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}