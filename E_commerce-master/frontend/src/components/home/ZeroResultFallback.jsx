import React from 'react';
import { Empty, Button } from 'antd';
import { SearchOutlined, LikeOutlined, RocketOutlined } from '@ant-design/icons';
import ProductCard from '../product/ProductCard';

export default function ZeroResultFallback({ searchQuery, fallbackProducts, onClearSearch }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-orange-100 shadow-sm my-6 text-center">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 m-0">
              Không tìm thấy sản phẩm nào cho từ khóa "{searchQuery}"
            </h3>
            <p className="text-xs text-gray-500 m-0">
              Hãy kiểm tra lại chính tả hoặc thử tìm kiếm bằng các từ khóa phổ biến hơn (VD: iphone, samsung, macbook, tai nghe, giày, đồng hồ...)
            </p>
          </div>
        }
      >
        <Button type="primary" danger shape="round" icon={<SearchOutlined />} onClick={onClearSearch} className="font-semibold">
          Xóa Từ Khóa & Xem Tất Cả Sản Phẩm
        </Button>
      </Empty>

      {/* Shopee-style Recommended Products Grid */}
      {fallbackProducts && fallbackProducts.length > 0 && (
        <div className="mt-10 pt-8 border-t border-gray-100 text-left">
          <div className="flex items-center gap-2 mb-6">
            <RocketOutlined className="text-orange-500 text-xl" />
            <h3 className="text-base font-bold text-gray-800 m-0">
              Có thể bạn cũng thích — Sản phẩm bán chạy nổi bật nhất
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {fallbackProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
