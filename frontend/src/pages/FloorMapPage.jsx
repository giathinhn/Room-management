import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import floorMapService from '../services/floormap.service';
import { useAuth } from '../context/AuthContext';
import FloorSelector from '../components/floormap/FloorSelector';
import BuildingSelector from '../components/floormap/BuildingSelector';
import StatusLegend from '../components/floormap/StatusLegend';
import RoomBlock from '../components/floormap/RoomBlock';
import RoomQuickViewModal from '../components/floormap/RoomQuickViewModal';
import RoomPositionEditor from '../components/floormap/RoomPositionEditor';
import { useTranslation } from 'react-i18next';
import useSSEEvent from '../hooks/useSSEEvent';
import './FloorMapPage.css';

const AUTO_REFRESH_SEC = 30;

const FloorMapPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedRoom, setDraggedRoom] = useState(null);
  
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SEC);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // ── Dynamic Grid Columns & Rows Settings ───────────────────────────────────
  const [colsCount, setColsCount] = useState(4);
  const [rowsCount, setRowsCount] = useState(4);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'available').length,
    inUse: rooms.filter((r) => r.status === 'in_use').length,
    upcoming: rooms.filter((r) => r.status === 'upcoming').length,
  };

  // ── Fetch buildings ────────────────────────────────────────────────────────
  const fetchBuildings = useCallback(async () => {
    try {
      const data = await floorMapService.getBuildings();
      setBuildings(data);
      if (data.length > 0 && !selectedBuilding) {
        setSelectedBuilding(data[0]);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách tòa nhà:', err);
    }
  }, [selectedBuilding]);

  // ── Fetch floors for selected building ──────────────────────────────────────
  const fetchFloorsForBuilding = useCallback(async (building) => {
    if (!building) return;
    try {
      const data = await floorMapService.getFloors(building);
      setFloors(data);
      if (data.length > 0) {
        if (!selectedFloor || !data.includes(selectedFloor)) {
          setSelectedFloor(data[0]);
        }
      } else {
        setSelectedFloor(null);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách tầng:', err);
    }
  }, [selectedFloor]);

  // ── Fetch floor setting ────────────────────────────────────────────────────
  const fetchFloorSetting = useCallback(async () => {
    if (!selectedBuilding || !selectedFloor) return;
    try {
      const setting = await floorMapService.getFloorSetting(selectedBuilding, selectedFloor);
      setColsCount(setting?.cols || 4);
      setRowsCount(setting?.rows || 4);
    } catch (err) {
      console.error('Lỗi lấy cấu hình tầng:', err);
    }
  }, [selectedBuilding, selectedFloor]);

  // ── Fetch floor map rooms ──────────────────────────────────────────────────
  const fetchFloorMap = useCallback(
    async (silent = false) => {
      if (!selectedFloor || !selectedBuilding) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const data = await floorMapService.getFloorMap(selectedFloor, selectedBuilding);
        
        // Ensure every room has valid mapX and mapY grid values
        const positioned = [];
        data.forEach(r => {
          if (r.mapX != null && r.mapY != null && r.mapX < colsCount && r.mapY < rowsCount) {
            positioned.push(r);
          }
        });

        let currentY = positioned.reduce((max, r) => Math.max(max, r.mapY || 0), -1) + 1;
        let currentX = 0;
        
        const finalizedRooms = [...data];
        finalizedRooms.forEach(room => {
          if (room.mapX == null || room.mapY == null || room.mapX >= colsCount || room.mapY >= rowsCount) {
            while (finalizedRooms.some(r => r.mapX === currentX && r.mapY === currentY && r.id !== room.id)) {
              currentX++;
              if (currentX >= colsCount) {
                currentX = 0;
                currentY++;
              }
            }
            room.mapX = currentX;
            room.mapY = currentY;
            currentX++;
            if (currentX >= colsCount) {
              currentX = 0;
              currentY++;
            }
          }
        });

        setRooms(finalizedRooms);
      } catch (err) {
        setError(t('floorMap.error'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedFloor, selectedBuilding, colsCount, rowsCount, t]
  );

  // ── Init ──
  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      fetchFloorsForBuilding(selectedBuilding);
    }
  }, [selectedBuilding, fetchFloorsForBuilding]);

  useEffect(() => {
    if (selectedFloor && selectedBuilding) {
      fetchFloorSetting();
    }
  }, [selectedFloor, selectedBuilding, fetchFloorSetting]);

  useEffect(() => {
    if (selectedFloor && selectedBuilding) {
      fetchFloorMap();
    }
  }, [selectedFloor, selectedBuilding, fetchFloorMap]);

  // ── Auto-refresh timer ──
  useEffect(() => {
    setCountdown(AUTO_REFRESH_SEC);

    timerRef.current = setInterval(() => {
      fetchFloorMap(true);
      setCountdown(AUTO_REFRESH_SEC);
    }, AUTO_REFRESH_SEC * 1000);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : AUTO_REFRESH_SEC));
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [fetchFloorMap]);

  const handleLiveRefresh = useCallback(() => {
    fetchFloorMap(true);
    setCountdown(AUTO_REFRESH_SEC);
  }, [fetchFloorMap]);

  useSSEEvent('bookings_changed', handleLiveRefresh);
  useSSEEvent('rooms_changed', handleLiveRefresh);

  // ── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragStart = (room) => {
    setDraggedRoom(room);
  };

  const handleDropRoom = async (targetX, targetY) => {
    if (!draggedRoom) return;

    // Check if slot occupied to swap
    const targetRoom = rooms.find(r => r.mapX === targetX && r.mapY === targetY);
    
    // Update local state instantly for optimistic UI response
    const updatedRooms = rooms.map(r => {
      if (r.id === draggedRoom.id) {
        return { ...r, mapX: targetX, mapY: targetY };
      }
      if (targetRoom && r.id === targetRoom.id) {
        return { ...r, mapX: draggedRoom.mapX, mapY: draggedRoom.mapY };
      }
      return r;
    });
    setRooms(updatedRooms);

    try {
      await floorMapService.updateMapPosition(draggedRoom.id, {
        mapX: targetX,
        mapY: targetY,
      });

      if (targetRoom) {
        await floorMapService.updateMapPosition(targetRoom.id, {
          mapX: draggedRoom.mapX,
          mapY: draggedRoom.mapY,
        });
      }
    } catch (err) {
      // Revert if error
      fetchFloorMap(true);
    } finally {
      setDraggedRoom(null);
    }
  };

  const handleColsChange = async (newCols) => {
    if (!selectedBuilding || !selectedFloor) return;
    try {
      await floorMapService.updateFloorSetting(selectedBuilding, selectedFloor, newCols, undefined);
      setColsCount(newCols);
      fetchFloorMap(true);
    } catch (err) {
      console.error('Lỗi cập nhật cấu hình cột:', err);
    }
  };

  const handleRowsChange = async (newRows) => {
    if (!selectedBuilding || !selectedFloor) return;
    try {
      await floorMapService.updateFloorSetting(selectedBuilding, selectedFloor, undefined, newRows);
      setRowsCount(newRows);
      fetchFloorMap(true);
    } catch (err) {
      console.error('Lỗi cập nhật cấu hình hàng:', err);
    }
  };

  // ── Handlers ──
  const handleBuildingChange = (building) => {
    setSelectedBuilding(building);
    setSelectedFloor(null);
    setSelectedRoom(null);
  };

  const handleFloorChange = (floor) => {
    setSelectedFloor(floor);
    setSelectedRoom(null);
  };

  const handleRoomClick = (room) => {
    if (isEditMode) return;
    setSelectedRoom(room);
  };

  const handleEditPosition = (e, room) => {
    e.stopPropagation();
    setEditingRoom(room);
    setSelectedRoom(null);
  };

  const handlePositionSaved = () => {
    fetchFloorMap(true);
    fetchBuildings();
    if (selectedBuilding) {
      fetchFloorsForBuilding(selectedBuilding);
    }
    setEditingRoom(null);
  };

  const handleManualRefresh = () => {
    fetchFloorMap(true);
    setCountdown(AUTO_REFRESH_SEC);
  };

  // ── Render Cells logic ──
  const maxRow = rooms.reduce((max, r) => Math.max(max, r.mapY || 0), 0);
  const rowCount = Math.max(rowsCount, maxRow + 1 + (isEditMode ? 1 : 0));
  
  const gridCells = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colsCount; col++) {
      const room = rooms.find(r => r.mapX === col && r.mapY === row);
      gridCells.push({ col, row, room });
    }
  }

  return (
    <div className="floor-map-page">
      {/* ── Page Header ── */}
      <div className="fmp__header">
        <div className="fmp__header-left">
          <div className="fmp__title-group">
            <h1 className="fmp__title">
              <span className="fmp__title-icon">🗺️</span>
              {t('floorMap.title')}
            </h1>
            <p className="fmp__subtitle">
              {t('floorMap.subtitle')}
            </p>
          </div>
        </div>

        <div className="fmp__header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && isEditMode && (
            <>
              <div className="fmp__cols-selector">
                <span>🔲 Cột:</span>
                <select
                  value={colsCount}
                  onChange={(e) => handleColsChange(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} cột
                    </option>
                  ))}
                </select>
              </div>

              <div className="fmp__rows-selector">
                <span>🔳 Hàng:</span>
                <select
                  value={rowsCount}
                  onChange={(e) => handleRowsChange(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((num) => (
                    <option key={num} value={num}>
                      {num} hàng
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {isAdmin && (
            <button
              className={`fmp__edit-mode-btn ${isEditMode ? 'fmp__edit-mode-btn--active' : ''}`}
              onClick={() => setIsEditMode(!isEditMode)}
              id="floor-map-edit-layout-btn"
            >
              {isEditMode ? t('floorMap.editModeActive') : t('floorMap.editModeInactive')}
            </button>
          )}
          <Link to="/bookings/new" className="fmp__book-btn" id="floor-map-book-btn">
            {t('floorMap.bookBtn')}
          </Link>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="fmp__controls">
        <div className="fmp__selectors">
          <BuildingSelector
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onChange={handleBuildingChange}
          />
          <FloorSelector
            floors={floors}
            selectedFloor={selectedFloor}
            onChange={handleFloorChange}
          />
        </div>

        <div className="fmp__controls-right">
          <StatusLegend />
          <div className="fmp__refresh-info">
            <span
              className={`fmp__refresh-dot ${refreshing ? 'fmp__refresh-dot--spinning' : ''}`}
              aria-hidden="true"
            />
            <span className="fmp__refresh-text">
              {refreshing ? t('floorMap.updating') : t('floorMap.updateIn', { seconds: countdown })}
            </span>
            <button
              className="fmp__refresh-btn"
              onClick={handleManualRefresh}
              aria-label={t('floorMap.updating')}
              id="floor-map-refresh-btn"
              disabled={refreshing}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="fmp__stats">
        <div className="fmp__stat fmp__stat--total">
          <span className="fmp__stat-value">{stats.total}</span>
          <span className="fmp__stat-label">{t('floorMap.totalRooms')}</span>
        </div>
        <div className="fmp__stat fmp__stat--available">
          <span className="fmp__stat-value">{stats.available}</span>
          <span className="fmp__stat-label">{t('floorMap.available')}</span>
        </div>
        <div className="fmp__stat fmp__stat--in-use">
          <span className="fmp__stat-value">{stats.inUse}</span>
          <span className="fmp__stat-label">{t('floorMap.inUse')}</span>
        </div>
        <div className="fmp__stat fmp__stat--upcoming">
          <span className="fmp__stat-value">{stats.upcoming}</span>
          <span className="fmp__stat-label">{t('floorMap.upcoming')}</span>
        </div>
      </div>

      {/* ── Main content ── */}
      {loading ? (
        <div className="fmp__loading" aria-live="polite">
          <div className="fmp__loading-spinner" />
          <span>{t('floorMap.loading')}</span>
        </div>
      ) : error ? (
        <div className="fmp__error" role="alert">
          <span className="fmp__error-icon">⚠️</span>
          <span>{error}</span>
          <button className="fmp__error-retry" onClick={handleManualRefresh}>
            {t('floorMap.retry')}
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="fmp__empty">
          <div className="fmp__empty-icon">🏢</div>
          <p>{t('floorMap.empty')}</p>
          {isAdmin && (
            <p className="fmp__empty-hint">
              {t('floorMap.emptyHint').split('{{link}}')[0]}
              <Link to="/rooms">{t('sidebar.rooms')}</Link>
              {t('floorMap.emptyHint').split('{{link}}')[1]}
            </p>
          )}
        </div>
      ) : (
        <div className="fmp__canvas-wrapper">
          {/* ── Floor plan canvas ── */}
          <div
            className="fmp__canvas fmp__canvas--map"
            role="region"
            aria-label={`Sơ đồ tòa ${selectedBuilding} tầng ${selectedFloor}`}
            style={{ gridTemplateColumns: `repeat(${colsCount}, 1fr)` }}
          >
            {/* Grid lines background helper */}
            <div
              className="fmp__canvas-grid"
              aria-hidden="true"
              style={{ backgroundSize: `${100 / colsCount}% 150px` }}
            />

            {/* Room and Placeholder Cells */}
            {gridCells.map(({ col, row, room }) => {
              if (room) {
                return (
                  <div
                    key={`cell-${room.id}`}
                    className="fmp__room-wrapper"
                    style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }}
                  >
                    <RoomBlock
                      room={room}
                      onClick={handleRoomClick}
                      draggable={isEditMode}
                      onDragStart={() => handleDragStart(room)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropRoom(col, row)}
                    />
                    {/* Admin: edit details button in edit mode */}
                    {isAdmin && isEditMode && (
                      <button
                        className="fmp__edit-pos-btn"
                        onClick={(e) => handleEditPosition(e, room)}
                        aria-label={t('floorMap.editPosition', { name: room.name })}
                        title={t('floorMap.editDetails')}
                        id={`edit-pos-${room.id}`}
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                );
              }
              
              if (isEditMode) {
                return (
                  <div
                    key={`placeholder-${col}-${row}`}
                    className="fmp__grid-placeholder"
                    style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropRoom(col, row)}
                  >
                    <span className="placeholder-icon">+</span>
                  </div>
                );
              }
              
              return null;
            })}

            {/* Watermark */}
            {selectedFloor && selectedBuilding && (
              <div className="fmp__floor-watermark" aria-hidden="true">
                {selectedBuilding} - F{selectedFloor}
              </div>
            )}
          </div>

          {/* ── Admin: position editor panel ── */}
          {isAdmin && editingRoom && (
            <div className="fmp__editor-panel">
              <RoomPositionEditor
                room={editingRoom}
                floors={floors}
                colsCount={colsCount}
                rowsCount={rowsCount}
                onSaved={handlePositionSaved}
                onClose={() => setEditingRoom(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Quick view modal ── */}
      {selectedRoom && (
        <RoomQuickViewModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
};

export default FloorMapPage;
