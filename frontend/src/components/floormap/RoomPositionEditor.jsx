import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import floorMapService from '../../services/floormap.service';
import './RoomPositionEditor.css';

const RoomPositionEditor = ({ room, floors, colsCount = 4, rowsCount = 4, onSaved, onClose }) => {
  const { t } = useTranslation();
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
      if (field === 'mapX') val = Math.min(colsCount - 1, val); // MAX columns limit
      if (field === 'mapY') val = Math.min(rowsCount - 1, val); // MAX rows limit
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
      toast.success(t('floorMap.configSuccess'));
      onSaved();
      onClose();
    } catch {
      toast.error(t('floorMap.configError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos-editor" role="dialog" aria-label={t('floorMap.editPosition', { name: room.name })}>
      <div className="pos-editor__header">
        <h3 className="pos-editor__title">{t('floorMap.configTitle')}</h3>
        <button className="pos-editor__close" onClick={onClose} aria-label={t('floorMap.close')}>✕</button>
      </div>

      <p className="pos-editor__room-name">{room.name}</p>

      <div className="pos-editor__fields">
        {/* Building & Floor */}
        <div className="pos-editor__row">
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`building-${room.id}`}>🏢 {t('floorMap.building')}</label>
            <input
              id={`building-${room.id}`}
              type="text"
              className="pos-editor__input"
              value={position.building}
              onChange={(e) => handleChange('building', e.target.value)}
              placeholder={t('floorMap.buildingPlaceholder')}
            />
          </div>
          
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`floor-${room.id}`}>🏗️ {t('floorMap.floor')}</label>
            <input
              id={`floor-${room.id}`}
              type="text"
              className="pos-editor__input"
              value={position.floor}
              onChange={(e) => handleChange('floor', e.target.value)}
              placeholder={t('floorMap.floorPlaceholder')}
            />
          </div>
        </div>

        {/* Grid placement */}
        <div className="pos-editor__row">
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`mapX-${room.id}`}>{t('floorMap.column')}</label>
            <select
              id={`mapX-${room.id}`}
              className="pos-editor__select"
              value={position.mapX}
              onChange={(e) => handleChange('mapX', e.target.value)}
            >
              {Array.from({ length: colsCount }).map((_, i) => (
                <option key={i} value={i}>
                  {t(`floorMap.col${i + 1}`) || `Cột ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div className="pos-editor__field">
            <label className="pos-editor__label" htmlFor={`mapY-${room.id}`}>{t('floorMap.row')}</label>
            <input
              id={`mapY-${room.id}`}
              type="number"
              className="pos-editor__input"
              value={position.mapY}
              min={0}
              max={rowsCount - 1}
              step={1}
              onChange={(e) => handleChange('mapY', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pos-editor__actions">
        <button className="pos-editor__btn pos-editor__btn--cancel" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button
          className="pos-editor__btn pos-editor__btn--save"
          onClick={handleSave}
          disabled={saving}
          id={`save-pos-${room.id}`}
        >
          {saving ? t('floorMap.configSaving') : t('floorMap.configSave')}
        </button>
      </div>
    </div>
  );
};

export default RoomPositionEditor;
