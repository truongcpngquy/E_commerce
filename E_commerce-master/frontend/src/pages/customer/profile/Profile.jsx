import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, Avatar, message, Spin, Tag, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, SolutionOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import userApi from '../../../api/userApi';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import '../../../styles/home.css';

export default function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await userApi.getProfile();
      setProfileData(res);
      form.setFieldsValue({
        full_name: res.full_name || '',
        gender: res.gender || 'male',
        date_of_birth: res.date_of_birth ? res.date_of_birth.split('T')[0] : '',
        phone: res.phone || '',
        city: res.city || '',
        district: res.district || '',
        price_sensitivity: res.price_sensitivity || 'mid-range',
      });
    } catch (err) {
      console.error('Lỗi tải profile:', err);
      message.error('Không thể tải thông tin cá nhân!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await userApi.updateProfile(values);
      message.success('Cập nhật thông tin profile thành công!');
      fetchProfileData();
    } catch (err) {
      console.error('Lỗi cập nhật profile:', err);
      message.error('Cập nhật thông tin thất bại!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Spin size="large" tip="Đang tải hồ sơ cá nhân..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 fade-in">
      <Card className="rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 bg-white">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100 flex-wrap">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            className="bg-orange-500 text-white font-bold border-4 border-orange-100 shadow"
          >
            {profileData?.full_name ? profileData.full_name.charAt(0).toUpperCase() : 'U'}
          </Avatar>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-800 m-0">
                {profileData?.full_name || currentUser?.username}
              </h1>
              <Tag color={currentUser?.role === 'seller' ? 'volcano' : 'blue'} className="font-semibold uppercase text-xs">
                {currentUser?.role === 'seller' ? 'Người Bán (Seller)' : 'Khách Hàng (Customer)'}
              </Tag>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-4 m-0">
              <span className="flex items-center gap-1"><MailOutlined /> {profileData?.email || currentUser?.email}</span>
              <span>•</span>
              <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircleOutlined /> Tài khoản đã xác thực</span>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <SolutionOutlined className="text-orange-500" /> Hồ Sơ Cá Nhân & Chỉnh Sửa Thông Tin
          </h2>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2"
          >
            <Form.Item
              name="full_name"
              label={<span className="font-semibold text-gray-700">Họ và tên</span>}
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nhập họ và tên..." size="large" className="rounded-xl" />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="font-semibold text-gray-700">Số điện thoại liên hệ</span>}
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
            >
              <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="0901234567" size="large" className="rounded-xl" />
            </Form.Item>

            <Form.Item
              name="gender"
              label={<span className="font-semibold text-gray-700">Giới tính</span>}
            >
              <Select size="large" className="rounded-xl">
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="date_of_birth"
              label={<span className="font-semibold text-gray-700">Ngày sinh</span>}
            >
              <Input type="date" size="large" className="rounded-xl" />
            </Form.Item>

            <Form.Item
              name="city"
              label={<span className="font-semibold text-gray-700">Tỉnh / Thành phố</span>}
            >
              <Input prefix={<HomeOutlined className="text-gray-400" />} placeholder="Hà Nội, TP.HCM..." size="large" className="rounded-xl" />
            </Form.Item>

            <Form.Item
              name="district"
              label={<span className="font-semibold text-gray-700">Quận / Huyện</span>}
            >
              <Input prefix={<HomeOutlined className="text-gray-400" />} placeholder="Đống Đa, Quận 1..." size="large" className="rounded-xl" />
            </Form.Item>

            <Form.Item
              name="price_sensitivity"
              label={<span className="font-semibold text-gray-700">Phân khúc chi tiêu cá nhân</span>}
              className="md:col-span-2"
            >
              <Select size="large" className="rounded-xl">
                <Select.Option value="budget">Tiết kiệm (Budget - Sản phẩm giá rẻ, sale)</Select.Option>
                <Select.Option value="mid-range">Tầm trung (Mid-range - Giá tốt, chất lượng)</Select.Option>
                <Select.Option value="premium">Cao cấp (Premium - Flagship, hàng hiệu chính hãng)</Select.Option>
              </Select>
            </Form.Item>

            <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <Button
                type="primary"
                danger
                size="large"
                shape="round"
                icon={<SaveOutlined />}
                loading={saving}
                htmlType="submit"
                className="font-bold px-8 shadow-md"
              >
                Lưu Thay Đổi Thông Tin
              </Button>
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
}
