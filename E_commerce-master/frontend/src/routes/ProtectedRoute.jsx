import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useReduxHooks';
import { showToast } from '../store/slices/uiSlice';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (user && allowedRoles) {
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    const hasPermission = allowedRoles.some(r => userRoles.includes(r) || user.role === r);
    if (!hasPermission) {
      dispatch(showToast('Bạn không có quyền truy cập trang Kênh Người Bán này!', 'error'));
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
