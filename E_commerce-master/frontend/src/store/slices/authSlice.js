import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../../api/authApi';
import { showToast } from './uiSlice';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { dispatch, rejectWithValue }) => {
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('shopee_token', data.token);
      dispatch(showToast('Đăng nhập thành công!'));
      return data; // { token, user }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại!';
      dispatch(showToast(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async ({ username, password, email, role }, { dispatch, rejectWithValue }) => {
    try {
      const data = await authApi.signup(username, password, email, role);
      dispatch(showToast('Đăng ký tài khoản thành công! Vui lòng đăng nhập.'));
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại!';
      dispatch(showToast(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.getMe();
      return data; // user object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Token expired');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('shopee_token') || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    logoutUser: (state) => {
      localStorage.removeItem('shopee_token');
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { logoutUser } = authSlice.actions;
export default authSlice.reducer;
