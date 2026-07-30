import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useReduxHooks';
import { createProduct } from '../store/slices/productSlice';
import { Link } from 'react-router-dom';
import { PlusCircle, Info, ShieldAlert } from 'lucide-react';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const categories = useAppSelector((state) => state.product.categories);
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc!');
      return;
    }

    const defaultImages = {
      1: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500', // Điện tử
      2: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', // Phụ kiện
      3: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500', // Nam
      4: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500', // Nữ
      5: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', // Gia dụng
    };

    const finalImageUrl = imageUrl.trim() || defaultImages[categoryId] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

    setIsSubmitting(true);
    const action = await dispatch(createProduct({
      name,
      description,
      price: Number(price),
      stock: Number(stock) || 0,
      image_url: finalImageUrl,
      category_id: Number(categoryId),
      tags: tags.toLowerCase(),
    }));
    setIsSubmitting(false);

    if (createProduct.fulfilled.match(action)) {
      // Clear form
      setName('');
      setPrice('');
      setStock('');
      setCategoryId('');
      setImageUrl('');
      setDescription('');
      setTags('');
    }
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="seller-dashboard error-seller fade-in">
        <ShieldAlert size={64} color="var(--primary-color)" />
        <h2>Quyền truy cập bị từ chối!</h2>
        <p>Tài khoản của bạn không có vai trò Người bán hàng (Seller).</p>
        <Link to="/" className="back-home-btn-redirect">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="seller-dashboard fade-in">
      <div className="dashboard-header">
        <h1 className="page-title">Kênh Người Bán Shopee</h1>
        <span className="seller-badge">Seller Portal</span>
      </div>

      <div className="dashboard-layout">
        {/* Form đăng bán sản phẩm */}
        <div className="product-upload-card">
          <h2 className="card-section-title">
            <PlusCircle size={20} className="icon-orange" />
            Đăng bán sản phẩm mới
          </h2>

          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-row-2">
              <div className="input-group">
                <label htmlFor="prod-name">Tên sản phẩm *</label>
                <input
                  type="text"
                  id="prod-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Bàn phím cơ AKKO 3098B"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="prod-category">Danh mục sản phẩm *</label>
                <select
                  id="prod-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label htmlFor="prod-price">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  id="prod-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Giá bán của sản phẩm..."
                  min="0"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="prod-stock">Số lượng trong kho</label>
                <input
                  type="number"
                  id="prod-stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Số lượng kho hàng..."
                  min="0"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="prod-img">Đường dẫn ảnh sản phẩm (Image URL)</label>
              <input
                type="text"
                id="prod-img"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Để trống nếu muốn tự động lấy ảnh Unsplash mẫu..."
              />
            </div>

            <div className="input-group">
              <label htmlFor="prod-tags">
                Tags phân tích gợi ý (Phân cách bằng dấu phẩy) *
              </label>
              <input
                type="text"
                id="prod-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ví dụ: laptop, gaming, asus, máy tính xách tay"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="prod-desc">Mô tả sản phẩm chi tiết</label>
              <textarea
                id="prod-desc"
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả các đặc điểm nổi bật, thông số kỹ thuật của sản phẩm..."
              ></textarea>
            </div>

            <button type="submit" className="upload-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tải lên sản phẩm...' : 'Đăng bán sản phẩm'}
            </button>
          </form>
        </div>

        {/* Hướng dẫn tags thuật toán */}
        <div className="recommendation-info-card">
          <h3 className="card-section-title">
            <Info size={18} className="icon-blue" />
            Về thuật toán Gợi ý (Content-Based)
          </h3>
          <div className="info-content">
            <p>Hệ thống của chúng tôi tự động hóa việc tính toán độ tương đồng giữa các sản phẩm để đưa ra gợi ý phù hợp nhất cho khách hàng.</p>
            
            <div className="info-tip">
              <strong>💡 Mẹo gán Tags hiệu quả:</strong>
              <ul>
                <li>Sử dụng các từ khóa phản ánh chính xác phân loại, thương hiệu và thuộc tính cốt lõi (ví dụ: <code>laptop, dell, xps, intel</code>).</li>
                <li>Các tags trùng khớp nhau giữa các sản phẩm sẽ trực tiếp tăng điểm tương đồng (Cosine Similarity).</li>
                <li>Hệ thống tự động loại bỏ các từ vô nghĩa (stop words) và chuẩn hóa chữ thường.</li>
              </ul>
            </div>

            <p className="info-footnote">Trang bị thông tin tags đầy đủ và mô tả rõ ràng sẽ giúp sản phẩm của bạn dễ dàng tiếp cận được tập khách hàng có nhu cầu tương thích cao!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
