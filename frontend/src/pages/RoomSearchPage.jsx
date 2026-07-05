import React, { useState } from 'react';
import roomService from '../services/room.service';
import RoomSearchForm from '../components/search/RoomSearchForm';
import AvailableRoomCard from '../components/search/AvailableRoomCard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './RoomSearchPage.css';

/**
 * RoomSearchPage — advanced room availability search.
 * Allows users to filter by date/time, capacity, location and equipment.
 */
function RoomSearchPage() {
  const { t } = useTranslation();
  const [rooms,          setRooms]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [searched,       setSearched]       = useState(false);
  const [lastParams,     setLastParams]     = useState({});

  const handleSearch = async (params) => {
    setLoading(true);
    setSearched(true);
    setLastParams(params);
    try {
      const queryParams = { ...params };
      const res = await roomService.getAvailableRooms(queryParams);
      setRooms(res.data || []);

      if ((res.data || []).length === 0) {
        toast(t('roomSearch.noAvailable'), { icon: '🔍' });
      } else {
        toast.success(t('roomSearch.foundSuccess', { count: res.data.length }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('roomSearch.failed'));
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rsp">
      {/* Page header */}
      <div className="rsp__header">
        <div className="rsp__title-area">
          <h1 className="rsp__title">🔍 {t('roomSearch.title')}</h1>
          <p className="rsp__subtitle">
            {t('roomSearch.subtitle')}
          </p>
        </div>
      </div>

      {/* Search form */}
      <RoomSearchForm onSearch={handleSearch} isLoading={loading} />

      {/* Results */}
      {searched && (
        <section className="rsp__results">
          <div className="rsp__results-header">
            <h2 className="rsp__results-title">
              {loading
                ? t('roomSearch.searching')
                : rooms.length > 0
                  ? t('roomSearch.resultsFound', { count: rooms.length })
                  : t('roomSearch.noRooms')}
            </h2>
          </div>

          {loading ? (
            <div className="rsp__loading">
              <div className="rsp__spinner" />
              <p>{t('roomSearch.loading')}</p>
            </div>
          ) : rooms.length > 0 ? (
            <div className="rsp__list">
              {rooms.map((room) => (
                <AvailableRoomCard
                  key={room.id}
                  room={room}
                  searchParams={lastParams}
                />
              ))}
            </div>
          ) : (
            <div className="rsp__empty">
              <div className="rsp__empty-icon">🏚️</div>
              <h3>{t('roomSearch.emptyTitle')}</h3>
              <p>
                {t('roomSearch.emptyDesc')}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Initial prompt */}
      {!searched && (
        <div className="rsp__prompt">
          <div className="rsp__prompt-icon">🏢</div>
          <p>{t('roomSearch.prompt')}</p>
        </div>
      )}
    </div>
  );
}

export default RoomSearchPage;
