import axios from "axios";
import { AUTH_STORAGE_KEY, readStoredJson } from "../utils/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const session = readStoredJson(AUTH_STORAGE_KEY, null);

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

const unwrap = (response) => response.data;

export const catalogApi = {
  getProducts: (params = {}) => api.get("/products", { params }).then(unwrap),
  getProduct: (id) => api.get(`/products/${id}`).then(unwrap),
  getRelatedProducts: (id) => api.get(`/products/${id}/related`).then(unwrap),
  getCategories: () => api.get("/categories").then(unwrap),
};

export const authApi = {
  login: (payload) => api.post("/auth/login", payload).then(unwrap),
  signup: (payload) => api.post("/auth/signup", payload).then(unwrap),
  getProfile: () => api.get("/auth/me").then(unwrap),
};

export const cartApi = {
  getCart: () => api.get("/cart").then(unwrap),
  addItem: (payload) => api.post("/cart/items", payload).then(unwrap),
  updateItem: (itemId, payload) => api.put(`/cart/items/${itemId}`, payload).then(unwrap),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`).then(unwrap),
};

export const orderApi = {
  createOrder: (payload) => api.post("/orders", payload).then(unwrap),
  getOrders: () => api.get("/orders/me").then(unwrap),
};

export const contentApi = {
  getFixes: () => api.get("/fixes").then(unwrap),
  getGuides: () => api.get("/guides").then(unwrap),
  getFaqs: () => api.get("/faqs").then(unwrap),
};

export default api;
