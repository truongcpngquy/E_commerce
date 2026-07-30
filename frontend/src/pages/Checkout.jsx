import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Checkout.css';

export default function Checkout() {
  const { cart, createOrder } = useApp();
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      alert('Vui lòng nhập địa chỉ giao hàng!');
      return;
    }

    setIsSubmitting(true);
    const res = await createOrder(shippingAddress);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/orders');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="checkout-page error-checkout fade-in">
        <h2>Bạn không có sản phẩm nào trong giỏ để thanh toán!</h2>
        <Link to="/" className="back-home-btn">Quay lại trang chủ mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page fade-in">
      <h1 className="page-title">Xác Nhận Thanh Toán</h1>
      
      <div className="checkout-layout">
        {/* Cột trái: Thông tin giao hàng */}
        <form onSubmit={handlePlaceOrder} className="checkout-delivery-card">
          <h3 className="card-section-title">Địa chỉ nhận hàng</h3>
          
          <div className="input-group-textarea">
            <label htmlFor="address">Địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)</label>
            <textarea
              id="address"
              rows="4"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Nhập địa chỉ giao hàng đầy đủ..."
              required
            ></textarea>
          </div>

          <div className="payment-method-box">
            <h4 className="method-title">Phương thức thanh toán</h4>
            <div className="method-options">
              <label className="method-option selected">
                <input type="radio" name="payment" defaultChecked />
                Thanh toán khi nhận hàng (COD)
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="place-order-submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý đặt hàng...' : 'Đặt hàng ngay'}
          </button>
        </form>

        {/* Cột phải: Xem trước đơn hàng */}
        <div className="checkout-preview-card">
          <h3 className="card-section-title">Chi tiết đơn hàng</h3>
          
          <div className="preview-items-list">
            {cart.map((item) => (
              <div key={item.product_id} className="preview-item">
                <img src={item.image_url} alt={item.name} className="preview-item-img" />
                <div className="preview-item-info">
                  <h4 className="preview-item-name">{item.name}</h4>
                  <span className="preview-item-qty">x{item.quantity}</span>
                </div>
                <span className="preview-item-price">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-totals">
            <div className="total-row-item">
              <span>Tổng tiền hàng:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <div className="total-row-item">
              <span>Phí vận chuyển:</span>
              <span className="shipping-free-label">Miễn phí</span>
            </div>
            
            <div className="totals-divider"></div>
            
            <div className="total-row-item final-total-row">
              <span>Tổng thanh toán:</span>
              <span className="final-price-value">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
