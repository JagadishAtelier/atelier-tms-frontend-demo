import axios from "axios";
import type { User } from "../types";

const API = axios.create({
  baseURL: "http://172.23.208.1:4000/api/v1/user", // adjust port
});

interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export async function getProfileApi(): Promise<User> {
  const res = await API.get<User>("/me/profile");
  return res.data;
}
export async function logoutApi() {
  await API.post("/logout");
  localStorage.clear();
}
export async function loginApi(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  const res = await API.post<LoginResponse>("/login", {
    identifier,
    password,
  });

  return res.data;
}
export async function forgotPasswordApi(email: string) {
  const res = await API.post("/forgot-password", { email });
  return res.data;
}

export async function resetPasswordApi(
  email: string,
  otp: string,
  newPassword: string
) {
  const res = await API.post("/reset-password", {
    email,
    otp,
    newPassword,
  });
  return res.data;
}

export const getUsersApi = async (): Promise<User[]> => {
  const res = await API.get("/");
  return res.data;
};

// GET user by ID
export const getUserByIdApi = async (id: string): Promise<User> => {
  const res = await API.get(`/${id}`);
  return res.data;
};

// CREATE user
export const createUserApi = async (data: Partial<User>) => {
  const res = await API.post("/", data);
  return res.data;
};

// UPDATE user by ID
export const updateUserApi = async (id: string, data: Partial<User>) => {
  const res = await API.put(`/${id}`, data);
  return res.data;
};

// Soft Delete User
export const deleteUserApi = async (id: string) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

// Restore User
export const restoreUserApi = async (id: string) => {
  const res = await API.patch(`/${id}/restore`);
  return res.data;
};
