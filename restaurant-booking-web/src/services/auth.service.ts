import { apiClient, attachAuthToken, detachAuthToken } from './api';
import { User } from '../types';

type LoginPayload = {
  email: string;
  password: string;
};

export const authService = {
  async login(payload: LoginPayload): Promise<User> {
    const { data } = await apiClient.post<{ data: User }>('auth/login', payload);
    if (data.data.token) {
      attachAuthToken(data.data.token);
    }
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('auth/logout');
    detachAuthToken();
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<{ data: User }>('auth/me');
    return data.data;
  }
};
