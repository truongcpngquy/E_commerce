import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Tag, Avatar, Badge } from 'antd';
import { SafetyCertificateOutlined, StarFilled, ArrowRightOutlined, ShopOutlined } from '@ant-design/icons';

export default function OfficialStoresSection({ officialStores }) {
  if (!officialStores || officialStores.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-red-50 to-orange-50/40 rounded-2xl p-8 mb-12 border border-red-100 shadow-sm">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <SafetyCertificateOutlined className="text-red-600 text-2xl" />
          <h2 className="text-lg font-bold text-red-600 m-0">
            Shopee Mall — Gian Hàng Chính Hãng Nổi Bật
          </h2>
        </div>
        <Tag color="error" className="m-0 font-semibold px-3 py-1 rounded-full border-red-200">
          100% Hàng Chính Hãng • Miễn Phí Đổi Trả
        </Tag>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {officialStores.map((st) => (
          <Link key={st.id} to={`/store/${st.slug}`} className="no-underline group">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-red-500 transition-all duration-300 flex flex-col h-full">
              {/* Cover Header */}
              <div
                className="h-20 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${st.banner_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'})` }}
              >
                <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Mall
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col items-center text-center -mt-7 relative flex-1">
                <Avatar
                  src={st.logo_url}
                  size={52}
                  className="border-2 border-white shadow-md bg-white mb-2"
                />
                <h3 className="font-bold text-sm text-gray-800 group-hover:text-red-600 transition-colors line-clamp-1 m-0">
                  {st.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 my-2">
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <StarFilled className="text-xs" /> {st.rating_avg || '5.0'}
                  </span>
                  <span>•</span>
                  <span>{st.total_products || 0} sản phẩm</span>
                </div>
                <span className="mt-auto text-xs font-bold text-red-600 bg-red-50 group-hover:bg-red-600 group-hover:text-white px-3 py-1 rounded-full transition-all flex items-center gap-1">
                  Vào Shop <ArrowRightOutlined className="text-[10px]" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
