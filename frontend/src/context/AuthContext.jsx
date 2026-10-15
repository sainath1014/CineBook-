import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cinebook_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check current token
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        setUser(res.data);
      } catch (err) {
        console.error('Session expired or invalid token:', err);
        localStorage.removeItem('cinebook_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('cinebook_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('cinebook_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('cinebook_token');
    setToken(null);
    setUser(null);
  };

  // Helper flags
  const isCustomer = user?.profile?.role === 'CUSTOMER';
  const isStaff = user?.profile?.role === 'STAFF';
  const isAdmin = user?.profile?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isCustomer,
        isStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
