import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartApi from '../../api/cartApi';
import { showToast } from './uiSlice';
import { trackUserInteraction } from './recommendationSlice';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const data = await cartApi.getCart();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải giỏ hàng');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }, { dispatch, rejectWithValue }) => {
    try {
      const data = await cartApi.addToCart(productId, quantity);
      dispatch(showToast('Đã thêm sản phẩm vào giỏ hàng!'));
      dispatch(fetchCart());
      // Track interaction (cart = weight 3)
      dispatch(trackUserInteraction({ productId, type: 'cart' }));
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi thêm vào giỏ hàng';
      dispatch(showToast(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { dispatch, rejectWithValue }) => {
    try {
      const data = await cartApi.updateCart(productId, quantity);
      dispatch(fetchCart());
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi cập nhật giỏ hàng';
      dispatch(showToast(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { dispatch, rejectWithValue }) => {
    try {
      const data = await cartApi.removeFromCart(productId);
      dispatch(showToast('Đã xóa sản phẩm khỏi giỏ hàng!'));
      dispatch(fetchCart());
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi xóa sản phẩm';
      dispatch(showToast(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cartItems: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.cartItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = action.payload || [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
