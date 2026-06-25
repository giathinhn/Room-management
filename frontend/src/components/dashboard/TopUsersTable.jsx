import './TopUsersTable.css';

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'];

/**
 * TopUsersTable — table of top N users by booking count.
 * Props:
 *   data    {Array<{ userId, fullName, email, bookingCount, totalHours }>}
 *   loading {boolean}
 */
const TopUsersTable = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="top-users-table">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="top-users-table__skeleton-row">
            <div className="top-users-table__skeleton top-users-table__skeleton--avatar" />
            <div className="top-users-table__skeleton top-users-table__skeleton--name" />
            <div className="top-users-table__skeleton top-users-table__skeleton--count" />
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <div className="chart-empty">Chưa có dữ liệu trong khoảng thời gian này</div>;
  }

  return (
    <div className="top-users-table" role="table" aria-label="Top người đặt phòng">
      {/* Header */}
      <div className="top-users-table__header" role="row">
        <span>#</span>
        <span>Người dùng</span>
        <span className="top-users-table__right">Lượt đặt</span>
        <span className="top-users-table__right">Giờ</span>
      </div>

      {data.map((user, idx) => {
        const isTop3 = idx < 3;
        return (
          <div
            key={user.userId}
            className={`top-users-table__row${idx === 0 ? ' top-users-table__row--first' : ''}`}
            role="row"
          >
            {/* Rank */}
            <span
              className="top-users-table__rank"
              style={{ color: isTop3 ? RANK_COLORS[idx] : 'var(--color-text-muted)' }}
            >
              {isTop3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
            </span>

            {/* Avatar + Name/Email */}
            <div className="top-users-table__user">
              <div
                className="top-users-table__avatar"
                style={{
                  background: `hsl(${(user.fullName.charCodeAt(0) * 37) % 360}, 60%, 35%)`,
                }}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="top-users-table__info">
                <span className="top-users-table__name">{user.fullName}</span>
                <span className="top-users-table__email">{user.email}</span>
              </div>
            </div>

            {/* Count */}
            <span className="top-users-table__count top-users-table__right">
              {user.bookingCount}
            </span>

            {/* Hours */}
            <span className="top-users-table__hours top-users-table__right">
              {user.totalHours}h
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TopUsersTable;
