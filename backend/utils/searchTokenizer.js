/**
 * searchTokenizer.js - Bộ phân tách từ khóa tiếng Việt & Lọc từ dừng (Stop Words)
 */

const STOP_WORDS = new Set([
  'là', 'của', 'nhau', 'và', 'cho', 'có', 'được', 'với', 'trong', 'các',
  'nhưng', 'bằng', 'về', 'thì', 'ở', 'đó', 'này', 'khi', 'ra', 'vào',
  'như', 'từ', 'theo', 'đã', 'sẽ', 'đang', 'tại', 'nên', 'cũng', 'hay',
  'hoặc', 'vì', 'do', 'để', 'mà', 'nếu', 'tuy', 'dù', 'thì', 'rằng'
]);

/**
 * Phân tách câu truy vấn người dùng thành danh sách các từ khóa có ý nghĩa
 * @param {string} query 
 * @returns {{ rawTokens: string[], filteredTokens: string[], cleanQuery: string }}
 */
function extractSearchTokens(query) {
  if (!query || typeof query !== 'string') {
    return { rawTokens: [], filteredTokens: [], cleanQuery: '' };
  }

  const cleanQuery = query.trim().toLowerCase();
  
  // Tách từ theo khoảng trắng và lọc ký tự đặc biệt
  const rawTokens = cleanQuery
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // Lọc bỏ từ dừng
  const filteredTokens = rawTokens.filter(word => word.length > 1 && !STOP_WORDS.has(word));

  // Nếu tất cả từ bị lọc mất (VD câu toàn từ dừng), dùng lại rawTokens để không bỏ sót
  const finalTokens = filteredTokens.length > 0 ? filteredTokens : rawTokens;

  // Loại bỏ các từ trùng lặp
  const uniqueTokens = Array.from(new Set(finalTokens));

  return {
    rawTokens,
    filteredTokens: uniqueTokens,
    cleanQuery
  };
}

module.exports = {
  STOP_WORDS,
  extractSearchTokens
};
