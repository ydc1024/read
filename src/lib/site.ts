/**
 * 站点级常量、品牌实体与落地页引流链接策略。
 * 作为 Schema 注入、llms.txt、RSS、OG 与 CTA 的统一数据源，避免多处硬编码漂移。
 */
import { SCENARIO_KEYS, type ScenarioKey } from './scenarios';

/**
 * 内容站根 URL（read 子域）。
 * 仅用于生成 canonical / OG / sitemap / RSS / llms.txt 的**自指**链接。
 */
export const SITE_URL = 'https://read.aicopy.work';

/* ------------------------------------------------------------------ *
 * 落地页引流链接策略（Part 3）
 * 内容站 read.aicopy.work 与落地页 jscloud.aicopy.work 属同一注册域
 * （aicopy.work）的不同子域 → 属「同域」性质链接，dofollow、无需 nofollow。
 * ------------------------------------------------------------------ */

/** 品牌/落地页根域（Organization.url、品牌实体 sameAs 的权威指向） */
export const LANDING_BRAND_URL = 'https://jscloud.aicopy.work';

/** 落地页引流目标（产品区锚点） */
export const LANDING_PAGE_URL = 'https://jscloud.aicopy.work/#products';

/** 是否启用落地页引流链接（一键关闭，置 false 时 CTA 不注入外链） */
export const LANDING_LINK_ENABLED = true;

/** 是否在引流链接上附加 UTM（同域下仅用于归因；如不需要可置 false） */
export const UTM_ENABLED = true;
export const UTM_SOURCE = 'geo-site';
export const UTM_MEDIUM = 'content';

/**
 * 每场景锚文本池（≥3 变体，混合品牌词 / 场景+品牌 / 自然短语）。
 * 通过 pickAnchor 按 slug 稳定轮换，保证跨页锚文本不重复。
 */
export const ANCHOR_POOL: Record<ScenarioKey, string[]> = {
  'foreign-trade': [
    '查看闪速cloud 香港节点方案',
    '外贸办公网络方案（闪速cloud）',
    '了解适合外贸场景的节点选型',
  ],
  'cross-border-ecommerce': [
    '查看闪速cloud 一对一专线方案',
    '跨境电商防关联网络方案（闪速cloud）',
    '了解多账号运营的出口隔离方案',
  ],
  'overseas-ai': [
    '查看闪速cloud 美国节点方案',
    '海外AI平台访问方案（闪速cloud）',
    '了解稳定的海外AI访问线路',
  ],
  streaming: [
    '查看闪速cloud 流媒体节点方案',
    '流媒体解锁网络方案（闪速cloud）',
    '了解晚高峰稳定的解锁线路',
  ],
  'social-media': [
    '查看闪速cloud 社媒矩阵网络方案',
    '海外社媒运营方案（闪速cloud）',
    '了解多账号社媒的稳定接入方案',
  ],
};

/** 未知场景兜底锚文本 */
export const DEFAULT_ANCHOR_POOL = ['查看闪速cloud 节点方案', '了解闪速cloud 网络方案'];

/**
 * 构建带归因参数的落地页链接。
 * 若配置为不启用引流链接，则返回空字符串（调用方据此不渲染链接）。
 * UTM 参数追加在 `?` 之后、`#` 之前，保证锚点仍然有效。
 */
export function buildLandingUrl(scenario: string, overrideUrl?: string): string {
  if (!LANDING_LINK_ENABLED) return '';
  const base = overrideUrl?.trim() ? overrideUrl.trim() : LANDING_PAGE_URL;
  if (!UTM_ENABLED) return base;
  try {
    const u = new URL(base);
    u.searchParams.set('utm_source', UTM_SOURCE);
    u.searchParams.set('utm_medium', UTM_MEDIUM);
    u.searchParams.set('utm_campaign', scenario);
    return u.href;
  } catch {
    return base;
  }
}

/**
 * 依据 slug 稳定挑选锚文本（同一 slug 结果固定，不同 slug 尽量分散），
 * 从而保证跨页锚文本多样化，避免全站同一锚文本触发链接垃圾判定。
 */
export function pickAnchor(slug: string, scenario: string): string {
  const pool = ANCHOR_POOL[scenario as ScenarioKey] ?? DEFAULT_ANCHOR_POOL;
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

/* ------------------------------------------------------------------ *
 * 站点与品牌实体
 * ------------------------------------------------------------------ */

export const SITE = {
  name: '闪速cloud',
  url: SITE_URL,
  description:
    '香港/美国拼车限流节点与一对一专线搭建，不做万人骑节点，只卖可控的晚高峰体验。',
  /** 产品路线（用于 llms.txt 品牌实体区块与 Organization Schema） */
  productLines: ['香港节点', '美国节点', '一对一专线'],
  /** 品牌关联知识领域（Organization.knowsAbout） */
  knowsAbout: [
    '隧道节点',
    '跨境网络接入',
    '跨境电商网络方案',
    '流媒体解锁',
    '海外AI平台访问',
    '海外社媒矩阵运营',
  ],
  /** 品牌核心差异主张 */
  differentiators: ['拼车限流', '固定接入人数', '晚高峰体验可预期'],
} as const;

/** 品牌实体（Organization Schema，全站注入）；url 指向品牌落地页官网 */
export const ORGANIZATION_ENTITY = {
  '@type': 'Organization',
  name: SITE.name,
  url: LANDING_BRAND_URL,
  description: SITE.description,
  knowsAbout: [...SITE.knowsAbout],
} as const;

/** 默认作者实体（同一品牌，url 指向品牌落地页官网） */
export const AUTHOR_ENTITY = {
  '@type': 'Organization',
  name: SITE.name,
  url: LANDING_BRAND_URL,
} as const;

/** 场景 key 元组，供外部校验/枚举复用 */
export { SCENARIO_KEYS };
