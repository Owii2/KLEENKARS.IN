"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      alert("Missing token");
      return;
    }

    if (!password) {
      alert("Enter password");
      return;
    }

    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();

    if (data.success) {
      alert("Password reset. Please login.");
      router.push("/customer/login");
    } else {
      alert(data.message || "Failed");
    }
  };

  return (
    <main className="min-h-screen p-6 bg-black text-white flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-zinc-900 p-6 rounded-2xl">
        <h1 className="text-xl font-bold mb-4">Reset Password</h1>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="New password"
          className="w-full p-3 rounded bg-zinc-800 mb-3"
        />
        <button className="w-full bg-red-500 p-3 rounded">Set password</button>
      </form>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black text-white p-6">Loading...</main>}>
      <ResetForm />
    </Suspense>
  );
}
