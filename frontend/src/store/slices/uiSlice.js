import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
    globalLoading: false,
  },
  reducers: {
    addToast: (state, action) => {
      state.toasts.push(action.payload);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
  },
});

export const { addToast, removeToast, setGlobalLoading } = uiSlice.actions;

export const showToast = (message, type = 'success') => (dispatch) => {
  const id = Date.now();
  dispatch(addToast({ id, message, type }));
  setTimeout(() => {
    dispatch(removeToast(id));
  }, 3000);
};

export default uiSlice.reducer;
