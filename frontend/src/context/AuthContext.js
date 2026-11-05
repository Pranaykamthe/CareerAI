import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('careerai_user');
    const token = localStorage.getItem('careerai_access_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh, user: userData } = response.data;

    localStorage.setItem('careerai_access_token', access);
    localStorage.setItem('careerai_refresh_token', refresh);
    localStorage.setItem('careerai_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    await api.post('/auth/register/', userData);
  };

  const logout = () => {
    localStorage.removeItem('careerai_access_token');
    localStorage.removeItem('careerai_refresh_token');
    localStorage.removeItem('careerai_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);