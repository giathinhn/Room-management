import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import templateService from '../services/template.service';
import TemplateList from '../components/templates/TemplateList';
import TemplateForm from '../components/templates/TemplateForm';
import { useTranslation } from 'react-i18next';
import './TemplatesPage.css';

const MAX_TEMPLATES = 10;

/**
 * TemplatesPage — full page to manage booking templates (CRUD).
 */
function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', template?: object }
  const [modalLoading, setModalLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await templateService.getTemplates();
      setTemplates(res.data || []);
    } catch (err) {
      toast.error(t('templates.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateNew = () => setModal({ mode: 'create' });
  const handleEdit = (template) => setModal({ mode: 'edit', template });

  const handleDelete = async (template) => {
    if (!window.confirm(t('templates.deleteConfirm', { name: template.name }))) return;
    try {
      await templateService.deleteTemplate(template.id);
      toast.success(t('templates.deleteSuccess'));
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    }
  };

  const handleUse = (template) => {
    // Navigate to BookingCreatePage with template pre-fill
    const params = new URLSearchParams();
    if (template.roomId) params.set('roomId', template.roomId);
    if (template.title) params.set('title', template.title);
    if (template.name) params.set('templateName', template.name);

    // Extract HH:mm for startTime and endTime from the Prisma Time field (UTC epoch)
    // Must use getUTCHours/getUTCMinutes because @db.Time() stores as 1970-01-01THH:MM:00Z
    if (template.startTime) {
      const d = new Date(template.startTime);
      params.set('startHHMM', `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`);
    }
    if (template.endTime) {
      const d = new Date(template.endTime);
      params.set('endHHMM', `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`);
    }

    navigate(`/bookings/new?${params.toString()}`);
  };

  const handleSave = async (formData) => {
    setModalLoading(true);
    try {
      if (modal.mode === 'create') {
        const res = await templateService.createTemplate(formData);
        toast.success(t('templates.createSuccess'));
        setTemplates((prev) => [res.data, ...prev]);
      } else {
        const res = await templateService.updateTemplate(modal.template.id, formData);
        toast.success(t('templates.updateSuccess'));
        setTemplates((prev) =>
          prev.map((t) => (t.id === modal.template.id ? res.data : t))
        );
      }
      setModal(null);
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="templates-page">
      {/* Page Header */}
      <div className="templates-page__header">
        <div>
          <h1 className="templates-page__title">📋 {t('templates.title')}</h1>
          <p className="templates-page__subtitle">
            {t('templates.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="templates-page__loading">
          <div className="spinner" />
          <p>{t('common.loading')}</p>
        </div>
      ) : (
        <TemplateList
          templates={templates}
          total={templates.length}
          maxTemplates={MAX_TEMPLATES}
          onCreateNew={handleCreateNew}
          onUse={handleUse}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <TemplateForm
          mode={modal.mode}
          initial={modal.template || {}}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isLoading={modalLoading}
        />
      )}
    </div>
  );
}

export default TemplatesPage;
