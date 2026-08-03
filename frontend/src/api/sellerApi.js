const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('shopee_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const sellerApi = {
  getAnalytics: async (storeId) => {
    const res = await fetch(`${API_BASE_URL}/seller/analytics?store_id=${storeId || 'all'}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Không thể lấy thống kê!');
    return res.json();
  },
  getProducts: async (storeId) => {
    const res = await fetch(`${API_BASE_URL}/seller/products?store_id=${storeId || 'all'}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Không thể lấy danh sách sản phẩm!');
    return res.json();
  },
  createProduct: async (productData) => {
    const res = await fetch(`${API_BASE_URL}/seller/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi đăng sản phẩm!');
    return data;
  },
  updateProduct: async (id, productData) => {
    const res = await fetch(`${API_BASE_URL}/seller/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật sản phẩm!');
    return data;
  },
  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE_URL}/seller/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi xóa sản phẩm!');
    return data;
  },
  getOrders: async (storeId) => {
    const res = await fetch(`${API_BASE_URL}/seller/orders?store_id=${storeId || 'all'}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Không thể lấy danh sách đơn hàng!');
    return res.json();
  },
  updateOrderStatus: async (orderId, status) => {
    const res = await fetch(`${API_BASE_URL}/seller/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật đơn hàng!');
    return data;
  },
  getStores: async () => {
    const res = await fetch(`${API_BASE_URL}/seller/stores`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Không thể lấy danh sách gian hàng!');
    return res.json();
  },
  createStore: async (storeData) => {
    const res = await fetch(`${API_BASE_URL}/seller/stores`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(storeData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tạo gian hàng!');
    return data;
  },
  updateStore: async (id, storeData) => {
    const res = await fetch(`${API_BASE_URL}/seller/stores/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(storeData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật gian hàng!');
    return data;
  }
};

export default sellerApi;
