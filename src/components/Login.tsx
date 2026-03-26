// src/components/Login.tsx
import { useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

import { loginApi, forgotPasswordApi, resetPasswordApi } from "./service/auth";
import {
  sendOtpApi,
  verifyOtpAndCreateCompanyApi,
} from "./service/company";
import type { User } from "../types";

import { Eye, EyeOff } from "lucide-react";
import LoadingPage from "./loading";

interface LoginProps {
  onLogin: (user: User) => void;
  users?: User[];
}

export function Login({ onLogin, users }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<
    "login" | "forgot" | "reset" | "signup"
  >("login");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // ================= SIGNUP STATE =================
  const [formData, setFormData] = useState({
    company_name: "",
    business_type: "",
    gst_number: "",
    owner_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
  });

  const [signupOtp, setSignupOtp] = useState("");
  const [showSignupOtp, setShowSignupOtp] = useState(false);
  const [signupErrors, setSignupErrors] = useState<any>({});

  // ================= SIGNUP HANDLERS =================
  const handleSignupChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSignupErrors({ ...signupErrors, [e.target.name]: "" });
  };

  const validateSignup = () => {
    let errors: any = {};

    if (!formData.company_name) errors.company_name = "Company name is required";
    if (!formData.owner_name) errors.owner_name = "Owner name is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.phone) errors.phone = "Phone is required";

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateSignup()) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await sendOtpApi(formData.email);

      setShowSignupOtp(true);
      setSuccess("OTP sent to your email");
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP send failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupOtp = async () => {
    try {
      setLoading(true);
      setError("");

      await verifyOtpAndCreateCompanyApi({
        ...formData,
        otp: signupOtp,
      });

      setSuccess("Account created successfully");

      // Reset form
      setFormData({
        company_name: "",
        business_type: "",
        gst_number: "",
        owner_name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
      });

      setEmail(formData.email);

      setShowSignupOtp(false);
      setSignupOtp("");
      setMode("login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ================= LOGIN =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginApi(email, password);

      localStorage.setItem("accessToken", res.token);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));

      onLogin(res.user);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= FORGOT =================
  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await forgotPasswordApi(email);
      setSuccess("OTP sent to your email");
      setMode("reset");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ================= RESET =================
  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await resetPasswordApi(email, otp, newPassword);
      setSuccess("Password reset successful. Please login.");
      setMode("login");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ================= LOADING =================
  if (loading) return <LoadingPage />;

  // ================= UI =================
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 border shadow-sm">
            <img src="/Dark_Logo.png" className="h-12" />
          </div>
          <CardTitle className="text-blue-600">
            Atelier Technologies
          </CardTitle>
          <CardDescription>Task Management System</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "login") handleSubmit(e);
              if (mode === "forgot") handleForgotPassword();
              if (mode === "reset") handleResetPassword();
              if (mode === "signup") handleSignup();
            }}
            className="space-y-4"
          >
            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email</Label>

              {mode === "signup" ? (
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleSignupChange}
                />
              ) : (
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </div>

            {/* PASSWORD */}
            {mode === "login" && (
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* RESET */}
            {mode === "reset" && (
              <>
                <Input
                  placeholder="OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </>
            )}

            {/* SIGNUP */}
            {mode === "signup" && (
              <>

                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input name="company_name" placeholder="Company Name" onChange={handleSignupChange} />
                  {signupErrors.company_name && <p className="text-red-500 text-xs">{signupErrors.company_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Owner Name</Label>
                  <Input name="owner_name" placeholder="Owner Name" onChange={handleSignupChange} />
                  {signupErrors.owner_name && <p className="text-red-500 text-xs">{signupErrors.owner_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" placeholder="Phone" onChange={handleSignupChange} />
                  {signupErrors.phone && <p className="text-red-500 text-xs">{signupErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Input name="business_type" placeholder="Business Type" onChange={handleSignupChange} />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input name="gst_number" placeholder="GST Number" onChange={handleSignupChange} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input name="address" placeholder="Address" onChange={handleSignupChange} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input name="city" placeholder="City" onChange={handleSignupChange} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input name="state" placeholder="State" onChange={handleSignupChange} />
                </div>
              </>
            )}

            {/* MESSAGES */}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            {/* BUTTON */}
            <Button className="w-full">
              {mode === "login"
                ? "Sign In"
                : mode === "forgot"
                  ? "Send OTP"
                  : mode === "reset"
                    ? "Reset Password"
                    : "Create Account"}
            </Button>
          </form>

          {/* FOOTER */}
          <div className="mt-6 border-t pt-6">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-sm text-blue-600 w-full">
                  Forgot password?
                </button>
                <button onClick={() => setMode("signup")} className="text-sm text-blue-600 w-full mt-2">
                  Create new account
                </button>
              </>
            )}

            {mode !== "login" && (
              <button onClick={() => setMode("login")} className="text-sm text-gray-600 w-full">
                Back to login
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OTP MODAL */}
      {showSignupOtp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg text-center space-y-4 flex flex-col w-full max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 border shadow-sm">
              <img src="/Dark_Logo.png" className="h-12" />
            </div>
            <h3 className="font-semibold">Verify OTP</h3>

            <Input
              value={signupOtp}
              onChange={(e) => setSignupOtp(e.target.value)}
              placeholder="Enter OTP"
            />

            <Button onClick={handleVerifySignupOtp}>
              Verify & Create
            </Button>

            <Button variant="ghost" onClick={() => setShowSignupOtp(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;