// Cloudflare Workers Site 入口文件
// 用于提供静态资源并支持 React SPA 路由
// 
// 注意：当使用 wrangler.toml 中的 site.bucket 配置时，
// Cloudflare 会自动处理静态文件服务，此 Worker 主要用于处理 SPA 路由

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // 尝试从 Workers Site bucket 获取请求的文件
        // env.ASSETS 是 Workers Site 自动注入的绑定
        let response = await env.ASSETS.fetch(request);

        // 如果文件不存在（404）且不是静态资源请求，返回 index.html 以支持 SPA 路由
        if (response.status === 404) {
            // 检查是否是静态资源（有文件扩展名）
            const hasFileExtension = pathname.includes('.') &&
                !pathname.endsWith('/') &&
                pathname.split('/').pop().includes('.');

            // 如果不是静态资源，返回 index.html 以支持客户端路由
            if (!hasFileExtension) {
                const indexRequest = new Request(new URL('/index.html', request.url), {
                    method: request.method,
                    headers: request.headers,
                });
                response = await env.ASSETS.fetch(indexRequest);
            }
        }

        return response;
    }
};