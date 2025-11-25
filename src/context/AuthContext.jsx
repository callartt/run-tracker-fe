import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    setToken(storedToken);
                    // Fetch user profile from backend
                    const response = await api.get('/users/me');
                    setUser(response.data);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error("Failed to load user", err);
                    // If 401, the interceptor might have already handled it, but good to be safe
                    if (err.response && err.response.status === 401) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {

            const response = await api.post('/auth/sign-in', {
                email: email,
                password: password
            });

            const { access_token, token_type } = response.data;

            localStorage.setItem('token', access_token);
            setToken(access_token);

            // Fetch user details immediately after login
            try {
                const userResponse = await api.get('/users/me');
                setUser(userResponse.data);
                setIsAuthenticated(true);
                return true;
            } catch (userErr) {
                console.error("Failed to fetch user details after login", userErr);
                setError("Login successful but failed to load user profile");
                return false;
            }

        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/sign-up', userData);
            return true;
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (updateData) => {
        setLoading(true);
        try {
            const response = await api.patch('/users/me', updateData);
            setUser(prev => ({ ...prev, ...response.data }));
            return true;
        } catch (err) {
            console.error("Failed to update user", err);
            setError(err.response?.data?.detail || 'Update failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            loading,
            error,
            login,
            register,
            logout,
            updateUser
        }}>
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
