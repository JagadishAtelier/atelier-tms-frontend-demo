import axios from "axios";

const API = axios.create({
    baseURL: "http://172.23.208.1:4000/api/v1/tms/dashboard",
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
