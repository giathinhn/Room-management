import Modal from '../common/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './RoomQRModal.css';

function RoomQRModal({ isOpen, onClose, room }) {
  const { t } = useTranslation();
  if (!room) return null;

  const quickBookUrl = `${window.location.origin}/rooms/${room.id}/quick-book`;

  const handleDownload = () => {
    const canvas = document.getElementById(`qr-code-canvas-${room.id}`);
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_Code_${room.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handlePrint = () => {
    window.open(`/rooms/${room.id}/qr`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('rooms.qrModal.qrTitle', { name: room.name })}>
      <div className="room-qr-modal">
        <p className="room-qr-modal__description">
          {t('rooms.qrModal.qrDesc')}
        </p>

        <div className="room-qr-modal__canvas-wrapper">
          <QRCodeCanvas
            id={`qr-code-canvas-${room.id}`}
            value={quickBookUrl}
            size={220}
            level="H"
            includeMargin={true}
            style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>

        <p className="room-qr-modal__url">{quickBookUrl}</p>

        <div className="room-qr-modal__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleDownload}
            title={t('rooms.qrModal.downloadPngTooltip')}
          >
            <FiDownload style={{ marginRight: '8px' }} />
            {t('rooms.qrModal.downloadPng')}
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={handlePrint}
            title={t('rooms.qrModal.printPreviewTooltip')}
          >
            <FiPrinter style={{ marginRight: '8px' }} />
            {t('rooms.qrModal.printPreview')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RoomQRModal;
