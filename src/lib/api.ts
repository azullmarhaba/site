import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { error: string; details?: unknown }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: "Invalid JSON body" };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: "Validation failed",
      details: result.error.flatten(),
    };
  }
  return { data: result.data };
}
