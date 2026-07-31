const productService = require('../services/productService');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts(req.query);
    res.json(products);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi lấy sản phẩm!' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi lấy sản phẩm!' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục!', error: err.message });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const brands = await productService.getBrands();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy thương hiệu!', error: err.message });
  }
};

exports.getPopularTags = async (req, res) => {
  try {
    const tags = await productService.getPopularTags();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy thẻ tags phổ biến!', error: err.message });
  }
};

exports.getTagsByCategory = async (req, res) => {
  try {
    const categoryId = req.query.category_id;
    const tags = await productService.getTagsByCategory(categoryId);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy thẻ tags theo danh mục!', error: err.message });
  }
};

exports.searchSuggest = async (req, res) => {
  try {
    const suggestions = await productService.searchSuggest(req.query.q);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gợi ý tìm kiếm!', error: err.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const products = await productService.searchProducts(req.query, userId);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tìm kiếm sản phẩm!', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const result = await productService.createProduct(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi thêm sản phẩm!' });
  }
};

exports.predictCategory = async (req, res) => {
  try {
    const result = await productService.predictCategoryByName(req.query.name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi AI gợi ý danh mục!', error: err.message });
  }
};

exports.getSellerProducts = async (req, res) => {
  try {
    const result = await productService.getSellerProducts(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm Người bán!', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const result = await productService.updateProduct(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi cập nhật sản phẩm!' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi xóa sản phẩm!' });
  }
};
