import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiSearch, FiUserPlus, FiEdit2, FiShield, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import userService from '../services/user.service';
import Pagination from '../components/common/Pagination';
import EditUserModal from '../components/users/EditUserModal';
import ChangeRoleModal from '../components/users/ChangeRoleModal';
import CreateUserModal from '../components/users/CreateUserModal';
import { useTranslation } from 'react-i18next';
import './UsersPage.css';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  admin:    { gradient: 'linear-gradient(135deg,#6366f1,#ec4899)', badgeClass: 'badge--admin' },
  approver: { gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)', badgeClass: 'badge--approver' },
  user:     { gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', badgeClass: 'badge--user' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(navigator.language, {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

// ─── Skeleton row ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="users-table__row users-table__row--skeleton">
      <td><div className="skeleton skeleton--avatar" /></td>
      <td><div className="skeleton skeleton--text" /><div className="skeleton skeleton--text-sm" /></td>
      <td><div className="skeleton skeleton--badge" /></td>
      <td><div className="skeleton skeleton--badge" /></td>
      <td><div className="skeleton skeleton--text-sm" /></td>
      <td><div className="skeleton skeleton--actions" /></td>
    </tr>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = { page: 1, limit: 15, search: '', role: '', isActive: '' };

function UsersPage() {
  const { t } = useTranslation();
  const [users,       setUsers]       = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS);
  const [loading,     setLoading]     = useState(true);
  const [togglingId,  setTogglingId]  = useState(null);

  const roleLabel = {
    admin: t('roles.admin'),
    approver: t('roles.approver'),
    user: t('roles.user')
  };

  // Modal states
  const [editUser,         setEditUser]         = useState(null);
  const [roleUser,         setRoleUser]         = useState(null);
  const [createModalOpen,  setCreateModalOpen]  = useState(false);

  // Debounce search
  const searchTimerRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = {
        page:  f.page,
        limit: f.limit,
        ...(f.search   && { search: f.search }),
        ...(f.role     && { role: f.role }),
        ...(f.isActive !== '' && { isActive: f.isActive }),
      };
      const result = await userService.getUsers(params);
      setUsers(result.data.users);
      setPagination(result.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || t('users.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers(filters);
  }, [filters, fetchUsers]);

  // ── Filter handlers ──────────────────────────────────────────────────────────
  function handleSearchChange(e) {
    const val = e.target.value;
    setFilters((prev) => ({ ...prev, search: val }));
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: val, page: 1 }));
    }, 400);
  }

  function handleRoleFilter(e) {
    setFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }));
  }

  function handleStatusFilter(e) {
    setFilters((prev) => ({ ...prev, isActive: e.target.value, page: 1 }));
  }

  function handlePageChange(page) {
    setFilters((prev) => ({ ...prev, page }));
  }

  // ── Quick toggle active ──────────────────────────────────────────────────────
  async function handleToggleActive(user) {
    setTogglingId(user.id);
    try {
      await userService.updateUser(user.id, { isActive: !user.isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
      toast.success(
        user.isActive ? t('users.deactivateSuccess', { name: user.fullName }) : t('users.activateSuccess', { name: user.fullName })
      );
    } catch (err) {
      toast.error(err.response?.data?.message || t('users.updateStatusFailed'));
    } finally {
      setTogglingId(null);
    }
  }

  // ── Modal callbacks ──────────────────────────────────────────────────────────
  function handleUserSaved(updated) {
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
    );
  }

  // Custom JSX for Title Count using i18n
  const renderTitleCount = () => {
    if (loading) return t('users.loading');
    const parts = t('users.totalUsers', { count: pagination.total }).split(/<span[^>]*>|<\/span>/);
    if (parts.length === 3) {
      return (
        <>
          {parts[0]}
          <span className="users-page__count">{pagination.total}</span>
          {parts[2]}
        </>
      );
    }
    return t('users.totalUsers', { count: pagination.total });
  };

  function handleUserCreated() {
    setFilters((prev) => ({ ...prev, page: 1 }));
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="users-page">
      {/* ── Header ── */}
      <div className="users-page__header">
        <div>
          <h1 className="users-page__title">👥 {t('users.title')}</h1>
          <p className="users-page__subtitle">
            {renderTitleCount()}
          </p>
        </div>
        <button
          id="create-user-btn"
          className="btn btn--primary users-page__create-btn"
          onClick={() => setCreateModalOpen(true)}
        >
          <FiUserPlus />
          <span>{t('users.addUser')}</span>
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="users-page__toolbar">
        {/* Search */}
        <div className="users-page__search-wrap">
          <FiSearch className="users-page__search-icon" />
          <input
            id="users-search-input"
            type="text"
            className="users-page__search"
            placeholder={t('users.searchPlaceholder')}
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Role filter */}
        <select
          id="users-role-filter"
          className="users-page__select"
          value={filters.role}
          onChange={handleRoleFilter}
        >
          <option value="">{t('users.allRoles')}</option>
          <option value="admin">{roleLabel.admin}</option>
          <option value="approver">{roleLabel.approver}</option>
          <option value="user">{roleLabel.user}</option>
        </select>

        {/* Status filter */}
        <select
          id="users-status-filter"
          className="users-page__select"
          value={filters.isActive}
          onChange={handleStatusFilter}
        >
          <option value="">{t('users.allStatuses')}</option>
          <option value="true">{t('users.active')}</option>
          <option value="false">{t('users.inactive')}</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="users-page__table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>{t('users.userCol')}</th>
              <th>{t('users.nameEmailCol')}</th>
              <th>{t('users.roleCol')}</th>
              <th>{t('users.statusCol')}</th>
              <th>{t('users.createdCol')}</th>
              <th className="users-table__actions-col">{t('users.actionsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="users-table__empty">
                  <div className="users-table__empty-inner">
                    <span className="users-table__empty-icon">🔍</span>
                    <p>{t('users.noUsers')}</p>
                    {(filters.search || filters.role || filters.isActive !== '') && (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                      >
                        {t('users.clearFilters')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
                return (
                  <tr key={user.id} className="users-table__row">
                    {/* Avatar */}
                    <td>
                      <div
                        className="user-avatar"
                        style={{ background: rc.gradient }}
                        title={user.fullName}
                      >
                        {getInitials(user.fullName)}
                      </div>
                    </td>

                    {/* Name + Email */}
                    <td>
                      <p className="users-table__name">{user.fullName}</p>
                      <p className="users-table__email">{user.email}</p>
                    </td>

                    {/* Role badge */}
                    <td>
                      <span className={`role-badge ${rc.badgeClass}`}>
                        {roleLabel[user.role] || user.role}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className={`status-badge ${user.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        {user.isActive ? t('users.active') : t('users.inactive')}
                      </span>
                    </td>

                    {/* Created at */}
                    <td className="users-table__date">{formatDate(user.createdAt)}</td>

                    {/* Actions */}
                    <td>
                      <div className="users-table__actions">
                        {/* Edit */}
                        <button
                          className="action-btn action-btn--edit"
                          title={t('users.editTooltip')}
                          onClick={() => setEditUser(user)}
                        >
                          <FiEdit2 />
                        </button>

                        {/* Change role */}
                        <button
                          className="action-btn action-btn--role"
                          title={t('users.roleTooltip')}
                          onClick={() => setRoleUser(user)}
                        >
                          <FiShield />
                        </button>

                        {/* Toggle active */}
                        <button
                          className={`action-btn ${user.isActive ? 'action-btn--deactivate' : 'action-btn--activate'}`}
                          title={user.isActive ? t('users.deactivateTooltip') : t('users.activateTooltip')}
                          onClick={() => handleToggleActive(user)}
                          disabled={togglingId === user.id}
                        >
                          {user.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {!loading && pagination.totalPages > 1 && (
        <div className="users-page__pagination">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
          <p className="users-page__page-info">
            {t('users.pageInfo', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
          </p>
        </div>
      )}

      {/* ── Modals ── */}
      <EditUserModal
        isOpen={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        onSaved={handleUserSaved}
        user={editUser}
      />

      <ChangeRoleModal
        isOpen={Boolean(roleUser)}
        onClose={() => setRoleUser(null)}
        onSaved={handleUserSaved}
        user={roleUser}
      />

      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleUserCreated}
      />
    </div>
  );
}

export default UsersPage;
