import api from "../../services/api";

const unwrap = (response) => response.data;

function withDefinedParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

const adminApi = {
  getDashboardOverview: (params = {}) =>
    api.get("/admin/analytics/overview", { params: withDefinedParams(params) }).then(unwrap),
  getRevenueMetrics: (params = {}) =>
    api.get("/admin/analytics/revenue", { params: withDefinedParams(params) }).then(unwrap),
  getSalesInsights: (params = {}) =>
    api.get("/admin/analytics/sales", { params: withDefinedParams(params) }).then(unwrap),
  getCustomerInsights: (params = {}) =>
    api.get("/admin/analytics/customers", { params: withDefinedParams(params) }).then(unwrap),
  getForecast: (params = {}) =>
    api.get("/admin/analytics/forecast", { params: withDefinedParams(params) }).then(unwrap),
  getAuraOverview: (params = {}) =>
    api.get("/admin/analytics/aura/overview", { params: withDefinedParams(params) }).then(unwrap),
  getAuraTrainingQueue: (params = {}) =>
    api.get("/admin/analytics/aura/training", { params: withDefinedParams(params) }).then(unwrap),
  updateAuraTrainingItem: (id, payload) =>
    api.put(`/admin/analytics/aura/training/${id}`, payload).then(unwrap),
  getNotifications: (params = {}) =>
    api.get("/admin/notifications", { params: withDefinedParams(params) }).then(unwrap),
  markAllNotificationsReviewed: (params = {}) =>
    api.post("/admin/notifications/review-all", null, { params: withDefinedParams(params) }).then(unwrap),
  getOrders: (params = {}) =>
    api.get("/admin/orders", { params: withDefinedParams(params) }).then(unwrap),
  getOrder: (id) => api.get(`/admin/orders/${id}`).then(unwrap),
  markOrderReviewed: (id) => api.put(`/admin/orders/${id}/reviewed`).then(unwrap),
  updateOrderStatus: (id, status) =>
    api.put(`/admin/orders/${id}/status`, { status }).then(unwrap),
  updateOrderTracking: (id, payload) =>
    api.put(`/admin/orders/${id}/tracking`, payload).then(unwrap),
  getReplacements: (params = {}) =>
    api.get("/admin/replacements", { params: withDefinedParams(params) }).then(unwrap),
  getReplacement: (id) => api.get(`/admin/replacements/${id}`).then(unwrap),
  markReplacementReviewed: (id) => api.put(`/admin/replacements/${id}/reviewed`).then(unwrap),
  approveReplacement: (id, payload = {}) =>
    api.post(`/admin/replacements/${id}/approve`, payload).then(unwrap),
  rejectReplacement: (id, payload = {}) =>
    api.post(`/admin/replacements/${id}/reject`, payload).then(unwrap),
  bulkApproveReplacements: (payload) =>
    api.post("/admin/replacements/bulk-approve", payload).then(unwrap),
  getProducts: (params = {}) =>
    api.get("/admin/products", { params: withDefinedParams(params) }).then(unwrap),
  createProduct: (payload) => api.post("/admin/products", payload).then(unwrap),
  updateProduct: (id, payload) => api.put(`/admin/products/${id}`, payload).then(unwrap),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then(unwrap),
  getProductInventoryHistory: (id) => api.get(`/admin/products/${id}/inventory-history`).then(unwrap),
  adjustProductInventory: (id, payload) =>
    api.post(`/admin/products/${id}/inventory-adjustments`, payload).then(unwrap),
  getCoupons: () => api.get("/admin/coupons").then(unwrap),
  createCoupon: (payload) => api.post("/admin/coupons", payload).then(unwrap),
  updateCoupon: (id, payload) => api.put(`/admin/coupons/${id}`, payload).then(unwrap),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`).then(unwrap),
  getCustomers: (params = {}) =>
    api.get("/admin/customers", { params: withDefinedParams(params) }).then(unwrap),
  getCustomer: (id) => api.get(`/admin/customers/${id}`).then(unwrap),
  getContactMessages: (params = {}) =>
    api.get("/admin/contact-messages", { params: withDefinedParams(params) }).then(unwrap),
  getContactMessage: (id) => api.get(`/admin/contact-messages/${id}`).then(unwrap),
  markContactMessageReviewed: (id) => api.put(`/admin/contact-messages/${id}/reviewed`).then(unwrap),
  getCategories: () => api.get("/categories").then(unwrap),
};

export default adminApi;
