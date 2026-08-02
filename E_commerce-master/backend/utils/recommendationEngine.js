/**
 * Thuật toán Content-Based Filtering sử dụng TF-IDF và Cosine Similarity
 */

// Các từ dừng (Stop words) phổ biến trong tiếng Việt và tiếng Anh để lọc bớt nhiễu
const STOP_WORDS = new Set([
  'và', 'của', 'cho', 'có', 'là', 'các', 'nhưng', 'được', 'bằng', 'với', 'trong',
  'ngoại', 'nhà', 'phù', 'hợp', 'chất', 'liệu', 'kiểu', 'dáng', 'phong', 'cách',
  'the', 'and', 'a', 'of', 'to', 'in', 'is', 'for', 'with', 'on', 'at', 'by'
]);

/**
 * Tokenize chuỗi văn bản: Chuyển về viết thường, xóa ký tự đặc biệt và tách từ
 * @param {string} text 
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Xây dựng biểu diễn TF-IDF cho danh sách sản phẩm
 * @param {Array} products Danh sách sản phẩm từ DB (bao gồm id, name, description, tags, category_name)
 * @returns {Object} { productVectors, vocabulary }
 */
function buildTFIDF(products) {
  const numDocs = products.length;
  const productWords = {};
  const docFreq = {};

  // Bước 1: Tokenize và tính Document Frequency (DF)
  products.forEach(p => {
    const content = `${p.name} ${p.description || ''} ${p.tags || ''} ${p.category_name || ''}`;
    const words = tokenize(content);
    productWords[p.id] = words;

    const uniqueWords = new Set(words);
    uniqueWords.forEach(word => {
      docFreq[word] = (docFreq[word] || 0) + 1;
    });
  });

  // Bước 2: Tính IDF cho từng từ
  const idf = {};
  Object.keys(docFreq).forEach(word => {
    idf[word] = Math.log(1 + numDocs / docFreq[word]) + 1;
  });

  // Bước 3: Tính TF-IDF Vector cho mỗi sản phẩm
  const productVectors = {};
  products.forEach(p => {
    const words = productWords[p.id];
    const tf = {};
    
    words.forEach(word => {
      tf[word] = (tf[word] || 0) + 1;
    });

    const vector = {};
    let length = 0;

    Object.keys(tf).forEach(word => {
      const tfVal = tf[word] / words.length;
      const tfidfVal = tfVal * (idf[word] || 1);
      vector[word] = tfidfVal;
      length += tfidfVal * tfidfVal;
    });

    productVectors[p.id] = {
      vector,
      magnitude: Math.sqrt(length)
    };
  });

  return { productVectors, idf };
}

/**
 * Tính Cosine Similarity giữa 2 vector
 */
function cosineSimilarity(vecA, magA, vecB, magB) {
  if (magA === 0 || magB === 0) return 0;
  
  let dotProduct = 0;
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  const iterKeys = keysA.length < keysB.length ? keysA : keysB;
  const targetVec = keysA.length < keysB.length ? vecB : vecA;

  iterKeys.forEach(word => {
    if (targetVec[word]) {
      dotProduct += vecA[word] * vecB[word];
    }
  });

  return dotProduct / (magA * magB);
}

/**
 * Gợi ý sản phẩm tương tự với một sản phẩm cụ thể (kèm Category Synergy Multiplier x1.35)
 */
function getSimilarProducts(targetProductId, allProducts, limit = 5) {
  if (allProducts.length <= 1) return [];

  const { productVectors } = buildTFIDF(allProducts);
  const targetVecInfo = productVectors[targetProductId];
  const targetProd = allProducts.find(p => p.id === Number(targetProductId));
  
  if (!targetVecInfo) return [];

  const targetVec = targetVecInfo.vector;
  const targetMag = targetVecInfo.magnitude;

  const scores = allProducts
    .filter(p => p.id !== Number(targetProductId))
    .map(p => {
      const vecInfo = productVectors[p.id];
      let score = vecInfo ? cosineSimilarity(targetVec, targetMag, vecInfo.vector, vecInfo.magnitude) : 0;

      // Category Synergy Multiplier (x1.35): Tăng trọng số khi cùng Danh Mục
      if (targetProd && p.category_id && targetProd.category_id === p.category_id) {
        score *= 1.35;
      }

      return { ...p, similarityScore: score };
    })
    .filter(p => p.similarityScore > 0)
    .sort((a, b) => b.similarityScore - a.similarityScore);

  return scores.slice(0, limit);
}

/**
 * Gợi ý sản phẩm cá nhân hóa dựa trên lịch sử tương tác của người dùng
 */
function getPersonalizedRecommendations(userInteractions, allProducts, limit = 6) {
  if (allProducts.length === 0) return [];
  if (userInteractions.length === 0) {
    return allProducts.slice(0, limit);
  }

  const { productVectors } = buildTFIDF(allProducts);
  
  const userVector = {};
  let interactedProductIds = new Set(userInteractions.map(ui => Number(ui.product_id)));

  userInteractions.forEach(interaction => {
    const prodId = interaction.product_id;
    const weight = interaction.weight;
    const vecInfo = productVectors[prodId];

    if (vecInfo) {
      Object.keys(vecInfo.vector).forEach(word => {
        userVector[word] = (userVector[word] || 0) + (weight * vecInfo.vector[word]);
      });
    }
  });

  let userLength = 0;
  Object.values(userVector).forEach(val => {
    userLength += val * val;
  });
  const userMagnitude = Math.sqrt(userLength);

  const purchasedProductIds = new Set(
    userInteractions.filter(ui => ui.weight >= 5).map(ui => Number(ui.product_id))
  );

  const recommendations = allProducts
    .filter(p => !purchasedProductIds.has(p.id))
    .map(p => {
      const vecInfo = productVectors[p.id];
      let score = 0;
      if (vecInfo && userMagnitude > 0) {
        score = cosineSimilarity(userVector, userMagnitude, vecInfo.vector, vecInfo.magnitude);
      }
      
      // Bonus thêm 35% điểm nếu sản phẩm cùng danh mục với sản phẩm tương tác gần nhất
      const latestInteraction = userInteractions[0];
      if (latestInteraction) {
        const latestProd = allProducts.find(prod => prod.id === latestInteraction.product_id);
        if (latestProd && latestProd.category_id === p.category_id) {
          score *= 1.35;
        }
      }

      return { ...p, recommendationScore: score };
    })
    .filter(p => p.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  if (recommendations.length < limit) {
    const existingIds = new Set(recommendations.map(r => r.id));
    const backfill = allProducts
      .filter(p => !interactedProductIds.has(p.id) && !existingIds.has(p.id))
      .slice(0, limit - recommendations.length)
      .map(p => ({ ...p, recommendationScore: 0 }));
    
    return [...recommendations, ...backfill].slice(0, limit);
  }

  return recommendations.slice(0, limit);
}

module.exports = {
  tokenize,
  buildTFIDF,
  cosineSimilarity,
  getSimilarProducts,
  getPersonalizedRecommendations
};
