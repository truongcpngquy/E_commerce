import axiosClient from './axiosClient';

const productApi = {
  getProducts: (params = {}) => {
    const { category, search, limit = 20, offset = 0 } = params;
    const queryParams = { limit, offset };
    if (category) queryParams.category = category;
    if (search) queryParams.search = search;
    return axiosClient.get('/products', { params: queryParams });
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
