import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { updateCartItem, removeFromCart } from '../../../store/slices/cartSlice';
import { Trash2, ShoppingBag } from 'lucide-react';
import ConfirmModal from '../../../components/common/ConfirmModal';
import './Cart.css';

export default function Cart() {
  const cart = useAppSelector((state) => state.cart.cartItems);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [deletingProductId, setDeletingProductId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleQuantityChange = async (productId, currentQty, stock, change) => {
    const newQty = currentQty + change;
    if (newQty >= 1 && newQty <= stock) {
      await dispatch(updateCartItem({ productId, quantity: newQty }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    await dispatch(removeFromCart(deletingProductId));
    setIsDeleting(false);
    setDeletingProductId(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="cart-page empty-cart fade-in">
        <div className="empty-cart-card">
          <ShoppingBag size={64} className="empty-cart-icon" />
          <h2>Giỏ hàng của bạn còn trống</h2>
          <p>Hãy duyệt qua hàng ngàn sản phẩm của Shopee và thêm chúng vào giỏ hàng nhé!</p>
          <Link to="/" className="shop-now-btn">Mua sắm ngay</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page fade-in">
      <h1 className="page-title">Giỏ Hàng Của Bạn</h1>
      
      <div className="cart-layout">
        {/* Cột trái: Danh sách item */}
        <div className="cart-items-list">
          <div className="cart-header-row">
            <span className="col-product">Sản phẩm</span>
            <span className="col-price">Đơn giá</span>
            <span className="col-qty">Số lượng</span>
            <span className="col-total">Số tiền</span>
            <span className="col-action">Thao tác</span>
          </div>

          {cart.map((item) => (
            <div key={item.product_id} className="cart-item-row">
              {/* Thông tin sản phẩm */}
              <div className="col-product product-item-info">
                <img src={item.image_url} alt={item.name} className="cart-item-img" />
                <Link to={`/product/${item.product_id}`} className="cart-item-name">
                  {item.name}
                </Link>
              </div>

              {/* Đơn giá */}
              <div className="col-price cart-item-price">
                {formatPrice(item.price)}
              </div>

              {/* Bộ điều khiển số lượng */}
              <div className="col-qty">
                <div className="quantity-controller">
                  <button 
                    onClick={() => handleQuantityChange(item.product_id, item.quantity, item.stock, -1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <input type="text" value={item.quantity} readOnly />
                  <button 
                    onClick={() => handleQuantityChange(item.product_id, item.quantity, item.stock, 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Tổng giá trị item */}
              <div className="col-total cart-item-total-price">
                {formatPrice(item.price * item.quantity)}
              </div>

              {/* Nút xóa */}
              <div className="col-action">
                <button 
                  onClick={() => setDeletingProductId(item.product_id)}
                  className="delete-item-btn"
                  title="Xóa sản phẩm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cột phải: Tổng thanh toán */}
        <div className="cart-summary-card">
          <h3 className="summary-title">Thanh toán đơn hàng</h3>
          
          <div className="summary-row">
            <span>Tổng tiền hàng:</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span className="shipping-free">Miễn phí</span>
          </div>

          <div className="summary-total-divider"></div>

          <div className="summary-row total-row">
            <span>Tổng thanh toán:</span>
            <span className="final-total">{formatPrice(totalAmount)}</span>
          </div>

          <button 
            onClick={() => navigate('/checkout')}
            className="checkout-btn"
          >
            Mua hàng ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </button>
        </div>
      </div>

      {/* Modal xác nhận xóa sản phẩm khỏi giỏ */}
      <ConfirmModal
        isOpen={Boolean(deletingProductId)}
        title="Xóa sản phẩm khỏi giỏ hàng"
        message="Bạn có chắc chắn muốn xóa sản phẩm này ra khỏi giỏ hàng của bạn không?"
        confirmText="Xóa sản phẩm"
        cancelText="Hủy bỏ"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProductId(null)}
      />
    </div>
  );
}
