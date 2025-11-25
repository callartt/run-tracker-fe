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
                    // Verify token or fetch user profile if needed
                    // For now, we'll assume if token exists, we are authenticated
                    // You might want to add a /me endpoint call here to validate
                    setToken(storedToken);
                    setIsAuthenticated(true);

                    // Optional: Load user data if stored
                    const storedUser = localStorage.getItem('user_data');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (err) {
                    console.error("Failed to load user", err);
                    logout();
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
            setIsAuthenticated(true);

            // Ideally fetch user details here
            // const userResponse = await api.get('/users/me');
            // setUser(userResponse.data);
            // localStorage.setItem('user_data', JSON.stringify(userResponse.data));

            return true;
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
            logout
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
