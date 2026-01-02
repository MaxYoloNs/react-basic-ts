/**
 * 关键 CSS 内联插件
 * 提取首屏关键 CSS 并内联到 HTML 中
 */

class CriticalCssPlugin {
    constructor(options = {}) {
        this.options = {
            // 关键 CSS 文件路径（相对于 dist 目录）
            cssFile: 'css/antd-styles.*.css',
            // 最大内联 CSS 大小（KB）
            maxSize: 50,
            // 提取的行数（简化版本，实际应该使用 critical 工具）
            extractLines: 500,
            ...options,
        };
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('CriticalCssPlugin', (compilation, callback) => {
            // 只在生产环境执行
            if (compilation.options.mode !== 'production') {
                callback();
                return;
            }

            // 查找 Ant Design CSS 文件
            const cssAssets = Object.keys(compilation.assets).filter(asset =>
                asset.includes('css/antd-styles') && asset.endsWith('.css')
            );

            if (cssAssets.length === 0) {
                callback();
                return;
            }

            const cssAsset = cssAssets[0];
            const cssContent = compilation.assets[cssAsset].source();

            // 提取关键 CSS（简化版本：提取前 N 行）
            // 实际项目中应该使用 critical 工具根据页面内容提取
            const lines = cssContent.split('\n');
            const criticalLines = lines.slice(0, this.options.extractLines);
            const criticalCSS = criticalLines.join('\n');

            // 检查大小
            const criticalSizeKB = Buffer.byteLength(criticalCSS, 'utf8') / 1024;
            if (criticalSizeKB > this.options.maxSize) {
                // 如果超过最大大小，只提取前一部分
                const maxLines = Math.floor((this.options.maxSize * 1024) / (Buffer.byteLength(lines[0] || '', 'utf8') + 1));
                const limitedCriticalCSS = lines.slice(0, maxLines).join('\n');
                this.inlineCriticalCSS(compilation, limitedCriticalCSS);
            } else {
                this.inlineCriticalCSS(compilation, criticalCSS);
            }

            callback();
        });
    }

    inlineCriticalCSS(compilation, criticalCSS) {
        // 查找 HTML 文件
        const htmlAssets = Object.keys(compilation.assets).filter(asset =>
            asset.endsWith('.html')
        );

        htmlAssets.forEach(htmlAsset => {
            let htmlContent = compilation.assets[htmlAsset].source();

            // 在 </head> 标签前插入关键 CSS
            const criticalStyleTag = `<style id="critical-css">${criticalCSS}</style>`;

            // 检查是否已经存在关键 CSS
            if (htmlContent.includes('id="critical-css"')) {
                // 替换现有的关键 CSS
                htmlContent = htmlContent.replace(
                    /<style id="critical-css">[\s\S]*?<\/style>/,
                    criticalStyleTag
                );
            } else {
                // 在 </head> 前插入
                htmlContent = htmlContent.replace('</head>', `${criticalStyleTag}\n</head>`);
            }

            // 更新 HTML 资源
            compilation.assets[htmlAsset] = {
                source: () => htmlContent,
                size: () => htmlContent.length,
            };
        });
    }
}

module.exports = CriticalCssPlugin;