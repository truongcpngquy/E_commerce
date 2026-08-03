import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Heart, ShieldCheck, RefreshCw, Truck, Store, ExternalLink } from 'lucide-react';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    fetchProductById, 
    addToCart, 
    trackInteraction, 
    getSimilarProducts 
  } = useApp();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load sản phẩm chi tiết
  useEffect(() => {
    const loadProductData = async () => {
      setIsLoading(true);
      const data = await fetchProductById(id);
      if (data) {
        setProduct(data);
        
        // Track hành vi 'view' của người dùng (trọng số = 1)
        trackInteraction(data.id, 'view');
        
        // Lấy danh sách sản phẩm tương tự (Content-Based)
        const similar = await getSimilarProducts(data.id, 5);
        setSimilarProducts(similar);
      } else {
        setProduct(null);
      }
      setIsLoading(false);
      // Reset số lượng về 1 khi đổi sản phẩm
      setQuantity(1);
    };

    loadProductData();
  }, [id]);

  const handleQuantityChange = (val) => {
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= (product?.stock || 1)) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, quantity);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    const success = await addToCart(product.id, quantity);
    if (success) {
      navigate('/cart');
    }
  };

  const handleLike = () => {
    if (!product) return;
    setIsLiked(!isLiked);
    if (!isLiked) {
      // Lưu vết tương tác: Like (trọng số = 2)
      trackInteraction(product.id, 'like');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (isLoading) {
    return <div className="loading-spinner">Đang tải chi tiết sản phẩm...</div>;
  }

  if (!product) {
    return (
      <div className="error-container">
        <h2>Không tìm thấy sản phẩm!</h2>
        <Link to="/" className="back-home-btn">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page fade-in">
      {/* Khối Thông Tin Sản Phẩm Chính */}
      <div className="product-main-container">
        {/* Cột Trái: Ảnh */}
        <div className="product-image-section">
          <img src={product.image_url} alt={product.name} className="main-product-img" />
        </div>

        {/* Cột Phải: Thông tin chi tiết */}
        <div className="product-info-section">
          <h1 className="detail-product-name">{product.name}</h1>
          
          <div className="detail-meta">
            <span className="meta-category">Danh mục: <strong>{product.category_name}</strong></span>
            <span className="divider">|</span>
            <span className="meta-stock">Còn lại: <strong>{product.stock}</strong> sản phẩm</span>
          </div>

          <div className="detail-price-box">
            <span className="detail-price">{formatPrice(product.price)}</span>
          </div>

          {/* Quyền lợi mua sắm */}
          <div className="shopping-benefits">
            <div className="benefit-item">
              <Truck size={18} className="benefit-icon" />
              <div>
                <p className="benefit-title">Miễn phí vận chuyển</p>
                <p className="benefit-desc">Miễn phí vận chuyển cho đơn hàng từ 250k</p>
              </div>
            </div>
          </div>

          {/* Chọn số lượng */}
          <div className="quantity-section">
            <span className="section-label">Số lượng</span>
            <div className="quantity-controller">
              <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
              <input type="text" value={quantity} readOnly />
              <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>+</button>
            </div>
            <span className="stock-info">Có sẵn {product.stock} sản phẩm</span>
          </div>

          {/* Nút thao tác */}
          <div className="action-buttons-group">
            <button onClick={handleAddToCart} className="btn-secondary-outline">
              <ShoppingCart size={18} />
              Thêm vào giỏ hàng
            </button>
            <button onClick={handleBuyNow} className="btn-primary-filled">
              Mua ngay
            </button>
            <button 
              onClick={handleLike} 
              className={`btn-like ${isLiked ? 'liked' : ''}`}
              title="Thêm vào danh sách yêu thích"
            >
              <Heart size={20} fill={isLiked ? 'red' : 'none'} stroke={isLiked ? 'red' : 'currentColor'} />
            </button>
          </div>

          {/* Dịch vụ cam kết */}
          <div className="guarantees-grid">
            <div className="guarantee-item">
              <ShieldCheck size={16} /> 100% Hàng chính hãng
            </div>
            <div className="guarantee-item">
              <RefreshCw size={16} /> 7 ngày miễn phí trả hàng
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI THÔNG TIN GIAN HÀNG (STORE CARD) */}
      <div className="product-store-card-container">
        <div className="store-card-left">
          <div className="store-card-avatar">
            <Store size={28} className="store-icon" />
          </div>
          <div className="store-card-meta">
            <h3 className="store-card-name">{product.store_name || 'SmartTech Official Store'}</h3>
            <span className="store-card-status">Online 5 phút trước • Tỷ lệ phản hồi 99%</span>
          </div>
        </div>
        <div className="store-card-right">
          <Link to={`/stores/${product.store_id || 1}`} className="btn-visit-store">
            <ExternalLink size={16} /> Xem Shop
          </Link>
        </div>
      </div>

      {/* Khối Mô Tả Sản Phẩm */}
      <div className="product-description-container">
        <h2 className="section-title-underlined">MÔ TẢ SẢN PHẨM</h2>
        <div className="description-text">
          <p>{product.description}</p>
        </div>
        <div className="product-tags-container">
          <span className="tags-label">Tags hệ thống gợi ý:</span>
          <div className="tags-list">
            {product.tags && product.tags.split(',').map((tag, idx) => (
              <span key={idx} className="detail-tag-pill">#{tag.trim()}</span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION SẢN PHẨM TƯƠNG TỰ (CONTENT-BASED IN ACTION) */}
      {similarProducts.length > 0 && (
        <div className="similar-products-container">
          <div className="section-header-row">
            <h2 className="section-title-underlined">SẢN PHẨM TƯƠNG TỰ</h2>
            <span className="reco-tech-label">Tìm kiếm bằng Cosine Similarity trên TF-IDF</span>
          </div>
          <div className="similar-products-grid">
            {similarProducts.map((p) => (
              <Link to={`/product/${p.id}`} key={p.id} className="similar-product-card">
                <div className="similar-similarity-badge">
                  Khớp {Math.round(p.similarityScore * 100)}%
                </div>
                <img src={p.image_url} alt={p.name} className="similar-img" />
                <div className="similar-info">
                  <h4 className="similar-name">{p.name}</h4>
                  <span className="similar-price">{formatPrice(p.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
