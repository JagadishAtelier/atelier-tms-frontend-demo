// src/services/employeeService.ts
import axios from "axios";

/**
 * Employee Type
 */
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image_url?: string;
  position?: string;
  department?: "HR" | "Finance" | "IT" | "Operations" | "Marketing" | "Sales";
  hire_date?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Axios instance
 */
const API = axios.create({
  baseURL: "http://192.168.1.40:4000/api/v1/tms/employee/employee",
});

/**
 * Attach token automatically
 */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ============================
   EMPLOYEE APIs
============================ */

/**
 * Get all employees (pagination, search, filters)
 */
export const getEmployeesApi = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
}) => {
  const res = await API.get("/", { params });
  return res.data;
};

/**
 * Get employee by ID
 */
export const getEmployeeByIdApi = async (id: string): Promise<Employee> => {
  const res = await API.get(`/${id}`);
  return res.data;
};

/**
 * Create employee
 */
export const createEmployeeApi = async (data: Partial<Employee>) => {
  const res = await API.post("/", data);
  return res.data;
};

/**
 * Update employee
 */
export const updateEmployeeApi = async (
  id: string,
  data: Partial<Employee>
) => {
  const res = await API.put(`/${id}`, data);
  return res.data;
};

/**
 * Soft delete employee
 */
export const deleteEmployeeApi = async (id: string) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

/**
 * Restore employee
 */
export const restoreEmployeeApi = async (id: string) => {
  const res = await API.patch(`/${id}/restore`);
  return res.data;
};

/**
 * Bulk upload employees (Excel / CSV)
 */
export const bulkUploadEmployeesApi = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post("/employee-bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
