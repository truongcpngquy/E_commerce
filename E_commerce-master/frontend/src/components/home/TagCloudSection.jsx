import React, { useEffect, useState } from 'react';
import { Tag, Button, Spin } from 'antd';
import { FireFilled, CloseOutlined, ThunderboltFilled } from '@ant-design/icons';
import productApi from '../../api/productApi';

export default function TagCloudSection({ popularTags, selectedTag, onSelectTag, selectedCategory, categories = [], totalProductsCount }) {
  const [displayTags, setDisplayTags] = useState(popularTags || []);
  const [loadingTags, setLoadingTags] = useState(false);

  // Sync / fetch tags when selectedCategory changes
  useEffect(() => {
    if (selectedCategory) {
      setLoadingTags(true);
      productApi.getTagsByCategory(selectedCategory)
        .then((res) => {
          setDisplayTags(res || []);
        })
        .catch(() => {
          setDisplayTags(popularTags || []);
        })
        .finally(() => {
          setLoadingTags(false);
        });
    } else {
      setDisplayTags(popularTags || []);
    }
  }, [selectedCategory, popularTags]);

  const activeCategoryObj = categories.find(c => String(c.id) === String(selectedCategory));

  if (!displayTags || displayTags.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl p-6 mb-10 border border-gray-100 shadow-sm transition-all">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          {selectedCategory ? (
            <ThunderboltFilled className="text-amber-500 text-lg animate-pulse" />
          ) : (
            <FireFilled className="text-orange-500 text-lg animate-bounce" />
          )}
          <span className="font-bold text-sm text-gray-800">
            {activeCategoryObj ? (
              <span>
                Thẻ Tag Phù Hợp Danh Mục: <strong className="text-orange-600">[{activeCategoryObj.name}]</strong>
              </span>
            ) : (
              'Thẻ Tag Phổ Biến (Tối Ưu Gợi Ý AI Content-Based):'
            )}
          </span>
        </div>

        {selectedTag && (
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            <span className="text-xs text-gray-700 font-medium">
              Đang lọc: <strong className="text-orange-600">#{selectedTag}</strong> ({totalProductsCount} SP)
            </span>
            <Button
              type="text"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => onSelectTag(null)}
              className="text-xs font-bold"
            >
              Xóa lọc
            </Button>
          </div>
        )}
      </div>

      {loadingTags ? (
        <div className="py-4 text-center text-xs text-gray-400">
          <Spin size="small" /> Đang cập nhật danh sách thẻ Tag theo danh mục...
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tagObj) => {
            const isSelected = selectedTag === tagObj.name;
            return (
              <Tag
                key={tagObj.id || tagObj.slug || tagObj.name}
                color={isSelected ? 'volcano' : 'default'}
                className={`cursor-pointer px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                  isSelected
                    ? 'font-bold shadow-md scale-105 border-orange-500 bg-orange-500 text-white'
                    : 'hover:border-orange-400 hover:text-orange-600 bg-gray-50 border-gray-200 text-gray-700'
                }`}
                onClick={() => onSelectTag(isSelected ? null : tagObj.name)}
              >
                #{tagObj.name} {tagObj.usage_count != null && <span className="opacity-75 text-[10px]">({tagObj.usage_count})</span>}
              </Tag>
            );
          })}
        </div>
      )}
    </section>
  );
}
