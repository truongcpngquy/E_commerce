import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Tag, Button } from 'antd';
import { ShopOutlined, SafetyCertificateFilled, StarFilled, UserAddOutlined, RightOutlined } from '@ant-design/icons';
import '../styles/store.css';

export default function StoreCardWidget({ store }) {
  if (!store) return null;

  const storeSlug = store.store_slug || store.slug;
  const storeName = store.store_name || store.name;
  const storeLogo = store.store_logo || store.logo_url;
  const isOfficial = store.store_is_official === 1 || store.is_official === 1;

  return (
    <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4 my-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <Link to={`/store/${storeSlug}`} className="relative block flex-shrink-0">
          <Avatar
            src={storeLogo || 'https://via.placeholder.com/60'}
            size={54}
            className="border-2 border-white shadow bg-white"
          />
          {isOfficial && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full border border-white">
              Mall
            </span>
          )}
        </Link>

        <div className="flex flex-col gap-1">
          <Link to={`/store/${storeSlug}`} className="no-underline flex items-center gap-2">
            <h4 className="font-bold text-base text-gray-800 hover:text-orange-600 transition-colors m-0">
              {storeName}
            </h4>
            {isOfficial && (
              <Tag color="error" icon={<SafetyCertificateFilled />} className="m-0 text-[10px] font-semibold px-2 py-0 border-none bg-red-600 text-white">
                Chính Hãng
              </Tag>
            )}
          </Link>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <StarFilled className="text-xs" /> {store.store_rating_avg || store.rating_avg || '5.0'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <UserAddOutlined /> {store.store_followers_count ? store.store_followers_count.toLocaleString() : '10,000+'} Người theo dõi
            </span>
          </div>
        </div>
      </div>

      <div>
        <Link to={`/store/${storeSlug}`} className="no-underline">
          <Button
            type="primary"
            danger
            ghost
            shape="round"
            icon={<ShopOutlined />}
            className="font-bold text-xs flex items-center gap-1"
          >
            Xem Shop <RightOutlined className="text-[10px]" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
