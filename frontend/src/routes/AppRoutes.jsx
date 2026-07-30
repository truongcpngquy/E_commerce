import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/customer/home/Home';
import ProductDetail from '../pages/customer/products/ProductDetail';
import Cart from '../pages/customer/my-shopping/Cart';
import Checkout from '../pages/customer/checkout/Checkout';
import Orders from '../pages/customer/my-orders/Orders';
import Auth from '../pages/auth/Auth';
import SellerDashboard from '../pages/customer/seller/SellerDashboard';
import StoreDetail from '../pages/customer/my-orders/StoreDetail';
import Profile from '../pages/customer/profile/Profile';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
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
        <Route path="/seller" element={
          <ProtectedRoute allowedRoles={['seller']}>
            <SellerDashboard />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
