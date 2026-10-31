export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const SAMPLE_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const formats = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
  "image/avif": "avif",
};
export function detectImageMime(bytes) {
  const starts = (signature) => signature.every((b, i) => bytes[i] === b);
  const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  if (starts([137, 80, 78, 71, 13, 10, 26, 10])) return "image/png";
  if (starts([255, 216, 255])) return "image/jpeg";
  if (["GIF87a", "GIF89a"].includes(text(0, 6))) return "image/gif";
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  if (starts([66, 77])) return "image/bmp";
  if (starts([0, 0, 1, 0])) return "image/x-icon";
  if (text(4, 8) === "ftyp" && ["avif", "avis"].includes(text(8, 12)))
    return "image/avif";
  throw new Error(
    "Format gambar tidak dikenali. Gunakan PNG, JPG, GIF, WebP, BMP, ICO, atau AVIF.",
  );
}
export function imageBytesToBase64(bytes) {
  if (!bytes.length) throw new Error("File gambar kosong.");
  if (bytes.length > MAX_IMAGE_BYTES)
    throw new Error("Ukuran gambar maksimal 10 MB.");
  const mime = detectImageMime(bytes);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const base64 = btoa(binary);
  return {
    mime,
    base64,
    dataUrl: `data:${mime};base64,${base64}`,
    extension: formats[mime],
    bytes,
  };
}
export function parseBase64Image(input) {
  if (input.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 2048)
    throw new Error("Ukuran gambar maksimal 10 MB.");
  const value = input.trim();
  if (!value) throw new Error("Masukkan Base64 gambar terlebih dahulu.");
  let declared;
  let payload = value;
  if (value.startsWith("data:")) {
    const match = /^data:([^;,]+);base64,([\s\S]*)$/i.exec(value);
    if (!match)
      throw new Error(
        "Data URL harus memakai format data:image/png;base64,...",
      );
    declared = match[1].toLowerCase();
    payload = match[2];
  }
  payload = payload.replace(/\s/g, "");
  if (
    !payload ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(payload) ||
    payload.length % 4 === 1
  )
    throw new Error("Base64 tidak valid. Periksa karakter dan padding.");
  let bytes;
  try {
    bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("Base64 tidak valid. Periksa karakter dan padding.");
  }
  const result = imageBytesToBase64(bytes);
  if (
    declared &&
    declared !== result.mime &&
    !(declared === "image/jpg" && result.mime === "image/jpeg") &&
    !(declared === "image/vnd.microsoft.icon" && result.mime === "image/x-icon")
  )
    throw new Error("Tipe gambar pada Data URL tidak cocok dengan isi file.");
  return result;
}
