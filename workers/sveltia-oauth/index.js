/**
 * Sveltia CMS / Decap CMS GitHub OAuth 代理（工程规格书 §6.2，修正 F2）。
 *
 * 三步握手：
 *   1. GET /auth      -> 302 重定向到 GitHub 授权页
 *   2. GET /callback  -> 用 code 换取 access_token
 *   3. 返回 HTML，通过 postMessage 把 token 回传给 CMS 前端
 *
 * 环境变量（在 Cloudflare Worker 中配置，禁止硬编码）：
 *   GITHUB_OAUTH_CLIENT_ID
 *   GITHUB_OAUTH_CLIENT_SECRET
 *
 * GitHub OAuth App 的 Authorization callback URL 必须配置为：
 *   https://<worker-domain>/callback
 */

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      return handleAuth(url, env);
    }

    if (url.pathname === '/callback') {
      return handleCallback(url, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

function handleAuth(url, env) {
  if (!env.GITHUB_OAUTH_CLIENT_ID) {
    return new Response('GITHUB_OAUTH_CLIENT_ID is not configured', { status: 500 });
  }

  const authUrl = new URL(GITHUB_AUTHORIZE);
  authUrl.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
  authUrl.searchParams.set('scope', 'repo,user');
  authUrl.searchParams.set('state', crypto.randomUUID());

  return Response.redirect(authUrl.toString(), 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get('code');
  if (!code) {
    return new Response('Missing "code" parameter', { status: 400 });
  }
  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    return new Response('OAuth credentials are not configured', { status: 500 });
  }

  const tokenResponse = await fetch(GITHUB_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();

  const message =
    tokenData && tokenData.access_token
      ? `authorization:github:success:${JSON.stringify({
          token: tokenData.access_token,
          provider: 'github',
        })}`
      : `authorization:github:error:${JSON.stringify(tokenData)}`;

  const html = `<!doctype html>
<html lang="zh-CN">
  <head><meta charset="utf-8" /><title>Authorizing…</title></head>
  <body>
    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        function receiveMessage(event) {
          window.opener.postMessage(message, event.origin);
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
