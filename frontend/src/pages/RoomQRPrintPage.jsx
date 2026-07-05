import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';
import roomService from '../services/room.service';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './RoomQRPrintPage.css';

function RoomQRPrintPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoom() {
      try {
        const result = await roomService.getRoom(id);
        setRoom(result.data);
      } catch (err) {
        toast.error(t('qrPrint.loadFailed'));
        navigate('/rooms');
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [id, navigate, t]);

  if (loading) {
    return (
      <div className="qr-print-page__loading">
        <div className="spinner" />
        <p>{t('qrPrint.loading')}</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="qr-print-page__error">
        <p>{t('qrPrint.notFound')}</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/rooms')}>
          {t('qrPrint.back')}
        </button>
      </div>
    );
  }

  const quickBookUrl = `${window.location.origin}/rooms/${room.id}/quick-book`;

  return (
    <div className="qr-print-page">
      {/* Action buttons - hidden during print */}
      <div className="qr-print-page__toolbar">
        <button type="button" className="btn btn--outline btn--sm" onClick={() => window.close()}>
          <FiArrowLeft style={{ marginRight: '6px' }} /> {t('qrPrint.closeTab')}
        </button>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => window.print()}>
          <FiPrinter style={{ marginRight: '6px' }} /> {t('qrPrint.printPage')}
        </button>
      </div>

      {/* Main poster to print */}
      <div className="qr-print-page__poster">
        <div className="qr-print-page__header">
          <div className="qr-print-page__logo">
            <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#6366f1" />
              <path d="M7 10h14M7 14h10M7 18h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span className="qr-print-page__logo-text">RoomBook</span>
          </div>
        </div>

        <div className="qr-print-page__body">
          <h1 className="qr-print-page__title">{room.name}</h1>
          <p className="qr-print-page__location">📍 {room.location}</p>

          <div className="qr-print-page__qr-container">
            <QRCodeCanvas
              value={quickBookUrl}
              size={320}
              level="H"
              includeMargin={true}
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '12px',
              }}
            />
          </div>

          <div className="qr-print-page__instructions">
            <h2>{t('qrPrint.instructionsTitle')}</h2>
            <ol>
              <li>{t('qrPrint.step1')}</li>
              <li>{t('qrPrint.step2')}</li>
              <li>{t('qrPrint.step3')}</li>
            </ol>
          </div>
        </div>

        <div className="qr-print-page__footer">
          <p className="qr-print-page__url">{quickBookUrl}</p>
          <p className="qr-print-page__copyright">{t('qrPrint.copyright')}</p>
        </div>
      </div>
    </div>
  );
}

export default RoomQRPrintPage;
