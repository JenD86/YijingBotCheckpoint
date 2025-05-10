import { axiosAPI } from './axiosApi';

interface IChingQuestion {
  question: string;
  userId: string;  // Changed to string to match backend DTO
}

interface ExpandedAnswer {
  userId: string;  // Changed to string to match backend DTO
  hexagramId: string;
}

interface IChingResponse {
  hexagramId: string;
  basicReading: string;
  timestamp: Date;
}

export const ichingApi = {
  askQuestion: async (question: string, userId: number): Promise<IChingResponse> => {
    const response = await axiosAPI.post('/iching/ask', {
      question,
      userId: userId.toString()  // Convert number to string for backend
    });
    return response.data;
  },

  getExpandedReading: async (userId: number, hexagramId: string): Promise<any> => {
    const response = await axiosAPI.post('/iching/expand', {
      userId: userId.toString(),  // Convert number to string for backend
      hexagramId
    });
    return response.data;
  }
};