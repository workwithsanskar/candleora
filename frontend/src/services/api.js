import axios from "axios";
import {
  AUTH_STORAGE_KEY,
  clearStoredJson,
  readStoredJson,
} from "../utils/storage";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const session = readStoredJson(AUTH_STORAGE_KEY, null);

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      !error?.config?.skipAuth &&
      !String(error?.config?.url ?? "").startsWith("/auth/") &&
      !String(error?.config?.url ?? "").startsWith("/public/auth/")
    ) {
      clearStoredJson(AUTH_STORAGE_KEY);
    }

    return Promise.reject(error);
  },
);

const unwrap = (response) => response.data;

function withDefinedParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value]),
  );
}

export const catalogApi = {
  getProducts: (params = {}) => api.get("/products", { params: withDefinedParams(params) }).then(unwrap),
  getProduct: (id) => api.get(`/products/${id}`).then(unwrap),
  getRelatedProducts: (id) => api.get(`/products/${id}/related`).then(unwrap),
  getProductReviews: (id) => api.get(`/products/${id}/reviews`).then(unwrap),
  createProductReview: (id, payload) => api.post(`/products/${id}/reviews`, payload).then(unwrap),
  getCategories: () => api.get("/categories").then(unwrap),
};

export const authApi = {
  login: (payload) => api.post("/public/auth/login", payload, { skipAuth: true }).then(unwrap),
  signup: (payload) => api.post("/public/auth/register", payload, { skipAuth: true }).then(unwrap),
  googleAuth: (payload) => api.post("/public/auth/google", payload, { skipAuth: true }).then(unwrap),
  phoneAuth: (payload) => api.post("/public/auth/phone", payload, { skipAuth: true }).then(unwrap),
  sendEmailVerification: () => api.post("/auth/email-verification/send").then(unwrap),
  verifyEmail: (payload) =>
    api.post("/public/auth/email-verification/verify", payload, { skipAuth: true }).then(unwrap),
  getProfile: () => api.get("/auth/me").then(unwrap),
  updateProfile: (payload) => api.put("/auth/me", payload).then(unwrap),
};

export const cartApi = {
  getCart: () => api.get("/cart").then(unwrap),
  addItem: (payload) => api.post("/cart/items", payload).then(unwrap),
  syncCart: (payload) => api.post("/cart/sync", payload).then(unwrap),
  updateItem: (itemId, payload) => api.put(`/cart/items/${itemId}`, payload).then(unwrap),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`).then(unwrap),
};

export const addressApi = {
  getAddresses: () => api.get("/addresses").then(unwrap),
  createAddress: (payload) => api.post("/addresses", payload).then(unwrap),
  updateAddress: (addressId, payload) => api.put(`/addresses/${addressId}`, payload).then(unwrap),
  deleteAddress: (addressId) => api.delete(`/addresses/${addressId}`).then(unwrap),
};

export const orderApi = {
  createOrder: (payload) => api.post("/orders", payload).then(unwrap),
  getOrders: () => api.get("/orders").then(unwrap),
  getOrder: (orderId) => api.get(`/orders/${orderId}`).then(unwrap),
  cancelOrder: (orderId, payload = {}) =>
    api.post(`/orders/${orderId}/cancel`, payload).then(unwrap),
  downloadInvoice: (orderId) =>
    api.get(`/orders/${orderId}/invoice`, { responseType: "blob" }).then(unwrap),
  downloadTrackedInvoice: (orderId, email) =>
    api.get(`/orders/${orderId}/invoice/tracking`, {
      params: { email },
      responseType: "blob",
      skipAuth: true,
    }).then(unwrap),
};

export const couponApi = {
  validate: (payload) => api.post("/coupons/validate", payload).then(unwrap),
  getOffers: () => api.get("/coupons/offers").then(unwrap),
};

export const paymentApi = {
  createPhonePeOrder: (payload) => api.post("/payments/phonepe/order", payload).then(unwrap),
  getPhonePeStatus: (orderId) => api.get(`/payments/phonepe/status/${orderId}`).then(unwrap),
  createRazorpayOrder: (payload) => api.post("/payments/razorpay/order", payload).then(unwrap),
  verifyRazorpayPayment: (payload) =>
    api.post("/payments/razorpay/verify", payload).then(unwrap),
};

export const contentApi = {
  getFixes: () => api.get("/fixes").then(unwrap),
  getGuides: () => api.get("/guides").then(unwrap),
  getFaqs: () => api.get("/faqs").then(unwrap),
  submitContactMessage: (payload) => api.post("/contact", payload, { skipAuth: true }).then(unwrap),
};

export const chatApi = {
  sendMessage: (payload) => api.post("/chat", payload).then(unwrap),
  logEvent: (payload) => api.post("/chat/events", payload).then(() => null),
};

export default api;
