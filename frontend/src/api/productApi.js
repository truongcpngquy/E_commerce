import axiosClient from './axiosClient';

const productApi = {
  getProducts: (params = {}) => {
    const { category, brand, tag, search, sort, min_price, max_price, limit = 20, offset = 0 } = params;
    const queryParams = { limit, offset };
    if (category) queryParams.category = category;
    if (brand) queryParams.brand = brand;
    if (tag) queryParams.tag = tag;
    if (search) queryParams.search = search;
    if (sort) queryParams.sort = sort;
    if (min_price) queryParams.min_price = min_price;
    if (max_price) queryParams.max_price = max_price;
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
