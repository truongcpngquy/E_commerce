import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/useReduxHooks';
import { fetchCurrentUser, logoutUser } from './store/slices/authSlice';
import { fetchCategories } from './store/slices/productSlice';
import { fetchCart } from './store/slices/cartSlice';
import AppRoutes from './routes/AppRoutes';

function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    // Tải danh mục sản phẩm ngay khi khởi động
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser())
        .unwrap()
        .then(() => {
          dispatch(fetchCart());
        })
        .catch(() => {
          dispatch(logoutUser());
        });
    }
  }, [token, dispatch]);

  useEffect(() => {
    const handleLogout = () => {
      dispatch(logoutUser());
    };
    window.addEventListener('auth_logout', handleLogout);
    return () => {
      window.removeEventListener('auth_logout', handleLogout);
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
