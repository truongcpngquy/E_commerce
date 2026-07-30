import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Package, Clock, ShieldAlert } from 'lucide-react';
import './Orders.css';

export default function Orders() {
  const { fetchOrders, token } = useApp();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (token) {
        setIsLoading(true);
        const data = await fetchOrders();
        setOrders(data);
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [token]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: 'Chờ xác nhận', class: 'status-pending' },
      processing: { text: 'Đang xử lý', class: 'status-processing' },
      shipping: { text: 'Đang giao hàng', class: 'status-shipping' },
      completed: { text: 'Hoàn thành', class: 'status-completed' },
      cancelled: { text: 'Đã hủy', class: 'status-cancelled' }
    };
    return labels[status] || { text: status, class: '' };
  };

  if (!token) {
    return (
      <div className="orders-page error-orders fade-in">
        <ShieldAlert size={64} color="var(--primary-color)" />
        <h2>Vui lòng đăng nhập để xem lịch sử mua hàng!</h2>
        <Link to="/auth" className="login-btn-redirect">Đăng nhập ngay</Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading-spinner">Đang tải lịch sử đơn hàng...</div>;
  }

  return (
    <div className="orders-page fade-in">
      <h1 className="page-title">Đơn Mua Của Bạn</h1>

      {orders.length === 0 ? (
        <div className="empty-orders-card">
          <Package size={50} color="var(--text-light)" />
          <h3>Chưa có đơn hàng nào</h3>
          <p>Lịch sử đơn hàng của bạn sẽ xuất hiện ở đây sau khi bạn đặt mua sản phẩm.</p>
          <Link to="/" className="continue-shopping-btn">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const statusInfo = getStatusLabel(order.status);
            return (
              <div key={order.id} className="order-card">
                {/* Header đơn hàng */}
                <div className="order-card-header">
                  <div className="order-meta-info">
                    <span className="order-id">Mã đơn hàng: <strong>#{order.id}</strong></span>
                    <span className="order-date">
                      Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`status-badge ${statusInfo.class}`}>
                    <Clock size={14} />
                    {statusInfo.text}
                  </span>
                </div>

                {/* Danh sách sản phẩm trong đơn */}
                <div className="order-card-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-detail">
                      <img src={item.image_url} alt={item.name} className="order-item-img" />
                      <div className="order-item-info">
                        <h4 className="order-item-name">{item.name}</h4>
                        <span className="order-item-qty">Số lượng: x{item.quantity}</span>
                      </div>
                      <span className="order-item-price">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer đơn hàng */}
                <div className="order-card-footer">
                  <div className="shipping-address-info">
                    Địa chỉ nhận hàng: <strong>{order.shipping_address}</strong>
                  </div>
                  <div className="order-total-price">
                    Thành tiền: <span className="total-val">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
