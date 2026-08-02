import axiosClient from './axiosClient';

const orderApi = {
  createOrder: (orderData) => {
    return axiosClient.post('/orders', typeof orderData === 'string' ? { shipping_address: orderData } : orderData);
  },
  getOrders: () => {
    return axiosClient.get('/orders');
  },
  getOrderById: (id) => {
    return axiosClient.get(`/orders/${id}`);
  },
  updateOrderStatus: (orderId, data) => {
    return axiosClient.put(`/orders/${orderId}/status`, data);
  },
};

export default orderApi;
