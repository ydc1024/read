// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 闪速cloud GEO 内容自动化站点
// 站点层：Astro 静态输出 + Schema 注入 + llms.txt/sitemap/rss
// 部署：Cloudflare Pages（构建命令 npm run build，输出目录 dist）
export default defineConfig({
  // 内容站根 URL（read.aicopy.work），用于生成绝对链接、canonical、sitemap 与 RSS。
  // 注意：这是「内容站」，不是落地页（落地页为 jscloud.aicopy.work，见 src/lib/site.ts）。
  site: 'https://read.aicopy.work',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // /admin 为 CMS 后台，不纳入站点地图
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  build: {
    // 静态 HTML 生成
    inlineStylesheets: 'auto',
  },
});
