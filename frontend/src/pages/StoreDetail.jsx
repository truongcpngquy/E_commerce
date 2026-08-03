import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  Star, 
  Package, 
  UserCheck, 
  MessageCircle, 
  Search, 
  SlidersHorizontal, 
  ShieldCheck, 
  Award, 
  Sparkles,
  Loader2,
  ChevronDown
} from 'lucide-react';
import './StoreDetail.css';

export default function StoreDetail() {
  const { id } = useParams();
  const { fetchStoreById, fetchStoreProducts, categories, addToCart, showToast } = useApp();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Tab & Filters state
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'popular', 'categories'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Lazy Loading & Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const PAGE_LIMIT = 8; // Tải 8 sản phẩm mỗi lần (Lazy Loading Chunks)

  // Anchor ref cho Infinite Scroll trigger
  const observerTarget = useRef(null);

  // 1. Tải thông tin Gian hàng
  useEffect(() => {
    const loadStore = async () => {
      setIsLoadingStore(true);
      const data = await fetchStoreById(id);
      if (data) {
        setStore(data);
      } else {
        setStore(null);
      }
      setIsLoadingStore(false);
    };

    loadStore();
  }, [id]);

  // 2. Tải đợt sản phẩm đầu tiên khi filters thay đổi (Reset Lazy Load)
  useEffect(() => {
    const loadInitialProducts = async () => {
      setIsLoadingProducts(true);
      setOffset(0);
      
      const sortParam = activeTab === 'popular' ? 'popular' : sortBy;
      const res = await fetchStoreProducts(id, {
        category: selectedCategory,
        q: searchQuery,
        sort: sortParam,
        limit: PAGE_LIMIT,
        offset: 0
      });

      setProducts(res.products || []);
      setTotalProducts(res.total || 0);
      setHasMore(res.hasMore || false);
      setIsLoadingProducts(false);
    };

    loadInitialProducts();
  }, [id, activeTab, selectedCategory, searchQuery, sortBy]);

  // 3. Hàm Lazy Load Tải thêm sản phẩm (Load More)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextOffset = offset + PAGE_LIMIT;

    const sortParam = activeTab === 'popular' ? 'popular' : sortBy;
    const res = await fetchStoreProducts(id, {
      category: selectedCategory,
      q: searchQuery,
      sort: sortParam,
      limit: PAGE_LIMIT,
      offset: nextOffset
    });

    if (res.products && res.products.length > 0) {
      setProducts((prev) => [...prev, ...res.products]);
      setOffset(nextOffset);
      setHasMore(res.hasMore || false);
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  };

  // Toggle Theo dõi gian hàng
  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      showToast(`Đã theo dõi gian hàng ${store?.name || 'này'}!`);
    } else {
      showToast(`Đã hủy theo dõi gian hàng ${store?.name || 'này'}.`);
    }
  };

  const handleContactStore = () => {
    showToast(`Đã mở cửa sổ trò chuyện với gian hàng ${store?.name || ''}!`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (isLoadingStore) {
    return (
      <div className="store-loading-container">
        <Loader2 size={40} className="spin-icon" />
        <p>Đang tải thông tin gian hàng...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="store-error-container">
        <Store size={60} className="icon-error" />
        <h2>Không tìm thấy gian hàng này!</h2>
        <p>Gian hàng có thể đã tạm ngưng hoạt động hoặc không tồn tại.</p>
        <Link to="/" className="btn-back-home">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="store-detail-page fade-in">
      {/* KHỐI HEADER BÌA VÀ THÔNG TIN SHOP (STORE HERO BANNER) */}
      <div className="store-hero-banner" style={{ backgroundImage: `url(${store.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200'})` }}>
        <div className="store-hero-overlay">
          <div className="store-profile-card">
            {/* Logo Shop */}
            <div className="store-avatar-wrapper">
              <img 
                src={store.logo_url || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200'} 
                alt={store.name} 
                className="store-avatar-img" 
                loading="lazy"
              />
              {store.is_official === 1 && (
                <span className="store-mall-badge" title="Shopee Mall Chính Hãng">
                  <ShieldCheck size={12} /> Mall
                </span>
              )}
            </div>

            {/* Thông tin chữ */}
            <div className="store-meta-info">
              <div className="store-title-row">
                <h1 className="store-name">{store.name}</h1>
                <span className="store-verified-pill">
                  <Award size={14} /> Gian Hàng Đã Xác Thực
                </span>
              </div>
              <p className="store-description">{store.description || 'Chuyên cung cấp sản phẩm chính hãng cao cấp.'}</p>
              
              {/* Nút thao tác Theo dõi / Chat */}
              <div className="store-action-buttons">
                <button 
                  onClick={handleToggleFollow} 
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                >
                  <UserCheck size={16} />
                  {isFollowing ? 'Đang Theo Dõi' : '+ Theo Dõi'}
                </button>
                <button onClick={handleContactStore} className="btn-chat">
                  <MessageCircle size={16} />
                  Chat Ngay
                </button>
              </div>
            </div>
          </div>

          {/* CHỈ SỐ THỐNG KÊ QUÁN */}
          <div className="store-stats-grid">
            <div className="stat-item">
              <Star size={18} className="stat-icon yellow" />
              <div>
                <span className="stat-value">{store.rating_avg} / 5.0</span>
                <span className="stat-label">Đánh giá Shop</span>
              </div>
            </div>
            <div className="stat-item">
              <Package size={18} className="stat-icon blue" />
              <div>
                <span className="stat-value">{store.product_count || totalProducts}</span>
                <span className="stat-label">Sản phẩm</span>
              </div>
            </div>
            <div className="stat-item">
              <UserCheck size={18} className="stat-icon green" />
              <div>
                <span className="stat-value">{(store.followers_count / 1000).toFixed(1)}k</span>
                <span className="stat-label">Người theo dõi</span>
              </div>
            </div>
            <div className="stat-item">
              <Sparkles size={18} className="stat-icon orange" />
              <div>
                <span className="stat-value">{store.response_rate}</span>
                <span className="stat-label">Tỉ lệ phản hồi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI THANH ĐIỀU HƯỚNG TABS VÀ TÌM KIẾM SẢN PHẨM QUÁN */}
      <div className="store-nav-sticky">
        <div className="store-tabs-container">
          <button 
            className={`store-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab('all'); setSelectedCategory('all'); }}
          >
            <Store size={16} /> Tất Cả Sản Phẩm
          </button>
          <button 
            className={`store-tab ${activeTab === 'popular' ? 'active' : ''}`}
            onClick={() => { setActiveTab('popular'); setSelectedCategory('all'); }}
          >
            <Sparkles size={16} /> Sản Phẩm Bán Chạy
          </button>
          <button 
            className={`store-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <SlidersHorizontal size={16} /> Theo Danh Mục
          </button>
        </div>

        {/* Ô Tìm Kiếm Sản Phẩm Trong Gian Hàng */}
        <div className="store-in-search-box">
          <Search size={16} className="search-box-icon" />
          <input 
            type="text" 
            placeholder={`Tìm trong gian hàng ${store.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* BỘ LỌC SUB-BAR VÀ SẮP XẾP */}
      <div className="store-filter-bar">
        {activeTab === 'categories' && (
          <div className="category-chips">
            <button 
              className={`chip ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                className={`chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="store-sort-wrapper">
          <span className="sort-label">Sắp xếp:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            <option value="popular">Nổi bật nhất</option>
          </select>
        </div>
      </div>

      {/* SANH SÁCH SẢN PHẨM VỚI KỸ THUẬT LAZY LOADING */}
      <div className="store-products-section">
        <div className="section-header-info">
          <h3>
            {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Danh sách sản phẩm của Quán'}
          </h3>
          <span className="total-badge">Hiển thị {products.length} / {totalProducts} sản phẩm</span>
        </div>

        {isLoadingProducts ? (
          <div className="product-skeleton-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="product-card-skeleton">
                <div className="skeleton-img"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="store-empty-products">
            <Package size={48} className="icon-empty" />
            <p>Gian hàng chưa có sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <>
            <div className="store-products-grid">
              {products.map((p) => (
                <div key={p.id} className="store-product-card">
                  {p.discount_percent > 0 && (
                    <div className="store-discount-badge">
                      -{p.discount_percent}%
                    </div>
                  )}

                  <Link to={`/product/${p.id}`} className="card-img-link">
                    <img 
                      src={p.image_url} 
                      alt={p.name} 
                      className="store-product-img"
                      loading="lazy" // Kỹ thuật Lazy Loading ảnh tiêu chuẩn HTML5
                    />
                  </Link>

                  <div className="store-card-body">
                    <span className="card-category-tag">{p.category_name || 'Sản phẩm'}</span>
                    <Link to={`/product/${p.id}`} className="card-title-link">
                      <h4 className="card-title">{p.name}</h4>
                    </Link>

                    <div className="card-price-row">
                      <span className="card-price">{formatPrice(p.price)}</span>
                      {p.original_price > p.price && (
                        <span className="card-original-price">{formatPrice(p.original_price)}</span>
                      )}
                    </div>

                    <button 
                      onClick={() => addToCart(p.id, 1)} 
                      className="btn-store-add-cart"
                    >
                      + Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* KỸ THUẬT LAZY LOADING - TẢI THÊM SẢN PHẨM (LOAD MORE / INFINITE CHUNKS) */}
            {hasMore && (
              <div className="lazy-load-action-bar">
                <button 
                  onClick={handleLoadMore} 
                  disabled={isLoadingMore}
                  className="btn-lazy-load-more"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={18} className="spin-icon" />
                      Đang tải thêm sản phẩm...
                    </>
                  ) : (
                    <>
                      Xem Thêm Sản Phẩm Khác ({totalProducts - products.length} còn lại)
                      <ChevronDown size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
