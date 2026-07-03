import { useState, useEffect, useRef, useCallback } from 'react';
import { FiMessageSquare, FiX, FiSend, FiTrash2, FiUser, FiClock, FiUsers, FiMapPin, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chat.service';
import bookingService from '../../services/booking.service';
import './ChatWidget.css';

// --- Sub-components ----------------------------------------------------------

const RoomCard = ({ room, onBook }) => (
  <div className="chat-room-card">
    <div className="chat-room-card__header">
      <span className="chat-room-card__name">{room.name}</span>
      <span className="chat-room-card__capacity"><FiUsers size={12} /> {room.capacity} người</span>
    </div>
    <div className="chat-room-card__info">
      <span><FiMapPin size={11} /> {room.location}</span>
    </div>
    {room.equipment && room.equipment.length > 0 && (
      <div className="chat-room-card__equipment">
        {room.equipment.slice(0, 3).map((eq) => (
          <span key={eq} className="chat-room-card__tag">{eq}</span>
        ))}
        {room.equipment.length > 3 && (
          <span className="chat-room-card__tag">+{room.equipment.length - 3}</span>
        )}
      </div>
    )}
    <button className="chat-room-card__btn" onClick={() => onBook(room)}>
      Đặt phòng này &rarr;
    </button>
  </div>
);

const BookingProposalCard = ({ proposal, onConfirm, onDecline, confirming }) => {
  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  };
  return (
    <div className="chat-proposal-card">
      <div className="chat-proposal-card__title">📋 Xác nhận đặt phòng</div>
      <div className="chat-proposal-card__detail">
        <span>🏢</span> <strong>{proposal.roomName || proposal.room?.name}</strong>
      </div>
      <div className="chat-proposal-card__detail">
        <span>📌</span> {proposal.title}
      </div>
      <div className="chat-proposal-card__detail">
        <span><FiClock size={12} /></span>
        {fmt(proposal.startTime)} – {new Date(proposal.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="chat-proposal-card__actions">
        <button className="chat-proposal-card__btn-confirm" onClick={() => onConfirm(proposal)} disabled={confirming}>
          {confirming ? '⏳ Đang đặt...' : '✅ Xác nhận đặt'}
        </button>
        <button className="chat-proposal-card__btn-decline" onClick={() => onDecline(proposal)} disabled={confirming}>
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};

const BookingItem = ({ booking }) => {
  const statusLabel = { pending: '⏳ Chờ duyệt', approved: '✅ Đã duyệt', rejected: '❌ Từ chối', cancelled: '🚫 Đã hủy' };
  const fmt = (iso) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  return (
    <div className="chat-booking-item">
      <div className="chat-booking-item__title">{booking.title}</div>
      <div className="chat-booking-item__meta">
        <span>🏢 {booking.room?.name}</span>
        <span>{statusLabel[booking.status] || booking.status}</span>
      </div>
      <div className="chat-booking-item__time">
        <FiClock size={11} /> {fmt(booking.startTime)}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="chat-message chat-message--ai">
    <div className="chat-bubble chat-bubble--ai">
      <div className="chat-typing">
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
      </div>
    </div>
  </div>
);

// --- Main ChatWidget ---------------------------------------------------------

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: 'Xin chào! Tôi là **RoomSync AI** 🤖\n\nTôi có thể giúp bạn:\n• Đặt phòng họp bằng ngôn ngữ tự nhiên\n• Kiểm tra phòng trống\n• Xem lịch cuộc họp của bạn\n• Hủy booking\n\nBạn cần gì?',
  metadata: null,
  createdAt: new Date().toISOString(),
};

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pendingProposal, setPendingProposal] = useState(null);
  const [confirmingProposal, setConfirmingProposal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !historyLoaded && user) {
      loadHistory();
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const loadHistory = async () => {
    try {
      const res = await chatService.getHistory(50);
      const history = res.data || [];
      if (history.length > 0) {
        setMessages([WELCOME_MESSAGE, ...history]);
      }
      setHistoryLoaded(true);
    } catch {
      setHistoryLoaded(true);
    }
  };

  const handleSend = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    setInput('');
    setPendingProposal(null);

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await chatService.sendMessage(text);
      const aiData = res.data;

      if (aiData.action === 'propose_booking' && aiData.proposal) {
        setPendingProposal(aiData.proposal);
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiData.reply,
        metadata: {
          action: aiData.action,
          rooms: aiData.rooms,
          proposal: aiData.proposal,
          bookings: aiData.bookings,
          booking: aiData.booking,
        },
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!',
        metadata: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRoom = (room) => {
    handleSend(`Đặt phòng ${room.name}`);
  };

  const handleConfirmProposal = async (proposalArg) => {
    const proposal = proposalArg || pendingProposal;
    if (!proposal || confirmingProposal) return;
    setConfirmingProposal(true);
    try {
      await bookingService.createBooking({
        roomId: proposal.roomId,
        title: proposal.title,
        startTime: proposal.startTime,
        endTime: proposal.endTime,
      });
      setPendingProposal(null);
      const successMsg = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Đặt phòng thành công!**\n\nCuộc họp **${proposal.title}** tại **${proposal.roomName}** đã được tạo và đang chờ duyệt. Bạn có thể xem trong trang [Đặt phòng của tôi](/bookings).`,
        metadata: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        if (!Array.isArray(prev)) return [successMsg];
        return prev
          .map((m) => {
            // Find the exact message containing this proposal to nullify it and hide buttons
            if (m && m.metadata && m.metadata.proposal && m.metadata.proposal.roomId === proposal.roomId && m.metadata.proposal.startTime === proposal.startTime) {
              return {
                ...m,
                metadata: {
                  ...m.metadata,
                  proposal: null,
                },
              };
            }
            return m;
          })
          .concat([successMsg]);
      });
      toast.success('Đặt phòng thành công!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Không thể đặt phòng. Vui lòng thử lại.');
    } finally {
      setConfirmingProposal(false);
    }
  };

  const handleDeclineProposal = (proposalArg) => {
    const proposal = proposalArg || pendingProposal;
    setPendingProposal(null);
    const declineMsg = {
      id: `decline-${Date.now()}`,
      role: 'assistant',
      content: 'Đã hủy đề xuất. Bạn muốn tìm phòng khác hoặc thay đổi thời gian không?',
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => {
      if (!Array.isArray(prev)) return [declineMsg];
      return prev
        .map((m) => {
          if (proposal && m && m.metadata && m.metadata.proposal && m.metadata.proposal.roomId === proposal.roomId && m.metadata.proposal.startTime === proposal.startTime) {
            return {
              ...m,
              metadata: {
                ...m.metadata,
                proposal: null,
              },
            };
          }
          return m;
        })
        .concat([declineMsg]);
    });
  };

  const handleClearHistory = async () => {
    try {
      await chatService.clearHistory();
      setMessages([WELCOME_MESSAGE]);
      setPendingProposal(null);
      setHistoryLoaded(true);
      toast.success('Đã xóa lịch sử chat');
    } catch {
      toast.error('Không thể xóa lịch sử');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (text) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  const renderMessage = (msg) => {
    const isUser = msg.role === 'user';
    const meta = msg.metadata;

    return (
      <div key={msg.id} className={`chat-message chat-message--${isUser ? 'user' : 'ai'}`}>
        {!isUser && (
          <div className="chat-avatar">🤖</div>
        )}
        <div className="chat-bubble-wrapper">
          <div className={`chat-bubble chat-bubble--${isUser ? 'user' : 'ai'}`}>
            {msg.content.split('\n').map((line, i, arr) => (
              <span key={i}>
                {renderContent(line)}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </div>

          {Array.isArray(meta?.rooms) && meta.rooms.length > 0 && (
            <div className="chat-cards">
              {meta.rooms.map((room) => (
                <RoomCard key={room.id} room={room} onBook={handleBookRoom} />
              ))}
            </div>
          )}

          {meta?.proposal && (
            <BookingProposalCard
              proposal={meta.proposal}
              onConfirm={handleConfirmProposal}
              onDecline={handleDeclineProposal}
              confirming={confirmingProposal}
            />
          )}

          {Array.isArray(meta?.bookings) && meta.bookings.length > 0 && (
            <div className="chat-booking-list">
              {meta.bookings.map((b) => (
                <BookingItem key={b.id} booking={b} />
              ))}
            </div>
          )}

          {meta?.booking && (
            <div className="chat-booking-result">
              <FiCheck size={14} /> Booking ID: {meta.booking.id?.slice(0, 8)}...
            </div>
          )}

          <span className="chat-time">
            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {isUser && (
          <div className="chat-avatar chat-avatar--user">
            {user?.fullName?.[0]?.toUpperCase() || <FiUser />}
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Bubble */}
      <button
        id="ai-chat-bubble-btn"
        className={`chat-bubble-btn ${isOpen ? 'chat-bubble-btn--active' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Mo AI Chatbot"
        title="RoomSync AI Assistant"
      >
        {isOpen ? <FiX size={24} /> : <FiMessageSquare size={24} />}
        {!isOpen && messages.length > 1 && (
          <span className="chat-bubble-btn__pulse" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel" role="dialog" aria-label="AI Chatbot">
          {/* Header */}
          <div className="chat-panel__header">
            <div className="chat-panel__header-info">
              <div className="chat-panel__avatar">🤖</div>
              <div>
                <div className="chat-panel__title">RoomSync AI</div>
                <div className="chat-panel__subtitle">Tro ly dat phong thong minh</div>
              </div>
            </div>
            <div className="chat-panel__header-actions">
              <button
                className="chat-icon-btn"
                onClick={handleClearHistory}
                title="Xóa lịch sử chat"
                id="chat-clear-history-btn"
              >
                <FiTrash2 size={16} />
              </button>
              <button
                className="chat-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Đóng"
                id="chat-close-btn"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-panel__messages" id="chat-messages-container">
            {messages.map(renderMessage)}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && !isLoading && (
            <div className="chat-suggestions">
              {[
                'Phòng nào trống hôm nay lúc 2h?',
                'Đặt phòng cho 5 người ngày mai lúc 9h',
                'Tôi có lịch họp gì hôm nay?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="chat-suggestion-chip"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-panel__input">
            <textarea
              ref={inputRef}
              id="chat-input"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn... (Enter để gửi)"
              rows={1}
              disabled={isLoading}
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              aria-label="Gửi tin nhắn"
            >
              <FiSend size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
