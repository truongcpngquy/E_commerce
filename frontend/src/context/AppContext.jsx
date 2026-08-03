import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shopee_token') || null);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Gửi Toast thông báo
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Cấu hình Header chứa Token
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Xác thực User khi App load
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token expired');
          return res.json();
        })
        .then((data) => {
          setUser(data);
          fetchCart();
        })
        .catch(() => {
          logout();
        });
    }
    fetchCategories();
  }, [token]);

  // Lấy danh mục sản phẩm
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Lấy danh sách sản phẩm (có hỗ trợ Lazy Loading phân trang)
  const fetchProducts = async (filters = {}) => {
    const { category, search, limit = 20, offset = 0, paginated = false } = filters;
    let url = `${API_BASE_URL}/products?limit=${limit}&offset=${offset}`;
    if (category) url += `&category=${category}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (paginated) url += `&paginated=true`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      return paginated ? { products: [], total: 0, hasMore: false } : [];
    } catch (err) {
      console.error('Error fetching products:', err);
      return paginated ? { products: [], total: 0, hasMore: false } : [];
    }
  };

  const fetchProductById = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Error fetching product details:', err);
      return null;
    }
  };

  // Thêm mới sản phẩm (Seller)
  const createProduct = async (productData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Thêm sản phẩm thành công!');
        return { success: true };
      } else {
        showToast(data.message || 'Lỗi khi thêm sản phẩm', 'error');
        return { success: false };
      }
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
      return { success: false };
    }
  };

  // Lấy giỏ hàng
  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  // Thêm vào giỏ hàng
  const addToCart = async (productId, quantity = 1) => {
    if (!token) {
      showToast('Vui lòng đăng nhập để mua hàng!', 'error');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Đã thêm sản phẩm vào giỏ hàng!');
        fetchCart();
        // Track hành vi 'cart' (trọng số = 3)
        trackInteraction(productId, 'cart');
        return true;
      } else {
        showToast(data.message || 'Lỗi thêm vào giỏ hàng', 'error');
        return false;
      }
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
      return false;
    }
  };

  // Cập nhật số lượng giỏ hàng
  const updateCartQuantity = async (productId, quantity) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchCart();
        return true;
      } else {
        showToast(data.message || 'Lỗi cập nhật giỏ hàng', 'error');
        return false;
      }
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
      return false;
    }
  };

  // Xóa khỏi giỏ hàng
  const removeFromCart = async (productId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast('Đã xóa sản phẩm khỏi giỏ hàng!');
        fetchCart();
        return true;
      }
      return false;
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
      return false;
    }
  };

  // Đặt hàng
  const createOrder = async (shippingAddress) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ shipping_address: shippingAddress }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Đặt hàng thành công!');
        setCart([]);
        return { success: true, data };
      } else {
        showToast(data.message || 'Lỗi đặt hàng', 'error');
        return { success: false };
      }
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
      return { success: false };
    }
  };

  // Lấy đơn hàng
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error('Error fetching orders:', err);
      return [];
    }
  };

  // Recommendation APIs
  // 1. Lưu vết tương tác
  const trackInteraction = async (productId, type) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/recommendations/track`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ product_id: productId, interaction_type: type }),
      });
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  };

  // 2. Lấy gợi ý cá nhân hóa dựa trên content-based
  const getPersonalizedRecommendations = async (limit = 6) => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/personalized?limit=${limit}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error('Error getting personalized recommendations:', err);
      return [];
    }
  };

  // 3. Lấy sản phẩm tương tự (không yêu cầu đăng nhập)
  const getSimilarProducts = async (productId, limit = 5) => {
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/similar/${productId}?limit=${limit}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error('Error getting similar products:', err);
      return [];
    }
  };

  // Store Public APIs
  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stores`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error('Error fetching stores:', err);
      return [];
    }
  };

  const fetchStoreById = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${id}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Error fetching store info:', err);
      return null;
    }
  };

  const fetchStoreProducts = async (storeId, params = {}) => {
    const { category, q, sort = 'newest', limit = 8, offset = 0 } = params;
    let url = `${API_BASE_URL}/stores/${storeId}/products?limit=${limit}&offset=${offset}&sort=${sort}`;
    if (category) url += `&category=${category}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      return { products: [], total: 0, hasMore: false };
    } catch (err) {
      console.error('Error fetching store products:', err);
      return { products: [], total: 0, hasMore: false };
    }
  };

  // Đăng nhập
  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('shopee_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast('Đăng nhập thành công!');
        return { success: true };
      } else {
        showToast(data.message || 'Đăng nhập thất bại!', 'error');
        return { success: false };
      }
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
      return { success: false };
    }
  };

  // Đăng ký
  const signup = async (username, password, email, role) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        return { success: true };
      } else {
        showToast(data.message || 'Đăng ký thất bại!', 'error');
        return { success: false };
      }
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
      return { success: false };
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('shopee_token');
    setToken(null);
    setUser(null);
    setCart([]);
    showToast('Đăng xuất thành công!');
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        cart,
        cartCount,
        categories,
        toasts,
        searchQuery,
        setSearchQuery,
        showToast,
        fetchProducts,
        fetchProductById,
        createProduct,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        createOrder,
        fetchOrders,
        trackInteraction,
        getPersonalizedRecommendations,
        getSimilarProducts,
        fetchStores,
        fetchStoreById,
        fetchStoreProducts,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
