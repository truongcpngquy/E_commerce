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

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    dispatch(showToast('Bạn không có quyền truy cập trang này!', 'error'));
    return <Navigate to="/" replace />;
  }

  return children;
}
