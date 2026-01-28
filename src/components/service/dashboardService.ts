import axios from "axios";

const API = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/tms/dashboard`,
});

/**
 * Attach token
 */
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ========== Dashboard API Calls ==========

/**
 * Get Admin Dashboard Statistics
 */
export const getAdminDashboardApi = () =>
    API.get<{ data: any }>("/admin");

/**
 * Get Employee Dashboard Statistics
 */
export const getEmployeeDashboardApi = (employeeId?: string) =>
    employeeId
        ? API.get<{ data: any }>(`/employee/${employeeId}`)
        : API.get<{ data: any }>("/employee");

export default API;
