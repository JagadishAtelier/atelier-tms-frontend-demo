// src/services/attendanceService.ts
import axios from "axios";

/**
 * Minimal Employee type embedded in attendances
 */
export interface MiniEmployee {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
}

/**
 * Single check-time entry
 */
export interface CheckTime {
  check_in?: string; // "HH:mm" or "HH:mm:ss" or ISO datetime
  check_out?: string;
}

/**
 * Attendance record returned from API
 */
export interface Attendance {
  id: string;
  employee_id: string;
  date: string; // "YYYY-MM-DD"
  check_time?: CheckTime[] | null;
  duration_hours?: number | null;
  sign_in?: string | null;
  sign_out?: string | null;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // optional included employee relation
  employee?: MiniEmployee | null;
}

/**
 * Payload used to create attendance
 * Supports action/time, check_in/check_out, or check_time array
 */
export type CreateAttendancePayload = {
  employee_id: string;
  date: string; 
  action?: "check_in" | "check_out" | "sign_in" | "sign_out";
  time?: string;
  check_in?: string;
  check_out?: string;
  check_time?: CheckTime[];
  duration_hours?: number;
  sign_in?: string;
  sign_out?: string;
  is_active?: boolean;
};

/**
 * Payload used to update attendance
 */
export type UpdateAttendancePayload = Partial<{
  date: string;
  check_time: CheckTime[];
  check_in: string;
  check_out: string;
  duration_hours: number;
  sign_in: string;
  sign_out: string;
  is_active: boolean;
}>;

/**
 * Query options for listing attendances
 */
export type GetAttendancesParams = {
  page?: number;
  limit?: number;
  employee_id?: string;
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  is_active?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
};

/**
 * Axios instance
 */
const API = axios.create({
  baseURL: "https://tms-be-kst3.onrender.com/api/v1/tms/employee",
});

/**
 * Attach token automatically (same as other services)
 */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const getAttendancesApi = async (params?: GetAttendancesParams) => {
  const res = await API.get("/attendance/", { params });
  return res.data;
};

/**
 * Get attendance by ID
 */
export const getAttendanceByIdApi = async (id: string): Promise<Attendance> => {
  const res = await API.get(`/attendance/${id}`);
  // backend returns the record under data or directly; normalize if needed
  return res.data.data ?? res.data;
};

/**
 * Create/append attendance (check-in/check-out/sign in/sign out)
 */
export const createAttendanceApi = async (payload: CreateAttendancePayload) => {
  const res = await API.post("/attendance/", payload);
  return res.data;
};

/**
 * Update attendance by ID
 */
export const updateAttendanceApi = async (id: string, payload: UpdateAttendancePayload) => {
  const res = await API.put(`/attendance/${id}`, payload);
  return res.data;
};

/**
 * Soft delete attendance
 */
export const deleteAttendanceApi = async (id: string) => {
  const res = await API.delete(`/attendance/${id}`);
  return res.data;
};

/**
 * Restore attendance (un-delete)
 */
export const restoreAttendanceApi = async (id: string) => {
  const res = await API.patch(`/attendance/${id}/restore`);
  return res.data;
};

/**
 * Get today's attendance for the logged-in user
 * Endpoint: GET /attendancetoday
 */
export const getTodayAttendanceApi = async () => {
  const res = await API.get("/attendancetoday");
  return res.data;
};

/**
 * Get attendances for a specific employee (helper)
 * Returns paginated shape similar to getAttendancesApi
 */
export const getAttendancesByEmployeeApi = async (employeeId: string, params?: { page?: number; limit?: number; from_date?: string; to_date?: string }) => {
  const res = await API.get(`/attendance`, { params: { ...params, employee_id: employeeId } });
  return res.data;
};
