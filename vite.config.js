import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 站点正式域名由环境变量 VITE_SITE_URL 提供（构建环境或 .env 文件），未配置时使用该默认域名兜底
const FALLBACK_SITE_URL = 'https://yellow-smoke-0fff14810.azurestaticapps.net'

const SITE_NAME = '广州/佛山地铁报站模拟器'
const SITE_DESCRIPTION =
	'广州/佛山地铁报站模拟器，在线试听广州地铁 1、2、3、5、10、12、22 号线及广肇城际的普通话、粤语与英语站名报站音频。'

// 可索引页面，需与 src/pages.json 中的路由保持一致
const ROUTES = [
	{ path: '/', priority: '1.0', changefreq: 'weekly', title: '首页' },
	{ path: '/pages/line1/line1', priority: '0.8', changefreq: 'monthly', title: '1号线' },
	{ path: '/pages/line2/line2', priority: '0.8', changefreq: 'monthly', title: '2号线' },
	{ path: '/pages/line3/line3', priority: '0.8', changefreq: 'monthly', title: '3号线' },
	{ path: '/pages/line3/B4/index', priority: '0.7', changefreq: 'monthly', title: '3号线 B4' },
	{ path: '/pages/line3/B4/apn2hb', priority: '0.7', changefreq: 'monthly', title: '3号线 机场北——海傍' },
	{ path: '/pages/line4/line4', priority: '0.8', changefreq: 'monthly', title: '4号线' },
	{ path: '/pages/line5/line5', priority: '0.8', changefreq: 'monthly', title: '5号线' },
	{ path: '/pages/line6/line6', priority: '0.8', changefreq: 'monthly', title: '6号线' },
	{ path: '/pages/line10/line10', priority: '0.8', changefreq: 'monthly', title: '10号线' },
	{ path: '/pages/line12/line12', priority: '0.8', changefreq: 'monthly', title: '12号线' },
	{ path: '/pages/line22/line22', priority: '0.8', changefreq: 'monthly', title: '22号线' },
	{
		path: '/pages/guangzhou-zhaoqing-intercity/guangzhou-zhaoqing-intercity',
		priority: '0.8',
		changefreq: 'monthly',
		title: '广肇城际'
	},
	{
		path: '/pages/guangzhou-zhaoqing-intercity/xiaojinkou-zhaoqing',
		priority: '0.7',
		changefreq: 'monthly',
		title: '广肇城际 小金口——肇庆'
	},
	{
		path: '/pages/guangzhou-zhaoqing-intercity/express/xiaojinkou-zhaoqing',
		priority: '0.7',
		changefreq: 'monthly',
		title: '广肇城际 小金口——肇庆（快车）'
	},
	{ path: '/pages/station-list', priority: '0.6', changefreq: 'monthly', title: '站点列表（地铁）' },
	{ path: '/pages/station-list-intercity', priority: '0.6', changefreq: 'monthly', title: '站点列表（城际）' },
	{ path: '/pages/station-list-suburban', priority: '0.6', changefreq: 'monthly', title: '站点列表（市域）' }
]

const absoluteUrl = (siteUrl, path) => `${siteUrl}${path === '/' ? '/' : path}`

const buildRobotsTxt = (siteUrl) =>
	[
		'User-agent: *',
		'Allow: /',
		'',
		'# AI / LLM 爬虫（GEO）',
		'User-agent: GPTBot',
		'Allow: /',
		'',
		'User-agent: OAI-SearchBot',
		'Allow: /',
		'',
		'User-agent: ChatGPT-User',
		'Allow: /',
		'',
		'User-agent: ClaudeBot',
		'Allow: /',
		'',
		'User-agent: anthropic-ai',
		'Allow: /',
		'',
		'User-agent: PerplexityBot',
		'Allow: /',
		'',
		'User-agent: Google-Extended',
		'Allow: /',
		'',
		'User-agent: Applebot-Extended',
		'Allow: /',
		'',
		`Sitemap: ${siteUrl}/sitemap.xml`,
		''
	].join('\n')

