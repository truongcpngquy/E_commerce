import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import adminApi from '../api/adminApi';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  UserCheck,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  ShieldAlert,
  UserX,
  Store,
  DollarSign,
  Package,
  Award
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, login, showToast } = useApp();
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminStats();
      loadUsersData();
    }
  }, [user, roleFilter, statusFilter]);

  const loadAdminStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsersData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({
        role: roleFilter,
        status: statusFilter,
        search: searchInput
      });
      setUsersList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsersData();
  };

  // 1-Click Approve Seller Account (pending -> active)
  const handleApproveSeller = async (userId, username) => {
    try {
      await adminApi.updateUserStatus(userId, 'active');
      showToast(`Đã phê duyệt tài khoản Người bán "${username}" thành công!`, 'success');
      loadUsersData();
      loadAdminStats();
    } catch (err) {
      showToast(err.message || 'Lỗi phê duyệt tài khoản!', 'error');
    }
  };

  // Change User Status (active <-> suspended)
  const handleToggleStatus = async (userId, currentStatus, username) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'suspended' ? 'Khóa' : 'Kích hoạt lại';
    
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản "${username}"?`)) return;

    try {
      await adminApi.updateUserStatus(userId, newStatus);
      showToast(`Đã ${actionText} tài khoản "${username}" thành công!`, 'success');
      loadUsersData();
      loadAdminStats();
    } catch (err) {
      showToast(err.message || 'Lỗi thay đổi trạng thái!', 'error');
    }
  };

  // Change User Role (customer <-> seller <-> admin)
  const handleRoleChange = async (userId, newRole, username) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      showToast(`Đã cập nhật vai trò tài khoản "${username}" thành "${newRole.toUpperCase()}"!`, 'success');
      loadUsersData();
      loadAdminStats();
    } catch (err) {
      showToast(err.message || 'Lỗi thay đổi vai trò!', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ CẢNH BÁO: Xóa vĩnh viễn tài khoản "${username}"? Thao tác này không thể hoàn tác!`)) return;

    try {
      await adminApi.deleteUser(userId);
      showToast(`Đã xóa tài khoản "${username}" khỏi hệ thống!`, 'success');
      loadUsersData();
      loadAdminStats();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa người dùng!', 'error');
    }
  };

  // Quick Login for Demo Admin
  const handleQuickLoginAdmin = async () => {
    setIsSubmitting(true);
    await login('admin', '123456');
    setIsSubmitting(false);
  };

  // Access Lock if Not Admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-portal-error fade-in" style={{ textAlign: 'center', padding: '50px 20px', maxWidth: '620px', margin: '40px auto', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <ShieldAlert size={64} color="#4f46e5" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Trang Quản Trị Hệ Thống Admin (Admin Portal)</h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
          {!user 
            ? 'Bạn chưa đăng nhập. Nhấp vào nút bên dưới để tự động đăng nhập với quyền Admin (admin / 123456) và vào ngay Trang Quản Trị.' 
            : `Tài khoản hiện tại (${user.username}) đang có vai trò "${user.role.toUpperCase()}". Nhấp bên dưới để chuyển sang quyền Admin.`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleQuickLoginAdmin} 
            disabled={isSubmitting} 
            style={{ padding: '14px 28px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '24px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)', width: '100%', maxWidth: '360px' }}
          >
            {isSubmitting ? 'Đang xử lý...' : '🛡️ Vào Trang Admin Ngay (Chuyển Sang Admin)'}
          </button>
          <Link to="/" style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', textDecoration: 'underline' }}>Quay lại trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container fade-in">
      {/* Top Banner Header */}
      <div className="admin-header-banner">
        <div className="admin-banner-text">
          <h1>Trang Quản Trị Hệ Thống Shopee (Admin Portal)</h1>
          <p>Quản Lý Người Dùng, Phê Duyệt Người Bán (Seller Approval) & Kiểm Soát Phân Quyền</p>
        </div>
        <span className="admin-badge"><Shield size={16} /> Super Admin Control</span>
      </div>

      {/* Admin Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card total-users">
          <div className="stat-icon bg-blue">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Tổng Người Dùng</span>
            <h3 className="stat-num">{stats?.totalUsers || 0}</h3>
            <span className="stat-sub text-gray">Tất cả tài khoản trong CSDL</span>
          </div>
        </div>

        <div className="admin-stat-card pending-sellers">
          <div className="stat-icon bg-orange">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Seller Chờ Phê Duyệt</span>
            <h3 className="stat-num text-orange">{stats?.pendingSellers || 0} Tài khoản</h3>
            <span className="stat-sub text-orange font-bold">Cần Admin phê duyệt</span>
          </div>
        </div>

        <div className="admin-stat-card total-sellers">
          <div className="stat-icon bg-emerald">
            <UserCheck size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Số Người Bán (Sellers)</span>
            <h3 className="stat-num">{stats?.totalSellers || 0}</h3>
            <span className="stat-sub text-emerald">Đã được phê duyệt bán hàng</span>
          </div>
        </div>

        <div className="admin-stat-card total-stores">
          <div className="stat-icon bg-purple">
            <Store size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Tổng Số Gian Hàng</span>
            <h3 className="stat-num">{stats?.totalStores || 0} Shop</h3>
            <span className="stat-sub text-purple">{stats?.totalProducts || 0} sản phẩm niêm yết</span>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="admin-content-card">
        {/* Table Toolbar Filters */}
        <div className="admin-toolbar-flex">
          {/* Role Filter Tabs */}
          <div className="filter-group">
            <span className="filter-label"><Filter size={14} /> Vai Trò:</span>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'customer', label: 'Khách hàng' },
              { key: 'seller', label: 'Người bán (Seller)' },
              { key: 'admin', label: 'Admin' }
            ].map(r => (
              <button
                key={r.key}
                className={`filter-btn ${roleFilter === r.key ? 'active' : ''}`}
                onClick={() => setRoleFilter(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Status Filter Tabs */}
          <div className="filter-group">
            <span className="filter-label">Trạng Thái:</span>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: '⏳ Chờ phê duyệt' },
              { key: 'active', label: '✅ Đang hoạt động' },
              { key: 'suspended', label: '🚫 Bị khóa' }
            ].map(s => (
              <button
                key={s.key}
                className={`filter-btn status-btn ${statusFilter === s.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo username, email, họ tên..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>

        {/* Users Management Table */}
        <div className="admin-table-responsive">
          {loading ? (
            <div className="admin-empty-loading">Đang tải danh sách người dùng...</div>
          ) : usersList.length === 0 ? (
            <div className="admin-empty-loading">Không tìm thấy tài khoản nào khớp với bộ lọc.</div>
          ) : (
            <table className="admin-custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tài Khoản & Email</th>
                  <th>Họ Tên & Vùng Miền</th>
                  <th>Vai Trò (Role)</th>
                  <th>Trạng Thái</th>
                  <th>Ngày Tạo</th>
                  <th>Thao Tác & Phê Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} className={u.status === 'pending' ? 'highlight-pending-row' : ''}>
                    <td><strong className="user-id-text">#{u.id}</strong></td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-circle">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="user-name-text">{u.username}</span>
                          <span className="user-email-sub">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="user-fullname-text">{u.full_name || 'Chưa cập nhật'}</span>
                        <span className="user-city-sub">{u.city || u.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      {/* Role Dropdown Switcher */}
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.username)}
                        className={`role-select-pill role-${u.role}`}
                      >
                        <option value="customer">🛒 Customer</option>
                        <option value="seller">🏪 Seller</option>
                        <option value="admin">🛡️ Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge-pill status-${u.status}`}>
                        {u.status === 'pending' ? '⏳ Chờ phê duyệt' : u.status === 'suspended' ? '🚫 Bị khóa' : '✅ Active'}
                      </span>
                    </td>
                    <td>
                      <span className="date-created-text">{formatDate(u.created_at)}</span>
                    </td>
                    <td>
                      <div className="admin-actions-flex">
                        {/* 1-CLICK APPROVE SELLER BUTTON */}
                        {u.status === 'pending' && (
                          <button
                            onClick={() => handleApproveSeller(u.id, u.username)}
                            className="btn-approve-seller"
                            title="Phê duyệt tài khoản Người bán"
                          >
                            <CheckCircle2 size={15} /> Phê Duyệt Seller
                          </button>
                        )}

                        {/* Toggle Status (Active / Suspended) */}
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status, u.username)}
                          className={`btn-action-status ${u.status === 'active' ? 'suspend' : 'activate'}`}
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                        >
                          {u.status === 'active' ? <UserX size={15} /> : <CheckCircle2 size={15} />}
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="btn-action-delete"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
