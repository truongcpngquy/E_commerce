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
 *   - productVectors: Map chứa { productId: { word1: weight1, word2: weight2 } }
 *   - idf: Map chứa { word: idf_value }
 */
function buildTFIDF(products) {
  const numDocs = products.length;
  const productWords = {}; // productId -> danh sách từ sau tokenize
  const docFreq = {};      // word -> số lượng sản phẩm chứa từ này

  // Bước 1: Tokenize và tính Document Frequency (DF)
  products.forEach(p => {
    // Kết hợp các trường thông tin để tạo mô tả nội dung phong phú cho sản phẩm
    const content = `${p.name} ${p.description || ''} ${p.tags || ''} ${p.category_name || ''}`;
    const words = tokenize(content);
    productWords[p.id] = words;

    // Tính tần suất xuất hiện trong các document (mỗi từ đếm tối đa 1 lần/sản phẩm)
    const uniqueWords = new Set(words);
    uniqueWords.forEach(word => {
      docFreq[word] = (docFreq[word] || 0) + 1;
    });
  });

  // Bước 2: Tính IDF cho từng từ
  const idf = {};
  Object.keys(docFreq).forEach(word => {
    // Công thức IDF mượt (smooth): idf = ln(1 + N / DF) + 1
    idf[word] = Math.log(1 + numDocs / docFreq[word]) + 1;
  });

  // Bước 3: Tính TF-IDF Vector cho mỗi sản phẩm
  const productVectors = {};
  products.forEach(p => {
    const words = productWords[p.id];
    const tf = {};
    
    // Tính Term Frequency (TF)
    words.forEach(word => {
      tf[word] = (tf[word] || 0) + 1;
    });

    const vector = {};
    let length = 0;

    // Tính TF-IDF = (TF / total_words) * IDF
    Object.keys(tf).forEach(word => {
      const tfVal = tf[word] / words.length;
      const tfidfVal = tfVal * (idf[word] || 1);
      vector[word] = tfidfVal;
      length += tfidfVal * tfidfVal;
    });

    // Lưu độ dài vector để phục vụ việc chuẩn hóa (normalization)
    productVectors[p.id] = {
      vector,
      magnitude: Math.sqrt(length)
    };
  });

  return { productVectors, idf };
}

/**
 * Tính Cosine Similarity giữa 2 vector
 * @param {Object} vecA { word: weight }
 * @param {number} magA Độ dài vector A
 * @param {Object} vecB { word: weight }
 * @param {number} magB Độ dài vector B
 * @returns {number} Điểm tương đồng từ 0 đến 1
 */
function cosineSimilarity(vecA, magA, vecB, magB) {
  if (magA === 0 || magB === 0) return 0;
  
  let dotProduct = 0;
  // Duyệt qua các từ của vector nhỏ hơn để tối ưu hiệu năng
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
 * Gợi ý sản phẩm tương tự với một sản phẩm cụ thể
 * @param {number} targetProductId ID sản phẩm đang xem
 * @param {Array} allProducts Danh sách tất cả sản phẩm
 * @param {number} limit Số lượng sản phẩm muốn lấy
 * @returns {Array} Danh sách sản phẩm tương tự kèm theo score
 */
function getSimilarProducts(targetProductId, allProducts, limit = 5) {
  if (allProducts.length <= 1) return [];

  const { productVectors } = buildTFIDF(allProducts);
  const targetVecInfo = productVectors[targetProductId];
  
  if (!targetVecInfo) return [];

  const targetVec = targetVecInfo.vector;
  const targetMag = targetVecInfo.magnitude;

  const scores = allProducts
    .filter(p => p.id !== Number(targetProductId)) // Loại bỏ sản phẩm hiện tại
    .map(p => {
      const vecInfo = productVectors[p.id];
      const score = vecInfo ? cosineSimilarity(targetVec, targetMag, vecInfo.vector, vecInfo.magnitude) : 0;
      return { ...p, similarityScore: score };
    })
    .filter(p => p.similarityScore > 0) // Chỉ giữ các sản phẩm có điểm tương đồng > 0
    .sort((a, b) => b.similarityScore - a.similarityScore);

  return scores.slice(0, limit);
}

/**
 * Gợi ý sản phẩm cá nhân hóa dựa trên lịch sử tương tác của người dùng
 * @param {Array} userInteractions Danh sách tương tác của user [{ product_id, weight }]
 * @param {Array} allProducts Danh sách tất cả sản phẩm
 * @param {number} limit Số lượng sản phẩm muốn lấy
 * @returns {Array} Danh sách gợi ý cá nhân hóa
 */
function getPersonalizedRecommendations(userInteractions, allProducts, limit = 6) {
  if (allProducts.length === 0) return [];
  if (userInteractions.length === 0) {
    // Nếu chưa có tương tác nào, gợi ý sản phẩm ngẫu nhiên hoặc phổ biến
    return allProducts.slice(0, limit);
  }

  const { productVectors } = buildTFIDF(allProducts);
  
  // 1. Tạo User Profile Vector bằng cách cộng dồn các vector sản phẩm đã tương tác
  const userVector = {};
  let interactedProductIds = new Set(userInteractions.map(ui => Number(ui.product_id)));

  userInteractions.forEach(interaction => {
    const prodId = interaction.product_id;
    const weight = interaction.weight;
    const vecInfo = productVectors[prodId];

    if (vecInfo) {
      Object.keys(vecInfo.vector).forEach(word => {
        // user_vector[word] = sum(interaction_weight * product_tfidf_weight)
        userVector[word] = (userVector[word] || 0) + (weight * vecInfo.vector[word]);
      });
    }
  });

  // Tính độ dài (magnitude) của User Profile Vector
  let userLength = 0;
  Object.values(userVector).forEach(val => {
    userLength += val * val;
  });
  const userMagnitude = Math.sqrt(userLength);

  // 2. Tính Cosine Similarity giữa User Profile Vector và các sản phẩm mà user CHƯA mua (hoặc chưa tương tác mạnh)
  // Trong thực tế Shopee, ta gợi ý cả sản phẩm chưa mua. Để tăng đa dạng, loại bỏ các sản phẩm đã mua (weight = 5),
  // nhưng vẫn gợi ý các sản phẩm tương tự với chúng.
  const purchasedProductIds = new Set(
    userInteractions.filter(ui => ui.weight >= 5).map(ui => Number(ui.product_id))
  );

  const recommendations = allProducts
    .filter(p => !purchasedProductIds.has(p.id)) // Bỏ qua sản phẩm đã mua
    .map(p => {
      const vecInfo = productVectors[p.id];
      let score = 0;
      if (vecInfo && userMagnitude > 0) {
        score = cosineSimilarity(userVector, userMagnitude, vecInfo.vector, vecInfo.magnitude);
      }
      
      // Bonus thêm 10% điểm nếu sản phẩm cùng danh mục với sản phẩm tương tác gần nhất
      // để tăng độ tập trung nếu người dùng vừa mới tương tác
      const latestInteraction = userInteractions[0];
      if (latestInteraction) {
        const latestProd = allProducts.find(prod => prod.id === latestInteraction.product_id);
        if (latestProd && latestProd.category_id === p.category_id) {
          score *= 1.1;
        }
      }

      return { ...p, recommendationScore: score };
    })
    .filter(p => p.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  // Nếu không đủ sản phẩm gợi ý có điểm > 0, bù đắp bằng các sản phẩm hot/khác chưa tương tác
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
