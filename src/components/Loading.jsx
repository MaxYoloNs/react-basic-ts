import React from 'react';
import './Loading.css';

/**
 * 路由懒加载时的加载组件
 */
const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <p className="loading-text">加载中...</p>
    </div>
  );
};

export default Loading;
