import React, { useState, useRef, useEffect } from 'react';

/**
 * CommentInput — textarea with submit button for writing new comments.
 *
 * @param {{
 *   onSubmit: (content: string) => Promise<void>,
 *   disabled?: boolean,
 * }} props
 */
function CommentInput({ onSubmit, disabled = false }) {
  const [content, setContent]   = useState('');
  const [loading, setLoading]   = useState(false);
  const textareaRef             = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || loading || disabled) return;

    setLoading(true);
    try {
      await onSubmit(trimmed);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > 1000;

  return (
    <form className="comment-input" onSubmit={handleSubmit}>
      <div className="comment-input__wrapper">
        <textarea
          id="comment-input-textarea"
          ref={textareaRef}
          className={`comment-input__textarea ${isOverLimit ? 'comment-input__textarea--error' : ''}`}
          placeholder="Viết bình luận... (Ctrl+Enter để gửi)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || disabled}
          rows={2}
          maxLength={1010} // slight buffer; validation happens on submit
        />

        <div className="comment-input__footer">
          <span className={`comment-input__count ${isOverLimit ? 'comment-input__count--error' : ''}`}>
            {charCount}/1000
          </span>
          <button
            id="comment-submit-btn"
            type="submit"
            className="comment-input__submit"
            disabled={!content.trim() || loading || disabled || isOverLimit}
          >
            {loading ? 'Đang gửi...' : 'Gửi 📤'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CommentInput;
