import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';
import { useTheme } from './ThemeContext';
import i18n from '../i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // checking token on mount
  const { setTheme } = useTheme();

  // Sync user settings (theme, language, calendar view) when user object loads
  useEffect(() => {
    if (user && user.settings) {
      const { theme: userTheme, language, defaultCalendarView } = user.settings;
      if (userTheme) {
        setTheme(userTheme);
      }
      if (language) {
        i18n.changeLanguage(language);
      }
      if (defaultCalendarView) {
        localStorage.setItem('defaultCalendarView', defaultCalendarView);
      }
    }
  }, [user, setTheme]);

  // ─── Verify token on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getProfile();
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
        // Token is invalid or expired — try refresh token
        const storedRefresh = localStorage.getItem('refreshToken');
        if (storedRefresh) {
          try {
            const refreshRes = await authService.refreshToken(storedRefresh);
            localStorage.setItem('accessToken', refreshRes.data.accessToken);
            if (refreshRes.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
            }
            // Retry getting profile
            const profileRes = await authService.getProfile();
            setUser(profileRes.data);
            setIsAuthenticated(true);
          } catch {
            _clearTokens();
          }
        } else {
          _clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const _clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const _storeTokensAndUser = (tokens, userData) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // ─── Auth Actions ─────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    _storeTokensAndUser(
      { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken },
      res.data.user
    );
    return res;
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    const res = await authService.register(email, password, fullName);
    _storeTokensAndUser(
      { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken },
      res.data.user
    );
    return res;
  }, []);

  const logout = useCallback(async () => {
    const storedRefresh = localStorage.getItem('refreshToken');
    try {
      if (storedRefresh) await authService.logout(storedRefresh);
    } catch {
      // Ignore server error on logout — clear locally regardless
    }
    _clearTokens();
    toast.success('Đã đăng xuất thành công');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getProfile();
      setUser(res.data);
    } catch (err) {
      console.error("Failed to refresh user data", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
