import React, { useState } from 'react';
import { Avatar, Tag, Button, Rate, Badge } from 'antd';
import { SafetyCertificateFilled, UserAddOutlined, CheckOutlined, MessageOutlined, StarFilled, ClockCircleOutlined, MessageFilled, ShopOutlined } from '@ant-design/icons';

export default function StoreHeroBanner({ store }) {
  const [isFollowing, setIsFollowing] = useState(false);

  if (!store) return null;

  return (
    <div
      className="rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.5)), url(${store.banner_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200'})`
      }}
    >
      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Avatar Logo */}
          <div className="relative">
            <Avatar
              src={store.logo_url}
              size={90}
              className="border-4 border-white shadow-xl bg-white"
            />
            {store.is_official === 1 && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-white shadow">
                Mall
              </span>
            )}
          </div>

          {/* Store Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white m-0 drop-shadow">
                {store.name}
              </h1>
              {store.is_official === 1 && (
                <Tag color="error" icon={<SafetyCertificateFilled />} className="m-0 font-semibold px-2.5 py-0.5 rounded-full border-none bg-red-600 text-white">
                  Chính Hãng Shopee Mall
                </Tag>
              )}
            </div>

            <p className="text-xs md:text-sm text-white/85 max-w-2xl leading-relaxed mb-4">
              {store.description}
            </p>

            <div className="flex gap-3">
              <Button
                type={isFollowing ? 'default' : 'primary'}
                danger={!isFollowing}
                shape="round"
                icon={isFollowing ? <CheckOutlined /> : <UserAddOutlined />}
                onClick={() => setIsFollowing(!isFollowing)}
                className="font-semibold"
              >
                {isFollowing ? 'Đã Theo Dõi' : '+ Theo Dõi'}
              </Button>
              <Button
                type="default"
                ghost
                shape="round"
                icon={<MessageOutlined />}
                className="font-semibold border-white/50 text-white hover:border-white"
              >
                Chat Vừa Rồi
              </Button>
            </div>
          </div>
        </div>

        {/* Store Trust Metrics Bar */}
        <div className="flex items-center gap-6 bg-black/40 backdrop-blur-md p-3 px-5 rounded-xl border border-white/10 overflow-x-auto text-xs">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <ShopOutlined className="text-orange-400" />
            <span className="text-white/80">Sản phẩm:</span>
            <strong className="text-yellow-300 font-bold">{store.total_products || 0}</strong>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <StarFilled className="text-amber-400" />
            <span className="text-white/80">Đánh giá:</span>
            <strong className="text-yellow-300 font-bold">{store.rating_avg || '5.0'} / 5.0</strong>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <UserAddOutlined className="text-blue-400" />
            <span className="text-white/80">Người theo dõi:</span>
            <strong className="text-yellow-300 font-bold">{store.followers_count ? store.followers_count.toLocaleString() : '10,000+'}</strong>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <MessageFilled className="text-green-400" />
            <span className="text-white/80">Tỷ lệ phản hồi chat:</span>
            <strong className="text-yellow-300 font-bold">{store.response_rate || '99%'}</strong>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <ClockCircleOutlined className="text-purple-400" />
            <span className="text-white/80">Thời gian phản hồi:</span>
            <strong className="text-yellow-300 font-bold">{store.response_time || 'Trong vài phút'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
