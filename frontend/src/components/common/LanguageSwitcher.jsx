import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="language-switcher">
      <FiGlobe className="language-switcher__icon" />
      <select
        value={i18n.language || 'vi'}
        onChange={handleLanguageChange}
        className="language-switcher__select"
        aria-label="Select language"
      >
        <option value="vi">🇻🇳 Tiếng Việt</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
