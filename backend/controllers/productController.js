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
