import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { fetchProductById, clearProductDetails } from '../../../store/slices/productSlice';
import { fetchSimilarProducts, trackUserInteraction } from '../../../store/slices/recommendationSlice';
import { addToCart } from '../../../store/slices/cartSlice';
import useProductTracking from '../../../hooks/useProductTracking';
import { Spin, Rate, Tag, Button, Breadcrumb } from 'antd';
import { LoadingOutlined, ShoppingCartOutlined, HeartOutlined, HeartFilled, SafetyCertificateOutlined, SyncOutlined, CarOutlined, ThunderboltFilled, HomeOutlined, ShopOutlined } from '@ant-design/icons';
import StoreCardWidget from '../../../components/StoreCardWidget';
import ProductCard from '../../../components/product/ProductCard';
import AlertBanner from '../../../components/common/AlertBanner';
import '../../../styles/product.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  const product = useAppSelector((state) => state.product.selectedProduct);
  const similarProducts = useAppSelector((state) => state.recommendation.similarList);
  const isLoading = useAppSelector((state) => state.product.loading);

  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  // Khởi chạy hook tự động ghi nhận tương tác 'view'
  useProductTracking(product?.id, 'view');

  // Tải chi tiết sản phẩm và sản phẩm tương tự
  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchSimilarProducts({ productId: id, limit: 4 }));

    return () => {
      dispatch(clearProductDetails());
    };
  }, [id, dispatch]);

  useEffect(() => {
    setQuantity(1);
    setIsLiked(false);
  }, [id]);

  const handleQuantityChange = (val) => {
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= (product?.stock || 1)) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!token) {
      navigate('/auth');
      return;
    }
    dispatch(addToCart({ productId: product.id, quantity }));
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!token) {
      navigate('/auth');
      return;
    }
    const action = await dispatch(addToCart({ productId: product.id, quantity }));
    if (addToCart.fulfilled.match(action)) {
      navigate('/cart');
    }
  };

  const handleLike = () => {
    if (!product) return;
    setIsLiked(!isLiked);
    if (!isLiked) {
      dispatch(trackUserInteraction({ productId: product.id, type: 'like' }));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const productError = useAppSelector((state) => state.product.error);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Spin indicator={<LoadingOutlined className="text-4xl text-orange-500" spin />} tip="Đang tải chi tiết sản phẩm..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl text-center shadow-sm border border-gray-100 fade-in">
        <AlertBanner
          type="error"
          title="Không tìm thấy sản phẩm"
          message={productError || "Sản phẩm bạn truy vấn không tồn tại, đã bị gỡ hoặc có lỗi kết nối đến máy chủ."}
        />
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button type="primary" danger shape="round" onClick={() => dispatch(fetchProductById(id))}>
            Thử tải lại
          </Button>
          <Link to="/">
            <Button type="default" shape="round">
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page fade-in">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        className="mb-4 text-xs"
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: <span>{product.category_name || 'Sản phẩm'}</span> },
          { title: <span className="font-semibold text-gray-800">{product.name}</span> }
        ]}
      />

      {/* Main Product Container */}
      <div className="bg-white rounded-2xl p-10 md:p-12 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
        {/* Left: Image */}
        <div className="md:col-span-5 relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full max-h-96 object-cover rounded-xl border border-gray-100 shadow-sm"
          />
          {product.store_is_official === 1 && (
            <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black uppercase px-2.5 py-1 rounded shadow">
              Shopee Mall
            </span>
          )}
        </div>

        {/* Right: Detailed Info */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div>
            {product.store_name && (
              <div className="mb-2">
                <Link to={`/store/${product.store_slug}`} className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full text-xs font-bold hover:bg-orange-100 transition-colors">
                  <ShopOutlined /> Gian Hàng Bán: {product.store_name} {product.store_is_official === 1 && '• Mall'}
                </Link>
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Rate disabled defaultValue={Number(product.rating_avg) || 5} className="text-sm text-amber-400" />
                <span className="font-bold text-gray-700">{product.rating_avg || '5.0'}</span>
                <span>({product.rating_count || 0} Đánh giá)</span>
              </div>
              <span>|</span>
              <span>Danh mục: <strong className="text-gray-800">{product.category_name}</strong></span>
              <span>|</span>
              <span>Còn lại: <strong className="text-orange-600">{product.stock}</strong></span>
            </div>

            {/* Price Box */}
            <div className="bg-orange-50/70 p-4 rounded-xl flex items-baseline gap-3 mb-6 border border-orange-100">
              <span className="text-3xl font-extrabold text-red-600">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            {/* Shopping Benefits */}
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 mb-6">
              <CarOutlined className="text-base" />
              <span><strong>Miễn phí vận chuyển:</strong> Miễn phí vận chuyển cho mọi đơn hàng từ 250k</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-gray-700">Số lượng:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 font-bold border-none cursor-pointer"
                >
                  -
                </button>
                <input
                  type="text"
                  value={quantity}
                  readOnly
                  className="w-12 h-8 text-center font-bold border-none outline-none text-sm"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 font-bold border-none cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">Có sẵn {product.stock} sản phẩm</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                type="primary"
                ghost
                danger
                size="large"
                shape="round"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                className="font-bold border-red-500 hover:bg-red-50"
              >
                Thêm Vào Giỏ Hàng
              </Button>
              <Button
                type="primary"
                danger
                size="large"
                shape="round"
                onClick={handleBuyNow}
                className="font-bold bg-red-600 hover:bg-red-700 shadow-md"
              >
                Mua Ngay
              </Button>
              <Button
                type="text"
                shape="circle"
                size="large"
                icon={isLiked ? <HeartFilled className="text-red-500 text-xl" /> : <HeartOutlined className="text-gray-400 text-xl" />}
                onClick={handleLike}
              />
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <SafetyCertificateOutlined className="text-red-600 text-base" /> 100% Hàng chính hãng
            </div>
            <div className="flex items-center gap-2">
              <SyncOutlined className="text-blue-600 text-base" /> 7 ngày miễn phí đổi trả
            </div>
          </div>
        </div>
      </div>

      {/* Store Card Widget */}
      {product.store_name && (
        <StoreCardWidget store={product} />
      )}

      {/* Description Container */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-red-500 pb-2 mb-4 inline-block">
          MÔ TẢ SẢN PHẨM
        </h2>
        <div className="text-sm text-gray-700 leading-relaxed mb-6">
          <p>{product.description}</p>
        </div>

        {/* Tags */}
        <div className="pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Tags gợi ý:</span>
          {product.tags && product.tags.split(',').map((t, idx) => (
            <Tag key={idx} color="orange" className="m-0 text-xs rounded-full px-3 py-0.5">
              #{t.trim()}
            </Tag>
          ))}
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-800 m-0 flex items-center gap-2">
              <ThunderboltFilled className="text-orange-500" /> SẢN PHẨM TƯƠNG TỰ
            </h2>
            <Tag color="volcano" className="m-0 text-xs font-medium">
              Tìm kiếm bằng Cosine Similarity trên TF-IDF
            </Tag>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
