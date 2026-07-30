import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { fetchOrders } from '../../../store/slices/orderSlice';
import { Link } from 'react-router-dom';
import { Modal, Button, Tag, Badge, message, QRCode } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined, ClockCircleOutlined, ShoppingOutlined, SafetyCertificateOutlined, CopyOutlined } from '@ant-design/icons';
import orderApi from '../../../api/orderApi';
import '../../../styles/home.css';

export default function Orders() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const orders = useAppSelector((state) => state.order.orders);
  const isLoading = useAppSelector((state) => state.order.loading);

  const [selectedOrderForQR, setSelectedOrderForQR] = useState(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(fetchOrders());
    }
  }, [token, dispatch]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: 'Chờ thanh toán / Chờ xác nhận', color: 'warning' },
      processing: { text: 'Đang xử lý', color: 'processing' },
      shipping: { text: 'Đang giao hàng', color: 'blue' },
      completed: { text: 'Đã thanh toán (Hoàn thành)', color: 'success' },
      cancelled: { text: 'Đã hủy', color: 'error' }
    };
    return labels[status] || { text: status, color: 'default' };
  };

  const handleOpenQRModal = (order) => {
    setSelectedOrderForQR(order);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrderForQR) return;
    setUpdatingPayment(true);
    try {
      await orderApi.updateOrderStatus(selectedOrderForQR.id, {
        status: 'completed',
        payment_method: 'qr_code_momo_bank'
      });
      message.success(`Đơn hàng #${selectedOrderForQR.id} đã chuyển trạng thái sang ĐÃ THANH TOÁN (HOÀN THÀNH)!`);
      setSelectedOrderForQR(null);
      dispatch(fetchOrders());
    } catch (err) {
      console.error('Lỗi thanh toán QR:', err);
      message.error('Cập nhật trạng thái đơn hàng thất bại!');
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl text-center shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Vui lòng đăng nhập để xem lịch sử mua hàng!</h2>
        <Link to="/auth">
          <Button type="primary" danger shape="round">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2">
          <ShoppingOutlined className="text-orange-500" /> Đơn Mua Của Bạn ({orders.length})
        </h1>
        <Link to="/">
          <Button type="default" shape="round">Tiếp tục mua sắm</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500 mb-6">Bạn chưa có đơn hàng nào trong hệ thống.</p>
          <Link to="/">
            <Button type="primary" danger shape="round">Khám phá sản phẩm ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const statusInfo = getStatusLabel(order.status);
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800 text-sm">Mã đơn: #{order.id}</span>
                    <span className="text-xs text-gray-400">
                      • {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <Tag color={statusInfo.color} className="font-semibold text-xs px-3 py-0.5 rounded-full m-0">
                    {statusInfo.text}
                  </Tag>
                </div>

                {/* Items */}
                <div className="py-4 flex flex-col gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-800 m-0 line-clamp-1">{item.product_name}</h4>
                        <span className="text-xs text-gray-500">Số lượng: x{item.quantity}</span>
                      </div>
                      <span className="font-bold text-sm text-gray-800">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                  <div className="text-xs text-gray-500">
                    Địa chỉ nhận hàng: <strong className="text-gray-700">{order.shipping_address}</strong>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Thành tiền: <strong className="text-xl text-red-600 font-extrabold">{formatPrice(order.total_amount)}</strong>
                    </div>

                    {order.status !== 'completed' && (
                      <Button
                        type="primary"
                        danger
                        shape="round"
                        icon={<QrcodeOutlined />}
                        onClick={() => handleOpenQRModal(order)}
                        className="font-bold bg-orange-600 hover:bg-orange-700"
                      >
                        Thanh toán ngay (QR Code)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP HOÀN THÀNH / THANH TOÁN QR CODE VIETQR */}
      <Modal
        open={Boolean(selectedOrderForQR)}
        onCancel={() => setSelectedOrderForQR(null)}
        footer={null}
        centered
        width={500}
        title={
          <div className="flex items-center gap-2 text-red-600 font-bold text-base border-b pb-3">
            <QrcodeOutlined className="text-xl" /> Cổng Thanh Toán QR Code (VietQR / MoMo / MBBank)
          </div>
        }
      >
        {selectedOrderForQR && (
          <div className="py-4 text-center">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-4 inline-block shadow-sm">
              <QRCode
                value={`https://api.vietqr.io/image/970422-0901234567-compact2.png?amount=${selectedOrderForQR.total_amount}&addInfo=THANH TOAN DON HANG ${selectedOrderForQR.id}`}
                size={200}
                icon="https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Logo_MB_new.svg/200px-Logo_MB_new.svg.png"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-left text-xs text-gray-700 space-y-2 mb-6 border border-gray-200">
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500">Ngân Hàng:</span>
                <strong className="text-blue-700 font-bold">MBBank (Ngân Hàng Quân Đội)</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500">Số tài khoản:</span>
                <strong className="text-gray-900 font-bold font-mono">0901234567</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500">Chủ tài khoản:</span>
                <strong className="text-gray-900 font-bold">SMART E-COMMERCE VIETNAM</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500">Số tiền cần trả:</span>
                <strong className="text-red-600 font-bold text-sm">{formatPrice(selectedOrderForQR.total_amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nội dung CK:</span>
                <strong className="text-orange-600 font-bold">THANH TOAN DON HANG #{selectedOrderForQR.id}</strong>
              </div>
            </div>

            <Button
              type="primary"
              danger
              size="large"
              block
              shape="round"
              icon={<CheckCircleOutlined />}
              loading={updatingPayment}
              onClick={handleConfirmPayment}
              className="font-bold bg-green-600 hover:bg-green-700 border-none h-12 shadow-md"
            >
              Xác Nhận Đã Chuyển Khoản (Cập Nhật Hoàn Thành Ngay)
            </Button>
            <p className="text-[11px] text-gray-400 mt-2">
              * Nhấn nút để hệ thống xác nhận thanh toán & tự động cập nhật trạng thái đơn hàng hoàn thành.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
