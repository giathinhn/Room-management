import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import roomService from '../services/room.service';
import RoomForm from '../components/rooms/RoomForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { EQUIPMENT_ICONS } from '../components/rooms/RoomCard';
import '../components/rooms/RoomCard.css';
import './RoomDetailPage.css';

function RoomDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';

  const [room,    setRoom]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editOpen,   setEditOpen]   = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch room
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await roomService.getRoom(id);
        setRoom(result.data);
      } catch (err) {
        toast.error('Không thể tải thông tin phòng');
        navigate('/rooms');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  async function handleEdit(data) {
    setEditLoading(true);
    try {
      const result = await roomService.updateRoom(id, data);
      setRoom(result.data);
      setEditOpen(false);
      toast.success('Cập nhật phòng thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await roomService.deleteRoom(id);
      toast.success(`Đã vô hiệu hóa phòng "${room.name}"`);
      navigate('/rooms');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa phòng');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="room-detail-page room-detail-page--loading">
        <div className="spinner" />
        <p>Đang tải…</p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="room-detail-page">
      {/* Top bar */}
      <div className="room-detail__topbar">
        <button
          id="room-detail-back-btn"
          className="btn btn--ghost btn--sm"
          onClick={() => navigate('/rooms')}
        >
          ← Quay lại
        </button>

        {isAdmin && (
          <div className="room-detail__admin-actions">
            <button
              id="room-detail-edit-btn"
              className="btn btn--primary btn--sm"
              onClick={() => setEditOpen(true)}
            >
              ✏️ Sửa
            </button>
            <button
              id="room-detail-delete-btn"
              className="btn btn--danger btn--sm"
              onClick={() => setDeleteOpen(true)}
            >
              🗑️ Xóa
            </button>
          </div>
        )}
      </div>

      {/* Room info card */}
      <div className="room-detail__card">
        {/* Room name + status */}
        <div className="room-detail__name-row">
          <h1 className="room-detail__name">{room.name}</h1>
          <span className={`room-detail__status ${room.isActive ? 'active' : 'inactive'}`}>
            {room.isActive ? '● Hoạt động' : '● Không hoạt động'}
          </span>
        </div>

        {/* Meta: location + capacity */}
        <div className="room-detail__meta">
          <div className="room-detail__meta-item">
            <span className="room-detail__meta-icon">📍</span>
            <div>
              <span className="room-detail__meta-label">Vị trí</span>
              <span className="room-detail__meta-value">{room.location}</span>
            </div>
          </div>
          <div className="room-detail__meta-item">
            <span className="room-detail__meta-icon">👥</span>
            <div>
              <span className="room-detail__meta-label">Sức chứa</span>
              <span className="room-detail__meta-value">{room.capacity} người</span>
            </div>
          </div>
          <div className="room-detail__meta-item">
            <span className="room-detail__meta-icon">📅</span>
            <div>
              <span className="room-detail__meta-label">Ngày tạo</span>
              <span className="room-detail__meta-value">
                {new Date(room.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="room-detail__section">
          <h2 className="room-detail__section-title">Thiết bị</h2>
          {room.equipment && room.equipment.length > 0 ? (
            <div className="room-detail__equipment">
              {room.equipment.map((item) => (
                <div key={item} className="room-detail__equipment-badge">
                  <span className="room-detail__equipment-icon">
                    {EQUIPMENT_ICONS[item] || '🔧'}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="room-detail__no-equipment">Chưa có thiết bị nào được ghi nhận.</p>
          )}
        </div>

        {/* Placeholder for today's usage timeline (plan-04 will fill this) */}
        <div className="room-detail__section">
          <h2 className="room-detail__section-title">Lịch sử dụng hôm nay</h2>
          <div className="room-detail__timeline-placeholder">
            <span>📆</span>
            <p>Lịch đặt phòng sẽ hiển thị ở đây sau khi tích hợp hệ thống đặt phòng.</p>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <RoomForm
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        room={room}
        isLoading={editLoading}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        title="Vô hiệu hóa phòng"
        message={`Bạn có chắc muốn vô hiệu hóa phòng "${room.name}"?`}
        confirmLabel="Vô hiệu hóa"
        isLoading={deleteLoading}
      />
    </div>
  );
}

export default RoomDetailPage;
