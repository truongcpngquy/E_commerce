import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderApi from '../../api/orderApi';
import { clearCart } from './cartSlice';
import { showToast } from './uiSlice';

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const data = await orderApi.getOrders();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh sách đơn hàng');
    }
  }
);

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (shippingAddress, { dispatch, rejectWithValue }) => {
    try {
      const data = await orderApi.createOrder(shippingAddress);
      dispatch(showToast('Đặt hàng thành công!'));
      dispatch(clearCart());
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi đặt hàng';
      dispatch(showToast(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default orderSlice.reducer;
