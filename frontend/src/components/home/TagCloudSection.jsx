import React from 'react';
import { Tag, Button } from 'antd';
import { FireFilled, CloseOutlined } from '@ant-design/icons';

export default function TagCloudSection({ popularTags, selectedTag, onSelectTag, totalProductsCount }) {
  if (!popularTags || popularTags.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl p-7 mb-12 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FireFilled className="text-orange-500 text-lg animate-bounce" />
          <span className="font-bold text-sm text-gray-800">
            Thẻ Tag Thịnh Hành (Phân Loại Style & Công Nghệ):
          </span>
        </div>
        {selectedTag && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              Đang lọc: <strong className="text-orange-600">#{selectedTag}</strong> ({totalProductsCount} SP)
            </span>
            <Button
              type="text"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => onSelectTag(null)}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {popularTags.map((tagObj) => {
          const isSelected = selectedTag === tagObj.name;
          return (
            <Tag
              key={tagObj.id || tagObj.slug}
              color={isSelected ? 'volcano' : 'default'}
              className={`cursor-pointer px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                isSelected
                  ? 'font-bold shadow-sm scale-105 border-orange-500 bg-orange-500 text-white'
                  : 'hover:border-orange-400 hover:text-orange-600 bg-gray-50 border-gray-200 text-gray-700'
              }`}
              onClick={() => onSelectTag(isSelected ? null : tagObj.name)}
            >
              #{tagObj.name} {tagObj.usage_count != null && <span className="opacity-75 text-[10px]">({tagObj.usage_count})</span>}
            </Tag>
          );
        })}
      </div>
    </section>
  );
}
