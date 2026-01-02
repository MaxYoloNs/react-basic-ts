/**
 * 实现用户登录/注销功能
 * 使用 Context 管理全局用户状态
 * 使用 React Router 实现路由保护
 * 某些页面需要登录后才能访问
 * @returns 
 */
import React, { useEffect, Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import router from './router';
import Loading from './components/Loading';
// 移除全量导入，使用 babel-plugin-import 按需加载样式
// import 'antd/dist/antd.css'; // 导入 Ant Design 样式
import './App.css';

/**
 * 预加载图片
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise} 返回 Promise，图片加载完成后 resolve
 */
const preloadImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`✅ 图片预加载成功: ${imageUrl}`);
      resolve(img);
    };
    img.onerror = () => {
      console.error(`❌ 图片预加载失败: ${imageUrl}`);
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    img.src = imageUrl;
  });
};

function App() {
  // 组件挂载时预加载图片
  useEffect(() => {
    const imageUrl = '/OIP.webp';
    preloadImage(imageUrl).catch((error) => {
      console.warn('图片预加载警告:', error.message);
    });
  }, []);

  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} fallbackElement={<Loading />} />
      </Suspense>
    </AuthProvider>
  );
}

// function AuthButtons() {
//   const { userInfo, logout } = useAuth();
//   console.log('userInfo', userInfo);

//   return (
//     <div className="auth-buttons">
//       {userInfo ? (
//         <>
//           <span>欢迎, {userInfo.name}</span>
//           <button onClick={logout} className="logout-btn">
//             退出登录
//           </button>
//         </>
//       ) : (
//         // <Navigate to="/login" replace />
//         <PublicPage />
//       )}
//     </div>
//   );
// }

export default App;
