import axiosClient from './axiosClient';

const cartApi = {
  getCart: () => {
    return axiosClient.get('/cart');
  },
  addToCart: (productId, quantity = 1) => {
    return axiosClient.post('/cart', { product_id: productId, quantity });
  },
  updateCart: (productId, quantity) => {
    return axiosClient.put('/cart', { product_id: productId, quantity });
  },
  removeFromCart: (productId) => {
    return axiosClient.delete(`/cart/${productId}`);
  },
};

export default cartApi;
