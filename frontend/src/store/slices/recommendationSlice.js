import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import recommendationApi from '../../api/recommendationApi';

export const fetchPersonalizedRecommendations = createAsyncThunk(
  'recommendation/fetchPersonalized',
  async (limit, { rejectWithValue }) => {
    try {
      const data = await recommendationApi.getPersonalizedRecommendations(limit);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải gợi ý cá nhân hóa');
    }
  }
);

export const fetchSimilarProducts = createAsyncThunk(
  'recommendation/fetchSimilar',
  async ({ productId, limit }, { rejectWithValue }) => {
    try {
      const data = await recommendationApi.getSimilarProducts(productId, limit);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải sản phẩm tương tự');
    }
  }
);

export const trackUserInteraction = createAsyncThunk(
  'recommendation/trackInteraction',
  async ({ productId, type }, { rejectWithValue }) => {
    try {
      const data = await recommendationApi.trackInteraction(productId, type);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi lưu tương tác');
    }
  }
);

const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState: {
    personalizedList: [],
    similarList: [],
    loadingPersonalized: false,
    loadingSimilar: false,
    error: null,
  },
  reducers: {
    clearRecommendations: (state) => {
      state.personalizedList = [];
      state.similarList = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Personalized
      .addCase(fetchPersonalizedRecommendations.pending, (state) => {
        state.loadingPersonalized = true;
      })
      .addCase(fetchPersonalizedRecommendations.fulfilled, (state, action) => {
        state.loadingPersonalized = false;
        state.personalizedList = action.payload || [];
      })
      .addCase(fetchPersonalizedRecommendations.rejected, (state, action) => {
        state.loadingPersonalized = false;
        state.error = action.payload;
      })
      // Similar
      .addCase(fetchSimilarProducts.pending, (state) => {
        state.loadingSimilar = true;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.loadingSimilar = false;
        state.similarList = action.payload || [];
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        state.loadingSimilar = false;
        state.error = action.payload;
      });
  },
});

export const { clearRecommendations } = recommendationSlice.actions;
export default recommendationSlice.reducer;
