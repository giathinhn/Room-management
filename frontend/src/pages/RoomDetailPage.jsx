import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import roomService from '../services/room.service';
import RoomForm from '../components/rooms/RoomForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { EQUIPMENT_ICONS } from '../components/rooms/RoomCard';
import RoomQRModal from '../components/rooms/RoomQRModal';
import { translateRoom } from '../utils/roomTranslate';
import { BsQrCode } from 'react-icons/bs';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import '../components/rooms/RoomCard.css';
import './RoomDetailPage.css';

function RoomDetailPage() {
  const { t } = useTranslation();
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';

  const [rawRoom, setRoom] = useState(null);
  const room = translateRoom(rawRoom, t);
  const [loading, setLoading] = useState(true);

  const equipmentLabel = {
    'Máy chiếu': t('rooms.equipmentOptions.projector'),
    'Micro':     t('rooms.equipmentOptions.microphone'),
    'Bảng trắng': t('rooms.equipmentOptions.whiteboard'),
    'TV':        t('rooms.equipmentOptions.tv'),
    'Webcam':    t('rooms.equipmentOptions.webcam'),
    'Loa':       t('rooms.equipmentOptions.speaker'),
    'Điều hòa':  t('rooms.equipmentOptions.airConditioner'),
  };

  // Edit modal
  const [editOpen,   setEditOpen]   = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // QR modal
  const [qrOpen, setQrOpen] = useState(false);

  // Inline equipment edit
  const [equipEditMode, setEquipEditMode] = useState(false);
  const [equipDraft,    setEquipDraft]    = useState([]);
  const [equipSaving,   setEquipSaving]   = useState(false);

  // Fetch room
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await roomService.getRoom(id);
        setRoom(result.data);
      } catch (err) {
        toast.error(t('roomDetail.loadFailed'));
        navigate('/rooms');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate, t]);

  async function handleEdit(data) {
    setEditLoading(true);
    try {
      const result = await roomService.updateRoom(id, data);
      setRoom(result.data);
      setEditOpen(false);
      toast.success(t('roomDetail.updateSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setEditLoading(false);
    }
  }

  // ── Inline equipment edit ──────────────────────────────────────────────────
  function startEquipEdit() {
    setEquipDraft(rawRoom?.equipment ? [...rawRoom.equipment] : []);
    setEquipEditMode(true);
  }

  function cancelEquipEdit() {
    setEquipEditMode(false);
    setEquipDraft([]);
  }

  function toggleEquipItem(value) {
    setEquipDraft((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  }

  async function saveEquipment() {
    setEquipSaving(true);
    try {
      const result = await roomService.updateRoom(id, { equipment: equipDraft });
      setRoom(result.data);
      setEquipEditMode(false);
      toast.success(t('roomDetail.equipmentUpdated', 'Thiết bị đã được cập nhật'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setEquipSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await roomService.deleteRoom(id);
      toast.success(t('roomDetail.disableSuccess', { name: room.name }));
      navigate('/rooms');
    } catch (err) {
      toast.error(err.response?.data?.message || t('roomDetail.deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="room-detail-page room-detail-page--loading">
        <div className="spinner" />
        <p>{t('roomDetail.loading')}</p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="room-detail-page">
      {/* Top bar */}
      <div className="room-detail__topbar">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            id="room-detail-back-btn"
            className="btn btn--ghost btn--sm"
            onClick={() => navigate('/rooms')}
          >
            ← {t('roomDetail.back')}
          </button>
          <button
            id="room-detail-qr-btn"
            className="btn btn--ghost btn--sm"
            onClick={() => setQrOpen(true)}
            title={t('roomDetail.qrCodeTooltip')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <BsQrCode /> {t('roomDetail.qrCode')}
          </button>
        </div>

        {isAdmin && (
          <div className="room-detail__admin-actions">
            <button
              id="room-detail-edit-btn"
              className="btn btn--primary btn--sm"
              onClick={() => setEditOpen(true)}
            >
              ✏️ {t('roomDetail.edit')}
            </button>
            <button
              id="room-detail-delete-btn"
              className="btn btn--danger btn--sm"
              onClick={() => setDeleteOpen(true)}
            >
              🗑️ {t('roomDetail.delete')}
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
            {room.isActive ? t('roomDetail.status.active') : t('roomDetail.status.inactive')}
          </span>
        </div>

        {/* Meta: location + capacity */}
        <div className="room-detail__meta">
          <div className="room-detail__meta-item">
            <span className="room-detail__meta-icon">📍</span>
            <div>
              <span className="room-detail__meta-label">{t('roomDetail.location')}</span>
              <span className="room-detail__meta-value">{room.location}</span>
            </div>
          </div>
          <div className="room-detail__meta-item">
            <span className="room-detail__meta-icon">👥</span>
            <div>
              <span className="room-detail__meta-label">{t('roomDetail.capacity')}</span>
              <span className="room-detail__meta-value">{t('roomDetail.people', { count: room.capacity })}</span>
            </div>
          </div>
          <div className="room-detail__meta-item">
            <span className="room-detail__meta-icon">📅</span>
            <div>
              <span className="room-detail__meta-label">{t('roomDetail.createdAt')}</span>
              <span className="room-detail__meta-value">
                {new Date(room.createdAt).toLocaleDateString(navigator.language)}
              </span>
            </div>
          </div>
          <div className="room-detail__meta-item">
            <span className="room-detail__meta-icon">⚙️</span>
            <div>
              <span className="room-detail__meta-label">{t('roomDetail.autoApprove')}</span>
              <span className="room-detail__meta-value">
                {room.autoApprove ? t('roomDetail.autoApproveActive') : t('roomDetail.autoApproveInactive')}
              </span>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="room-detail__section">
          <div className="room-detail__section-header">
            <h2 className="room-detail__section-title">{t('roomDetail.equipment')}</h2>
            {isAdmin && !equipEditMode && (
              <button
                id="edit-equipment-btn"
                className="room-detail__equip-edit-btn"
                onClick={startEquipEdit}
                title={t('roomDetail.editEquipment', 'Chỉnh sửa thiết bị')}
              >
                <FiEdit2 size={14} />
                <span>{t('common.edit')}</span>
              </button>
            )}
          </div>

          {equipEditMode ? (
            /* ── Edit mode ── */
            <div className="room-detail__equip-editor">
              <div className="room-detail__equip-grid">
                {[
                  { value: 'Máy chiếu', icon: '📽️', label: t('rooms.equipmentOptions.projector') },
                  { value: 'Micro',     icon: '🎤', label: t('rooms.equipmentOptions.microphone') },
                  { value: 'Bảng trắng', icon: '📋', label: t('rooms.equipmentOptions.whiteboard') },
                  { value: 'TV',        icon: '🖥️', label: t('rooms.equipmentOptions.tv') },
                  { value: 'Webcam',    icon: '📷', label: t('rooms.equipmentOptions.webcam') },
                  { value: 'Loa',       icon: '🔊', label: t('rooms.equipmentOptions.speaker') },
                  { value: 'Điều hòa',  icon: '❄️', label: t('rooms.equipmentOptions.airConditioner') },
                ].map(({ value, icon, label }) => {
                  const checked = equipDraft.includes(value);
                  return (
                    <label
                      key={value}
                      htmlFor={`equip-inline-${value}`}
                      className={`room-detail__equip-option${checked ? ' selected' : ''}`}
                    >
                      <input
                        id={`equip-inline-${value}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEquipItem(value)}
                        className="room-detail__equip-checkbox"
                      />
                      <span className="room-detail__equip-icon">{icon}</span>
                      <span className="room-detail__equip-label">{label}</span>
                      {checked && <FiCheck className="room-detail__equip-check" size={13} />}
                    </label>
                  );
                })}
              </div>
              <div className="room-detail__equip-actions">
                <button
                  id="save-equipment-btn"
                  className="btn btn--primary btn--sm"
                  onClick={saveEquipment}
                  disabled={equipSaving}
                >
                  {equipSaving ? (
                    <><span className="spinner-xs" /> {t('rooms.form.saving')}</>
                  ) : (
                    <><FiCheck size={14} /> {t('common.save', 'Lưu')}</>
                  )}
                </button>
                <button
                  id="cancel-equipment-btn"
                  className="btn btn--secondary btn--sm"
                  onClick={cancelEquipEdit}
                  disabled={equipSaving}
                >
                  <FiX size={14} /> {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : room.equipment && room.equipment.length > 0 ? (
            /* ── View mode — has equipment ── */
            <div className="room-detail__equipment">
              {room.equipment.map((item) => (
                <div key={item} className="room-detail__equipment-badge">
                  <span className="room-detail__equipment-icon">
                    {EQUIPMENT_ICONS[item] || '🔧'}
                  </span>
                  <span>{equipmentLabel[item] || item}</span>
                </div>
              ))}
            </div>
          ) : (
            /* ── View mode — no equipment ── */
            <p className="room-detail__no-equipment">{t('roomDetail.noEquipment')}</p>
          )}
        </div>

        {/* Placeholder for today's usage timeline */}
        <div className="room-detail__section">
          <h2 className="room-detail__section-title">{t('roomDetail.usageHistory')}</h2>
          <div className="room-detail__timeline-placeholder">
            <span>📆</span>
            <p>{t('roomDetail.usagePlaceholder')}</p>
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
        title={t('roomDetail.disableTitle')}
        message={t('roomDetail.disableConfirm', { name: room.name })}
        confirmLabel={t('roomDetail.delete')}
        isLoading={deleteLoading}
      />

      {/* QR Modal */}
      {qrOpen && (
        <RoomQRModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          room={room}
        />
      )}
    </div>
  );
}

export default RoomDetailPage;
