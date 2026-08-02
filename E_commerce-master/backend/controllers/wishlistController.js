const wishlistService = require('../services/wishlistService');

exports.getWishlist = async (req, res) => {
  try {
    const items = await wishlistService.getWishlist(req.user.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích!', error: err.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const result = await wishlistService.addToWishlist(req.user.id, req.params.productId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thêm vào wishlist!', error: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const result = await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xóa khỏi wishlist!', error: err.message });
  }
};
