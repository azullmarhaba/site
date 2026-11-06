import path from "node:path";

// Uploaded media is stored outside `public/` so it is not baked into the
// build output (files under `public/` that are added at runtime are not
// served by `next start`). The `/uploads/[...path]` route streams them.
export const PUBLIC_UPLOAD_PREFIX = "/uploads";
export const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");

/** Resolve a `/uploads/...` public path to an absolute on-disk path (or null if unsafe). */
export function resolveUploadPath(publicPath: string): string | null {
  if (!publicPath.startsWith(PUBLIC_UPLOAD_PREFIX + "/")) return null;
  const rel = publicPath.slice(PUBLIC_UPLOAD_PREFIX.length + 1);
  const abs = path.resolve(UPLOADS_DIR, rel);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) return null;
  return abs;
}
