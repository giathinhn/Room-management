import { useState, useRef, useEffect } from 'react';
import { FiMenu, FiBell, FiChevronDown, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = ({ onMenuToggle, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    user: 'Nhân viên',
  };

  return (
    <header className="app-header">
      {/* Left: hamburger */}
      <div className="app-header__left">
        <button
          className="app-header__menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
        >
          <FiMenu />
        </button>
      </div>

      {/* Right: actions */}
      <div className="app-header__right">
        {/* Notification bell */}
        <button className="app-header__icon-btn" aria-label="Thông báo" id="header-notifications">
          <FiBell />
          <span className="app-header__badge">3</span>
        </button>

        {/* User dropdown */}
        <div className="user-dropdown" ref={dropdownRef}>
          <button
            className="user-dropdown__trigger"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            id="header-user-menu"
          >
            <div className="user-avatar">
              {getInitials(user?.fullName)}
            </div>
            <div className="user-info">
              <span className="user-info__name">{user?.fullName || 'User'}</span>
              <span className="user-info__role">
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
            <FiChevronDown className={`user-dropdown__chevron ${dropdownOpen ? 'rotated' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown__menu">
              <div className="user-dropdown__header">
                <div className="user-avatar user-avatar--lg">
                  {getInitials(user?.fullName)}
                </div>
                <div>
                  <p className="user-dropdown__name">{user?.fullName}</p>
                  <p className="user-dropdown__email">{user?.email}</p>
                </div>
              </div>

              <div className="user-dropdown__divider" />

              <Link
                to="/profile"
                className="user-dropdown__item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiUser /> Hồ sơ cá nhân
              </Link>
              <Link
                to="/settings"
                className="user-dropdown__item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiSettings /> Cài đặt
              </Link>

              <div className="user-dropdown__divider" />

              <button
                className="user-dropdown__item user-dropdown__item--danger"
                onClick={() => { setDropdownOpen(false); logout(); }}
                id="header-logout-btn"
              >
                <FiLogOut /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
