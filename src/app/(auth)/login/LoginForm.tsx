"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  next?: string;
  error?: string;
}

export function LoginForm({ next, error }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(error ? "Login failed" : null);
  const router = useRouter();

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (!res || res.error) {
      setErr("Invalid email or password");
      return;
    }
    router.replace(next && next.startsWith("/") ? next : "/");
    router.refresh();
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-[380px] card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="txt-mono-label">household</div>
            <h1 className="font-display text-[22px] font-medium -tracking-[0.02em]">Coin Cache</h1>
          </div>
          <div className="txt-mono-label">local</div>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="txt-mono-label">email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="card-sunk px-3 py-2 text-[14px] outline-none"
              placeholder="you@home.local"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="txt-mono-label">password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="card-sunk px-3 py-2 text-[14px] outline-none"
              placeholder="••••••••"
            />
          </label>
          {err ? <p className="text-[12px] text-neg">{err}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-accent py-2 text-[14px] font-medium text-accent-ink transition-opacity duration-med disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <p className="mt-2 text-[11px] text-fg-dim">
            Accounts are provisioned by the household admin via CLI. No self-signup.
          </p>
        </form>
      </div>
    </main>
  );
}
