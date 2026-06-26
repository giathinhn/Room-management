import React, { useState } from 'react';
import TemplateCard from './TemplateCard';

/**
 * TemplateList — renders the list of templates as a grid.
 *
 * Props:
 *   templates     — array of template objects
 *   total         — total count (templates.length)
 *   maxTemplates  — maximum allowed (10)
 *   onCreateNew   — callback to open create modal
 *   onUse         — callback(template) — navigate to booking with pre-fill
 *   onEdit        — callback(template) — open edit modal
 *   onDelete      — callback(template) — delete with confirm
 */
function TemplateList({ templates, total, maxTemplates = 10, onCreateNew, onUse, onEdit, onDelete }) {
  const atLimit = total >= maxTemplates;

  return (
    <div className="tpl-list">
      {/* Header */}
      <div className="tpl-list__header">
        <div className="tpl-list__title-area">
          <span className="tpl-list__icon">📋</span>
          <h2 className="tpl-list__title">Mẫu đặt phòng</h2>
          <span className="tpl-list__counter">
            {total}/{maxTemplates}
          </span>
        </div>
        <button
          id="tpl-create-btn"
          className={`tpl-list__create-btn ${atLimit ? 'tpl-list__create-btn--disabled' : ''}`}
          onClick={onCreateNew}
          disabled={atLimit}
          title={atLimit ? `Đã đạt giới hạn ${maxTemplates} mẫu` : 'Tạo mẫu mới'}
        >
          + Tạo mới
        </button>
      </div>

      {/* Grid */}
      {templates.length === 0 ? (
        <div className="tpl-list__empty">
          <span className="tpl-list__empty-icon">📋</span>
          <p className="tpl-list__empty-text">Chưa có mẫu nào. Tạo mẫu đầu tiên!</p>
        </div>
      ) : (
        <div className="tpl-list__grid">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onUse={onUse}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateList;
