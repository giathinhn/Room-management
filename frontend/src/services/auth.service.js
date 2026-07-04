import api from './api';

/**
 * Auth service — wraps all auth-related API calls
 */

/**
 * Register a new user account
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 */
export const register = async (email, password, fullName) => {
  const { data } = await api.post('/auth/register', { email, password, fullName });
  return data;
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 */
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

/**
 * Logout — invalidate refresh token on server
 * @param {string} refreshToken
 */
export const logout = async (refreshToken) => {
  const { data } = await api.post('/auth/logout', { refreshToken });
  return data;
};

/**
 * Refresh access token
 * @param {string} refreshToken
 */
export const refreshToken = async (token) => {
  const { data } = await api.post('/auth/refresh', { refreshToken: token });
  return data;
};

/**
 * Get current user profile
 */
export const getProfile = async () => {
  const { data } = await api.get('/profile');
  return data;
};

/**
 * Update user profile
 * @param {{ fullName?: string, phone?: string, department?: string, avatar?: string }} profileData
 */
export const updateProfile = async (profileData) => {
  const { data } = await api.put('/profile', profileData);
  return data;
};

/**
 * Upload profile avatar
 * @param {File} file
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

/**
 * Get personal stats
 */
export const getPersonalStats = async () => {
  const { data } = await api.get('/profile/stats');
  return data;
};

/**
 * Change password
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await api.put('/profile/password', { currentPassword, newPassword });
  return data;
};

const authService = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  uploadAvatar,
  getPersonalStats,
  changePassword,
};

export default authService;
