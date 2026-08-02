/**
 * Thuật toán Item-based Collaborative Filtering (Lọc cộng tác dựa trên Item)
 * Sử dụng ma trận Item-User để tìm các sản phẩm tương tự dựa trên hành vi mua chéo.
 */

/**
 * Xây dựng ma trận Item-User và tính toán điểm tương đồng Cosine giữa các Item
 * @param {Array} behaviorLogs Danh sách tất cả lịch sử tương tác của mọi users {user_id, product_id, weight}
 * @returns {Object} itemSimilarities: { itemId: { similarItemId: score } }
 */
function buildItemSimilarities(behaviorLogs) {
  // 1. Nhóm tương tác theo User và Item
  const itemUserMatrix = {}; // { itemId: { userId: weight } }
  const userVectors = {};    // Để chuẩn hóa độ lớn vector của mỗi Item
  
  behaviorLogs.forEach(log => {
    const uId = log.user_id;
    const pId = log.product_id;
    const weight = log.weight;

    if (!itemUserMatrix[pId]) itemUserMatrix[pId] = {};
    itemUserMatrix[pId][uId] = (itemUserMatrix[pId][uId] || 0) + weight;
  });

  const itemMagnitudes = {};
  Object.keys(itemUserMatrix).forEach(pId => {
    let lengthSq = 0;
    Object.values(itemUserMatrix[pId]).forEach(w => {
      lengthSq += w * w;
    });
    itemMagnitudes[pId] = Math.sqrt(lengthSq);
  });

  // 2. Tính Cosine Similarity giữa các Items
  const itemSimilarities = {};
  const itemIds = Object.keys(itemUserMatrix);

  for (let i = 0; i < itemIds.length; i++) {
    const itemA = itemIds[i];
    itemSimilarities[itemA] = {};
    
    for (let j = 0; j < itemIds.length; j++) {
      if (i === j) continue;
      const itemB = itemIds[j];

      // Tính Dot Product
      let dotProduct = 0;
      const usersA = Object.keys(itemUserMatrix[itemA]);
      usersA.forEach(uId => {
        if (itemUserMatrix[itemB][uId]) {
          dotProduct += itemUserMatrix[itemA][uId] * itemUserMatrix[itemB][uId];
        }
      });

      if (dotProduct > 0) {
        const sim = dotProduct / (itemMagnitudes[itemA] * itemMagnitudes[itemB]);
        itemSimilarities[itemA][itemB] = sim;
      }
    }
  }

  return itemSimilarities;
}

/**
 * Gợi ý sản phẩm cho User dựa trên Item-based Collaborative Filtering
 * @param {Array} userInteractions Lịch sử tương tác của User đang xét {product_id, weight}
 * @param {Object} itemSimilarities Ma trận tương đồng Items đã tính
 * @param {Array} allProducts Danh sách tất cả sản phẩm
 * @param {Number} limit Số lượng trả về
 */
function getCFRecommendations(userInteractions, itemSimilarities, allProducts, limit = 6) {
  if (!userInteractions || userInteractions.length === 0) return [];

  const scores = {};
  const interactedIds = new Set(userInteractions.map(i => Number(i.product_id)));

  // Duyệt qua các item user đã tương tác
  userInteractions.forEach(interaction => {
    const pId = String(interaction.product_id);
    const weight = interaction.weight;

    const similarItems = itemSimilarities[pId];
    if (similarItems) {
      Object.keys(similarItems).forEach(simItemId => {
        if (!interactedIds.has(Number(simItemId))) {
          scores[simItemId] = (scores[simItemId] || 0) + (similarItems[simItemId] * weight);
        }
      });
    }
  });

  // Ánh xạ sang object sản phẩm
  const recommendations = allProducts
    .filter(p => scores[String(p.id)])
    .map(p => ({
      ...p,
      cfScore: scores[String(p.id)] || 0
    }))
    .sort((a, b) => b.cfScore - a.cfScore)
    .slice(0, limit);

  return recommendations;
}

module.exports = {
  buildItemSimilarities,
  getCFRecommendations
};
