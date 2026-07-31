import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import SellerLayout from './layouts/SellerLayout';
import ProtectedRoute from './ProtectedRoute';
import sellerApi from '../api/sellerApi';

import Home from '../pages/customer/home/Home';
import ProductDetail from '../pages/customer/products/ProductDetail';
import Cart from '../pages/customer/my-shopping/Cart';
import Checkout from '../pages/customer/checkout/Checkout';
import Orders from '../pages/customer/my-orders/Orders';
import Auth from '../pages/auth/Auth';
import SellerDashboard from '../pages/seller/SellerDashboard';
import StoreDetail from '../pages/customer/my-orders/StoreDetail';
import StoresList from '../pages/customer/stores/StoresList';
import Profile from '../pages/customer/profile/Profile';

export default function AppRoutes() {
  const [sellerActiveTab, setSellerActiveTab] = useState('overview');
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [storesList, setStoresList] = useState([]);

  const loadStoresData = async () => {
    try {
      const stores = await sellerApi.getStores();
      setStoresList(stores || []);
      // Mặc định nếu có stores và chưa chọn, có thể giữ 'all' hoặc store đầu tiên
    } catch (err) {
      console.error('Lỗi tải danh sách cửa hàng của người bán:', err);
    }
  };

  return (
    <Routes>
      {/* Customer Layout Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/store" element={<StoresList />} />
        <Route path="/stores" element={<StoresList />} />
        <Route path="/store/:slug" element={<StoreDetail />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/auth" element={<Auth />} />
      </Route>

      {/* Seller Portal Dedicated Layout Route */}
      <Route path="/seller" element={
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerLayout
            activeTab={sellerActiveTab}
            setActiveTab={setSellerActiveTab}
            selectedStoreId={selectedStoreId}
            setSelectedStoreId={setSelectedStoreId}
            storesList={storesList}
            setStoresList={setStoresList}
            loadStoresData={loadStoresData}
          >
            <SellerDashboard
              activeTab={sellerActiveTab}
              setActiveTab={setSellerActiveTab}
              selectedStoreId={selectedStoreId}
              setSelectedStoreId={setSelectedStoreId}
              storesList={storesList}
              loadStoresData={loadStoresData}
            />
          </SellerLayout>
        </ProtectedRoute>
      }>
        <Route index element={
          <SellerDashboard
            activeTab={sellerActiveTab}
            setActiveTab={setSellerActiveTab}
            selectedStoreId={selectedStoreId}
            setSelectedStoreId={setSelectedStoreId}
            storesList={storesList}
            loadStoresData={loadStoresData}
          />
        } />
      </Route>
    </Routes>
  );
}
