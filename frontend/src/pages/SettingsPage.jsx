import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import settingsService from '../services/settings.service';
import toast from 'react-hot-toast';
import { FiSettings, FiBell, FiMonitor, FiSliders, FiSave, FiGlobe, FiSun } from 'react-icons/fi';
import './SettingsPage.css';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User Settings state
  const [userSettings, setUserSettingsState] = useState({
    emailNotifyApproved: true,
    emailNotifyRejected: true,
    emailNotifyCancelled: true,
    emailNotifyReminder: true,
    inAppNotifyApproved: true,
    inAppNotifyRejected: true,
    inAppNotifyCancelled: true,
    inAppNotifyReminder: true,
    language: 'vi',
    theme: 'system',
    defaultCalendarView: 'timeGridWeek'
  });

  // System Settings state
  const [systemSettings, setSystemSettingsState] = useState({
    workHourStart: '07:00',
    workHourEnd: '22:00',
    maxBookingDaysAhead: 30,
    minBookingDurationMin: 30,
    maxBookingDurationMin: 480,
    noShowReleaseTimeMin: 15,
    allowCancelApproved: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await settingsService.getUserSettings();
        if (userRes.success && userRes.data) {
          setUserSettingsState(userRes.data);
          // Set language locally if defined
          if (userRes.data.language) {
            i18n.changeLanguage(userRes.data.language);
          }
          // Sync theme context
          if (userRes.data.theme) {
            setTheme(userRes.data.theme);
          }
          if (userRes.data.defaultCalendarView) {
            localStorage.setItem('defaultCalendarView', userRes.data.defaultCalendarView);
          }
        }

        if (user?.role === 'admin') {
          const sysRes = await settingsService.getSystemSettings();
          if (sysRes.success && sysRes.data) {
            setSystemSettingsState(sysRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast.error('Không thể tải cấu hình cài đặt');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, i18n, setTheme]);

  const handleUserToggle = (field) => {
    setUserSettingsState((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleUserSelect = (field, value) => {
    setUserSettingsState((prev) => ({
      ...prev,
      [field]: value
    }));

    if (field === 'language') {
      i18n.changeLanguage(value);
    }
    if (field === 'theme') {
      setTheme(value);
    }
    if (field === 'defaultCalendarView') {
      localStorage.setItem('defaultCalendarView', value);
    }
  };

  const saveUserSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await settingsService.updateUserSettings(userSettings);
      if (res.success) {
        localStorage.setItem('defaultCalendarView', userSettings.defaultCalendarView);
        toast.success(t('settings.saveSuccess'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi lưu cấu hình cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleSysChange = (field, value) => {
    setSystemSettingsState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSystemSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await settingsService.updateSystemSettings({
        ...systemSettings,
        maxBookingDaysAhead: parseInt(systemSettings.maxBookingDaysAhead, 10),
        minBookingDurationMin: parseInt(systemSettings.minBookingDurationMin, 10),
        maxBookingDurationMin: parseInt(systemSettings.maxBookingDurationMin, 10),
        noShowReleaseTimeMin: parseInt(systemSettings.noShowReleaseTimeMin, 10),
      });
      if (res.success) {
        toast.success(t('settings.system.saveSuccess'));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('settings.system.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header">
        <div className="settings-title-group">
          <FiSettings className="settings-icon-large" />
          <div>
            <h1>{t('settings.title')}</h1>
            <p className="settings-subtitle">Cấu hình các thiết lập tài khoản và quy tắc vận hành</p>
          </div>
        </div>
      </div>

      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <div className="settings-sidebar">
          <button 
            className={`sidebar-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <FiMonitor className="btn-icon" />
            <span>{t('settings.tabs.personal')}</span>
          </button>
          
          <button 
            className={`sidebar-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell className="btn-icon" />
            <span>{t('settings.tabs.notifications')}</span>
          </button>

          {user?.role === 'admin' && (
            <button 
              className={`sidebar-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <FiSliders className="btn-icon" />
              <span>{t('settings.tabs.system')}</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="settings-content-card">
          {activeTab === 'personal' && (
            <form onSubmit={saveUserSettings} className="settings-form">
              <h2 className="section-title">
                <FiGlobe className="title-icon" />
                {t('settings.display.title')}
              </h2>

              <div className="form-group-grid">
                <div className="form-item">
                  <label htmlFor="language-select">{t('settings.display.language')}</label>
                  <div className="select-wrapper">
                    <select
                      id="language-select"
                      value={userSettings.language}
                      onChange={(e) => handleUserSelect('language', e.target.value)}
                    >
                      <option value="vi">Tiếng Việt (🇻🇳)</option>
                      <option value="en">English (🇬🇧)</option>
                    </select>
                  </div>
                </div>

                <div className="form-item">
                  <label htmlFor="theme-select">{t('settings.display.theme')}</label>
                  <div className="select-wrapper">
                    <select
                      id="theme-select"
                      value={userSettings.theme}
                      onChange={(e) => handleUserSelect('theme', e.target.value)}
                    >
                      <option value="light">{t('settings.display.themeOptions.light')}</option>
                      <option value="dark">{t('settings.display.themeOptions.dark')}</option>
                      <option value="system">{t('settings.display.themeOptions.system')}</option>
                    </select>
                  </div>
                </div>

                <div className="form-item full-width">
                  <label htmlFor="calendar-view-select">{t('settings.display.calendar')}</label>
                  <div className="select-wrapper">
                    <select
                      id="calendar-view-select"
                      value={userSettings.defaultCalendarView}
                      onChange={(e) => handleUserSelect('defaultCalendarView', e.target.value)}
                    >
                      <option value="timeGridDay">{t('settings.display.calendarOptions.day')}</option>
                      <option value="timeGridWeek">{t('settings.display.calendarOptions.week')}</option>
                      <option value="dayGridMonth">{t('settings.display.calendarOptions.month')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-action-row">
                <button type="submit" className="save-settings-btn" disabled={saving}>
                  <FiSave className="btn-icon" />
                  <span>{saving ? 'Đang lưu...' : t('settings.saveBtn')}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={saveUserSettings} className="settings-form">
              {/* Email Notifications */}
              <div className="notification-section">
                <h2 className="section-title">
                  <FiBell className="title-icon text-primary" />
                  {t('settings.notifications.emailTitle')}
                </h2>

                <div className="switch-list">
                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.approved')}</span>
                      <span className="switch-desc">Nhận email thông báo khi đơn đặt phòng của bạn được quản trị viên duyệt</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.emailNotifyApproved}
                        onChange={() => handleUserToggle('emailNotifyApproved')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.rejected')}</span>
                      <span className="switch-desc">Nhận email thông báo khi đơn đặt phòng của bạn bị từ chối</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.emailNotifyRejected}
                        onChange={() => handleUserToggle('emailNotifyRejected')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.cancelled')}</span>
                      <span className="switch-desc">Nhận email thông báo khi phòng họp bị hủy</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.emailNotifyCancelled}
                        onChange={() => handleUserToggle('emailNotifyCancelled')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.reminder')}</span>
                      <span className="switch-desc">Nhận nhắc nhở lịch họp qua email trước khi cuộc họp bắt đầu</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.emailNotifyReminder}
                        onChange={() => handleUserToggle('emailNotifyReminder')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* In-app Notifications */}
              <div className="notification-section spacing-top">
                <h2 className="section-title">
                  <FiMonitor className="title-icon text-accent" />
                  {t('settings.notifications.inAppTitle')}
                </h2>

                <div className="switch-list">
                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.approved')}</span>
                      <span className="switch-desc">Nhận thông báo in-app khi đơn đặt được duyệt</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.inAppNotifyApproved}
                        onChange={() => handleUserToggle('inAppNotifyApproved')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.rejected')}</span>
                      <span className="switch-desc">Nhận thông báo in-app khi đơn đặt bị từ chối</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.inAppNotifyRejected}
                        onChange={() => handleUserToggle('inAppNotifyRejected')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.cancelled')}</span>
                      <span className="switch-desc">Nhận thông báo in-app khi lịch họp bị hủy</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.inAppNotifyCancelled}
                        onChange={() => handleUserToggle('inAppNotifyCancelled')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-info">
                      <span className="switch-label">{t('settings.notifications.reminder')}</span>
                      <span className="switch-desc">Nhận thông báo check-in và nhắc nhở trên giao diện app</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={userSettings.inAppNotifyReminder}
                        onChange={() => handleUserToggle('inAppNotifyReminder')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-action-row">
                <button type="submit" className="save-settings-btn" disabled={saving}>
                  <FiSave className="btn-icon" />
                  <span>{saving ? 'Đang lưu...' : t('settings.saveBtn')}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'system' && user?.role === 'admin' && (
            <form onSubmit={saveSystemSettings} className="settings-form">
              <h2 className="section-title">
                <FiSliders className="title-icon" />
                {t('settings.system.title')}
              </h2>

              <div className="form-group-grid">
                <div className="form-item">
                  <label htmlFor="workHourStart-input">{t('settings.system.workHourStart')}</label>
                  <input
                    id="workHourStart-input"
                    type="time"
                    value={systemSettings.workHourStart}
                    onChange={(e) => handleSysChange('workHourStart', e.target.value)}
                    required
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="workHourEnd-input">{t('settings.system.workHourEnd')}</label>
                  <input
                    id="workHourEnd-input"
                    type="time"
                    value={systemSettings.workHourEnd}
                    onChange={(e) => handleSysChange('workHourEnd', e.target.value)}
                    required
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="maxDays-input">{t('settings.system.maxBookingDaysAhead')}</label>
                  <input
                    id="maxDays-input"
                    type="number"
                    min="1"
                    max="365"
                    value={systemSettings.maxBookingDaysAhead}
                    onChange={(e) => handleSysChange('maxBookingDaysAhead', e.target.value)}
                    required
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="noShow-input">{t('settings.system.noShowReleaseTimeMin')}</label>
                  <input
                    id="noShow-input"
                    type="number"
                    min="5"
                    max="60"
                    value={systemSettings.noShowReleaseTimeMin}
                    onChange={(e) => handleSysChange('noShowReleaseTimeMin', e.target.value)}
                    required
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="minDur-input">{t('settings.system.minBookingDurationMin')}</label>
                  <input
                    id="minDur-input"
                    type="number"
                    min="5"
                    max="1440"
                    value={systemSettings.minBookingDurationMin}
                    onChange={(e) => handleSysChange('minBookingDurationMin', e.target.value)}
                    required
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="maxDur-input">{t('settings.system.maxBookingDurationMin')}</label>
                  <input
                    id="maxDur-input"
                    type="number"
                    min="5"
                    max="1440"
                    value={systemSettings.maxBookingDurationMin}
                    onChange={(e) => handleSysChange('maxBookingDurationMin', e.target.value)}
                    required
                  />
                </div>

                <div className="form-item full-width switch-item border-none pb-0">
                  <div className="switch-info">
                    <span className="switch-label">{t('settings.system.allowCancelApproved')}</span>
                    <span className="switch-desc">Nếu tắt, người dùng không thể tự hủy lịch họp khi đã được duyệt (chỉ admin được phép hủy)</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={systemSettings.allowCancelApproved}
                      onChange={(e) => handleSysChange('allowCancelApproved', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-action-row">
                <button type="submit" className="save-settings-btn" disabled={saving}>
                  <FiSave className="btn-icon" />
                  <span>{saving ? 'Đang lưu...' : t('settings.saveBtn')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
