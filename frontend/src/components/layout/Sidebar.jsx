import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiHome,
  FiCalendar,
  FiGrid,
  FiPlusSquare,
  FiUsers,
  FiLayout,
  FiSearch,
  FiBookmark,
  FiChevronLeft,
  FiMap,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    icon: <FiHome />,
    to: '/dashboard',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'calendar',
    icon: <FiCalendar />,
    to: '/bookings',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'calendarView',
    icon: <FiLayout />,
    to: '/calendar',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'rooms',
    icon: <FiGrid />,
    to: '/rooms',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'search',
    icon: <FiSearch />,
    to: '/rooms/search',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'floorMap',
    icon: <FiMap />,
    to: '/floor-map',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'newBooking',
    icon: <FiPlusSquare />,
    to: '/bookings/new',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'templates',
    icon: <FiBookmark />,
    to: '/templates',
    roles: ['admin', 'approver', 'user'],
  },
  {
    key: 'manageUsers',
    icon: <FiUsers />,
    to: '/admin/users',
    roles: ['admin'],
  },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const { t } = useTranslation();
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
                title={!isOpen ? t(`sidebar.${item.key}`) : undefined}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                {isOpen && <span className="sidebar__nav-label">{t(`sidebar.${item.key}`)}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User role badge & Theme toggle at bottom */}
      <div className="sidebar__footer">
        <div style={{ marginBottom: isOpen ? '12px' : '0' }}>
          <ThemeToggle collapsed={!isOpen} />
        </div>
        {isOpen && (
          <div className="sidebar__role-badge">
            <span className="sidebar__role-dot" />
            <span>{t(`roles.${role}`)}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
