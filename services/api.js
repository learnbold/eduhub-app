import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const API = API_BASE_URL;

const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

export const getCourses = async () => {
  const response = await apiClient.get('/courses');
  return response.data;
};

export const getCourse = async (slug) => {
  const response = await apiClient.get(`/courses/${slug}`);
  return response.data;
};

export const enroll = async (courseId) => {
  const response = await apiClient.post(`/enroll/${courseId}`);
  return response.data;
};

export const getVideos = async (courseId) => {
  const response = await apiClient.get(`/videos/course/${courseId}/playback`);
  return response.data;
};

export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const register = async (payload) => {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
};

export default apiClient;
