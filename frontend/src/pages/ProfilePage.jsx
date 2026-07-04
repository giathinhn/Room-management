import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar, getPersonalStats, changePassword } from '../services/auth.service';
import toast from 'react-hot-toast';
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
      toast.error('Không thể lấy thông tin thống kê');
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
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPEG, JPG, PNG, WEBP.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      if (res.success) {
        toast.success('Cập nhật ảnh đại diện thành công');
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save profile info handler
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Họ tên không được để trống');
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
        toast.success('Cập nhật thông tin thành công');
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Change password handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    // Check strength
    const strength = getPasswordStrength(newPassword);
    if (strength.score < 2) {
      toast.error('Mật khẩu quá yếu. Vui lòng làm theo hướng dẫn độ mạnh mật khẩu.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success('Đổi mật khẩu thành công');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Calculate Password Strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: 'Chưa nhập', color: '#6b7280', percent: 0, score: 0 };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    let label = 'Yếu';
    let color = '#ef4444'; // Red
    let percent = 25;

    if (score === 2) {
      label = 'Trung bình';
      color = '#f59e0b'; // Amber
      percent = 50;
    } else if (score === 3) {
      label = 'Khá mạnh';
      color = '#3b82f6'; // Blue
      percent = 75;
    } else if (score === 4) {
      label = 'Mạnh';
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
    admin: 'Quản trị viên',
    approver: 'Người duyệt',
    user: 'Nhân viên'
  };

  const statusMap = {
    pending: { label: 'Chờ duyệt', class: 'status-pending', icon: <FiClock /> },
    approved: { label: 'Đã duyệt', class: 'status-approved', icon: <FiCheckCircle /> },
    rejected: { label: 'Bị từ chối', class: 'status-rejected', icon: <FiXCircle /> },
    cancelled: { label: 'Đã hủy', class: 'status-cancelled', icon: <FiAlertCircle /> }
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
  };

  return (
    <div className="profile-container">
      {/* Sidebar Overview */}
      <div className="profile-sidebar-card">
        <div className="avatar-upload-wrapper">
          <div className="profile-avatar-large">
            {user?.avatar ? (
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`}
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
              title="Thay đổi ảnh đại diện"
            >
              {isUploadingAvatar ? (
                <FiLoader className="spin-icon" />
              ) : (
                <>
                  <FiCamera size={20} />
                  <span>Thay ảnh</span>
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
            <FiUser /> Thông tin cá nhân
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <FiKey /> Đổi mật khẩu
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FiBarChart2 /> Thống kê & Lịch sử
          </button>
        </div>

        <div className="profile-tabs-content">
          {/* Tab 1: Info */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="profile-form-grid">
              <div className="form-group-item">
                <label className="form-label">Email đăng nhập</label>
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
                <label className="form-label">Vai trò</label>
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
                <label className="form-label">Họ và tên <span className="text-danger">*</span></label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">Số điện thoại</label>
                <div className="input-with-icon">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div className="form-group-item full-width-item">
                <label className="form-label">Phòng ban / Lớp học</label>
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
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Password */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="profile-form-grid">
              <div className="form-group-item full-width-item">
                <label className="form-label">Mật khẩu hiện tại</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">Mật khẩu mới</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    required
                  />
                </div>
              </div>

              {/* Password strength details */}
              <div className="form-group-item full-width-item pass-strength-container">
                <div className="pass-strength-header">
                  <span>Độ mạnh mật khẩu: <strong style={{ color: passStrength.color }}>{passStrength.label}</strong></span>
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
                  <li className={newPassword.length >= 8 ? 'rule-checked' : ''}>Ít nhất 8 ký tự</li>
                  <li className={/[A-Z]/.test(newPassword) ? 'rule-checked' : ''}>Chứa ít nhất một chữ hoa</li>
                  <li className={/[0-9]/.test(newPassword) ? 'rule-checked' : ''}>Chứa ít nhất một con số</li>
                  <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'rule-checked' : ''}>Chứa ít nhất một ký tự đặc biệt</li>
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
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Cập nhật mật khẩu</span>
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
                  <p>Đang tải dữ liệu thống kê...</p>
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
                        <p>Tổng cuộc họp đã đặt</p>
                      </div>
                    </div>

                    <div className="stats-card-item green-glow">
                      <div className="card-icon-bg">
                        <FiClock size={24} />
                      </div>
                      <div className="card-data">
                        <h3>{statsData.totalMeetingHours || 0}h</h3>
                        <p>Tổng số giờ họp</p>
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
                        <p>Tỉ lệ duyệt</p>
                      </div>
                    </div>
                  </div>

                  {/* Status breakdowns */}
                  <div className="stats-breakdowns-box">
                    <h3 className="section-title">Phân loại theo trạng thái</h3>
                    <div className="status-bars-list">
                      {[
                        { key: 'approved', label: 'Đã duyệt', color: '#10b981' },
                        { key: 'pending', label: 'Chờ duyệt', color: '#f59e0b' },
                        { key: 'rejected', label: 'Bị từ chối', color: '#ef4444' },
                        { key: 'cancelled', label: 'Đã hủy', color: '#6b7280' }
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
                    <h3 className="section-title">Các cuộc họp gần nhất</h3>
                    {statsData.recentBookings && statsData.recentBookings.length > 0 ? (
                      <div className="recent-bookings-table-wrapper">
                        <table className="recent-bookings-table">
                          <thead>
                            <tr>
                              <th>Phòng họp</th>
                              <th>Tiêu đề</th>
                              <th>Thời gian</th>
                              <th>Trạng thái</th>
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
                                      <span>Bắt đầu: {formatDateTime(booking.startTime)}</span>
                                      <span>Kết thúc: {formatDateTime(booking.endTime)}</span>
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
                        <p>Bạn chưa thực hiện cuộc họp nào gần đây.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-bookings-notice">
                  <p>Không có dữ liệu thống kê để hiển thị.</p>
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
