import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({children}) => {
  const { userInfo } = useAuth();
  console.log('userInfo', userInfo);
  
    return (
        userInfo ? children : <Navigate to="/login" replace></Navigate> 
    )
}

export default ProtectedRoute;


// ProtectedRoute.js
// import { useLocation, Navigate } from 'react-router-dom';
// import { useAuth } from './AuthContext';

// function ProtectedRoute({ children }) {
//   const { user } = useAuth();
//   const location = useLocation();

//   if (!user) {
//     // 重定向到登录页面，并保存当前试图访问的地址
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return children;
// }

// export default ProtectedRoute;