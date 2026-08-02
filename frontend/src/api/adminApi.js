import axiosClient from './axiosClient';

const adminApi = {
  getStats: () => {
    return axiosClient.get('/admin/stats');
  },
  getUsers: () => {
    return axiosClient.get('/admin/users');
  },
  updateUserRole: (id, role) => {
    return axiosClient.put(`/admin/users/${id}/role`, { role });
  },
  updateUserStatus: (id, status) => {
    return axiosClient.put(`/admin/users/${id}/status`, { status });
  },
  getStores: () => {
    return axiosClient.get('/admin/stores');
  },
  updateStoreStatus: (id, status) => {
    return axiosClient.put(`/admin/stores/${id}/status`, { status });
  },
  getProducts: () => {
    return axiosClient.get('/admin/products');
  },
  deleteProduct: (id) => {
    return axiosClient.delete(`/admin/products/${id}`);
  },
  getOrders: () => {
    return axiosClient.get('/admin/orders');
  },
  updateOrderStatus: (id, status) => {
    return axiosClient.put(`/admin/orders/${id}/status`, { status });
  },
};

export default adminApi;
