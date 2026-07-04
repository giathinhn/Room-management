import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ collapsed }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle-btn ${theme} ${collapsed ? 'collapsed' : ''}`}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label="Toggle Theme"
    >
      <div className="icon-container">
        {theme === 'dark' ? <FiMoon className="moon-icon" /> : <FiSun className="sun-icon" />}
      </div>
      {!collapsed && (
        <span className="toggle-text">
          {theme === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
