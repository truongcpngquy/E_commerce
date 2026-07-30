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
};

export default recommendationApi;
