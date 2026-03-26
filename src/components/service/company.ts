import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/tms`,
});

// ✅ Send OTP
export const sendOtpApi = async (email: string) => {
  const res = await API.post("/send-otp", { email });
  return res.data;
};

// ✅ Verify OTP + Create Company
export const verifyOtpAndCreateCompanyApi = async (data: {
  email: string;
  otp: string;
  company_name: string;
  owner_name: string;
  phone: string;
}) => {
  const res = await API.post("/verify-otp", data);
  return res.data;
};