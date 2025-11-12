import axios, { AxiosHeaders } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { useAuthContext } from '../context/AuthContext';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : AxiosHeaders.from(config.headers ?? {});
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

export const attachAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const detachAuthToken = () => {
  localStorage.removeItem('auth_token');
};

export const useApiWithAuth = () => {
  const { user } = useAuthContext();
  return {
    client: apiClient,
    token: user?.token
  };
};
