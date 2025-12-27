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
import { loginApi, forgotPasswordApi, resetPasswordApi } from "../api/auth";
import type { User } from "../types";

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin, users }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginApi(email, password);

      // Store tokens
      localStorage.setItem("accessToken", res.token);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));

      // Login success
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

  const quickLogin = (role: string) => { const user = users.find((u) => u.role === role && u.isActive); if (user) { onLogin(user); } }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
            <img src="/Dark_Logo.png" alt="Logo" srcSet="/Dark_Logo.png" className="h-12" />
          </div>
          <CardTitle className="text-blue-600">
            Atelier Technologies
          </CardTitle>
          <CardDescription>Task Management System</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (mode === "login") handleSubmit(e);
            if (mode === "forgot") handleForgotPassword();
            if (mode === "reset") handleResetPassword();
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode === "login" && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === "reset" && (
              <>
                <div className="space-y-2">
                  <Label>OTP</Label>
                  <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </>
            )}



            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "forgot"
                    ? "Send OTP"
                    : "Reset Password"}
            </Button>

          </form>

          <div className="mt-6 border-t pt-6"> {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-blue-600 hover:underline text-center w-full"
              >
                Forgot password?
              </button>
            )}

              {mode !== "login" && (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-gray-600 hover:underline text-center w-full"
                >
                  Back to login
                </button>
              )}
            </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Developed by Atelier Technologies
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
