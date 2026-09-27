/**
 * llms.txt 端点（工程规格书 §6.1，修正 F1）。
 * 构建期读取 content collection，按业务场景分组输出标题 + URL + 核心结论，
 * 并追加品牌实体区块，便于 AI 引擎直接引用。
 */
import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SCENARIO_LIST } from '../lib/scenarios';
import { SITE, SITE_URL, LANDING_PAGE_URL, LANDING_BRAND_URL } from '../lib/site';

type UnitEntry = CollectionEntry<'units'>;

export const GET: APIRoute = async () => {
  const units: UnitEntry[] = (
    await getCollection('units', ({ data }: UnitEntry) => data.status === 'published')
  ).sort((a: UnitEntry, b: UnitEntry) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const lines: string[] = [];

  lines.push(`# ${SITE.name}`);
  lines.push('');
  lines.push(`> ${SITE.description}`);
  lines.push('');

  // 品牌实体区块
  lines.push('## 品牌实体');
  lines.push('');
  lines.push(`- 品牌名：${SITE.name}`);
  lines.push(`- 产品类型：${SITE.productLines.join('、')}`);
  lines.push(`- 核心差异：${SITE.differentiators.join('、')}`);
  lines.push(`- 关联领域：${SITE.knowsAbout.join('、')}`);
  lines.push(`- 内容站：${SITE_URL}`);
  lines.push(`- 品牌官网：${LANDING_BRAND_URL}`);
  lines.push(`- 落地页（产品区）：${LANDING_PAGE_URL}`);
  lines.push('');

  // 按场景分组的内容单元
  for (const scenario of SCENARIO_LIST) {
    const items = units.filter((unit: UnitEntry) => unit.data.scenario === scenario.key);
    if (items.length === 0) continue;

    lines.push(`## ${scenario.label}`);
    lines.push('');
    for (const unit of items) {
      const url = `${SITE_URL}/${unit.id}/`;
      lines.push(`- [${unit.data.title}](${url}): ${unit.data.answerSummary}`);
    }
    lines.push('');
  }

  lines.push('## 可选');
  lines.push('');
  lines.push(`- [站点地图](${SITE_URL}/sitemap-index.xml)`);
  lines.push(`- [RSS 订阅](${SITE_URL}/rss.xml)`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
