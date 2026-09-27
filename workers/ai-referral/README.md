# AI 引荐度量 Worker

按工程规格书 §9.2 采集 AI 平台引荐流量，写入 Supabase `ai_referrals`。

## 工作原理

```
访客（来自 chatgpt.com / perplexity.ai / …）
        │
        ▼
[本 Worker]  解析 Referer → 命中白名单 → 异步写 ai_referrals
        │
        ▼
[Cloudflare Pages 源站]  正常返回页面
```

## 部署

```bash
cd workers/ai-referral
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler deploy
```

随后在 Cloudflare 控制台为域名 `jscloud.aicopy.work` 添加 Worker Route：
`jscloud.aicopy.work/*` → `geo-ai-referral`。

> ⚠️ 该 Route 会使所有站点流量经过 Worker。若仅需度量、不希望代理全部流量，可改为在 Pages Functions 中以中间件方式实现同等逻辑。

## 识别口径

`ai_platform` 取值：`chatgpt` / `perplexity` / `claude` / `gemini` / `copilot` / `kimi`。

**验收口径**（§9.2 调整）：将"AI 引荐流量"定义为 **Referer 命中白名单的访问会话数**。

## 周报查询

```sql
select ai_platform, count(*) as sessions
from ai_referrals
where occurred_at >= now() - interval '7 days'
group by ai_platform
order by sessions desc;
```
