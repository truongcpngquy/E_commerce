import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import storeApi from '../../../api/storeApi';
import AlertBanner from '../../../components/common/AlertBanner';
import { Breadcrumb, Spin, Tag, Avatar, Button } from 'antd';
import {
  SafetyCertificateFilled,
  StarFilled,
  ShopOutlined,
  UserAddOutlined,
  RightOutlined,
  SearchOutlined,
  HomeOutlined,
  FireFilled
} from '@ant-design/icons';
import './StoresList.css';

export default function StoresList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'mall', 'top_rated', 'popular'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.getStores({ limit: 50 });
      setStores(data || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách cửa hàng:', err);
      setError('Không thể tải danh sách Gian Hàng. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(st => {
    // Search query filter
    const matchesSearch =
      st.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter type
    if (filterType === 'mall') return st.is_official === 1;
    if (filterType === 'top_rated') return Number(st.rating_avg) >= 4.9;
    if (filterType === 'popular') return (st.followers_count || 0) >= 10000;
    return true;
  });

  return (
    <div className="stores-list-page fade-in">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* BREADCRUMB */}
        <Breadcrumb
          className="mb-4 text-xs"
          items={[
            { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
            { title: <span className="font-bold text-red-600">Khám Phá Gian Hàng Shopee</span> }
          ]}
        />

        {/* HERO BANNER */}
        <div className="stores-hero-banner">
          <div className="hero-badge">
            <FireFilled /> Shopee Official Hub
          </div>
          <h1 className="hero-title">
            Khám Phá Gian Hàng Top Shopee Mall & Cửa Hàng Chính Hãng
          </h1>
          <p className="hero-sub">
            Trải nghiệm mua sắm an tâm với 100% hàng chính hãng, đổi trả miễn phí và ưu đãi độc quyền từ các thương hiệu hàng đầu.
          </p>

          {/* SEARCH & FILTERS BAR */}
          <div className="stores-search-bar">
            <div className="search-input-box">
              <SearchOutlined className="search-icon" />
              <input
                type="text"
                placeholder="Tìm gian hàng thương hiệu (Apple, Samsung, Nike, Logitech...)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="stores-filter-pills">
              {[
                { key: 'all', label: 'Tất cả Gian Hàng' },
                { key: 'mall', label: '⭐ Shopee Mall Chính Hãng' },
                { key: 'top_rated', label: '🏆 Đánh Giá Cao (4.9+★)' },
                { key: 'popular', label: '🔥 Nhiều Người Theo Dõi' }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`filter-pill-btn ${filterType === tab.key ? 'active' : ''}`}
                  onClick={() => setFilterType(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <AlertBanner
            type="error"
            title="Lỗi tải dữ liệu"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* STORES GRID */}
        {loading ? (
          <div className="py-20 text-center">
            <Spin size="large" tip="Đang tải danh sách Gian Hàng Top Shopee..." />
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm my-6">
            <ShopOutlined style={{ fontSize: 48 }} className="text-gray-300 mb-3" />
            <h3 className="text-gray-700 font-bold text-base m-0">Không tìm thấy Gian Hàng phù hợp</h3>
            <p className="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
            {filteredStores.map(st => (
              <div key={st.id} className="store-discovery-card group">
                {/* Cover Banner */}
                <div
                  className="card-banner-bg"
                  style={{ backgroundImage: `url(${st.banner_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800'})` }}
                >
                  {st.is_official === 1 && (
                    <span className="card-mall-badge">
                      <SafetyCertificateFilled /> Shopee Mall
                    </span>
                  )}
                </div>

                {/* Card Header & Avatar */}
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    <Link to={`/store/${st.slug}`} className="flex-shrink-0">
                      <Avatar
                        src={st.logo_url}
                        size={60}
                        className="card-avatar border-2 border-white shadow bg-white"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/store/${st.slug}`} className="no-underline">
                        <h3 className="card-store-name group-hover:text-red-600 transition-colors">
                          {st.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-amber-500">
                          <StarFilled className="text-xs" /> {st.rating_avg || '5.0'}
                        </span>
                        <span>•</span>
                        <span>
                          <UserAddOutlined /> {st.followers_count ? st.followers_count.toLocaleString() : '10,000+'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="card-description">
                    {st.description || 'Chào mừng bạn đến với Cửa Hàng chính thức trên Shopee!'}
                  </p>

                  {/* Store Specs Pills */}
                  <div className="card-specs-row">
                    <div className="spec-item">
                      <span className="spec-label">Sản phẩm:</span>
                      <span className="spec-val">{st.total_products || 0}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Phản hồi:</span>
                      <span className="spec-val text-emerald-600">{st.response_rate || '99%'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Tốc độ:</span>
                      <span className="spec-val">{st.response_time || 'Vài phút'}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="card-footer-action">
                    <Link to={`/store/${st.slug}`} className="w-full no-underline">
                      <Button
                        type="primary"
                        danger
                        block
                        shape="round"
                        icon={<ShopOutlined />}
                        className="font-bold text-xs bg-red-600 hover:bg-red-700 h-9"
                      >
                        Ghé Thăm Gian Hàng <RightOutlined className="text-[10px]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
