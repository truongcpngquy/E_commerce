import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useReduxHooks';
import { fetchProducts } from '../store/slices/productSlice';
import { fetchPersonalizedRecommendations, fetchSearchBasedRecommendations, trackUserInteraction } from '../store/slices/recommendationSlice';
import { addToCart } from '../store/slices/cartSlice';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Grid, ArrowRight, Search, Filter, Star, Eye, ShoppingCart, Heart, Tag, SlidersHorizontal, Check, Flame, Sparkle, Cpu, Target, Award } from 'lucide-react';
import productApi from '../api/productApi';
import './Home.css';

export default function Home() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const categories = useAppSelector((state) => state.product.categories);
  const user = useAppSelector((state) => state.auth.user);
  const personalizedList = useAppSelector((state) => state.recommendation.personalizedList);
  const searchBasedList = useAppSelector((state) => state.recommendation.searchBasedList);
  const isLoadingPersonalized = useAppSelector((state) => state.recommendation.loadingPersonalized);

  const searchQuery = searchParams.get('search') || '';

  // Local states cho Bộ Lọc Đa Chiều (Multi-Dimensional Filter Dashboard)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedSort, setSelectedSort] = useState('popularity');
  const [brands, setBrands] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Tải danh sách thương hiệu chính hãng & thẻ Tags phân loại theo loại
  useEffect(() => {
    productApi.getBrands()
      .then(res => setBrands(res || []))
      .catch(() => setBrands([]));

    productApi.getPopularTags()
      .then(res => setPopularTags(res || []))
      .catch(() => setPopularTags([]));
  }, []);

  // Tải sản phẩm theo bộ lọc đa chiều (Category, Brand, Tag, Search, Sort)
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      const action = await dispatch(fetchProducts({
        category: selectedCategory,
        brand: selectedBrand,
        tag: selectedTag,
        search: searchQuery,
        sort: selectedSort
      }));
      if (fetchProducts.fulfilled.match(action)) {
        setAllProducts(action.payload || []);
      }
      setIsLoadingProducts(false);
    };

    loadProducts();
  }, [selectedCategory, selectedBrand, selectedTag, searchQuery, selectedSort, dispatch]);

  // Tải các widget gợi ý AI khi user đăng nhập
  useEffect(() => {
    if (user) {
      dispatch(fetchPersonalizedRecommendations(6));
      dispatch(fetchSearchBasedRecommendations(6));
    }
  }, [user, dispatch]);

  const handleAddToCart = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ productId, quantity: 1 }));
  };

  const handleQuickLike = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(trackUserInteraction({ productId, type: 'like' }));
  };

  const handleTagClick = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  const getTagIconAndClass = (type) => {
    switch (type) {
      case 'style':
        return { icon: <Sparkles size={12} />, className: 'pill-style' }; // Thời trang & Vẻ đẹp (Pink/Purple)
      case 'tech':
        return { icon: <Cpu size={12} />, className: 'pill-tech' };       // Công nghệ & Laptop (Cyan/Blue)
      case 'usage':
        return { icon: <Target size={12} />, className: 'pill-usage' };   // Mục đích sử dụng (Green)
      case 'segment':
        return { icon: <Award size={12} />, className: 'pill-segment' }; // Trend / Chính hãng (Orange)
      default:
        return { icon: <Tag size={12} />, className: '' };
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="home-page fade-in">
      {/* Banner Quảng Cáo Smart Recommendation System */}
      {!searchQuery && (
        <div className="home-banner">
          <div className="banner-content">
            <span className="banner-badge">AI Recommendation System v2.0</span>
            <h1 className="banner-title">MUA SẮM TIỆN LỢI - GỢI Ý THÔNG MINH</h1>
            <p className="banner-desc">
              Tự động phân tích hành vi tương tác thụ động (Dwell time, Search click) kết hợp sở thích cá nhân hóa để đề xuất sản phẩm chính xác nhất cho bạn.
            </p>
            {!user ? (
              <Link to="/auth" className="banner-btn">
                Đăng nhập để nhận gợi ý riêng
                <ArrowRight size={16} />
              </Link>
            ) : (
              <div className="user-persona-tag">
                🎯 Đang áp dụng hồ sơ cá nhân hóa cho: <strong>{user.full_name || user.username}</strong> ({user.city || 'Hà Nội'})
              </div>
            )}
          </div>
          <div className="banner-image">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600" 
              alt="Ecommerce AI" 
            />
          </div>
        </div>
      )}

      {/* HEADER BÁO CÁO NGỮ CẢNH TÌM KIẾM (SEARCH CONTEXT HEADER) */}
      {searchQuery && (
        <div className="search-context-header">
          <div className="search-context-info">
            <h2>
              <Search size={22} className="icon-orange" />
              Kết quả tìm kiếm cho: <span className="highlight-text">"{searchQuery}"</span>
            </h2>
            <span className="results-count">Tìm thấy <strong>{allProducts.length}</strong> sản phẩm phù hợp</span>
          </div>
          <button onClick={() => setSearchParams({})} className="clear-search-btn">
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      )}

      {/* SECTION CATEGORY BAR (CÂY DANH MỤC SẢN PHẨM) */}
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
            <span className="category-name">Tất cả</span>
          </div>
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`category-card ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <img src={cat.image_url} alt={cat.name} className="category-img" />
              <span className="category-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION SMART TAG CLOUD BAR (KHỐI THẺ TAG PHÂN LOẠI: Thời trang, Vẻ đẹp, Công nghệ, Mục đích...) */}
      {popularTags.length > 0 && (
        <section className="tag-cloud-section">
          <div className="tag-cloud-header">
            <span className="tag-cloud-title">
              <Flame size={18} className="icon-flame animate-pulse" />
              Thẻ Tag thịnh hành (Phân loại theo Style & Công nghệ):
            </span>
            {selectedTag && (
              <span className="active-tag-indicator">
                Đang lọc tag: <strong>#{selectedTag}</strong>
                <button onClick={() => setSelectedTag(null)} className="clear-tag-btn">✕ Clear</button>
              </span>
            )}
          </div>
          <div className="tag-cloud-pills">
            {popularTags.map((tObj, idx) => {
              const tagName = typeof tObj === 'object' ? tObj.name : tObj;
              const tagType = typeof tObj === 'object' ? tObj.type : 'general';
              const { icon, className } = getTagIconAndClass(tagType);
              return (
                <button
                  key={idx}
                  className={`tag-cloud-pill ${selectedTag === tagName ? 'active' : ''} ${className}`}
                  onClick={() => handleTagClick(tagName)}
                >
                  {icon}
                  #{tagName}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* WIDGET 1: GỢI Ý CÁ NHÂN HÓA DỰA TRÊN BEHAVIOR LOGS & PROFILING */}
      {user && personalizedList.length > 0 && !searchQuery && !selectedTag && (
        <section className="recommendations-section">
          <div className="section-header">
            <h2 className="section-title text-sparkle">
              <Sparkles size={22} className="icon-sparkle animate-pulse" />
              Gợi ý dành riêng cho {user.full_name || user.username}
            </h2>
            <span className="algorithm-badge">Content-Based + Behavior Weights Active</span>
          </div>

          {isLoadingPersonalized ? (
            <div className="loading-spinner">Đang tính toán vector gợi ý...</div>
          ) : (
            <div className="products-grid">
              {personalizedList.map((p) => (
                <div key={p.id} className="product-card recommend-card">
                  {p.recommendationScore > 0 && (
                    <div className="similarity-badge">
                      <Sparkles size={12} />
                      Khớp {Math.round(p.recommendationScore * 100)}%
                    </div>
                  )}
                  <Link to={`/product/${p.id}`} className="product-img-wrapper">
                    <img src={p.image_url} alt={p.name} className="product-img" />
                  </Link>
                  <div className="product-info">
                    {p.brand_name && <span className="brand-badge">{p.brand_name}</span>}
                    <Link to={`/product/${p.id}`}>
                      <h3 className="product-name">{p.name}</h3>
                    </Link>
                    <div className="product-tags">
                      {p.tags && p.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="tag-pill clickable-tag"
                          onClick={() => handleTagClick(tag.trim())}
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="product-rating-row">
                      <span className="rating-stars">
                        <Star size={14} fill="#ffb800" stroke="#ffb800" />
                        {p.rating_avg || '5.0'}
                      </span>
                      <span className="views-count">
                        <Eye size={12} /> {p.views_count || 0}
                      </span>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">{formatPrice(p.price)}</span>
                      <div className="card-actions">
                        <button onClick={(e) => handleQuickLike(e, p.id)} className="btn-icon-like" title="Yêu thích">
                          <Heart size={16} />
                        </button>
                        <button onClick={(e) => handleAddToCart(e, p.id)} className="btn-icon-cart" title="Thêm vào giỏ">
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* WIDGET 2: GỢI Ý THEO NGỮ CẢNH TÌM KIẾM GẦN ĐÂY */}
      {user && searchBasedList.length > 0 && !searchQuery && !selectedTag && (
        <section className="search-recommendations-section">
          <div className="section-header">
            <h2 className="section-title">
              <Search size={20} className="icon-orange" />
              Gợi ý từ lịch sử tìm kiếm gần đây
            </h2>
            <span className="algorithm-badge secondary">Search Context Matching</span>
          </div>
          <div className="products-grid">
            {searchBasedList.map((p) => (
              <div key={p.id} className="product-card search-reco-card">
                <Link to={`/product/${p.id}`} className="product-img-wrapper">
                  <img src={p.image_url} alt={p.name} className="product-img" />
                </Link>
                <div className="product-info">
                  {p.category_name && <span className="category-pill">{p.category_name}</span>}
                  <Link to={`/product/${p.id}`}>
                    <h3 className="product-name">{p.name}</h3>
                  </Link>
                  <div className="product-footer">
                    <span className="product-price">{formatPrice(p.price)}</span>
                    <button onClick={(e) => handleAddToCart(e, p.id)} className="btn-icon-cart" title="Thêm vào giỏ">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BỘ LỌC ĐA CHIỀU & DANH SÁCH SẢN PHẨM CHÍNH */}
      <section className="all-products-section">
        {/* Filter Bar Header */}
        <div className="filter-dashboard-bar">
          <div className="filter-title-group">
            <SlidersHorizontal size={20} className="icon-orange" />
            <h2 className="section-title">
              {searchQuery ? `Sản phẩm kết quả` : selectedTag ? `Sản phẩm theo Tag #${selectedTag}` : selectedCategory ? 'Danh mục được chọn' : 'Tất cả sản phẩm thông minh'}
            </h2>
          </div>

          {/* Sắp xếp đa chiều */}
          <div className="sort-buttons-group">
            <span className="sort-label">Sắp xếp theo:</span>
            <button 
              className={`sort-btn ${selectedSort === 'popularity' ? 'active' : ''}`}
              onClick={() => setSelectedSort('popularity')}
            >
              🔥 Nổi bật
            </button>
            <button 
              className={`sort-btn ${selectedSort === 'rating' ? 'active' : ''}`}
              onClick={() => setSelectedSort('rating')}
            >
              ⭐ Đánh giá cao
            </button>
            <button 
              className={`sort-btn ${selectedSort === 'price_asc' ? 'active' : ''}`}
              onClick={() => setSelectedSort('price_asc')}
            >
              Giá thấp ➔ cao
            </button>
            <button 
              className={`sort-btn ${selectedSort === 'price_desc' ? 'active' : ''}`}
              onClick={() => setSelectedSort('price_desc')}
            >
              Giá cao ➔ thấp
            </button>
          </div>
        </div>

        {/* Lọc theo Thương hiệu chính hãng (Brand Filter Chips) */}
        {brands.length > 0 && (
          <div className="brand-filter-bar">
            <span className="brand-filter-label">Thương hiệu chính hãng:</span>
            <div className="brand-chips-container">
              <button 
                className={`brand-chip ${selectedBrand === null ? 'active' : ''}`}
                onClick={() => setSelectedBrand(null)}
              >
                Tất cả
              </button>
              {brands.map(b => (
                <button 
                  key={b.id}
                  className={`brand-chip ${selectedBrand === b.id ? 'active' : ''}`}
                  onClick={() => setSelectedBrand(selectedBrand === b.id ? null : b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid Sản Phẩm */}
        {isLoadingProducts ? (
          <div className="loading-spinner">Đang truy vấn sản phẩm...</div>
        ) : allProducts.length === 0 ? (
          <div className="empty-products">
            <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc!</p>
          </div>
        ) : (
          <div className="products-grid">
            {allProducts.map((p) => (
              <div key={p.id} className="product-card">
                <Link to={`/product/${p.id}`} className="product-img-wrapper">
                  <img src={p.image_url} alt={p.name} className="product-img" />
                </Link>
                <div className="product-info">
                  <div className="product-meta-header">
                    {p.brand_name && <span className="brand-badge">{p.brand_name}</span>}
                    {p.category_name && <span className="category-pill">{p.category_name}</span>}
                  </div>
                  <Link to={`/product/${p.id}`}>
                    <h3 className="product-name">{p.name}</h3>
                  </Link>
                  <div className="product-tags">
                    {p.tags && p.tags.split(',').slice(0, 3).map((tag, idx) => (
                      <span 
                        key={idx} 
                        className={`tag-pill clickable-tag ${selectedTag === tag.trim() ? 'active-tag-pill' : ''}`}
                        onClick={() => handleTagClick(tag.trim())}
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                  <div className="product-rating-row">
                    <span className="rating-stars">
                      <Star size={14} fill="#ffb800" stroke="#ffb800" />
                      {p.rating_avg || '5.0'} ({p.rating_count || 0})
                    </span>
                    <span className="views-count">Kho: {p.stock}</span>
                  </div>
                  <div className="product-footer">
                    <div className="price-group">
                      <span className="product-price">{formatPrice(p.price)}</span>
                    </div>
                    <div className="card-actions">
                      <button onClick={(e) => handleQuickLike(e, p.id)} className="btn-icon-like" title="Yêu thích">
                        <Heart size={16} />
                      </button>
                      <button onClick={(e) => handleAddToCart(e, p.id)} className="btn-icon-cart" title="Thêm vào giỏ">
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
