import axios from 'axios';
import axiosRetry from 'axios-retry';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Configure Exponential Backoff for Network Errors and 5xx
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 500;
  }
});

// Request Interceptor: Inject JWT and Idempotency Keys
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error reading token:", error);
  }

  // Auto-inject X-Idempotency-Key for POST/PUT/PATCH/DELETE
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    if (!config.headers['X-Idempotency-Key']) {
      config.headers['X-Idempotency-Key'] = uuid.v4().toString();
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and optionally dispatch to auth store to logout
      await AsyncStorage.removeItem('@auth_token');
      // window.location.reload() equivalent in React Native would be handled via auth context
    }
    return Promise.reject(error);
  }
);
