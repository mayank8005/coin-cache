import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, LlmOfflineError, userLlmConfig } from "@/lib/llm/client";
import { nlParseSystem } from "@/lib/llm/prompts";
import { NlParseSchema, ParsedTransactionSchema } from "@/utils/validation";
import { accountsForUser, categoriesForUser } from "@/lib/repo";
import { handle, ok, parseJson, withUser } from "@/lib/api-helpers";

const LlmOutputSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  categoryId: z.string(),
  accountId: z.string().optional().nullable(),
  note: z.string().optional().default(""),
  occurredAt: z.string(),
  kind: z.enum(["expense", "income"]),
  confidence: z.number().min(0).max(1).optional().default(0.7),
});

export const POST = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const { text } = await parseJson(req, NlParseSchema);
    const [cats, accts] = await Promise.all([categoriesForUser(u.id), accountsForUser(u.id)]);
    try {
      const raw = await chat({
        system: nlParseSystem(cats, accts, u.currency),
        user: `User time: ${new Date().toISOString()}\nInput: ${text}`,
        schema: LlmOutputSchema,
        temperature: 0.2,
        timeoutMs: 60_000,
        config: userLlmConfig(u),
      });
      const normalized = ParsedTransactionSchema.safeParse({
        ...raw,
        occurredAt: new Date(raw.occurredAt).toISOString(),
      });
      if (!normalized.success) return ok({ offline: false, error: "parse_failed" });
      return ok({ parsed: normalized.data });
    } catch (err) {
      if (err instanceof LlmOfflineError) return ok({ offline: true });
      return handle(async () => {
        throw err;
      });
    }
  });
