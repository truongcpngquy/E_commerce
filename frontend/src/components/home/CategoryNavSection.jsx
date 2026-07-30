import React from 'react';
import { Tag, Badge, Button } from 'antd';
import { AppstoreOutlined, CloseCircleOutlined } from '@ant-design/icons';

export default function CategoryNavSection({ categories, selectedCategory, onSelectCategory }) {
  const rootCategories = categories.filter(c => c.level === 1 || !c.parent_id);
  const subCategories = categories.filter(c => (c.level === 2 || c.parent_id) && (!selectedCategory || c.parent_id === selectedCategory || c.id === selectedCategory));

  return (
    <section className="bg-white rounded-2xl p-8 mb-12 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 m-0">
          <AppstoreOutlined className="text-orange-500 text-xl" />
          Danh Mục Sản Phẩm Hệ Thống
        </h2>
        {selectedCategory && (
          <Button
            type="link"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => onSelectCategory(null)}
            className="text-xs font-semibold"
          >
            Bỏ chọn danh mục
          </Button>
        )}
      </div>

      {/* Root Categories Bar */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        <div
          className={`flex flex-col items-center justify-center p-3 min-w-[100px] rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedCategory === null
              ? 'border-orange-500 bg-orange-50/70 font-bold text-orange-600 shadow-sm'
              : 'border-gray-200 bg-white hover:border-orange-300 text-gray-700'
          }`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="text-2xl mb-1">🌐</span>
          <span className="text-xs font-medium">Tất cả</span>
        </div>

        {rootCategories.map((cat) => (
          <div
            key={cat.id}
            className={`flex flex-col items-center justify-center p-3 min-w-[120px] rounded-xl border cursor-pointer transition-all duration-200 relative ${
              selectedCategory === cat.id
                ? 'border-orange-500 bg-orange-50/70 font-bold text-orange-600 shadow-sm'
                : 'border-gray-200 bg-white hover:border-orange-300 text-gray-700'
            }`}
            onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <img src={cat.image_url} alt={cat.name} className="w-11 h-11 object-cover rounded-full mb-1 border border-gray-100" />
            <span className="text-xs text-center line-clamp-1 font-medium">{cat.name}</span>
            {cat.product_count != null && (
              <span className="text-[10px] text-gray-400 font-normal">({cat.product_count})</span>
            )}
          </div>
        ))}
      </div>

      {/* Subcategories Chips (Level 2) */}
      {subCategories.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 mr-1">Phân loại chi tiết:</span>
          {subCategories.map((subCat) => (
            <Tag
              key={subCat.id}
              color={selectedCategory === subCat.id ? 'volcano' : 'default'}
              className={`cursor-pointer px-3 py-1 rounded-full text-xs transition-all ${
                selectedCategory === subCat.id ? 'font-bold border-orange-500' : 'hover:border-orange-300'
              }`}
              onClick={() => onSelectCategory(selectedCategory === subCat.id ? null : subCat.id)}
            >
              {subCat.name} {subCat.product_count != null && `(${subCat.product_count})`}
            </Tag>
          ))}
        </div>
      )}
    </section>
  );
}
