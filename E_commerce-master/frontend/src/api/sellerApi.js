import axiosClient from './axiosClient';

const sellerApi = {
  getStores: () => {
    return axiosClient.get('/seller/stores');
  },
  createStore: (storeData) => {
    return axiosClient.post('/seller/stores', storeData);
  },
  updateStore: (id, storeData) => {
    return axiosClient.put(`/seller/stores/${id}`, storeData);
  },
  getProducts: (storeId) => {
    return axiosClient.get('/seller/products', {
      params: { store_id: storeId }
    });
  },
  createProduct: (productData) => {
    return axiosClient.post('/seller/products', productData);
  },
  updateProduct: (id, productData) => {
    return axiosClient.put(`/seller/products/${id}`, productData);
  },
  deleteProduct: (id) => {
    return axiosClient.delete(`/seller/products/${id}`);
  },
  getAnalytics: (storeId) => {
    return axiosClient.get('/seller/analytics', {
      params: { store_id: storeId }
    });
  },
  getOrders: (storeId) => {
    return axiosClient.get('/seller/orders', {
      params: { store_id: storeId }
    });
  },
  updateOrderStatus: (id, status) => {
    return axiosClient.put(`/seller/orders/${id}/status`, { status });
  },
};

export default sellerApi;
