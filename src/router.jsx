import React, { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./pages/Login/ProtectedRoute";
// import AppLayout from "./components/AppLayout";

/**
 * React Router 声明式路由配置 - 支持懒加载
 * 使用 createBrowserRouter 创建基于 history API 的路由
 * 
 * 路由懒加载说明：
 * - lazy: 函数返回动态导入的模块
 * - 模块必须导出 default 组件，或者返回 { Component } 对象
 * - RouterProvider 的 fallbackElement 会在懒加载时显示
 * 
 * 路由配置说明：
 * - path: 路由路径
 * - lazy: 懒加载函数，返回 Promise<{ Component }> 或 Promise<{ default: Component }>
 * - element: 直接渲染组件（不使用懒加载时）
 * - children: 嵌套路由
 * - loader: 数据加载器（可选）
 * - action: 表单提交处理器（可选）
 * - errorElement: 错误边界组件（可选）
 */

// 懒加载包装函数，支持路由保护
const lazyWithProtection = (importFn, requireAuth = false) => {
  return async () => {
    const module = await importFn();
    const Component = module.default || module.Component || module;
    
    if (requireAuth) {
      return {
        Component: () => (
          <ProtectedRoute>
            <Component />
          </ProtectedRoute>
        ),
      };
    }
    
    return {
      Component: Component,
    };
  };
};

const AppLayoutLazy = React.lazy(() => import("./components/AppLayout"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Suspense fallback={<div>Loading...</div>}>
        <AppLayoutLazy />
        </Suspense>,
    children: [
      {
        index: true,
        lazy: () => import("./pages/Login/PublicPage").then(module => ({
          Component: module.default,
        })),
      },
      {
        path: "login",
        lazy: () => import("./pages/Login/Login").then(module => ({
          Component: module.default,
        })),
      },
      {
        path: "list",
        lazy: () => import("./pages/PageList/index").then(module => ({
            Component: module.default,
        })),
        children: [
          {
            path: "detail",
            lazy: () => import("./pages/PageList/PageDetail").then(module => ({
              Component: module.default,
            })),
          },
        ],
      },
    //   {
    //     path: "detail",
    //     lazy: () => import("./pages/PageList/PageDetail").then(module => ({
    //         Component: module.default,
    //       })),
    //   },
      {
        path: "dashboard",
        lazy: lazyWithProtection(() => import("./pages/Login/Dashboard"), true),
      },
      {
        path: "profile",
        lazy: lazyWithProtection(() => import("./pages/Login/Profile"), true),
      },
      {
        path: "profile/:id",
        lazy: lazyWithProtection(() => import("./pages/Login/Profile"), true),
      },
      {
        path: "tab",
        lazy: () => import("./pages/TabComponent").then(module => ({
          Component: module.default,
        })),
      },
      {
        path: "todo",
        lazy: () => import("./pages/ToDoList").then(module => ({
          Component: module.default,
        })),
      },
      {
        path: "visual-list",
        lazy: () => import("./pages/VisualList").then(module => ({
          Component: module.default,
        })),
      },
      {
        path: "turntable",
        lazy: () => import("./pages/Games/Turntable").then(module => ({
          Component: module.default,
        })),
      },
      {
        path: "egg-frenzy",
        lazy: () => import("./pages/Games/EggFrenzy").then(module => ({
          Component: module.default,
        })),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
