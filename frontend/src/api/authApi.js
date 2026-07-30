import axiosClient from './axiosClient';

const authApi = {
  login: (username, password) => {
    return axiosClient.post('/auth/login', { username, password });
  },
  signup: (username, password, email, role) => {
    return axiosClient.post('/auth/signup', { username, password, email, role });
  },
  getMe: () => {
    return axiosClient.get('/auth/me');
  },
};

export default authApi;
