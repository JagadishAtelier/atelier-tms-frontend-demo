// src/services/projectService.ts
import axios from "axios";

/**
 * Project Type
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  given_enddate?: string;
  status?: "Not Started" | "In Progress" | "Completed" | "On Hold" | "Cancelled";
  timetaken?: string;
  project_lead: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
  attachments?: { name: string; url: string; type: string; key?: string }[];
  team_members?: string[]; // Array of employee IDs
}

/**
 * 🔹 Project Time Report Types
 */
export interface ProjectTimeByDateEmployee {
  employee_id: string;
  employee_name: string;
  work_date: string; // YYYY-MM-DD
  total_hours: number;
}

export interface ProjectEmployeeTotal {
  employee_id: string;
  employee_name: string;
  task_total_hours: number;
}

export interface ProjectTimeReport {
  project: Project;
  perDateEmployee: ProjectTimeByDateEmployee[];
  perEmployeeTaskTotals: ProjectEmployeeTotal[];
  projectTotals: {
    total_from_timings: number;
    total_from_task_hours: number;
    grand_total: number;
  };
}

/**
 * Axios instance
 */
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/tms/project/project`,
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

/* ============================
   CRUD APIs
============================ */

/**
 * Get all projects (pagination, search, filters)
 */
export const getProjectsApi = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  is_active?: boolean;
}) => {
  const res = await API.get("/", { params });
  return res.data;
};

/**
 * Get project by ID
 */
export const getProjectByIdApi = async (id: string): Promise<Project> => {
  const res = await API.get(`/${id}`);
  return res.data;
};

/**
 * Create project
 */
export const createProjectApi = async (data: Partial<Project> | FormData) => {
  const isFormData = data instanceof FormData;
  const headers = isFormData ? { "Content-Type": "multipart/form-data" } : undefined;

  const res = await API.post("/", data, { headers });
  return res.data;
};

/**
 * Update project
 */
export const updateProjectApi = async (
  id: string,
  data: Partial<Project> | FormData
) => {
  const isFormData = data instanceof FormData;
  const headers = isFormData ? { "Content-Type": "multipart/form-data" } : undefined;

  const res = await API.put(`/${id}`, data, { headers });
  return res.data;
};

/**
 * Soft delete project
 */
export const deleteProjectApi = async (id: string) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

/**
 * Restore project
 */
export const restoreProjectApi = async (id: string) => {
  const res = await API.patch(`/${id}/restore`);
  return res.data;
};

/* ============================
   📊 REPORT APIs
============================ */

/**
 * ✅ Get Project Time Report (date-wise & employee-wise)
 *
 * @param projectId - Project UUID
 * @param params.from - YYYY-MM-DD (optional)
 * @param params.to   - YYYY-MM-DD (optional)
 *
 * Example:
 * getProjectTimeReportApi("uuid", { from: "2025-01-01", to: "2025-01-31" })
 */
export const getProjectTimeReportApi = async (
  projectId: string,
  params?: {
    from?: string;
    to?: string;
  }
): Promise<ProjectTimeReport> => {
  const res = await API.get(`/${projectId}/time-report`, { params });
  return res.data;
};
