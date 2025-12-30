import axios from "axios";

// ===============================
// Task Enums (MATCH BACKEND)
// ===============================
export type TaskPriority = "Low" | "Medium" | "High";

export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "On Hold"
  | "Cancelled";

// ===============================
// Task Payload (Create / Update)
// ===============================
export interface TaskPayload {
  title: string;
  description?: string;
  notes?: string;

  priority?: TaskPriority;
  status?: TaskStatus;

  due_date_and_time?: string; // ISO string
  start_date?: string;        // ISO string
  end_date?: string;          // ISO string

  timetaken?: string; // HH:mm:ss
  total_hours?: string; // HH:mm:ss
  project_id: string; // UUID
  assigned_to: string; // UUID

  is_active?: boolean;
}

// ===============================
// Task Entity (Response)
// ===============================
export interface Task extends TaskPayload {
  id: string;
  createdAt: string;
  updatedAt: string;

  created_by?: string;
  created_by_name?: string;
  created_by_email?: string;

  updated_by?: string;
  updated_by_name?: string;
  updated_by_email?: string;
}

// ===============================
// API Response Wrapper
// ===============================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ===============================
// Axios Instance
// ===============================
const API = axios.create({
  baseURL: "http://192.168.1.40:4000/api/v1/tms/task/task",
});

// Attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===============================
// API Calls
// ===============================

// Create Task
export const createTaskApi = (data: TaskPayload) =>
  API.post<ApiResponse<Task>>("/", data);

// Get all tasks
export const getTasksApi = (params?: Record<string, any>) =>
  API.get<ApiResponse<Task[]>>("/", { params });

// Get task by ID
export const getTaskByIdApi = (id: string) =>
  API.get<ApiResponse<Task>>(`/${id}`);

// Update task
export const updateTaskApi = (
  id: string,
  data: Partial<TaskPayload>
) =>
  API.put<ApiResponse<Task>>(`/${id}`, data);

// Delete task (soft delete)
export const deleteTaskApi = (id: string) =>
  API.delete<ApiResponse<null>>(`/${id}`);

// Restore task
export const restoreTaskApi = (id: string) =>
  API.patch<ApiResponse<Task>>(`/${id}/restore`);

// Tasks by project
export const getTaskByProjectApi = (projectId: string) =>
  API.get<ApiResponse<Task[]>>(`/project/${projectId}`);

// Logged-in employee tasks
export const getMyTasksApi = () =>
  API.get<ApiResponse<Task[]>>(`/employee/me`);
