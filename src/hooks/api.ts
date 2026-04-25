"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { AccountDto, CategoryDto, TransactionDto } from "@/lib/dto";

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    const err: Error & { status?: number } = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return (text ? JSON.parse(text) : {}) as T;
};

// -------- Accounts --------
export const useAccounts = (): UseQueryResult<AccountDto[]> =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api<{ accounts: AccountDto[] }>("/api/accounts")).accounts,
  });

export const useCreateAccount = (): UseMutationResult<AccountDto, Error, {
  label: string;
  kind: string;
  mono?: string;
  last4?: string | null;
  colorHex: string;
}> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) =>
      (
        await api<{ account: AccountDto }>("/api/accounts", {
          method: "POST",
          body: JSON.stringify(input),
        })
      ).account,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
};

// -------- Categories --------
export const useCategories = (): UseQueryResult<CategoryDto[]> =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () =>
      (await api<{ categories: CategoryDto[] }>("/api/categories")).categories,
  });

export const useCreateCategory = (): UseMutationResult<CategoryDto, Error, {
  label: string;
  mono?: string;
  iconId: string;
  colorHex: string;
  kind: "expense" | "income";
}> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) =>
      (
        await api<{ category: CategoryDto }>("/api/categories", {
          method: "POST",
          body: JSON.stringify(input),
        })
      ).category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

// -------- Transactions --------
export interface TxnQueryParams {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  kind?: "expense" | "income";
  flagged?: boolean;
  limit?: number;
}

const buildQuery = (params?: TxnQueryParams): string => {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const useTransactions = (params?: TxnQueryParams): UseQueryResult<TransactionDto[]> =>
  useQuery({
    queryKey: ["transactions", params],
    queryFn: async () =>
      (
        await api<{ transactions: TransactionDto[] }>(`/api/transactions${buildQuery(params)}`)
      ).transactions,
  });

export const useCreateTransaction = (): UseMutationResult<TransactionDto, Error, {
  accountId: string;
  categoryId: string;
  amountMinor: number;
  note?: string;
  occurredAt: string;
  kind: "expense" | "income";
  aiCategorized?: boolean;
  aiConfidence?: number | null;
  flagged?: boolean;
}> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) =>
      (
        await api<{ transaction: TransactionDto }>("/api/transactions", {
          method: "POST",
          body: JSON.stringify(input),
        })
      ).transaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
};

export const useDeleteTransaction = (): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api(`/api/transactions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
};

export const useUpdateTransaction = (): UseMutationResult<
  TransactionDto,
  Error,
  {
    id: string;
    patch: Partial<{
      accountId: string;
      categoryId: string;
      amountMinor: number;
      note: string;
      occurredAt: string;
      kind: "expense" | "income";
      flagged: boolean;
    }>;
  }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) =>
      (
        await api<{ transaction: TransactionDto }>(`/api/transactions/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        })
      ).transaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
};

// -------- Settings --------
export const useUpdateSettings = (): UseMutationResult<
  { settings: Record<string, string> },
  Error,
  Partial<{
    displayName: string;
    paletteId: string;
    vizStyle: "rings" | "pie";
    chipStyle: "rings" | "pill" | "block" | "mono";
    chipRep: "mono" | "icon";
    currency: "INR" | "USD";
    llmBaseUrl: string | null;
    llmApiKey: string | null;
    llmModel: string | null;
  }>
> =>
  useMutation({
    mutationFn: async (input) =>
      api<{ settings: Record<string, string> }>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  });

export const useListLlmModels = (): UseMutationResult<
  { models: string[] },
  Error,
  { baseUrl: string | null; apiKey: string | null }
> =>
  useMutation({
    mutationFn: async (input) =>
      api<{ models: string[] }>("/api/ai/models", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });

// -------- AI --------
export const useNlParse = (): UseMutationResult<
  { parsed?: import("@/utils/validation").ParsedTransaction; offline?: boolean },
  Error,
  { text: string }
> =>
  useMutation({
    mutationFn: async (input) =>
      api<{
        parsed?: import("@/utils/validation").ParsedTransaction;
        offline?: boolean;
      }>("/api/ai/parse", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });

export const useInsights = (period: "week" | "month"): UseQueryResult<{
  offline: boolean;
  summary?: string;
  narrative?: string;
  callout?: string;
}> =>
  useQuery({
    queryKey: ["insights", period],
    queryFn: async () =>
      api<{ offline: boolean; summary?: string; narrative?: string; callout?: string }>(
        `/api/ai/insights?period=${period}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