const buildSitemapXml = (siteUrl) => {
	const lastmod = new Date().toISOString().slice(0, 10)
	const urls = ROUTES.map((route) =>
		[
			'  <url>',
			`    <loc>${absoluteUrl(siteUrl, route.path)}</loc>`,
			`    <lastmod>${lastmod}</lastmod>`,
			`    <changefreq>${route.changefreq}</changefreq>`,
			`    <priority>${route.priority}</priority>`,
			'  </url>'
		].join('\n')
	).join('\n')

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		'</urlset>',
		''
	].join('\n')
}

const buildLlmsTxt = (siteUrl) =>
	[
		`# ${SITE_NAME}`,
		'',
		'> 网站在线播放广州地铁与广肇城际的真实报站音频，支持普通话、粤语、英语三种语言，可按线路选择方向并逐站播放或停止播放。',
		'',
		'## 内容',
		...ROUTES.map((route) => `- [${route.title}](${absoluteUrl(siteUrl, route.path)})`),
		'',
		'## 说明',
		`- ${SITE_DESCRIPTION}`,
		'- 报站音频由爱好者提供，仅供学习、研究与怀旧用途，并非广州地铁官方产品或服务。',
		''
	].join('\n')

// H5 使用 history 路由。Cloudflare Pages 的 _redirects 会无条件生效（即便命中静态资源），
// 因此只对已知页面路由做 200 改写，避免影响 /assets、/sitemap.xml 等静态文件
const buildRedirects = () =>
	[
		...ROUTES.filter((route) => route.path !== '/').flatMap((route) => [
			`${route.path} /index.html 200`,
			`${route.path}/ /index.html 200`
		]),
		''
	].join('\n')

// 为生成文件声明 Content-Type，并让入口 HTML 走协商缓存
const buildHeaders = () =>
	[
		'/robots.txt',
		'  Content-Type: text/plain; charset=utf-8',
		'',
		'/sitemap.xml',
		'  Content-Type: application/xml; charset=utf-8',
		'',
		'/llms.txt',
		'  Content-Type: text/plain; charset=utf-8',
		'',
		'/index.html',
		'  Cache-Control: public, max-age=0, must-revalidate',
		''
	].join('\n')

const seoFilesPlugin = (siteUrl) => {
	const files = {
		'robots.txt': buildRobotsTxt(siteUrl),
		'sitemap.xml': buildSitemapXml(siteUrl),
		'llms.txt': buildLlmsTxt(siteUrl),
		'_redirects': buildRedirects(),
		'_headers': buildHeaders()
	}
	const contentTypes = {
		'robots.txt': 'text/plain; charset=utf-8',
		'sitemap.xml': 'application/xml; charset=utf-8',
		'llms.txt': 'text/plain; charset=utf-8',
		'_redirects': 'text/plain; charset=utf-8',
		'_headers': 'text/plain; charset=utf-8'
	}

	return {
		name: 'gzmtr-seo-files',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const fileName = (req.url || '').split('?')[0].replace(/^\//, '')
				if (!Object.prototype.hasOwnProperty.call(files, fileName)) {
					return next()
				}
				res.setHeader('Content-Type', contentTypes[fileName])
				res.end(files[fileName])
			})
		},
		generateBundle() {
			for (const fileName of Object.keys(files)) {
				this.emitFile({ type: 'asset', fileName, source: files[fileName] })
			}
		},
		transformIndexHtml(html) {
			const tags = [
				`<meta property="og:url" content="${siteUrl}/" />`,
				`<meta property="og:image" content="${siteUrl}/static/logo.png" />`,
				`<meta name="twitter:image" content="${siteUrl}/static/logo.png" />`
			].join('\n  ')
			return html.replace('</head>', `  ${tags}\n</head>`)
		}
	}
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	const siteUrl = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
	const plugins = [uni()]

	// 仅 H5 端需要 SEO/GEO 相关文件
	if (!process.env.UNI_PLATFORM || process.env.UNI_PLATFORM === 'h5') {
		if (!siteUrl) {
			console.warn(`[seo] 未配置 VITE_SITE_URL，sitemap.xml / robots.txt 将使用默认域名 ${FALLBACK_SITE_URL}`)
		}
		plugins.push(seoFilesPlugin(siteUrl || FALLBACK_SITE_URL))
	}

	return { plugins }
})
