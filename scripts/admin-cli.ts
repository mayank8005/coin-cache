#!/usr/bin/env tsx
/**
 * Admin CLI — create, list, delete users by posting to /api/admin/* with
 * the master password header. Mirrors what a curl script would do, but nicer.
 *
 * Usage:
 *   pnpm admin user:add    --email a@b --password '…' --name 'Alex'
 *   pnpm admin user:list
 *   pnpm admin user:delete --email a@b   (or --id <cuid>)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

interface Args {
  _: string[];
  flags: Record<string, string | boolean>;
}

const parseArgs = (argv: string[]): Args => {
  const out: Args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        out.flags[key] = true;
      } else {
        out.flags[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
};

const loadEnv = (): void => {
  if (process.env.SKIP_ENV_FILE) return;
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, vRaw] = m;
      if (!k || k in process.env) continue;
      let v = (vRaw ?? "").trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  } catch {
    /* no .env — that's fine */
  }
};

const getStr = (flags: Record<string, string | boolean>, key: string): string | null => {
  const v = flags[key];
  return typeof v === "string" ? v : null;
};

const prompt = async (label: string, opts: { mask?: boolean } = {}): Promise<string> => {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(opts.mask ? `${label} (hidden): ` : `${label}: `);
    return answer;
  } finally {
    rl.close();
  }
};

const confirm = async (msg: string): Promise<boolean> => {
  const a = (await prompt(`${msg} (y/N)`)).trim().toLowerCase();
  return a === "y" || a === "yes";
};

interface ApiOpts {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
}

const api = async <T>(opts: ApiOpts): Promise<T> => {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}${opts.path}`;
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) {
    console.error("Missing ADMIN_PASSWORD env. Set it in .env or the shell.");
    process.exit(1);
  }
  const res = await fetch(url, {
    method: opts.method,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": pass,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${res.statusText}`);
    console.error(text);
    process.exit(1);
  }
  if (!text) return {} as T;
  return JSON.parse(text) as T;
};

const usage = (): void => {
  console.info(`
Coin Cache admin CLI

  pnpm admin user:add --email <e> --password <p> --name <name>
  pnpm admin user:list
  pnpm admin user:delete (--email <e> | --id <id>)
`);
};

const run = async (): Promise<void> => {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (!cmd || cmd === "--help" || cmd === "-h") {
    usage();
    return;
  }

  if (cmd === "user:add") {
    const email = getStr(args.flags, "email") ?? (await prompt("email"));
    const name = getStr(args.flags, "name") ?? (await prompt("display name"));
    const password = getStr(args.flags, "password") ?? (await prompt("password", { mask: true }));
    const res = await api<{ id: string; email: string }>({
      method: "POST",
      path: "/api/admin/users",
      body: { email, displayName: name, password },
    });
    console.info(`created: ${res.email} (${res.id})`);
    return;
  }

  if (cmd === "user:list") {
    const res = await api<{ users: { id: string; email: string; displayName: string; createdAt: string }[] }>({
      method: "GET",
      path: "/api/admin/users",
    });
    if (res.users.length === 0) {
      console.info("no users");
      return;
    }
    for (const u of res.users) {
      console.info(`${u.email.padEnd(32)}  ${u.displayName.padEnd(24)}  ${u.id}`);
    }
    return;
  }

  if (cmd === "user:delete") {
    const id = getStr(args.flags, "id") ?? getStr(args.flags, "email");
    if (!id) {
      console.error("Pass --email <e> or --id <id>");
      process.exit(1);
    }
    if (!(await confirm(`Delete user ${id} and ALL their data?`))) {
      console.info("aborted");
      return;
    }
    const res = await api<{ deleted: string }>({
      method: "DELETE",
      path: `/api/admin/users/${encodeURIComponent(id)}`,
    });
    console.info(`deleted: ${res.deleted}`);
    return;
  }

  console.error(`unknown command: ${cmd}`);
  usage();
  process.exit(1);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
