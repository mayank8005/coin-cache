import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { UnauthorizedError, requireUser, type SessionUser } from "./session";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export const ok = <T>(data: T, init?: ResponseInit): NextResponse =>
  NextResponse.json(data, init);

export const bad = (message: string, status = 400, details?: unknown): NextResponse =>
  NextResponse.json({ error: message, details }, { status });

export const parseJson = async <T>(req: Request, schema: ZodSchema<T>): Promise<T> => {
  const raw = (await req.json().catch(() => null)) as unknown;
  return schema.parse(raw);
};

export const handle = async (fn: () => Promise<NextResponse>): Promise<NextResponse> => {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      return bad("Validation failed", 422, err.flatten());
    }
    if (err instanceof UnauthorizedError) {
      return bad("Unauthorized", 401);
    }
    if (err instanceof NotFoundError) {
      return bad(err.message, 404);
    }
    console.error("API error:", err);
    return bad("Internal error", 500);
  }
};

export const withUser = async (
  fn: (user: SessionUser) => Promise<NextResponse>,
): Promise<NextResponse> => handle(async () => fn(await requireUser()));
