/**
 * RSS 2.0 订阅端点（工程规格书 §6.4）。
 * 输出已发布内容单元的标题、摘要与链接。
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE, SITE_URL } from '../lib/site';

type UnitEntry = CollectionEntry<'units'>;

export const GET: APIRoute = async (context) => {
  const units: UnitEntry[] = (
    await getCollection('units', ({ data }: UnitEntry) => data.status === 'published')
  ).sort((a: UnitEntry, b: UnitEntry) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE_URL,
    trailingSlash: false,
    items: units.map((unit: UnitEntry) => ({
      title: unit.data.title,
      description: unit.data.answerSummary,
      pubDate: unit.data.pubDate,
      link: `/${unit.id}/`,
    })),
    customData: '<language>zh-cn</language>',
  });
};
