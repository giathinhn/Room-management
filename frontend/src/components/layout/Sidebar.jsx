import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiCalendar,
  FiGrid,
  FiPlusSquare,
  FiUsers,
  FiLayout,
  FiSearch,
  FiChevronLeft,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: <FiHome />,
    to: '/dashboard',
    roles: ['admin', 'approver', 'user'],
  },
  {
    label: 'Lịch đặt phòng',
    icon: <FiCalendar />,
    to: '/bookings',
    roles: ['admin', 'approver', 'user'],
  },
  {
    label: 'Xem lịch',
    icon: <FiLayout />,
    to: '/calendar',
    roles: ['admin', 'approver', 'user'],
  },
  {
    label: 'Phòng họp',
    icon: <FiGrid />,
    to: '/rooms',
    roles: ['admin', 'approver', 'user'],
  },
  {
    label: 'Tìm phòng trống',
    icon: <FiSearch />,
    to: '/rooms/search',
    roles: ['admin', 'approver', 'user'],
  },
  {
    label: 'Đặt phòng mới',
    icon: <FiPlusSquare />,
    to: '/bookings/new',
    roles: ['admin', 'approver', 'user'],
  },
  {
    label: 'Quản lý users',
    icon: <FiUsers />,
    to: '/admin/users',
    roles: ['admin'],
  },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const role = user?.role || 'user';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#sgrad)" />
            <path d="M7 10h14M7 14h10M7 18h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            <defs>
              <linearGradient id="sgrad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {isOpen && <span className="sidebar__brand-name">RoomBook</span>}

        <button className="sidebar__toggle-btn" onClick={onToggle} aria-label="Thu gọn sidebar">
          <FiChevronLeft className={`sidebar__toggle-icon ${isOpen ? '' : 'rotated'}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav" role="navigation" aria-label="Main navigation">
        <ul className="sidebar__nav-list">
          {visibleItems.map((item) => (
            <li key={item.to} className="sidebar__nav-item">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`
                }
                title={!isOpen ? item.label : undefined}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                {isOpen && <span className="sidebar__nav-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User role badge at bottom */}
      {isOpen && (
        <div className="sidebar__footer">
          <div className="sidebar__role-badge">
            <span className="sidebar__role-dot" />
            <span>{role === 'admin' ? 'Quản trị viên' : role === 'approver' ? 'Người duyệt' : 'Nhân viên'}</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
