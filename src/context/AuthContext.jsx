import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
}

const AuthProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(null)

    const updateUserInfo = (params) => {
        setUserInfo(prev=> ({ ...prev, ...params }))
    }

    const logout = () => {
        setUserInfo(null)
    }

    return (
        <AuthContext.Provider value={{ userInfo, login: updateUserInfo, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthProvider, useAuth };
