import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ collapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkIsDark = () => {
      if (theme === 'dark') {
        setIsDark(true);
      } else if (theme === 'light') {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    checkIsDark();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => setIsDark(e.matches);

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
      } else {
        mediaQuery.addListener(handler);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handler);
        } else {
          mediaQuery.removeListener(handler);
        }
      };
    }
  }, [theme]);

  return (
    <button
      className={`theme-toggle-btn ${isDark ? 'dark' : 'light'} ${collapsed ? 'collapsed' : ''}`}
      onClick={toggleTheme}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label="Toggle Theme"
    >
      <div className="icon-container">
        {isDark ? <FiMoon className="moon-icon" /> : <FiSun className="sun-icon" />}
      </div>
      {!collapsed && (
        <span className="toggle-text">
          {isDark ? 'Giao diện tối' : 'Giao diện sáng'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
