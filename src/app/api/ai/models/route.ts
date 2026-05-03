import type { NextResponse } from "next/server";
import { listModels } from "@/lib/llm/client";
import { ListModelsSchema } from "@/utils/validation";
import { ok, parseJson, withUser } from "@/lib/api-helpers";

export const POST = (req: Request): Promise<NextResponse> =>
  withUser(async () => {
    const input = await parseJson(req, ListModelsSchema);
    const models = input.baseUrl
      ? await listModels({
          baseUrl: input.baseUrl,
          apiKey: input.apiKey ?? null,
          model: null,
        })
      : await listModels();
    return ok({ models });
  });
