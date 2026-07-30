import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { fetchProducts } from '../../../store/slices/productSlice';
import { fetchPersonalizedRecommendations, fetchSearchBasedRecommendations, trackUserInteraction } from '../../../store/slices/recommendationSlice';
import { addToCart } from '../../../store/slices/cartSlice';
import { Link, useSearchParams } from 'react-router-dom';
import { Spin, Button, Tag, Segmented } from 'antd';
import { ThunderboltFilled, FireFilled, LoadingOutlined, AppstoreOutlined, FilterOutlined } from '@ant-design/icons';
import productApi from '../../../api/productApi';
import storeApi from '../../../api/storeApi';
import ProductCard from '../../../components/product/ProductCard';
import BannerSection from '../../../components/home/BannerSection';
import CategoryNavSection from '../../../components/home/CategoryNavSection';
import OfficialStoresSection from '../../../components/home/OfficialStoresSection';
import TagCloudSection from '../../../components/home/TagCloudSection';
import ZeroResultFallback from '../../../components/home/ZeroResultFallback';
import '../../../styles/home.css';

export default function Home() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const categories = useAppSelector((state) => state.product.categories);
  const user = useAppSelector((state) => state.auth.user);
  const personalizedList = useAppSelector((state) => state.recommendation.personalizedList);
  const searchBasedList = useAppSelector((state) => state.recommendation.searchBasedList);
  const isLoadingPersonalized = useAppSelector((state) => state.recommendation.loadingPersonalized);

  const searchQuery = searchParams.get('search') || '';

  // Local states cho Bộ Lọc Đa Chiều & Phân Trang Lazy Loading
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedSort, setSelectedSort] = useState('popularity');
  const [popularTags, setPopularTags] = useState([]);
  const [officialStores, setOfficialStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [fallbackProducts, setFallbackProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // States Phân trang Backend & Infinite Scroll Lazy Loading
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, page: 1, limit: 8, totalPages: 1, hasMore: false });
  const sentinelRef = useRef(null);

  // Tải danh sách thương hiệu chính hãng, thẻ Tags & Gian hàng Shopee Mall
  useEffect(() => {
    productApi.getPopularTags()
      .then(res => setPopularTags(res || []))
      .catch(() => setPopularTags([]));

    storeApi.getStores({ is_official: 1, limit: 8 })
      .then(res => setOfficialStores(res || []))
      .catch(() => setOfficialStores([]));
  }, []);

  // Hàm tải sản phẩm phân trang từ Backend
  const loadProductsData = async (targetPage = 1, isReset = false) => {
    if (targetPage > 1) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingProducts(true);
    }

    try {
      const res = await productApi.getProducts({
        search: searchQuery,
        category: selectedCategory,
        tag: selectedTag,
        sort: selectedSort,
        page: targetPage,
        limit: 8
      });

      const newProducts = res.products || [];
      setFallbackProducts(res.fallbackProducts || []);
      setPaginationInfo(res.pagination || { total: newProducts.length, page: targetPage, limit: 8, totalPages: 1, hasMore: false });

      if (isReset || targetPage === 1) {
        setAllProducts(newProducts);
      } else {
        setAllProducts(prev => [...prev, ...newProducts]);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm:', err);
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingMore(false);
    }
  };

  // Trigger lại khi chọn Bộ Lọc (reset về page 1)
  useEffect(() => {
    setPage(1);
    loadProductsData(1, true);
  }, [searchQuery, selectedCategory, selectedTag, selectedSort]);

  // Tải AI Recommendations theo Ngữ cảnh Người dùng
  useEffect(() => {
    if (user && user.id) {
      dispatch(fetchPersonalizedRecommendations({ userId: user.id, limit: 6 }));
    }
    if (searchQuery) {
      dispatch(fetchSearchBasedRecommendations({ query: searchQuery, limit: 6 }));
    }
  }, [user, searchQuery, dispatch]);

  // Infinite Scroll Lazy Loading với IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && paginationInfo.hasMore && !isLoadingMore && !isLoadingProducts) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadProductsData(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [paginationInfo.hasMore, isLoadingMore, isLoadingProducts, page]);

  return (
    <div className="home-page fade-in">
      {/* 1. HERO BANNER */}
      {!searchQuery && <BannerSection />}

      {/* 2. CÂY DANH MỤC SẢN PHẨM 2 CẤP */}
      <CategoryNavSection
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 3. KHỐI TRƯNG BÀY GIAN HÀNG CHÍNH HÃNG SHOPEE MALL */}
      {!searchQuery && (
        <OfficialStoresSection officialStores={officialStores} />
      )}

      {/* 4. KHỐI THẺ TAG THỊNH HÀNH */}
      {popularTags.length > 0 && (
        <TagCloudSection
          popularTags={popularTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          totalProductsCount={allProducts.length}
        />
      )}

      {/* 5. GỢI Ý AI RECOMMENDATIONS (PERSONALIZED FEED) */}
      {!searchQuery && personalizedList.length > 0 && (
        <section className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 mb-8 border border-orange-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ThunderboltFilled className="text-orange-500 text-xl" />
            <h2 className="text-lg font-bold text-gray-800 m-0">
              Gợi Ý Dành Riêng Cho Bạn (AI Personalized Recommendation)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {personalizedList.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 6. DANH SÁCH SẢN PHẨM PHÂN TRANG & SẮP XẾP */}
      <section className="main-products-section">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
            <AppstoreOutlined className="text-orange-500" />
            {searchQuery ? `Kết quả tìm kiếm cho: "${searchQuery}"` : 'Tất Cả Sản Phẩm Nổi Bật'}
            <span className="text-xs font-normal text-gray-500">
              ({paginationInfo.total} sản phẩm)
            </span>
          </h2>

          {/* Sắp xếp Toolbar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Sắp xếp:</span>
            <Segmented
              options={[
                { label: '🔥 Nổi bật', value: 'popularity' },
                { label: 'Mới nhất', value: 'newest' },
                { label: 'Giá ⬆', value: 'price_asc' },
                { label: 'Giá ⬇', value: 'price_desc' }
              ]}
              value={selectedSort}
              onChange={setSelectedSort}
              className="bg-gray-100"
            />
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="py-16 text-center">
            <Spin indicator={<LoadingOutlined className="text-3xl text-orange-500" spin />} tip="Đang tải danh sách sản phẩm..." />
          </div>
        ) : allProducts.length === 0 ? (
          <ZeroResultFallback
            searchQuery={searchQuery}
            fallbackProducts={fallbackProducts}
            onClearSearch={() => setSearchParams({})}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {allProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="py-8 flex justify-center items-center">
              {isLoadingMore && (
                <Spin indicator={<LoadingOutlined className="text-2xl text-orange-500" spin />} tip="Đang tải thêm sản phẩm..." />
              )}
              {!paginationInfo.hasMore && allProducts.length > 0 && (
                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-4 py-1.5 rounded-full">
                  🎉 Bạn đã xem hết tất cả {paginationInfo.total} sản phẩm!
                </span>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
