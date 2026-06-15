// API Service wrapper

// If VITE_API_BASE_URL is set, use it. Otherwise, default to empty string
// which uses the Vite proxy (for local development).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  // Set default headers and credentials
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const token = sessionStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Required to send cookies (like jwt token) to backend
    credentials: 'include',
  };

  if (mergedOptions.body && typeof mergedOptions.body === 'object') {
    mergedOptions.body = JSON.stringify(mergedOptions.body);
  }

  try {
    const response = await fetch(url, mergedOptions);
    
    // Check if the response is an attachment (Excel file for statements)
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      if (!response.ok) {
        throw new Error('Failed to download statement');
      }
      return response.blob();
    }
    
    let data = {};
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const api = {
  // Auth API
  register: (name, email, password) => 
    request('/api/auth/register', { method: 'POST', body: { name, email, password } }),
    
  verifyOtp: (email, otp) => 
    request('/api/auth/verify', { method: 'POST', body: { email, otp } }),
    
  login: (email, password) => 
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
    
  logout: () => 
    request('/api/auth/logout', { method: 'POST' }),
    
  resendOtp: (email) => 
    request('/api/auth/resend', { method: 'POST', body: { email } }),
    
  sendResetOtp: (email) => 
    request('/api/auth/resetotp', { method: 'POST', body: { email } }),
    
  resetPassword: (email, otp, password) => 
    request('/api/auth/resetpass', { method: 'POST', body: { email, otp, password } }),

  // Account API
  createAccount: () => 
    request('/api/accounts', { method: 'POST' }),
    
  getAccounts: () => 
    request('/api/accounts', { method: 'GET' }),
    
  getBalance: (accountId) => 
    request(`/api/accounts/balance/${accountId}`, { method: 'GET' }),

  // Transaction API
  createTransaction: (fromAccount, toAccount, amount) => 
    request('/api/transactions', { method: 'POST', body: { fromAccount, toAccount, amount } }),

  createInitialFunds: (toAccount, amount) => 
    request('/api/transactions/system/initial-funds', { method: 'POST', body: { toAccount, amount } }),

  // Statement API
  getStatementBlob: (accountId) => 
    request(`/api/statements/${accountId}`, { method: 'GET' }),
    
  getHistory: (accountId) => 
    request(`/api/statements/history/${accountId}`, { method: 'GET' }),
};
