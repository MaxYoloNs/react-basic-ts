const path = require('path'); // node提供的path库
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // CSS 提取插件
const CompressionWebpackPlugin = require('compression-webpack-plugin'); // Gzip/Brotli 压缩插件
const CriticalCssPlugin = require('./scripts/critical-css-plugin'); // 关键 CSS 内联插件
const webpackBundleAnalyzer = require('webpack-bundle-analyzer'); // 可视化打包分析工具

// 自定义插件：生成 _redirects 文件（用于 Cloudflare Pages SPA 路由）
class GenerateRedirectsPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('GenerateRedirectsPlugin', (compilation) => {
            compilation.hooks.processAssets.tap({
                    name: 'GenerateRedirectsPlugin',
                    stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONAL, // 在资源处理完成后添加
                },
                () => {
                    const redirectsContent = '/*    /index.html   200\n';
                    compilation.emitAsset('_redirects', {
                        source: () => redirectsContent,
                        size: () => redirectsContent.length
                    });
                }
            );
        });
    }
}

// 使用函数形式导出配置，可以获取 webpack CLI 的 mode 参数
module.exports = (env, argv) => {
    // 从 webpack CLI 参数获取 mode，如果没有则从环境变量获取
    const mode = argv.mode || process.env.NODE_ENV || 'development';
    const isProduction = true;
    // const isProduction = mode === 'production';

    return {
        mode: mode,
        entry: './src/index.js', // 入口文件
        output: {
            filename: 'js/[name].[hash:8].js', // 每次打包生成随机字符串的文件名
            // filename: 'dist.js', // 输出文件名
            chunkFilename: 'js/[name].[hash:8].chunk.js', // 动态导入的 chunk
            path: path.resolve(__dirname, 'dist'), // 输出结果放在dist目录下
            // 设置 publicPath 为根路径，确保资源路径正确，这对 historyApiFallback 很重要
            publicPath: '/'
        },
        optimization: {
            minimize: isProduction, // 只在生产环境压缩
            usedExports: true, // 启用 Tree Shaking
            sideEffects: false, // 启用 Tree Shaking（标记为无副作用）
            // ⭐强制让 Webpack 输出 runtime（避免 vendor + main 耦合）
            runtimeChunk: isProduction ? 'single' : false, // 开发环境不需要单独 runtime
            splitChunks: {
                chunks: 'all', // 对所有代码块（包括异步代码块）进行分割
                minSize: 30000, // 增大最小 chunk 大小（30KB），减少小 chunk
                maxInitialRequests: isProduction ? 5 : Infinity, // 限制初始 chunk 数量
                maxAsyncRequests: isProduction ? 5 : Infinity, // 限制异步 chunk 数量
                cacheGroups: {
                    // 默认配置：禁用默认的 vendors 分组
                    default: false,
                    // React 核心库单独打包
                    react: {
                        test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                        name: 'react-vendor',
                        chunks: 'all',
                        priority: 30,
                        reuseExistingChunk: true,
                        enforce: true, // 强制创建这个 chunk
                    },
                    // Ant Design 单独打包（体积较大）
                    antd: {
                        test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
                        name: 'antd-vendor',
                        chunks: 'all',
                        priority: 25,
                        reuseExistingChunk: true,
                        enforce: true, // 强制创建这个 chunk
                    },
                    // Ant Design CSS 单独打包
                    antdStyles: {
                        test: /[\\/]node_modules[\\/]antd[\\/].*\.css$/,
                        name: 'antd-styles',
                        chunks: 'all',
                        priority: 30,
                        enforce: true,
                    },
                    // 其他第三方库 CSS
                    vendorStyles: {
                        test: /[\\/]node_modules[\\/].*\.css$/,
                        name: 'vendor-styles',
                        chunks: 'all',
                        priority: 20,
                        enforce: true,
                        // exclude: /[\\/]node_modules[\\/]antd[\\/]/,
                    },
                    // 其他第三方库（合并打包，避免过度分割）
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10,
                        reuseExistingChunk: true,
                        // 排除已经单独打包的库
                        // exclude: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|antd|@ant-design)[\\/]/,
                    },
                }
            },
            // 只在生产环境使用压缩
            minimizer: isProduction ? [
                new TerserWebpackPlugin({
                    parallel: true, // 启用并行压缩，提升速度
                    terserOptions: {
                        compress: {
                            drop_console: true, // 移除所有console语句
                            drop_debugger: true, // 移除debugger语句
                            pure_funcs: ['console.log'] // 也可指定移除特定函数
                        },
                        mangle: true, // 混淆变量名
                        format: {
                            comments: false // 移除所有注释
                        }
                    },
                    extractComments: false, // 不将注释提取到单独文件
                })
            ] : []
        },
        devServer: {
            // 配置静态文件服务，同时服务 dist 和 public 目录
            static: [{
                    directory: path.join(__dirname, 'dist'),
                },
                {
                    directory: path.join(__dirname, 'public'),
                    publicPath: '/', // public 目录的文件可以通过根路径访问
                }
            ],
            // 修复 BrowserRouter 刷新页面报错 "Cannot GET /detail" 的问题
            // 将所有 404 请求回退到 index.html，让 React Router 处理路由
            historyApiFallback: {
                // 回退到 index.html（相对于 publicPath）
                index: '/index.html',
                // 禁用点文件（如 .git）的重定向
                disableDotRule: true,
            },
            // 启用热更新
            hot: true,
            // 启用 gzip 压缩
            compress: true,
        },
        // 开发环境使用更快的 source map，生产环境使用 source-map
        devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
            alias: {
                '@/utils': path.resolve(__dirname, 'src/utils'),
            }
        },
        module: {
            rules: [
                // 针对 .css 文件
                {
                    test: /\.css$/i,
                    use: [
                        // 生产环境提取 CSS 为独立文件，开发环境使用 style-loader（支持热更新）
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader' // 将 CSS 转换为 CommonJS
                    ],
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ["@babel/preset-env", '@babel/preset-react'],
                            plugins: [
                                // 按需导入 Ant Design 组件和样式
                                [
                                    'import',
                                    {
                                        libraryName: 'antd',
                                        libraryDirectory: 'es', // 使用 ES 模块
                                        style: 'css', // 按需导入 CSS
                                    },
                                    'antd'
                                ],
                                // 按需导入 Ant Design Icons
                                [
                                    'import',
                                    {
                                        libraryName: '@ant-design/icons',
                                        libraryDirectory: 'es/icons',
                                        camel2DashComponentName: false,
                                    },
                                    'antd-icons'
                                ],
                            ],
                        }
                    }
                },
                {
                    // test: /\.svg$/,
                    test: /\.(png|svg|jpg|jpeg|gif|webp)$/i, // i表示忽略大小写，包含 webp
                    // 排除 public 目录的文件，让它们通过静态文件服务
                    exclude: [path.resolve(__dirname, 'public')],
                    // use: ['file-loader']
                    type: 'asset/resource'
                },
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: [path.resolve(__dirname, 'node_modules')],
                }
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: 'public/index.html',
                // filename: 'index.html', // 确保输出文件名为 index.html
                // inject: 'body', // 将脚本注入到 body 标签中
            }),
            // 自动生成 _redirects 文件（用于 Cloudflare Pages SPA 路由）
            new GenerateRedirectsPlugin(),
            // 生产环境提取 CSS 为独立文件
            ...(isProduction ? [
                new MiniCssExtractPlugin({
                    filename: 'css/[name].[contenthash:8].css',
                    chunkFilename: 'css/[name].[contenthash:8].chunk.css',
                    // 忽略 CSS 顺序警告（Ant Design 可能有样式顺序依赖）
                    ignoreOrder: true,
                }),
                // Gzip 压缩
                new CompressionWebpackPlugin({
                    algorithm: 'gzip',
                    test: /\.(css|js|html|svg)$/,
                    threshold: 10240, // 只压缩大于 10KB 的文件
                    minRatio: 0.8, // 只压缩压缩率小于 0.8 的文件
                    deleteOriginalAssets: false, // 保留原文件
                }),
                // Brotli 压缩（更好的压缩率）
                new CompressionWebpackPlugin({
                    filename: '[path][base].br',
                    algorithm: 'brotliCompress',
                    test: /\.(css|js|html|svg)$/,
                    threshold: 10240,
                    minRatio: 0.8,
                    deleteOriginalAssets: false,
                }),
                // 关键 CSS 内联
                new CriticalCssPlugin({
                    maxSize: 50, // 最大 50KB
                    extractLines: 500, // 提取前 500 行（简化版本）
                }),
            ] : []),
            // 只在需要分析时启用 Bundle Analyzer
            // 生产环境可以通过环境变量控制：ANALYZE=true npm run build
            ...(process.env.ANALYZE === 'true' ? [
                new webpackBundleAnalyzer.BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    openAnalyzer: true,
                    reportFilename: 'bundle-report.html',
                })
            ] : [])
        ]
    };
};