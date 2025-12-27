// src/services/projectService.ts
import axios from "axios";

/**
 * Project Type (adjust if you already have a shared type)
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
}

/**
 * Axios instance
 */
const API = axios.create({
  baseURL: "http://192.168.31.14:4000/api/v1/tms/project/project",
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
export const createProjectApi = async (data: Partial<Project>) => {
  const res = await API.post("/", data);
  return res.data;
};

/**
 * Update project
 */
export const updateProjectApi = async (
  id: string,
  data: Partial<Project>
) => {
  const res = await API.put(`/${id}`, data);
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
