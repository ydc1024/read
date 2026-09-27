/**
 * 五大业务场景定义。
 * 与内容单元 frontmatter 的 scenario 字段、Sveltia CMS 的 select 选项保持一致。
 */

export const SCENARIO_KEYS = [
  'foreign-trade',
  'cross-border-ecommerce',
  'overseas-ai',
  'streaming',
  'social-media',
] as const;

export type ScenarioKey = (typeof SCENARIO_KEYS)[number];

export interface ScenarioMeta {
  key: ScenarioKey;
  /** 完整场景名称（用于分组标题） */
  label: string;
  /** 简短标签（用于卡片角标） */
  shortLabel: string;
  /** 该场景的预置静态 OG 图（MVP 决策：每场景 1 张，PNG 1200x630） */
  ogImage: string;
  /** 展示排序 */
  order: number;
}

export const SCENARIOS: Record<ScenarioKey, ScenarioMeta> = {
  'foreign-trade': {
    key: 'foreign-trade',
    label: '外贸SOHO与跨境办公',
    shortLabel: '外贸办公',
    ogImage: '/images/og/foreign-trade.png',
    order: 1,
  },
  'cross-border-ecommerce': {
    key: 'cross-border-ecommerce',
    label: '跨境电商与多账号运营',
    shortLabel: '跨境电商',
    ogImage: '/images/og/cross-border-ecommerce.png',
    order: 2,
  },
  'overseas-ai': {
    key: 'overseas-ai',
    label: '海外AI平台使用',
    shortLabel: '海外AI',
    ogImage: '/images/og/overseas-ai.png',
    order: 3,
  },
  streaming: {
    key: 'streaming',
    label: '流媒体与内容消费',
    shortLabel: '流媒体',
    ogImage: '/images/og/streaming.png',
    order: 4,
  },
  'social-media': {
    key: 'social-media',
    label: '海外社媒运营与矩阵营销',
    shortLabel: '社媒运营',
    ogImage: '/images/og/social-media.png',
    order: 5,
  },
};

/** 按 order 升序排列的场景列表 */
export const SCENARIO_LIST: ScenarioMeta[] = SCENARIO_KEYS.map(
  (key) => SCENARIOS[key],
).sort((a, b) => a.order - b.order);

export function getScenario(key: string): ScenarioMeta | undefined {
  return SCENARIOS[key as ScenarioKey];
}

/** 场景的显示名称，兜底返回原始 key */
export function scenarioLabel(key: string): string {
  return SCENARIOS[key as ScenarioKey]?.label ?? key;
}
