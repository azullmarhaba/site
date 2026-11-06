import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOADS_DIR } from "@/lib/uploads";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;
  const rel = segments.join("/");
  const abs = path.resolve(UPLOADS_DIR, rel);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(abs);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const stream = Readable.toWeb(createReadStream(abs)) as unknown as ReadableStream;
    return new Response(stream, {
      headers: {
        "content-type": MIME[path.extname(abs).toLowerCase()] ?? "application/octet-stream",
        "content-length": String(info.size),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
