"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";
import Logo from "@/components/Logo";

export default function LoginPage() {

  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  type ViewMode = "login" | "otp-login-request" | "otp-login-verify" | "reset-request" | "reset-verify";
  const [viewMode, setViewMode] = useState<ViewMode>("login");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
    });

    const data = await response.json();

    if (data.success) {
      if (data.role === "manager") {
        router.push("/manager");
      } else if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/staff");
      }
    } else {
      alert(data.message);
    }
  };

  const handleRequestOtpLogin = async (method: "email" | "mobile") => {
    if (!phoneNumber) {
      alert("Enter mobile number or email to login via OTP");
      return;
    }

    const response = await fetch("/api/login/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: phoneNumber, method }),
    });

    const data = await response.json();

    if (data.success) {
      alert(data.message || "OTP sent successfully");
      setViewMode("otp-login-verify");
    } else {
      alert(data.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtpLogin = async () => {
    if (!phoneNumber) {
      alert("Enter phone number, email, or employee code");
      return;
    }
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    const response = await fetch("/api/login/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: phoneNumber, otp }),
    });

    const data = await response.json();

    if (data.success) {
      if (data.role === "manager") {
        router.push("/manager");
      } else if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/staff");
      }
    } else {
      alert(data.message || "Failed to verify OTP");
    }
  };

  const handleRequestOtpReset = async (method: "email" | "mobile") => {
    if (!phoneNumber) {
      alert("Enter mobile number or email to reset password");
      return;
    }

    const response = await fetch("/api/reset-password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: phoneNumber, method }),
    });

    const data = await response.json();

    if (data.success) {
      alert(data.message || "OTP sent successfully");
      setViewMode("reset-verify");
    } else {
      alert(data.message || "Failed to send OTP");
    }
  };

  const handleVerifyReset = async () => {
    if (!phoneNumber) {
      alert("Enter phone number, email, or employee code to reset");
      return;
    }
    if (!otp) {
      alert("Enter OTP");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password should be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const response = await fetch("/api/reset-password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: phoneNumber, otp, newPassword }),
    });

    const data = await response.json();

    if (data.success) {
      alert("Password reset successful — use the new password to login");
      setViewMode("login");
      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      alert(data.message || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-[#111] p-10 rounded-xl w-full max-w-md border border-gray-800">
        <div className="flex justify-center mb-6">
          <Logo width={180} height={60} />
        </div>
        <h1 className="text-3xl font-bold text-red-500 mb-8 text-center">Staff Login</h1>

        <div className="space-y-5">
          <input
            placeholder="Mobile Number or Email"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full bg-black border border-gray-700 p-4 rounded-lg"
          />

          {viewMode === "login" && (
            <>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-700 p-4 rounded-lg"
              />

              <button
                onClick={handleLogin}
                className="w-full bg-red-600 hover:bg-red-700 p-4 rounded-lg font-bold"
              >
                Login
              </button>

              <div className="flex justify-between mt-2">
                <button
                  className="text-sm text-gray-400 underline"
                  onClick={() => setViewMode("otp-login-request")}
                >
                  Try another way
                </button>
                <button
                  className="text-sm text-gray-400 underline"
                  onClick={() => setViewMode("reset-request")}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {viewMode === "otp-login-request" && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequestOtpLogin('mobile')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 p-4 rounded-lg font-bold"
                >
                  OTP on Mobile
                </button>
                <button
                  onClick={() => handleRequestOtpLogin('email')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 p-4 rounded-lg font-bold"
                >
                  OTP on Email
                </button>
              </div>
              <div className="text-center mt-2">
                <button
                  className="text-sm text-gray-400 underline"
                  onClick={() => setViewMode("login")}
                >
                  Back to login
                </button>
              </div>
            </>
          )}

          {viewMode === "otp-login-verify" && (
            <>
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-black border border-gray-700 p-4 rounded-lg"
              />
              <button
                onClick={handleVerifyOtpLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded-lg font-bold"
              >
                Login with OTP
              </button>
              <div className="text-center mt-2">
                <button
                  className="text-sm text-gray-400 underline"
                  onClick={() => setViewMode("otp-login-request")}
                >
                  Back
                </button>
              </div>
            </>
          )}

          {viewMode === "reset-request" && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequestOtpReset('mobile')}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 p-4 rounded-lg font-bold"
                >
                  Reset via Mobile
                </button>
                <button
                  onClick={() => handleRequestOtpReset('email')}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 p-4 rounded-lg font-bold"
                >
                  Reset via Email
                </button>
              </div>
              <div className="text-center mt-2">
                <button
                  className="text-sm text-gray-400 underline"
                  onClick={() => setViewMode("login")}
                >
                  Back to login
                </button>
              </div>
            </>
          )}

          {viewMode === "reset-verify" && (
            <>
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-black border border-gray-700 p-4 rounded-lg"
              />

              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black border border-gray-700 p-4 rounded-lg"
              />

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black border border-gray-700 p-4 rounded-lg"
              />

              <button
                onClick={handleVerifyReset}
                className="w-full bg-yellow-600 hover:bg-yellow-700 p-4 rounded-lg font-bold"
              >
                Reset Password
              </button>
              <div className="text-center mt-2">
                <button
                  className="text-sm text-gray-400 underline"
                  onClick={() => setViewMode("reset-request")}
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}