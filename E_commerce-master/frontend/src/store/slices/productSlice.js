import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productApi from '../../api/productApi';
import { showToast } from './uiSlice';

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (filters, { rejectWithValue }) => {
    try {
      if (filters?.search) {
        const data = await productApi.searchProducts(filters);
        return data;
      }
      const data = await productApi.getProducts(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải sản phẩm');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'product/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await productApi.getProductById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải chi tiết sản phẩm');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const data = await productApi.getCategories();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh mục');
    }
  }
);

export const createProduct = createAsyncThunk(
  'product/createProduct',
  async (productData, { dispatch, rejectWithValue }) => {
    try {
      const data = await productApi.createProduct(productData);
      dispatch(showToast(data.message || 'Thêm sản phẩm thành công!'));
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi khi thêm sản phẩm';
      dispatch(showToast(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState: {
    items: [],
    selectedProduct: null,
    categories: [],
    searchQuery: '',
    selectedCategory: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearProductDetails: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchCategories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { setSearchQuery, setSelectedCategory, clearProductDetails } = productSlice.actions;
export default productSlice.reducer;
