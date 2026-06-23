import React, { useState } from 'react';
import roomService from '../services/room.service';
import RoomSearchForm from '../components/search/RoomSearchForm';
import AvailableRoomCard from '../components/search/AvailableRoomCard';
import toast from 'react-hot-toast';
import './RoomSearchPage.css';

/**
 * RoomSearchPage — advanced room availability search.
 * Allows users to filter by date/time, capacity, location and equipment.
 */
function RoomSearchPage() {
  const [rooms,          setRooms]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [searched,       setSearched]       = useState(false);
  const [lastParams,     setLastParams]     = useState({});

  const handleSearch = async (params) => {
    setLoading(true);
    setSearched(true);
    setLastParams(params);
    try {
      // Build ISO strings for API (backend expects full ISO datetime)
      const queryParams = { ...params };
      if (queryParams.equipment) {
        // equipment is an array — keep it as-is, roomService handles arrays
      }

      const res = await roomService.getAvailableRooms(queryParams);
      setRooms(res.data || []);

      if ((res.data || []).length === 0) {
        toast('Không tìm thấy phòng trống phù hợp', { icon: '🔍' });
      } else {
        toast.success(`Tìm thấy ${res.data.length} phòng trống`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tìm kiếm thất bại');
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
          <h1 className="rsp__title">🔍 Tìm phòng trống</h1>
          <p className="rsp__subtitle">
            Tìm kiếm phòng họp phù hợp theo thời gian, sức chứa và thiết bị
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
                ? 'Đang tìm kiếm...'
                : rooms.length > 0
                  ? `✅ Kết quả: ${rooms.length} phòng trống`
                  : '❌ Không tìm thấy phòng trống'}
            </h2>
          </div>

          {loading ? (
            <div className="rsp__loading">
              <div className="rsp__spinner" />
              <p>Đang tìm phòng...</p>
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
              <h3>Không có phòng trống</h3>
              <p>
                Tất cả phòng phù hợp đều đã được đặt trong khoảng thời gian này.
                Hãy thử thay đổi thời gian hoặc bỏ bớt bộ lọc.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Initial prompt */}
      {!searched && (
        <div className="rsp__prompt">
          <div className="rsp__prompt-icon">🏢</div>
          <p>Nhập tiêu chí tìm kiếm và nhấn <strong>Tìm phòng trống</strong></p>
        </div>
      )}
    </div>
  );
}

export default RoomSearchPage;
