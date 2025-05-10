import axios from 'axios';
import { axiosAPI } from './axiosApi';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export const verifyTelegramAuth = async (initData: string): Promise<boolean> => {
  try {
    const response = await axiosAPI.get('/auth/verify', {
      params: { initData },
    });
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AuthenticationError(
        error.response?.data?.message || 'Authentication failed'
      );
    }
    throw new AuthenticationError('Unexpected error during authentication');
  }
};