import { z } from "zod";
import { ACCOUNT_KINDS } from "@/constants/accounts";
import { CURRENCY_CODES } from "@/constants/currencies";
import { PALETTE_IDS } from "@/constants/palettes";

export const zPaletteId = z.enum(PALETTE_IDS as [string, ...string[]]);
export const zCurrency = z.enum(CURRENCY_CODES as [string, ...string[]]);
export const zAccountKind = z.enum(ACCOUNT_KINDS as unknown as [string, ...string[]]);
export const zTxnKind = z.enum(["expense", "income"]);
export const zVizStyle = z.enum(["rings", "pie"]);
export const zChipStyle = z.enum(["rings", "pill", "block", "mono"]);

export const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(256),
  displayName: z.string().min(1).max(64),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const CreateCategorySchema = z.object({
  label: z.string().min(1).max(32),
  iconId: z.string().min(1).max(32),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/),
  mono: z
    .string()
    .min(1)
    .max(4)
    .optional(),
  kind: zTxnKind,
  monthlyBudgetMinor: z.number().int().nonnegative().nullable().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateAccountSchema = z.object({
  label: z.string().min(1).max(32),
  kind: zAccountKind,
  mono: z.string().min(1).max(4).optional(),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable()
    .optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export const CreateTransactionSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  amountMinor: z.number().int().nonnegative(),
  note: z.string().max(240).optional().default(""),
  occurredAt: z.string().datetime().or(z.date()),
  kind: zTxnKind,
  aiCategorized: z.boolean().optional().default(false),
  aiConfidence: z.number().min(0).max(1).optional().nullable(),
  flagged: z.boolean().optional().default(false),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const TransactionQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  kind: zTxnKind.optional(),
  flagged: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((v) => v === true || v === "true")
    .optional(),
  limit: z.coerce.number().int().positive().max(500).optional().default(100),
});

export const UpdateSettingsSchema = z
  .object({
    displayName: z.string().min(1).max(64),
    paletteId: zPaletteId,
    vizStyle: zVizStyle,
    chipStyle: zChipStyle,
    currency: zCurrency,
  })
  .partial();

export const NlParseSchema = z.object({
  text: z.string().min(1).max(400),
});

export const ParsedTransactionSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  categoryId: z.string(),
  accountId: z.string().optional().nullable(),
  note: z.string().optional().default(""),
  occurredAt: z.string().datetime(),
  kind: zTxnKind,
  confidence: z.number().min(0).max(1),
});
export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;
