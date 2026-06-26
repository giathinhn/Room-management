import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import templateService from '../services/template.service';
import TemplateList from '../components/templates/TemplateList';
import TemplateForm from '../components/templates/TemplateForm';
import './TemplatesPage.css';

const MAX_TEMPLATES = 10;

/**
 * TemplatesPage — full page to manage booking templates (CRUD).
 */
function TemplatesPage() {
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
      toast.error('Không thể tải danh sách mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateNew = () => setModal({ mode: 'create' });
  const handleEdit = (template) => setModal({ mode: 'edit', template });

  const handleDelete = async (template) => {
    if (!window.confirm(`Xóa mẫu "${template.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await templateService.deleteTemplate(template.id);
      toast.success('Đã xóa mẫu đặt phòng');
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (err) {
      const msg = err.response?.data?.message || 'Xóa thất bại';
      toast.error(msg);
    }
  };

  const handleUse = (template) => {
    // Navigate to BookingCreatePage with template pre-fill
    const params = new URLSearchParams();
    if (template.roomId) params.set('roomId', template.roomId);
    if (template.title) params.set('title', template.title);

    // Extract HH:mm for startTime and endTime from the Time field
    if (template.startTime) {
      const d = new Date(template.startTime);
      params.set('startHHMM', `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }
    if (template.endTime) {
      const d = new Date(template.endTime);
      params.set('endHHMM', `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }

    navigate(`/bookings/new?${params.toString()}`);
  };

  const handleSave = async (formData) => {
    setModalLoading(true);
    try {
      if (modal.mode === 'create') {
        const res = await templateService.createTemplate(formData);
        toast.success('Tạo mẫu thành công!');
        setTemplates((prev) => [res.data, ...prev]);
      } else {
        const res = await templateService.updateTemplate(modal.template.id, formData);
        toast.success('Cập nhật mẫu thành công!');
        setTemplates((prev) =>
          prev.map((t) => (t.id === modal.template.id ? res.data : t))
        );
      }
      setModal(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Lưu mẫu thất bại';
      toast.error(msg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="templates-page">
      {/* Page Header */}
      <div className="templates-page__header">
        <div>
          <h1 className="templates-page__title">📋 Mẫu đặt phòng</h1>
          <p className="templates-page__subtitle">
            Lưu các cấu hình đặt phòng thường xuyên — đặt phòng nhanh chỉ 1 click
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="templates-page__loading">
          <div className="spinner" />
          <p>Đang tải...</p>
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
