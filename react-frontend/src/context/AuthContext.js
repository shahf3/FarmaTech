
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);

    
    fetchOrganizations();
  }, []);

  
  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/auth/organizations', {
        params: { type: 'manufacturer' }, // Filter for manufacturer organizations
      });
      setOrganizations(response.data);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure role is manufacturer
      const payload = { ...userData, role: 'manufacturer' };
      const response = await axios.post('http://localhost:3000/api/auth/register', payload);

      const { token } = response.data;

      // Fetch user data
      const userResponse = await axios.get('http://localhost:3000/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = userResponse.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);

      return user;
    } catch (err) {
      const errorMessage =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);

      return user;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Login failed. Please check your email and password.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const isFromOrganization = (organizationName) => {
    return currentUser?.organization === organizationName;
  };

  const isOrgAdmin = () => {
    return currentUser?.isOrgAdmin === true;
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        organizations,
        token: localStorage.getItem('token'),
        loading,
        error,
        register,
        login,
        logout,
        isFromOrganization,
        isOrgAdmin,
        fetchOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};