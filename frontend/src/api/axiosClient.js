import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopee_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (!error.response) {
      // Network Error, Server offline, ECONNREFUSED
      const customError = new Error('Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra kết nối hoặc máy chủ backend (Port 5000).');
      customError.response = { data: { message: customError.message } };
      return Promise.reject(customError);
    }

    const { status, data } = error.response;

    if (status === 401) {
      localStorage.removeItem('shopee_token');
      // Dispatch standard event to trigger state logout in Redux
      window.dispatchEvent(new Event('auth_logout'));
    } else if (status === 403 && !data.message) {
      data.message = 'Bạn không có quyền thực hiện hành động này!';
    } else if (status === 404 && !data.message) {
      data.message = 'Không tìm thấy dữ liệu tài nguyên được yêu cầu.';
    } else if (status >= 500 && !data.message) {
      data.message = 'Lỗi máy chủ nội bộ (Server Error). Vui lòng thử lại sau.';
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
