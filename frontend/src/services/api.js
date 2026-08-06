import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Attach tab-isolated token from sessionStorage on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth  →  /api/auth/
export const register = (data) => api.post("/auth/register", data);
export const verifyOtp = (data) => api.post("/auth/verify", data);
export const resendOtp = (data) => api.post("/auth/resend", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const requestPasswordResetOtp = (data) => api.post("/auth/resetotp", data);
export const resetPassword = (data) => api.post("/auth/resetpass", data);

// Account  →  /api/accounts
export const createAccount = () => api.post("/accounts");
export const getUserAccount = () => api.get("/accounts");
export const getAccountBalance = (accountId) => api.get(`/accounts/balance/${accountId}`);

// Transactions  →  /api/transactions
export const createTransaction = (data) => api.post("/transactions", data);

// Statements  →  /api/statements
export const getTransactionHistory = (accountId) => api.get(`/statements/history/${accountId}`);
export const downloadStatement = (accountId) =>
  api.get(`/statements/${accountId}`, { responseType: "blob" });

export default api;
