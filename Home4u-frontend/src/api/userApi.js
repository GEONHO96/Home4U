import axios from 'axios';

const BASE_URL = 'http://localhost:8080'; // 백엔드 서버 주소

// Axios 인스턴스 (JWT 토큰 자동 포함)
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ 회원가입
export const registerUser = async (userData) => {
  const response = await api.post('/users/register', userData);
  return response.data; // { message: "회원 가입 성공" }
};

// ✅ 로그인
export const loginUser = async ({ username, password }) => {
  const response = await api.post('/users/login', { username, password });
  return response.data.token; // JWT 토큰
};
