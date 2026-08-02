import axiosClient from './axiosClient';

const storeApi = {
  getStores: (params = {}) => {
    return axiosClient.get('/stores', { params });
  },
  getStoreBySlug: (slug) => {
    return axiosClient.get(`/stores/${slug}`);
  },
  getStoreProducts: (slug, params = {}) => {
    return axiosClient.get(`/stores/${slug}/products`, { params });
  },
  createStore: (storeData) => {
    return axiosClient.post('/stores', storeData);
  },
  updateStore: (id, storeData) => {
    return axiosClient.put(`/stores/${id}`, storeData);
  },
};

export default storeApi;
