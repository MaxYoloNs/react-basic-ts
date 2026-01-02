// Cloudflare Workers Site 入口文件
// 用于提供静态资源并支持 React SPA 路由

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url)
    let pathname = url.pathname

    // 如果路径是根路径，返回 index.html
    if (pathname === '/') {
        pathname = '/index.html'
    }

    // 如果路径不包含文件扩展名，可能是 SPA 路由，返回 index.html
    if (!pathname.includes('.')) {
        pathname = '/index.html'
    }

    // 从 Workers Site 的 bucket 中获取文件
    // Workers Site 会自动将 bucket 中的文件映射到请求路径
    return fetch(request)
}