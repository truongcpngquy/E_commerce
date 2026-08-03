const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('shopee_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const adminApi = {
  getStats: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Không thể lấy chỉ số Admin!');
    return res.json();
  },
  getUsers: async (filters = {}) => {
    const { role = 'all', status = 'all', search = '' } = filters;
    const query = new URLSearchParams({ role, status, search }).toString();
    const res = await fetch(`${API_BASE_URL}/admin/users?${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Không thể lấy danh sách người dùng!');
    return res.json();
  },
  updateUserStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật trạng thái!');
    return data;
  },
  updateUserRole: async (id, role) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật vai trò!');
    return data;
  },
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi xóa tài khoản!');
    return data;
  }
};

export default adminApi;
