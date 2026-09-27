import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * 内容单元集合（Content Collection）。
 * 采用 Astro Content Layer API：glob loader + Zod（Astro 7 内置 Zod v4）校验。
 * 与工程规格书 §6.2 Frontmatter 定义、§7.1 数据模型保持一致。
 */

const INTENTS = [
  'informational',
  'commercial',
  'navigational',
  'transactional',
] as const;

const SCENARIOS = [
  'foreign-trade',
  'cross-border-ecommerce',
  'overseas-ai',
  'streaming',
  'social-media',
] as const;

const ENTITY_TYPES = [
  'Organization',
  'Product',
  'Concept',
  'Platform',
  'Thing',
] as const;

const SCHEMA_TYPES = ['FAQPage', 'Article', 'HowTo'] as const;

const STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'published',
] as const;

const entitySchema = z.object({
  name: z.string(),
  type: z.enum(ENTITY_TYPES),
  /** 权威来源链接（Wikipedia、官方文档等） */
  sameAs: z.string().optional(),
  /** 关联实体名称（用于实体关系标记） */
  relatedTo: z.array(z.string()).optional(),
  brand: z.string().optional(),
});

const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const sourceFactSchema = z.object({
  statement: z.string(),
  sourceUrl: z.string(),
  sourceTitle: z.string().optional(),
  credibilityScore: z.number().min(0).max(1).optional(),
  freshness: z.enum(['fresh', 'recent', 'stale']).optional(),
});

const ctaSchema = z.object({
  text: z.string(),
  link: z.string(),
  /** 落地页锚文本（可选；缺省时按场景锚文本池轮换，保证跨页不重复） */
  anchor: z.string().optional(),
});

const units = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/units' }),
  schema: z.object({
    /** 问题式标题，直接对应 AI 搜索中的对话式查询 */
    title: z.string(),
    /** 页面描述（meta description / OG description） */
    description: z.string(),
    /** 标准化答案（2-3 句核心结论，页面 answer-summary） */
    answerSummary: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** 业务场景标签 */
    scenario: z.enum(SCENARIOS),
    /** 搜索意图 */
    intent: z.enum(INTENTS),
    /** 内容状态（流水线写入；仅 published 会进入站点与 llms.txt） */
    status: z.enum(STATUSES).default('published'),
    /** 主 Schema 类型 */
    schemaType: z.enum(SCHEMA_TYPES),
    /** 核心实体列表（≥1，GEO 校验要求页面核心实体≥5，由内容侧保证） */
    entities: z.array(entitySchema).min(1),
    faq: z.array(faqSchema).default([]),
    /** 场景化结论（CTA） */
    cta: ctaSchema,
    /** 覆盖默认场景 OG 图（可选） */
    ogImage: z.string().optional(),
    /** 流水线产出的评分（可选，人工录入时可省略） */
    geoScore: z.number().min(0).max(100).optional(),
    aiToneScore: z.number().min(0).max(100).optional(),
    /** 来源事实清单 */
    sourceFacts: z.array(sourceFactSchema).default([]),
  }),
});

export const collections = { units };
