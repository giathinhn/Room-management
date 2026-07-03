import { useState } from 'react';
import toast from 'react-hot-toast';
import floorMapService from '../../services/floormap.service';
import './RoomPositionEditor.css';

const RoomPositionEditor = ({ room, floors, onSaved, onClose }) => {
  const [position, setPosition] = useState({
    floor: room.floor || '1',
    building: room.building || 'A',
    mapX: room.mapX ?? 0,
    mapY: room.mapY ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    let val = value;
    if (field === 'mapX' || field === 'mapY') {
      const num = parseInt(value, 10);
      val = isNaN(num) ? 0 : Math.max(0, num);
      if (field === 'mapX') val = Math.min(3, val); // MAX 4 columns (0-3)
    } else if (field === 'building') {
      val = value.toUpperCase();
    }
    setPosition((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await floorMapService.updateMapPosition(room.id, position);
      toast.success('Đã cập nhật thông tin phòng họp');
      onSaved();
      onClose();
    } catch {
      toast.error('Lỗi khi cập nhật thông tin phòng');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos-editor" role="dialog" aria-label={`Chỉnh sửa phòng ${room.name}`}>
      <div className="pos-editor__header">
        <h3 className="pos-editor__title">🔧 Cấu hình sơ đồ phòng</h3>
        <button className="pos-editor__close" onClick={onClose} aria-label="Đóng">✕</button>
      </div>

      <p className="pos-editor__room-name">{room.name}</p>

      <div className="pos-editor__fields">
        {/* Building & Floor */}
        <div className="pos-editor__row">
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`building-${room.id}`}>🏢 Tòa nhà</label>
            <input
              id={`building-${room.id}`}
              type="text"
              className="pos-editor__input"
              value={position.building}
              onChange={(e) => handleChange('building', e.target.value)}
              placeholder="Ví dụ: A, B, C"
            />
          </div>
          
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`floor-${room.id}`}>🏗️ Tầng</label>
            <input
              id={`floor-${room.id}`}
              type="text"
              className="pos-editor__input"
              value={position.floor}
              onChange={(e) => handleChange('floor', e.target.value)}
              placeholder="Ví dụ: 1, 2, 3"
            />
          </div>
        </div>

        {/* Grid placement */}
        <div className="pos-editor__row">
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`mapX-${room.id}`}>Cột (0 - 3)</label>
            <select
              id={`mapX-${room.id}`}
              className="pos-editor__select"
              value={position.mapX}
              onChange={(e) => handleChange('mapX', e.target.value)}
            >
              <option value={0}>Cột 1 (Trái)</option>
              <option value={1}>Cột 2</option>
              <option value={2}>Cột 3</option>
              <option value={3}>Cột 4 (Phải)</option>
            </select>
          </div>
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`mapY-${room.id}`}>Hàng (0+)</label>
            <input
              id={`mapY-${room.id}`}
              type="number"
              className="pos-editor__input"
              value={position.mapY}
              min={0}
              step={1}
              onChange={(e) => handleChange('mapY', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pos-editor__actions">
        <button className="pos-editor__btn pos-editor__btn--cancel" onClick={onClose}>
          Hủy
        </button>
        <button
          className="pos-editor__btn pos-editor__btn--save"
          onClick={handleSave}
          disabled={saving}
          id={`save-pos-${room.id}`}
        >
          {saving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình'}
        </button>
      </div>
    </div>
  );
};

export default RoomPositionEditor;
