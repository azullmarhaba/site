import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/server/services/audit";
import { UPLOAD_MAX_BYTES, UPLOAD_MIME_TO_EXT, isUploadableImage, imageDims } from "@/lib/image";
import { PUBLIC_UPLOAD_PREFIX, UPLOADS_DIR, resolveUploadPath } from "@/lib/uploads";

export async function GET(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const pick = url.searchParams.get("pick");

  if (id) {
    const media = await prisma.media.findUnique({
      where: { id },
      select: { id: true, path: true, filename: true, alt: true, caption: true, width: true, height: true, mimeType: true, sizeBytes: true, deletedAt: true },
    });
    if (!media || media.deletedAt) return jsonError("Not found", 404);
    return jsonOk(media);
  }

  const media = await prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: pick === "1" ? 80 : 120,
    select: { id: true, path: true, filename: true, alt: true, caption: true, width: true, height: true, mimeType: true, sizeBytes: true, createdAt: true },
  });
  return jsonOk({ media });
}

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart form data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError("No file provided", 400);
  if (file.size > UPLOAD_MAX_BYTES) return jsonError("File exceeds the 8 MB limit", 413);
  const mime = file.type;
  if (!isUploadableImage(mime)) return jsonError("Unsupported image type", 415);

  const ext = UPLOAD_MIME_TO_EXT[mime];
  const buffer = Buffer.from(await file.arrayBuffer());
  const dims = imageDims(buffer);

  const now = new Date();
  const folder = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const diskName = `${randomUUID()}.${ext}`;
  const relDir = path.join(folder);
  const absDir = path.join(UPLOADS_DIR, relDir);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, diskName), buffer);

  const publicPath = `${PUBLIC_UPLOAD_PREFIX}/${folder}/${diskName}`;
  const alt = typeof form.get("alt") === "string" ? (form.get("alt") as string).trim().slice(0, 320) : null;

  const media = await prisma.media.create({
    data: {
      filename: file.name.slice(0, 255),
      path: publicPath,
      mimeType: mime,
      sizeBytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      alt: alt || null,
      uploadedBy: user.id,
    },
    select: { id: true, path: true, filename: true, alt: true, caption: true, width: true, height: true, mimeType: true, sizeBytes: true },
  });
  await logAudit({ actorId: user.id, action: "media.upload", entity: "Media", entityId: media.id, diff: { path: publicPath } });
  return jsonOk(media, 201);
}

export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!body || typeof body !== "object") return jsonError("Invalid JSON body", 400);
  const { id, alt, caption, filename } = body as Record<string, unknown>;
  if (typeof id !== "string" || !id) return jsonError("Missing id", 400);

  const data: { alt?: string | null; caption?: string | null; filename?: string } = {};
  if (typeof alt === "string" || alt === null) data.alt = alt ? String(alt).trim().slice(0, 320) || null : null;
  if (typeof caption === "string" || caption === null) data.caption = caption ? String(caption).trim().slice(0, 400) || null : null;
  if (typeof filename === "string" && filename.trim()) data.filename = filename.trim().slice(0, 255);

  try {
    const media = await prisma.media.update({
      where: { id },
      data,
      select: { id: true, path: true, filename: true, alt: true, caption: true, width: true, height: true },
    });
    await logAudit({ actorId: user.id, action: "media.update", entity: "Media", entityId: id, diff: data });
    return jsonOk(media);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === "P2025") {
      return jsonError("Not found", 404);
    }
    console.error("[admin media patch]", err);
    return jsonError("Update failed", 500);
  }
}

export async function DELETE(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  let id = new URL(request.url).searchParams.get("id");
  if (!id) {
    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object" && typeof (body as Record<string, unknown>).id === "string") {
        id = (body as Record<string, string>).id;
      }
    } catch {
      /* ignore */
    }
  }
  if (!id) return jsonError("Missing id", 400);

  const media = await prisma.media.findUnique({ where: { id }, select: { id: true, path: true, deletedAt: true } });
  if (!media || media.deletedAt) return jsonError("Not found", 404);

  await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });

  const abs = resolveUploadPath(media.path);
  if (abs) {
    await unlink(abs).catch(() => undefined);
  }
  await logAudit({ actorId: user.id, action: "media.delete", entity: "Media", entityId: id, diff: { path: media.path } });
  return jsonOk({ id });
}
