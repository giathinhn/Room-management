import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar, getPersonalStats, changePassword } from '../services/auth.service';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  FiUser,
  FiLock,
  FiPhone,
  FiBriefcase,
  FiMail,
  FiKey,
  FiBarChart2,
  FiCamera,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import './ProfilePage.css';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password' | 'stats'
  
  // Tab 1: Profile Info state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Tab 2: Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Tab 3: Stats state
  const [statsData, setStatsData] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Sync user info on load/change
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  // Load stats when clicking stats tab
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await getPersonalStats();
      if (res.success) {
        setStatsData(res.data);
      }
    } catch (err) {
      toast.error(t('profile.statsLoadFailed'));
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.avatarSizeError'));
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('profile.avatarTypeError'));
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      if (res.success) {
        toast.success(t('profile.avatarSuccess'));
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.avatarUploadError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save profile info handler
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error(t('profile.nameEmpty'));
      return;
    }

    setIsSavingInfo(true);
    try {
      const res = await updateProfile({
        fullName,
        phone: phone || null,
        department: department || null
      });
      if (res.success) {
        toast.success(t('profile.infoSuccess'));
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.infoError'));
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Change password handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error(t('profile.enterCurrentPassword'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('profile.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }

    // Check strength
    const strength = getPasswordStrength(newPassword);
    if (strength.score < 2) {
      toast.error(t('profile.passwordWeak'));
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success(t('profile.passwordSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.passwordError'));
    } finally {
      setIsChangingPass(false);
    }
  };

  // Calculate Password Strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: t('profile.notEntered'), color: '#6b7280', percent: 0, score: 0 };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    let label = t('profile.weak');
    let color = '#ef4444'; // Red
    let percent = 25;

    if (score === 2) {
      label = t('profile.medium');
      color = '#f59e0b'; // Amber
      percent = 50;
    } else if (score === 3) {
      label = t('profile.fairlyStrong');
      color = '#3b82f6'; // Blue
      percent = 75;
    } else if (score === 4) {
      label = t('profile.strong');
      color = '#10b981'; // Green
      percent = 100;
    }

    return { label, color, percent, score };
  };

  const passStrength = getPasswordStrength(newPassword);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const roleLabel = {
    admin: t('roles.admin'),
    approver: t('roles.approver'),
    user: t('roles.user')
  };

  const statusMap = {
    pending: { label: t('bookings.status.pending'), class: 'status-pending', icon: <FiClock /> },
    approved: { label: t('bookings.status.approved'), class: 'status-approved', icon: <FiCheckCircle /> },
    rejected: { label: t('bookings.status.rejected'), class: 'status-rejected', icon: <FiXCircle /> },
    cancelled: { label: t('bookings.status.cancelled'), class: 'status-cancelled', icon: <FiAlertCircle /> }
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return `${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString(locale)}`;
  };

  return (
    <div className="profile-container">
      {/* Sidebar Overview */}
      <div className="profile-sidebar-card">
        <div className="avatar-upload-wrapper">
          <div className="profile-avatar-large">
            {user?.avatar ? (
              <img
                src={`${import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') : ''}${user.avatar}`}
                alt="Profile Avatar"
                className="avatar-large-img"
              />
            ) : (
              <span className="avatar-initials-large">{getInitials(user?.fullName)}</span>
            )}
            <button
              className="avatar-edit-overlay"
              onClick={() => fileInputRef.current.click()}
              disabled={isUploadingAvatar}
              title={t('profile.changeAvatarTooltip')}
            >
              {isUploadingAvatar ? (
                <FiLoader className="spin-icon" />
              ) : (
                <>
                  <FiCamera size={20} />
                  <span>{t('profile.changeAvatar')}</span>
                </>
              )}
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <div className="profile-sidebar-info">
          <h2 className="user-profile-name">{user?.fullName}</h2>
          <span className="user-profile-role-badge">
            {roleLabel[user?.role] || user?.role}
          </span>
          <p className="user-profile-email">
            <FiMail /> {user?.email}
          </p>
          {user?.department && (
            <p className="user-profile-dept">
              <FiBriefcase /> {user?.department}
            </p>
          )}
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="profile-main-card">
        <div className="profile-tabs-header">
          <button
            className={`profile-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <FiUser /> {t('profile.personalInfo')}
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <FiKey /> {t('profile.changePassword')}
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FiBarChart2 /> {t('profile.statsHistory')}
          </button>
        </div>

        <div className="profile-tabs-content">
          {/* Tab 1: Info */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="profile-form-grid">
              <div className="form-group-item">
                <label className="form-label">{t('profile.email')}</label>
                <div className="input-with-icon lock-field">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="disabled-input"
                  />
                  <FiLock className="lock-icon" title="Không thể chỉnh sửa trường này" />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">{t('profile.role')}</label>
                <div className="input-with-icon lock-field">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    value={roleLabel[user?.role] || user?.role || ''}
                    disabled
                    className="disabled-input"
                  />
                  <FiLock className="lock-icon" title="Không thể chỉnh sửa trường này" />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">{t('profile.fullName')} <span className="text-danger">*</span></label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('profile.fullName')}
                    required
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">{t('profile.phone')}</label>
                <div className="input-with-icon">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('profile.phone')}
                  />
                </div>
              </div>

              <div className="form-group-item full-width-item">
                <label className="form-label">{t('profile.department')}</label>
                <div className="input-with-icon">
                  <FiBriefcase className="input-icon" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ví dụ: Phòng Kỹ thuật, Lớp CNTT-K15"
                  />
                </div>
              </div>

              <div className="form-submit-wrapper full-width-item">
                <button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={isSavingInfo}
                >
                  {isSavingInfo ? (
                    <>
                      <FiLoader className="spin-icon" />
                      <span>{t('profile.saving')}</span>
                    </>
                  ) : (
                    <span>{t('profile.saveChanges')}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Password */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="profile-form-grid">
              <div className="form-group-item full-width-item">
                <label className="form-label">{t('profile.currentPassword')}</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('profile.currentPassword')}
                    required
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">{t('profile.newPassword')}</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('profile.newPassword')}
                    required
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">{t('profile.confirmNewPassword')}</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('profile.confirmNewPassword')}
                    required
                  />
                </div>
              </div>

              {/* Password strength details */}
              <div className="form-group-item full-width-item pass-strength-container">
                <div className="pass-strength-header">
                  <span>{t('profile.strengthLabel')} <strong style={{ color: passStrength.color }}>{passStrength.label}</strong></span>
                </div>
                <div className="pass-strength-bar-bg">
                  <div
                    className="pass-strength-bar-fill"
                    style={{
                      width: `${passStrength.percent}%`,
                      backgroundColor: passStrength.color
                    }}
                  />
                </div>
                <ul className="pass-strength-rules">
                  <li className={newPassword.length >= 8 ? 'rule-checked' : ''}>{t('profile.ruleLength')}</li>
                  <li className={/[A-Z]/.test(newPassword) ? 'rule-checked' : ''}>{t('profile.ruleUpper')}</li>
                  <li className={/[0-9]/.test(newPassword) ? 'rule-checked' : ''}>{t('profile.ruleNumber')}</li>
                  <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'rule-checked' : ''}>{t('profile.ruleSpecial')}</li>
                </ul>
              </div>

              <div className="form-submit-wrapper full-width-item">
                <button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={isChangingPass}
                >
                  {isChangingPass ? (
                    <>
                      <FiLoader className="spin-icon" />
                      <span>{t('profile.updating')}</span>
                    </>
                  ) : (
                    <span>{t('profile.updatePassword')}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Stats */}
          {activeTab === 'stats' && (
            <div className="profile-stats-panel">
              {isLoadingStats ? (
                <div className="loading-spinner-wrapper">
                  <FiLoader className="spin-icon" size={40} />
                  <p>{t('profile.loadingStats')}</p>
                </div>
              ) : statsData ? (
                <>
                  {/* Summary Cards */}
                  <div className="stats-cards-grid">
                    <div className="stats-card-item purple-glow">
                      <div className="card-icon-bg">
                        <FiCalendar size={24} />
                      </div>
                      <div className="card-data">
                        <h3>{statsData.stats.total || 0}</h3>
                        <p>{t('profile.totalBookings')}</p>
                      </div>
                    </div>

                    <div className="stats-card-item green-glow">
                      <div className="card-icon-bg">
                        <FiClock size={24} />
                      </div>
                      <div className="card-data">
                        <h3>{statsData.totalMeetingHours || 0}h</h3>
                        <p>{t('profile.totalHours')}</p>
                      </div>
                    </div>

                    <div className="stats-card-item blue-glow">
                      <div className="card-icon-bg">
                        <FiCheckCircle size={24} />
                      </div>
                      <div className="card-data">
                        <h3>
                          {statsData.stats.total > 0
                            ? Math.round((statsData.stats.approved / statsData.stats.total) * 100)
                            : 0}
                          %
                        </h3>
                        <p>{t('profile.approvalRate')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status breakdowns */}
                  <div className="stats-breakdowns-box">
                    <h3 className="section-title">{t('profile.statusDistribution')}</h3>
                    <div className="status-bars-list">
                      {[
                        { key: 'approved', label: t('bookings.status.approved'), color: '#10b981' },
                        { key: 'pending', label: t('bookings.status.pending'), color: '#f59e0b' },
                        { key: 'rejected', label: t('bookings.status.rejected'), color: '#ef4444' },
                        { key: 'cancelled', label: t('bookings.status.cancelled'), color: '#6b7280' }
                      ].map((item) => {
                        const count = statsData.stats[item.key] || 0;
                        const percentage = statsData.stats.total > 0 ? (count / statsData.stats.total) * 100 : 0;
                        return (
                          <div className="status-bar-row" key={item.key}>
                            <div className="status-bar-info">
                              <span>{item.label}</span>
                              <strong>{count} ({Math.round(percentage)}%)</strong>
                            </div>
                            <div className="status-bar-bg">
                              <div
                                className="status-bar-fill"
                                style={{ width: `${percentage}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent bookings list */}
                  <div className="stats-recent-bookings">
                    <h3 className="section-title">{t('profile.recentMeetings')}</h3>
                    {statsData.recentBookings && statsData.recentBookings.length > 0 ? (
                      <div className="recent-bookings-table-wrapper">
                        <table className="recent-bookings-table">
                          <thead>
                            <tr>
                              <th>{t('profile.room')}</th>
                              <th>{t('profile.title')}</th>
                              <th>{t('profile.time')}</th>
                              <th>{t('profile.status')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statsData.recentBookings.map((booking) => {
                              const statusConf = statusMap[booking.status] || {
                                label: booking.status,
                                class: 'status-pending',
                                icon: <FiClock />
                              };
                              return (
                                <tr key={booking.id}>
                                  <td>
                                    <span className="room-name-cell">{booking.room?.name || 'Phòng đã xóa'}</span>
                                  </td>
                                  <td>
                                    <span className="booking-title-cell">{booking.title}</span>
                                  </td>
                                  <td>
                                    <div className="time-cell">
                                      <span>{t('profile.start')} {formatDateTime(booking.startTime)}</span>
                                      <span>{t('profile.end')} {formatDateTime(booking.endTime)}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`status-pill ${statusConf.class}`}>
                                      {statusConf.icon} {statusConf.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-bookings-notice">
                        <p>{t('profile.noRecentMeetings')}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-bookings-notice">
                  <p>{t('profile.noStats')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
