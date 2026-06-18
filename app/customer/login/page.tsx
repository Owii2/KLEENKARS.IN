"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface StoredCustomer {
  name: string;
  phone: string;
  email: string;
  createdAt?: string;
  lastVisit?: string;
  totalSpend?: number;
  visits?: number;
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "otp" | "forgot" | "reset-password">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const persistCustomer = (data: { name?: string; phone: string; email?: string }) => {
    const now = new Date().toISOString();
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("customers") || "[]";
    const customers = JSON.parse(stored) as StoredCustomer[];
    const existing = customers.find((c) => c.phone === data.phone);
    if (existing) {
      existing.name = data.name || existing.name;
      existing.email = data.email || existing.email;
      existing.lastVisit = now;
      existing.visits = (existing.visits || 0) + 1;
    } else {
      customers.push({
        name: data.name || "",
        phone: data.phone,
        email: data.email || "",
        createdAt: now,
        lastVisit: now,
        totalSpend: 0,
        visits: 1,
      });
    }
    window.localStorage.setItem("customers", JSON.stringify(customers));
    window.localStorage.setItem("customerUser", JSON.stringify({ name: data.name || "", phone: data.phone, email: data.email || "" }));
  };

  const handleSendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phone) return alert("Enter phone number");
    // mock OTP
    setOtpSent(true);
    alert("Mock OTP sent: 1234");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "1234") return alert("Enter code 1234 for mock OTP");
    persistCustomer({ phone });
    router.push("/customer/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password) return alert("Name, phone, and password required");
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, phoneNumber: phone, email, password })
      });
      const j = await res.json();
      if (j.success) {
        alert('Account created successfully');
        const u = j.customer;
        window.localStorage.setItem('customerUser', JSON.stringify({ name: u.customerName, phone: u.phone, email: u.email }));
        router.push("/customer/dashboard");
      } else {
        alert(j.message || 'Signup failed');
      }
    } catch (err) {
      console.log(err);
      alert('Server error');
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = phone || email;
    if (!id) return alert('Enter email or phone');
    if (!password) return alert('Enter password');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: id, password }) });
      const j = await res.json();
      if (j.success) {
        const u = j.customer;
        window.localStorage.setItem('customerUser', JSON.stringify({ name: u.customerName, phone: u.phone, email: u.email }));
        router.push('/customer/dashboard');
      } else {
        alert(j.message || 'Login failed');
      }
    } catch (err) {
      console.log(err);
      alert('Server error');
    }
  };

  const requestReset = async () => {
    const id = resetEmail || phone;
    if (!id) return alert('Enter email or mobile');
    try {
      const res = await fetch('/api/auth/request-reset', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: id }) });
      const j = await res.json();
      if (j.success) {
        alert('Reset OTP sent successfully');
        setMode('reset-password');
      } else {
        alert(j.message || 'Failed');
      }
    } catch (err) { console.log(err); alert('Server error'); }
  };

  const handleResetPassword = async () => {
    const id = resetEmail || phone;
    if (!id || !otp || !newPassword) return alert('Please fill all fields');
    if (newPassword !== confirmPassword) return alert('Passwords do not match');

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: id, otp, password: newPassword }),
      });
      const j = await res.json();
      if (j.success) {
        alert('Password reset successfully');
        setMode('login');
      } else {
        alert(j.message || 'Failed to reset password');
      }
    } catch (err) {
      console.log(err);
      alert('Server error');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 p-6 rounded-2xl border border-zinc-700">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode("login")} className={`flex-1 p-3 rounded ${mode === "login" ? "bg-red-600" : "bg-white/5"}`}>
            Login
          </button>
          <button onClick={() => setMode("signup")} className={`flex-1 p-3 rounded ${mode === "signup" ? "bg-red-600" : "bg-white/5"}`}>
            Sign up
          </button>
        </div>

        {mode === "login" ? (
          <>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <input 
                  value={phone || email} 
                  onChange={(e) => {
                    const val = e.target.value;
                    // basic heuristic: if it looks like a number, treat as phone, else email
                    if (/^\d*$/.test(val)) {
                      setPhone(val);
                      setEmail("");
                    } else {
                      setEmail(val);
                      setPhone("");
                    }
                  }} 
                  className="w-full p-3 rounded-xl bg-zinc-800 mt-2" 
                  placeholder="Mobile Number or Email" 
                />
              </div>

              <div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-zinc-800 mt-2" 
                  placeholder="Password" 
                />
              </div>

              <button type="submit" className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-xl font-bold transition">
                Login
              </button>

              <div className="flex justify-between items-center mt-2">
                <button type="button" onClick={() => setMode('otp')} className="text-sm text-gray-400 hover:text-white transition">
                  Try another way
                </button>
                <button type="button" onClick={() => setMode('forgot')} className="text-sm text-gray-400 hover:text-white transition">
                  Forgot password?
                </button>
              </div>
            </form>
          </>
        ) : mode === 'otp' ? (
          <form className="space-y-4">
            <div>
              <input 
                value={phone || email} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setPhone(val);
                    setEmail("");
                  } else {
                    setEmail(val);
                    setPhone("");
                  }
                }} 
                className="w-full p-3 rounded-xl bg-zinc-800 mt-2" 
                placeholder="Mobile Number or Email" 
              />
            </div>
            
            {otpSent && (
              <div>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="Enter OTP" />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {otpSent ? (
                <button type="button" onClick={handleVerifyOtp} className="flex-1 bg-red-500 hover:bg-red-600 p-3 rounded-xl font-bold">Login</button>
              ) : (
                <button type="button" onClick={handleSendOtp} className="flex-1 bg-red-500 hover:bg-red-600 p-3 rounded-xl font-bold">Send OTP</button>
              )}
            </div>

            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('login'); setOtpSent(false); }} className="text-sm text-gray-400 hover:text-white transition">Back to login</button>
            </div>
          </form>
        ) : mode === 'forgot' ? (
          <form className="space-y-4">
             <div>
              <input 
                value={resetEmail || phone} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setPhone(val);
                    setResetEmail("");
                  } else {
                    setResetEmail(val);
                    setPhone("");
                  }
                }} 
                className="w-full p-3 rounded-xl bg-zinc-800 mt-2" 
                placeholder="Mobile Number or Email" 
              />
            </div>

            <button type="button" onClick={requestReset} className="w-full bg-yellow-600 hover:bg-yellow-700 p-3 rounded-xl font-bold transition mt-2">
              Send Reset OTP
            </button>

            <div className="text-center mt-4">
              <button type="button" onClick={() => setMode('login')} className="text-sm text-gray-400 hover:text-white transition">Back to login</button>
            </div>
          </form>
        ) : mode === 'reset-password' ? (
          <form className="space-y-4">
            <input value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="Enter OTP" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="New Password" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="Confirm New Password" />
            <button type="button" onClick={handleResetPassword} className="w-full bg-yellow-600 hover:bg-yellow-700 p-3 rounded-xl font-bold transition mt-2">
              Reset Password
            </button>
             <div className="text-center mt-4">
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-gray-400 hover:text-white transition">Back</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="Full name" required />
            </div>

            <div>
              <label className="text-sm text-gray-400">Mobile Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="10 digit mobile number" required />
            </div>

            <div>
              <label className="text-sm text-gray-400">Email (optional)</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="Email" />
            </div>

            <div>
              <label className="text-sm text-gray-400">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 mt-2" placeholder="Password" required />
            </div>

            <button type="submit" className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-xl font-bold transition">Create Account</button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setMode('login')} className="text-sm text-gray-400 hover:text-white transition">Back to login</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
