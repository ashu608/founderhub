// src/api/client.js
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
    withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

export default client;