import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, Input, Segmented, Empty, Button } from 'antd';
import { LoadingOutlined, SearchOutlined, ArrowLeftOutlined, ShopOutlined } from '@ant-design/icons';
import storeApi from '../../../api/storeApi';
import StoreHeroBanner from '../../../components/store/StoreHeroBanner';
import ProductCard from '../../../components/product/ProductCard';
import AlertBanner from '../../../components/common/AlertBanner';
import '../../../styles/store.css';

export default function StoreDetail() {
  const { slug } = useParams();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [storeError, setStoreError] = useState(null);

  // States tìm kiếm nội bộ Shop, lọc & phân trang
  const [searchInStore, setSearchInStore] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1, hasMore: false });

  // Tải thông tin Gian Hàng
  useEffect(() => {
    setIsLoadingStore(true);
    setStoreError(null);
    storeApi.getStoreBySlug(slug)
      .then(res => setStore(res))
      .catch(err => {
        console.error('Lỗi tải thông tin Gian Hàng:', err);
        setStoreError(err.response?.data?.message || 'Gian hàng không tồn tại hoặc đã bị khóa.');
      })
      .finally(() => setIsLoadingStore(false));
  }, [slug]);

  // Tải danh sách sản phẩm của Gian Hàng
  const loadStoreProducts = async (targetPage = 1, isReset = false) => {
    if (!slug) return;
    setIsLoadingProducts(true);

    try {
      const res = await storeApi.getStoreProducts(slug, {
        search: searchInStore,
        sort: selectedSort,
        page: targetPage,
        limit: 8
      });

      const newProds = res.products || [];
      setPagination(res.pagination || { total: newProds.length, page: targetPage, limit: 8, totalPages: 1, hasMore: false });

      if (isReset || targetPage === 1) {
        setProducts(newProds);
      } else {
        setProducts(prev => [...prev, ...newProds]);
      }
    } catch (err) {
      console.error('Lỗi tải sản phẩm Cửa hàng:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadStoreProducts(1, true);
  }, [slug, selectedSort, searchInStore]);

  const handleSearchSubmit = (value) => {
    setSearchInStore(value);
  };

  if (isLoadingStore) {
    return (
      <div className="py-20 text-center">
        <Spin indicator={<LoadingOutlined className="text-4xl text-orange-500" spin />} tip="Đang tải thông tin Gian Hàng..." />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl text-center shadow-sm border border-gray-100 fade-in">
        <AlertBanner
          type="error"
          title="Không tìm thấy Gian Hàng"
          message={storeError || "Gian hàng bạn truy cập không tồn tại hoặc đã tạm dừng hoạt động."}
        />
        <div className="mt-6">
          <Link to="/">
            <Button type="primary" danger icon={<ArrowLeftOutlined />} shape="round">
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-detail-page fade-in">
      {/* 1. HERO STORE HEADER BANNER SUB-COMPONENT */}
      <StoreHeroBanner store={store} />

      {/* 2. THANH TÌM KIẾM NỘI BỘ TRONG GIAN HÀNG & SORT BAR */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96">
          <Input.Search
            placeholder={`Tìm sản phẩm trong gian hàng ${store.name}...`}
            allowClear
            enterButton={<Button type="primary" danger icon={<SearchOutlined />}>Tìm trong Shop</Button>}
            size="large"
            onSearch={handleSearchSubmit}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Sắp xếp:</span>
          <Segmented
            options={[
              { label: 'Mới nhất', value: 'newest' },
              { label: '🔥 Bán chạy', value: 'popularity' },
              { label: 'Giá ⬆', value: 'price_asc' },
              { label: 'Giá ⬇', value: 'price_desc' }
            ]}
            value={selectedSort}
            onChange={setSelectedSort}
          />
        </div>
      </div>

      {/* 3. DANH SÁCH SẢN PHẨM THUỘC GIAN HÀNG */}
      <div className="store-products-section">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 m-0">
            <ShopOutlined className="text-orange-500 text-xl" />
            Tất cả sản phẩm của {store.name} ({pagination.total})
          </h2>
          {searchInStore && (
            <span className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full font-medium border border-orange-200">
              Từ khóa: "{searchInStore}"
            </span>
          )}
        </div>

        {isLoadingProducts ? (
          <div className="py-16 text-center">
            <Spin indicator={<LoadingOutlined className="text-3xl text-orange-500" spin />} tip="Đang truy vấn sản phẩm của Gian Hàng..." />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Empty description={`Không tìm thấy sản phẩm nào trong gian hàng phù hợp với từ khóa "${searchInStore}".`}>
              <Button type="primary" danger shape="round" onClick={() => setSearchInStore('')}>
                Xem tất cả sản phẩm của Shop
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
