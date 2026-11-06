/**
 * Zero-dependency image helpers for admin uploads.
 * Parses intrinsic dimensions from file headers (PNG / JPEG / GIF / WebP)
 * and validates upload type + size. AVIF/heic return null dimensions
 * (Media.width/height are nullable).
 */

export const UPLOAD_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export const UPLOAD_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function isUploadableImage(mime: string): boolean {
  return Object.prototype.hasOwnProperty.call(UPLOAD_MIME_TO_EXT, mime);
}

export function imageDims(
  buf: ArrayBuffer | Uint8Array
): { width: number; height: number } | null {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  try {
    return pngDims(b) ?? jpegDims(b) ?? gifDims(b) ?? webpDims(b);
  } catch {
    return null;
  }
}

function pngDims(b: Uint8Array): { width: number; height: number } | null {
  // 89 50 4E 47 0D 0A 1A 0A | IHDR (len 13) | width u32be | height u32be
  if (b.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) if (b[i] !== sig[i]) return null;
  if (b[12] !== 0x49 || b[13] !== 0x48 || b[14] !== 0x44 || b[15] !== 0x52) return null;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
}

function gifDims(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 10) return null;
  const h = String.fromCharCode(b[0], b[1], b[2], b[3]);
  if (h !== "GIF8" || (b[4] !== 0x37 && b[4] !== 0x39) || b[5] !== 0x61) return null;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
}

function jpegDims(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    // Standalone markers without a length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = view.getUint16(i + 2, false);
    // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return { height: view.getUint16(i + 5, false), width: view.getUint16(i + 7, false) };
    }
    i += 2 + len;
  }
  return null;
}

function webpDims(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 30) return null;
  const riff = String.fromCharCode(b[0], b[1], b[2], b[3]);
  const webp = String.fromCharCode(b[8], b[9], b[10], b[11]);
  if (riff !== "RIFF" || webp !== "WEBP") return null;
  const fourcc = String.fromCharCode(b[12], b[13], b[14], b[15]);
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (fourcc === "VP8 ") {
    // Lossy: 3-byte frame tag + 3-byte sync code, then 14-bit w/h.
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }
  if (fourcc === "VP8L") {
    const bits = view.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === "VP8X") {
    const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { width: w, height: h };
  }
  return null;
}
