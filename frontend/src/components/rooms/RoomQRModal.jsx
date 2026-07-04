import Modal from '../common/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import './RoomQRModal.css';

function RoomQRModal({ isOpen, onClose, room }) {
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
    <Modal isOpen={isOpen} onClose={onClose} title={`📱 Mã QR - ${room.name}`}>
      <div className="room-qr-modal">
        <p className="room-qr-modal__description">
          Quét mã QR dưới đây bằng điện thoại để xem trạng thái thời gian thực và đặt phòng nhanh chóng.
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
            title="Tải xuống QR Code dạng ảnh PNG"
          >
            <FiDownload style={{ marginRight: '8px' }} />
            Tải xuống PNG
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={handlePrint}
            title="Mở trang xem bản in mã QR"
          >
            <FiPrinter style={{ marginRight: '8px' }} />
            Xem bản in
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RoomQRModal;
