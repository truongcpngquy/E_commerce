import axiosClient from './axiosClient';

const orderApi = {
  createOrder: (shippingAddress) => {
    return axiosClient.post('/orders', { shipping_address: shippingAddress });
  },
  getOrders: () => {
    return axiosClient.get('/orders');
  },
};

export default orderApi;
