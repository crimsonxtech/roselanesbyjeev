"use client";

import "../dashboard/dashboard.css";
import * as React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/dashboard/spinner";

const inputCls =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-400 disabled:opacity-60";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setError(error.message || "Invalid email or password.");
        setLoading(false);
        return;
      }
      // Keep the spinner running until the dashboard takes over.
      router.push("/dashboard");
    } catch {
      setError("Could not reach the server. Try again.");
      setLoading(false);
    }
  }

  return (
    <div data-dashboard className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-neutral-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>

        <div>
          <label htmlFor="email" className="mb-1 block text-xs text-neutral-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs text-neutral-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-white py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-70"
        >
          {loading && <Spinner />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}