import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Rate, Tag, Button, Tooltip, Badge } from 'antd';
import { ShoppingCartOutlined, HeartOutlined, ShopOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { addToCart } from '../../store/slices/cartSlice';
import { trackUserInteraction } from '../../store/slices/recommendationSlice';

export default function ProductCard({ product }) {
  const dispatch = useAppDispatch();

  if (!product) return null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
  };

  const handleQuickLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(trackUserInteraction({ productId: product.id, type: 'like' }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const discountPercent = product.discount_percent || (product.original_price && product.original_price > product.price ? Math.round((1 - product.price / product.original_price) * 100) : 0);

  return (
    <div className="h-full group">
      <Badge.Ribbon
        text={discountPercent > 0 ? `-${discountPercent}%` : (product.store_is_official === 1 ? 'Mall' : 'Hot')}
        color={discountPercent > 0 ? '#ff4d4f' : (product.store_is_official === 1 ? '#d0011b' : '#ff7a00')}
      >
        <Card
          hoverable
          className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 bg-white"
          cover={
            <Link to={`/product/${product.id}`} className="relative block h-56 w-full overflow-hidden bg-gray-50 p-2">
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
              {product.store_is_official === 1 && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow z-10">
                  Mall
                </span>
              )}
            </Link>
          }
          actions={[
            <Tooltip title="Thêm vào yêu thích" key="like">
              <Button type="text" icon={<HeartOutlined className="text-gray-400 hover:text-red-500 text-lg" />} onClick={handleQuickLike} />
            </Tooltip>,
            <Tooltip title="Thêm vào giỏ hàng" key="cart">
              <Button type="primary" danger icon={<ShoppingCartOutlined />} onClick={handleAddToCart} size="middle" className="font-semibold px-5">
                Thêm Giỏ
              </Button>
            </Tooltip>
          ]}
        >
          <div className="flex flex-col gap-2.5 p-3 flex-1">
            {/* Store & Brand badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.store_name && (
                <Link to={`/store/${product.store_slug}`} className="no-underline">
                  <Tag color="volcano" icon={<ShopOutlined />} className="m-0 text-[11px] font-medium border-0 bg-orange-50 text-orange-600">
                    {product.store_name}
                  </Tag>
                </Link>
              )}
              {product.brand_name && (
                <Tag color="blue" className="m-0 text-[11px] border-0 bg-blue-50 text-blue-600">
                  {product.brand_name}
                </Tag>
              )}
            </div>

            {/* Title */}
            <Link to={`/product/${product.id}`} className="no-underline">
              <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 hover:text-orange-600 transition-colors h-10 leading-snug m-0">
                {product.name}
              </h3>
            </Link>

            {/* Rating & Stock */}
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Rate disabled defaultValue={Number(product.rating_avg) || 5} className="text-xs text-amber-400" />
                <span className="text-gray-500 text-[11px]">({product.rating_count || 0})</span>
              </div>
              <span className="text-[11px] text-gray-400">Kho: {product.stock}</span>
            </div>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-bold text-red-600">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Badge.Ribbon>
    </div>
  );
}
