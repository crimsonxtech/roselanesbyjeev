"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message || "Invalid credentials.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-24 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded border px-3 py-2" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded border px-3 py-2" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" className="w-full rounded bg-black py-2 text-white">Sign in</button>
    </form>
  );
}