# Sveltia CMS OAuth 代理 Worker

为 [`public/admin/config.yml`](../../public/admin/config.yml) 提供 GitHub OAuth 授权，使 Sveltia CMS 能读写内容仓库（工程规格书 §6.2）。

## 部署步骤

1. 在 GitHub 创建 OAuth App：
   - `Homepage URL`：`https://jscloud.aicopy.work`
   - `Authorization callback URL`：`https://<worker-domain>/callback`（Worker 部署后再回填）

2. 部署 Worker：

   ```bash
   cd workers/sveltia-oauth
   npx wrangler deploy
   ```

3. 写入密钥（禁止硬编码到代码或 `wrangler.toml`）：

   ```bash
   npx wrangler secret put GITHUB_OAUTH_CLIENT_ID
   npx wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
   ```

4. 回填配置：
   - GitHub OAuth App 的 callback URL 填入实际 Worker 域名 `/callback`
   - 将 [`public/admin/config.yml`](../../public/admin/config.yml) 的 `backend.base_url` 改为该 Worker 域名
   - 将 `backend.repo` 改为实际仓库 `owner/repo`

5. 验证：访问 `https://jscloud.aicopy.work/admin/`，点击登录应弹出 GitHub 授权页并成功返回。

## 安全说明

- `GITHUB_OAUTH_CLIENT_SECRET` 仅存于 Worker secret，永不进入仓库。
- OAuth scope 为 `repo,user`，仅授予内容仓库读写所需权限。
