import { axiosAPI } from './axiosApi';

interface UserResponse {
  id: number;
  username: string;
  points: number;
}

interface PointsResponse {
  username: string;
  points: number;
}

export const userApi = {
  getUser: async (username: string): Promise<UserResponse> => {
    const response = await axiosAPI.get(`/user/${username}`);
    return response.data;
  },

  addPoints: async (username: string, points: number): Promise<PointsResponse> => {
    const response = await axiosAPI.post(`/user/${username}/addPoints`, { points });
    return response.data;
  },

  addRandomPoints: async (username: string): Promise<PointsResponse> => {
    const response = await axiosAPI.post(`/user/${username}/addRandomPoints`);
    return response.data;
  },

  convertPoints: async (username: string, conversionRate: number): Promise<{ message: string }> => {
    const response = await axiosAPI.post(`/user/${username}/convertPoints`, { conversionRate });
    return response.data;
  }
};