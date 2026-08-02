import axiosClient from './axiosClient';

const userApi = {
  getProfile: () => {
    return axiosClient.get('/users/profile');
  },
  updateProfile: (data) => {
    return axiosClient.put('/users/profile', data);
  },
};

export default userApi;
