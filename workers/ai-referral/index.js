/**
 * AI 引荐流量采集 Worker（工程规格书 §9.2，确认项 5）。
 *
 * 部署为站点域名前的 Worker Route（如 `jscloud.aicopy.work/*`），职责：
 *   1. 解析入站请求的 Referer，匹配 AI 平台域名白名单；
 *   2. 命中则异步写入 Supabase `ai_referrals` 表（不阻塞响应）；
 *   3. 透传请求到源站（Cloudflare Pages）。
 *
 * 环境变量：
 *   ORIGIN              源站地址，如 https://geo-site.pages.dev
 *   SUPABASE_URL        https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY（secret）service_role key
 */

/** AI 平台 → Referer 域名白名单（后缀匹配） */
const AI_PLATFORMS = [
  { platform: 'chatgpt', hosts: ['chat.openai.com', 'chatgpt.com'] },
  { platform: 'perplexity', hosts: ['perplexity.ai', 'www.perplexity.ai'] },
  { platform: 'claude', hosts: ['claude.ai'] },
  { platform: 'gemini', hosts: ['gemini.google.com'] },
  { platform: 'copilot', hosts: ['copilot.microsoft.com'] },
  { platform: 'kimi', hosts: ['kimi.moonshot.cn'] },
];

export default {
  async fetch(request, env, ctx) {
    const referer = request.headers.get('Referer') || '';
    const match = detectAiPlatform(referer);

    if (match) {
      ctx.waitUntil(recordReferral(env, match.platform, referer, request));
    }

    return proxyToOrigin(request, env);
  },
};

function detectAiPlatform(referer) {
  if (!referer) return null;

  let host;
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }

  for (const entry of AI_PLATFORMS) {
    for (const allowed of entry.hosts) {
      if (host === allowed || host.endsWith(`.${allowed}`)) {
        return { platform: entry.platform, host };
      }
    }
  }
  return null;
}

async function recordReferral(env, platform, referer, request) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;

  const url = new URL(request.url);
  const body = {
    ai_platform: platform,
    referer,
    path: url.pathname,
    session_id: request.headers.get('CF-Ray') || null,
  };

  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/ai_referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // 度量失败不得影响正常访问
    console.error('recordReferral failed', error);
  }
}

async function proxyToOrigin(request, env) {
  const origin = env.ORIGIN;
  if (!origin) {
    return new Response('ORIGIN is not configured', { status: 500 });
  }

  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, origin);

  return fetch(new Request(target, request));
}
