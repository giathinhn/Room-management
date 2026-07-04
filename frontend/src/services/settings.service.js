import api from './api';

export const getUserSettings = async () => {
  const { data } = await api.get('/settings/user');
  return data;
};

export const updateUserSettings = async (settingsData) => {
  const { data } = await api.put('/settings/user', settingsData);
  return data;
};

export const getSystemSettings = async () => {
  const { data } = await api.get('/settings/system');
  return data;
};

export const updateSystemSettings = async (systemData) => {
  const { data } = await api.put('/settings/system', systemData);
  return data;
};

const settingsService = {
  getUserSettings,
  updateUserSettings,
  getSystemSettings,
  updateSystemSettings
};

export default settingsService;
