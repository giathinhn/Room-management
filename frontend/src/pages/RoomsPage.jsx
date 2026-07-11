import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import roomService from '../services/room.service';
import RoomCard from '../components/rooms/RoomCard';
import RoomForm from '../components/rooms/RoomForm';
import RoomFilter from '../components/rooms/RoomFilter';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import { useTranslation } from 'react-i18next';
import useSSEEvent from '../hooks/useSSEEvent';
import '../components/rooms/RoomCard.css';
import './RoomsPage.css';

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  capacity: '',
  equipment: [],
  onlyFavorites: false,
};

function RoomsPage() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';

  // ── State ────────────────────────────────────────────────────────────────────
  const [rooms,      setRooms]      = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [loading,    setLoading]    = useState(true);

  // Form modal
  const [formOpen,   setFormOpen]   = useState(false);
  const [editRoom,   setEditRoom]   = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Confirm delete dialog
  const [deleteRoom,    setDeleteRoom]    = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async (f) => {
    setLoading(true);
    try {
      const result = await roomService.getRooms({
        page:      f.page,
        limit:     f.limit,
        search:    f.search  || undefined,
        capacity:  f.capacity || undefined,
        equipment: f.equipment?.length ? f.equipment : undefined,
      });
      setRooms(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRooms(filters);
  }, [filters, fetchRooms]);

  const handleRoomsChange = useCallback(() => {
    fetchRooms(filters);
  }, [fetchRooms, filters]);

  useSSEEvent('rooms_changed', handleRoomsChange);

  // ── Filter change ────────────────────────────────────────────────────────────
  function handleFilterChange(newFilters) {
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page || 1 }));
  }

  function handlePageChange(page) {
    setFilters((prev) => ({ ...prev, page }));
  }

  // ── Toggle Favorite status locally ───────────────────────────────────────────
  const handleFavoriteToggle = useCallback((roomId, isFavorite) => {
    setRooms((prevRooms) =>
      prevRooms.map((r) => (r.id === roomId ? { ...r, isFavorite } : r))
    );
  }, []);

  // ── Create / Edit ────────────────────────────────────────────────────────────
  function openCreate() {
    setEditRoom(null);
    setFormOpen(true);
  }

  // eslint-disable-next-line no-unused-vars
  function openEdit(room) {
    setEditRoom(room);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    setFormLoading(true);
    try {
      if (editRoom) {
        await roomService.updateRoom(editRoom.id, data);
        toast.success(t('rooms.updateSuccess'));
      } else {
        await roomService.createRoom(data);
        toast.success(t('rooms.createSuccess'));
      }
      setFormOpen(false);
      fetchRooms(filters);
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setFormLoading(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  function openDelete(room) {
    setDeleteRoom(room);
  }

  async function handleConfirmDelete() {
    if (!deleteRoom) return;
    setDeleteLoading(true);
    try {
      await roomService.deleteRoom(deleteRoom.id);
      toast.success(t('rooms.deleteSuccess', { name: deleteRoom.name }));
      setDeleteRoom(null);
      fetchRooms(filters);
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Filter & Sort Rooms ──────────────────────────────────────────────────────
  const displayedRooms = (() => {
    let list = rooms;
    if (filters.onlyFavorites) {
      list = list.filter((r) => r.isFavorite);
    }
    return [...list].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
  })();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="rooms-page">
      {/* Header */}
      <div className="rooms-page__header">
        <div>
          <h1 className="rooms-page__title">🏢 {t('rooms.title')}</h1>
          <p className="rooms-page__subtitle">
            {pagination.total} {t('rooms.countLabel')}{' '}
            {!isAdmin && t('rooms.activeOnly')}
          </p>
        </div>
        {isAdmin && (
          <button
            id="add-room-btn"
            className="btn btn--primary"
            onClick={openCreate}
          >
            {t('rooms.addRoom')}
          </button>
        )}
      </div>

      {/* Filters */}
      <RoomFilter filters={filters} onChange={handleFilterChange} />

      {/* Room grid */}
      {loading ? (
        <div className="rooms-page__loading">
          <div className="spinner" />
          <p>{t('rooms.loadingRooms')}</p>
        </div>
      ) : displayedRooms.length === 0 ? (
        <div className="rooms-page__empty">
          <div className="rooms-page__empty-icon">🏚️</div>
          <p>{t('rooms.noRoomsFound')}</p>
          {isAdmin && (
            <button className="btn btn--primary" onClick={openCreate}>
              {t('rooms.addFirstRoom')}
            </button>
          )}
        </div>
      ) : (
        <div className="rooms-page__grid">
          {displayedRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isAdmin={isAdmin}
              onView={(id) => navigate(`/rooms/${id}`)}
              onEdit={openEdit}
              onDelete={openDelete}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="rooms-page__pagination">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Create / Edit modal */}
      <RoomForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        room={editRoom}
        isLoading={formLoading}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteRoom)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteRoom(null)}
        title={t('rooms.disableRoomTitle')}
        message={t('rooms.disableRoomConfirm', { name: deleteRoom?.name })}
        confirmLabel={t('rooms.disableLabel')}
        isLoading={deleteLoading}
      />
    </div>
  );
}

export default RoomsPage;
