import React from 'react';
import { Tag, Button } from 'antd';
import { ThunderboltFilled, ArrowRightOutlined, RocketOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

export default function BannerSection() {
  return (
    <section className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-2xl p-10 md:p-12 text-white shadow-lg mb-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
      <div className="max-w-xl z-10">
        <Tag color="volcano" className="bg-white/20 text-white border-none px-3 py-1 rounded-full text-xs font-semibold mb-3 inline-flex items-center gap-1">
          <ThunderboltFilled className="text-yellow-300" /> Smart AI Shopping Engine v4.0
        </Tag>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white leading-tight">
          Gợi Ý Thông Minh Theo Sở Thích Cá Nhân & Gian Hàng Shopee Mall
        </h1>
        <p className="text-white/90 text-sm md:text-base mb-6 leading-relaxed">
          Trải nghiệm mua sắm mượt mà với thuật toán AI Content-based Recommendation, tìm kiếm linh hoạt theo nhiều Tag và khám phá 8+ Gian hàng chính hãng ủy quyền.
        </p>
        <div className="flex gap-3">
          <Button type="primary" size="large" shape="round" className="bg-white text-orange-600 hover:bg-orange-50 font-bold border-none shadow-md flex items-center gap-2">
            <Link to="/store/apple-official-store" className="no-underline text-orange-600">
              Khám phá Shopee Mall <ArrowRightOutlined />
            </Link>
          </Button>
        </div>
      </div>

      <div className="hidden md:block w-64 flex-shrink-0 z-10">
        <img
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500"
          alt="Smart E-Commerce Banner"
          className="rounded-xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-300 object-cover h-48 w-full border-2 border-white/30"
        />
      </div>

      {/* Background Decorative Circles */}
      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none"></div>
    </section>
  );
}
