import axiosClient from './axiosClient';

const productApi = {
  getProducts: (params = {}) => {
    const { category, search, limit = 20, offset = 0 } = params;
    const queryParams = { limit, offset };
    if (category) queryParams.category = category;
    if (search) queryParams.search = search;
    return axiosClient.get('/products', { params: queryParams });
  },
  searchSuggest: (query) => {
    return axiosClient.get('/products/search/suggest', { params: { q: query } });
  },
  searchProducts: (params = {}) => {
    return axiosClient.get('/products/search', { params });
  },
  getProductById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },
  getCategories: () => {
    return axiosClient.get('/products/categories');
  },
  createProduct: (productData) => {
    return axiosClient.post('/products', productData);
  },
};

export default productApi;
