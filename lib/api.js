import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────
//  Create Axios instance
// ─────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─────────────────────────────────────────────
//  Request Interceptor — attach access token
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
//  Response Interceptor — handle 401 / token refresh
// ─────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      const refreshToken = localStorage.getItem('refreshToken');

      // No refresh token — force logout
      if (!refreshToken) {
        clearAuth();
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
//  Auth helpers
// ─────────────────────────────────────────────
export const setAuth = (accessToken, refreshToken, user) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
//  API service methods
// ─────────────────────────────────────────────

// AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (token) => api.post('/auth/refresh-token', { refreshToken: token }),
  getMe: () => api.get('/auth/me'),
};

// EMPLOYEES
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  activate: (id) => api.post(`/employees/${id}/activate`),
};

// USERS
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  create: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  delete: (id) => api.delete(`/users/${id}`),
  uploadAvatar: (id, formData) =>
    api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (id, data) => api.put(`/users/${id}/change-password`, data),
};

// ATTENDANCE
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: () => api.post('/attendance/check-out'),
  getToday: () => api.get('/attendance/today'),
  getByUser: (id, params) => api.get(`/attendance/user/${id}`, { params }),
  getAll: (params) => api.get('/attendance/all', { params }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  markAbsent: (data) => api.post('/attendance/mark-absent', data),
  markEmployee: (data) => api.post('/attendance/mark-employee', data), // Admin only
};

// LEAVES
export const leavesAPI = {
  submit: (data) => api.post('/leaves', data),
  getMy: (params) => api.get('/leaves/my', { params }),
  getAll: (params) => api.get('/leaves/all', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  approve: (id, data) => api.put(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.put(`/leaves/${id}/reject`, data),
  cancel: (id) => api.delete(`/leaves/${id}`),
  getBalance: (userId) => api.get(`/leaves/balance/${userId}`),
  adminCreate: (data) => api.post('/leaves/admin-create', data), // Admin only
};

// DASHBOARD
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getAttendanceTrend: (days) => api.get('/dashboard/attendance-trend', { params: { days } }),
  getDepartmentStats: () => api.get('/dashboard/department-stats'),
  getNotifications: (limit) => api.get('/dashboard/notifications', { params: { limit } }),
  markNotificationsRead: () => api.put('/dashboard/notifications/read'),
};

// REPORTS
export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getDepartmentReport: (params) => api.get('/reports/department', { params }),
  getLateArrivals: (params) => api.get('/reports/late-arrivals', { params }),
  getAbsentees: (params) => api.get('/reports/absentees', { params }),
  export: (params) =>
    api.get('/reports/export', {
      params,
      responseType: 'blob',
    }),
  getYearOverview: (year) => api.get('/reports/overview', { params: { year } }),
};

// DEPARTMENTS
export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  getEmployees: (id, params) => api.get(`/departments/${id}/employees`, { params }),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// SHIFTS
export const shiftsAPI = {
  getAll: (params) => api.get('/shifts', { params }),
  getById: (id) => api.get(`/shifts/${id}`),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.put(`/shifts/${id}`, data),
  delete: (id) => api.delete(`/shifts/${id}`),
};

// HOLIDAYS
export const holidaysAPI = {
  getAll: (params) => api.get('/holidays', { params }),
  getById: (id) => api.get(`/holidays/${id}`),
  getUpcoming: (limit) => api.get('/holidays/upcoming', { params: { limit } }),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
};

export default api;
