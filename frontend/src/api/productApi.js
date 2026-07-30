import axiosClient from './axiosClient';

const productApi = {
  getProducts: (params = {}) => {
    return axiosClient.get('/products', { params });
  },
  searchSuggest: (query) => {
    return axiosClient.get('/products/search/suggest', { params: { q: query } });
  },
  searchProducts: (params = {}) => {
    const q = params.q || params.search || '';
    return axiosClient.get('/products/search', { params: { ...params, q } });
  },
  getProductById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },
  getCategories: () => {
    return axiosClient.get('/products/categories');
  },
  getBrands: () => {
    return axiosClient.get('/products/brands');
  },
  getPopularTags: () => {
    return axiosClient.get('/products/tags/popular');
  },
  createProduct: (productData) => {
    return axiosClient.post('/products', productData);
  },
};

export default productApi;
