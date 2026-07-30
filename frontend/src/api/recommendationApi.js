import axiosClient from './axiosClient';

const recommendationApi = {
  trackInteraction: (productId, type) => {
    return axiosClient.post('/recommendations/track', {
      product_id: productId,
      interaction_type: type,
    });
  },
  getPersonalizedRecommendations: (limit = 6) => {
    return axiosClient.get('/recommendations/personalized', {
      params: { limit },
    });
  },
  getSimilarProducts: (productId, limit = 5) => {
    return axiosClient.get(`/recommendations/similar/${productId}`, {
      params: { limit },
    });
  },
  getTrendingProducts: (limit = 10) => {
    return axiosClient.get('/recommendations/trending', {
      params: { limit },
    });
  },
  getSearchBasedRecommendations: (limit = 6) => {
    return axiosClient.get('/recommendations/search-based', {
      params: { limit },
    });
  },
};

export default recommendationApi;
