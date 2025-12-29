import axios from "axios"; // your axios instance

// ========== Task Types ==========
export interface TaskPayload {
  title: string;
  description?: string;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  due_date_and_time?: string | Date;
  start_date?: string | Date;
  end_date?: string | Date;
  project_id: string; // UUID
  assigned_to: string; // UUID (single employee)
  status?: "Not Started" | "In Progress" | "Completed" | "On Hold" | "Cancelled";
  timetaken?: string; // HH:mm:ss format
  is_active?: boolean;
}

export interface Task extends TaskPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
  timeSpent?: number;
  estimatedTime?: number;
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  comments?: {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    userName: string;
  }[];
}

const API = axios.create({
  baseURL: "https://tms-be-kst3.onrender.com/api/v1/tms/task/task",
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

// ========== API Calls ==========

// Create Task
export const createTaskApi = (data: TaskPayload) =>
  API.post<{ data: Task }>("/", data);

// Get all tasks
export const getTasksApi = (params?: Record<string, any>) =>
  API.get<{ data: Task[] }>("/", { params });

// Get task by id
export const getTaskByIdApi = (id: string) =>
  API.get<{ data: Task }>(`/${id}`);

// Update task
export const updateTaskApi = (id: string, data: Partial<TaskPayload>) =>
  API.put<{ data: Task }>(`/${id}`, data);

// Delete task
export const deleteTaskApi = (id: string) =>
  API.delete(`/${id}`);

// Restore task
export const restoreTaskApi = (id: string) =>
  API.patch(`/${id}/restore`);

// Tasks by project
export const getTaskByProjectApi = (projectId: string) =>
  API.get<{ data: Task[] }>(`/project/${projectId}`);

// Tasks by employee
export const getTaskByEmployeeApi = (employeeId: string) =>
  API.get<{ data: Task[] }>(`/employee/${employeeId}`);
