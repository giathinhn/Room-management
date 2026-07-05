import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import suggestionService from '../../services/suggestion.service';
import './SmartSuggestions.css';

/**
 * SmartSuggestions — displays personalized booking suggestions on BookingCreatePage.
 * Fetches smart suggestions from user history and shows "Book now" CTA.
 *
 * @param {{
 *   onSelect?: (suggestion: object) => void,
 * }} props
 */
function SmartSuggestions({ onSelect }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [visible, setVisible]         = useState(true);

  useEffect(() => {
    suggestionService.getSmartSuggestions()
      .then((res) => setSuggestions(res.data || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, []);

  if (!visible || (!loading && suggestions.length === 0)) return null;

  const handleSelect = (s) => {
    if (onSelect) {
      onSelect(s);
    } else {
      // Default: navigate to create page with pre-filled params
      const params = new URLSearchParams({
        roomId:    s.room.id,
        startTime: s.startTime,
        endTime:   s.endTime,
      });
      navigate(`/bookings/new?${params.toString()}`);
    }
  };

  const getSuggestionMessage = (suggestion) => {
    const dayIndex = new Date(suggestion.startTime).getDay();
    const dayNames = i18n.language === 'en'
      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      : ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    
    const dayName = dayNames[dayIndex];
    return t('bookings.suggestions.pattern', {
      day: dayName,
      time: suggestion.startLabel,
      roomName: suggestion.room?.name || ''
    });
  };

  return (
    <div className="smart-suggestions">
      <div className="smart-suggestions__header">
        <span className="smart-suggestions__icon">💡</span>
        <h3 className="smart-suggestions__title">{t('bookings.suggestions.title')}</h3>
        <button
          id="smart-suggestions-close"
          className="smart-suggestions__close"
          onClick={() => setVisible(false)}
          aria-label={t('bookings.suggestions.close')}
        >
          ×
        </button>
      </div>

      {loading ? (
        <div className="smart-suggestions__loading">
          <span className="spinner-sm" /> {t('bookings.suggestions.loading')}
        </div>
      ) : (
        <div className="smart-suggestions__list">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`smart-suggestions__item ${!s.available ? 'smart-suggestions__item--unavailable' : ''}`}
            >
              <div className="smart-suggestions__item-info">
                <div className="smart-suggestions__item-message">
                  {s.available ? '🔄' : '📅'} {getSuggestionMessage(s)}
                </div>
                <div className="smart-suggestions__item-detail">
                  <span className="smart-suggestions__room">{s.room?.name}</span>
                  <span className="smart-suggestions__sep">·</span>
                  <span className="smart-suggestions__time">
                    {s.startLabel} – {s.endLabel}
                  </span>
                  {s.room?.location && (
                    <>
                      <span className="smart-suggestions__sep">·</span>
                      <span className="smart-suggestions__location">{s.room.location}</span>
                    </>
                  )}
                </div>
              </div>

              {s.available ? (
                <button
                  id={`smart-suggest-book-${i}`}
                  className="smart-suggestions__book-btn"
                  onClick={() => handleSelect(s)}
                >
                  {t('bookings.suggestions.bookNow')}
                </button>
              ) : (
                <span className="smart-suggestions__unavailable-badge">{t('bookings.suggestions.unavailable')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SmartSuggestions;
