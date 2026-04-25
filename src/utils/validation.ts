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
export const zChipRep = z.enum(["mono", "icon"]);

export const zPin = z.string().regex(/^\d{4}$/);
export const zRole = z.enum(["lead", "member", "shared"]);

export const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  pin: zPin,
  displayName: z.string().min(1).max(64),
  role: zRole.optional().default("member"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  userId: z.string().min(1),
  pin: zPin,
});

export const ResetPinSchema = z.object({
  email: z.string().email().toLowerCase(),
  pin: zPin,
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

const zNullableUrl = z
  .string()
  .trim()
  .max(512)
  .transform((s) => (s === "" ? null : s))
  .nullable()
  .refine(
    (s) => s === null || /^https?:\/\//i.test(s),
    "must be an http(s) URL",
  );

const zNullableTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s))
    .nullable();

export const UpdateSettingsSchema = z
  .object({
    displayName: z.string().min(1).max(64),
    paletteId: zPaletteId,
    vizStyle: zVizStyle,
    chipStyle: zChipStyle,
    chipRep: zChipRep,
    currency: zCurrency,
    llmBaseUrl: zNullableUrl,
    llmApiKey: zNullableTrimmed(512),
    llmModel: zNullableTrimmed(128),
  })
  .partial();

export const ListModelsSchema = z.object({
  baseUrl: zNullableUrl,
  apiKey: zNullableTrimmed(512).optional(),
});

export const NlParseSchema = z.object({
  text: z.string().min(1).max(400),
});

export const ImportRowSchema = z.object({
  date: z.string().min(1),
  account: z.string().min(1).max(64),
  category: z.string().min(1).max(64),
  amount: z.number().finite(),
  description: z.string().max(240).optional().default(""),
});
export type ImportRow = z.infer<typeof ImportRowSchema>;

export const ImportTransactionsSchema = z.object({
  rows: z.array(ImportRowSchema).min(1).max(200),
  dateFormat: z.enum(["mdy", "dmy", "ymd"]).optional().default("mdy"),
});

export const ParsedTransactionSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  categoryId: z.string(),
  accountId: z.string().optional().nullable(),
  note: z.string().optional().default(""),
  occurredAt: z.string().datetime(),
  kind: zTxnKind,
  confidence: z.number().min(0).max(1).optional().default(0.7),
});
export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;
