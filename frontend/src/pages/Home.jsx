import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Sparkles, Grid, ArrowRight } from 'lucide-react';
import './Home.css';

export default function Home() {
  const { categories, fetchProducts, getPersonalizedRecommendations, user, searchQuery } = useApp();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Lấy danh sách sản phẩm thông thường
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      const data = await fetchProducts({
        category: selectedCategory,
        search: searchQuery
      });
      setAllProducts(data);
      setIsLoadingProducts(false);
    };

    loadProducts();
  }, [selectedCategory, searchQuery]);

  // Lấy danh sách sản phẩm gợi ý (Content-Based)
  useEffect(() => {
    const loadRecommendations = async () => {
      if (user) {
        setIsLoadingRecommendations(true);
        const data = await getPersonalizedRecommendations(6);
        setRecommendedProducts(data);
        setIsLoadingRecommendations(false);
      } else {
        setRecommendedProducts([]);
      }
    };

    loadRecommendations();
  }, [user, allProducts]); // Load lại khi user đổi hoặc danh sách sản phẩm đổi

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="home-page fade-in">
      {/* Banner Quảng Cáo Premium */}
      <div className="home-banner">
        <div className="banner-content">
          <span className="banner-badge">Shopee Tech & Fashion</span>
          <h1 className="banner-title">MUA SẮM TIỆN LỢI - GỢI Ý THÔNG MINH</h1>
          <p className="banner-desc">Hệ thống gợi ý cá nhân hóa dựa trên Content-Based Filtering. Tự động đề xuất các sản phẩm tối ưu nhất dựa trên thói quen mua sắm của bạn.</p>
          {!user && (
            <Link to="/auth" className="banner-btn">
              Đăng nhập ngay
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
        <div className="banner-image">
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600" 
            alt="Ecommerce tech" 
          />
        </div>
      </div>

      {/* Grid Categories */}
      <section className="categories-section">
        <h2 className="section-title">
          <Grid size={20} className="icon-orange" />
          Danh mục sản phẩm
        </h2>
        <div className="categories-grid">
          <div 
            className={`category-card ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            <div className="category-img-placeholder">🌐</div>
            <span className="category-name">Tất cả danh mục</span>
          </div>
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`category-card ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <img src={cat.image_url} alt={cat.name} className="category-img" />
              <span className="category-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 1: GỢI Ý CÁ NHÂN HÓA (Chỉ khi User đăng nhập hoặc hiển thị gợi ý tổng quan) */}
      {user && recommendedProducts.length > 0 && (
        <section className="recommendations-section">
          <div className="section-header">
            <h2 className="section-title text-sparkle">
              <Sparkles size={20} className="icon-sparkle animate-pulse" />
              Gợi ý dành riêng cho {user.username}
            </h2>
            <span className="algorithm-badge">Content-Based Filtering active</span>
          </div>
          
          {isLoadingRecommendations ? (
            <div className="loading-spinner">Đang tính toán gợi ý phù hợp...</div>
          ) : (
            <div className="products-grid">
              {recommendedProducts.map((p) => (
                <Link to={`/product/${p.id}`} key={p.id} className="product-card recommend-card">
                  {p.recommendationScore > 0 && (
                    <div className="similarity-badge">
                      Khớp {Math.round(p.recommendationScore * 100)}%
                    </div>
                  )}
                  <div className="product-img-wrapper">
                    <img src={p.image_url} alt={p.name} className="product-img" />
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{p.name}</h3>
                    <div className="product-tags">
                      {p.tags && p.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag-pill">{tag.trim()}</span>
                      ))}
                    </div>
                    <div className="product-footer">
                      <span className="product-price">{formatPrice(p.price)}</span>
                      <span className="product-sales">Kho: {p.stock}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: TẤT CẢ SẢN PHẨM / KẾT QUẢ TÌM KIẾM */}
      <section className="all-products-section">
        <h2 className="section-title">
          {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : selectedCategory ? 'Sản phẩm theo danh mục' : 'Gợi ý hôm nay'}
        </h2>

        {isLoadingProducts ? (
          <div className="loading-spinner">Đang tải sản phẩm...</div>
        ) : allProducts.length === 0 ? (
          <div className="empty-products">
            <p>Không tìm thấy sản phẩm nào phù hợp!</p>
          </div>
        ) : (
          <div className="products-grid">
            {allProducts.map((p) => (
              <Link to={`/product/${p.id}`} key={p.id} className="product-card">
                <div className="product-img-wrapper">
                  <img src={p.image_url} alt={p.name} className="product-img" />
                </div>
                <div className="product-info">
                  <h3 className="product-name">{p.name}</h3>
                  <div className="product-tags">
                    {p.tags && p.tags.split(',').slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="tag-pill">{tag.trim()}</span>
                    ))}
                  </div>
                  <div className="product-footer">
                    <span className="product-price">{formatPrice(p.price)}</span>
                    <span className="product-sales">Kho: {p.stock}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
