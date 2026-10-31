export function formatJson(input, minify = false) {
  try {
    return JSON.stringify(JSON.parse(input), null, minify ? undefined : 2);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "JSON tidak valid";
    const position = /position (\d+)/i.exec(msg);
    if (position) {
      const before = input.slice(0, Number(position[1]));
      throw new Error(
        `${msg} — Baris ${before.split("\n").length}, kolom ${before.split("\n").at(-1).length + 1}`,
      );
    }
    throw new Error(msg);
  }
}
export function encodeBase64(text) {
  return btoa(
    Array.from(new TextEncoder().encode(text), (b) =>
      String.fromCharCode(b),
    ).join(""),
  );
}
export function decodeBase64(text) {
  const value = text.trim();
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1)
    throw new Error("Base64 tidak valid. Periksa karakter dan padding.");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(atob(value), (c) => c.charCodeAt(0)),
    );
  } catch {
    throw new Error("Base64 tidak valid atau hasilnya bukan teks UTF-8.");
  }
}
export function decodeJwt(token) {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1])
    throw new Error("JWT harus memiliki tiga bagian yang dipisahkan titik.");
  const parse = (s) => {
    const value = s.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeBase64(value));
  };
  const header = parse(parts[0]),
    payload = parse(parts[1]);
  if (
    !header ||
    !payload ||
    typeof header !== "object" ||
    typeof payload !== "object" ||
    Array.isArray(header) ||
    Array.isArray(payload)
  )
    throw new Error("Header dan payload harus berupa objek JSON.");
  return { header, payload };
}
export function convertCase(text, mode) {
  const words = text
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  switch (mode) {
    case "UPPERCASE":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "camelCase":
      return words.map((w, i) => (i ? cap(w) : w)).join("");
    case "PascalCase":
      return words.map(cap).join("");
    case "snake_case":
      return words.join("_");
    default:
      return words.join("-");
  }
}
export function randomInt(max) {
  const limit = 4294967296 - (4294967296 % max);
  const a = new Uint32Array(1);
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % max;
}
export function generatePassword(length, sets) {
  if (!sets.length) throw new Error("Pilih minimal satu kelompok karakter.");
  if (length < sets.length || length > 128)
    throw new Error("Panjang harus cukup untuk setiap kelompok, maksimal 128.");
  const all = sets.join("");
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
export function timestampDate(input, unit) {
  if (!/^-?\d+(\.\d+)?$/.test(input.trim()))
    throw new Error("Masukkan timestamp berupa angka.");
  const date = new Date(Number(input) * (unit === "seconds" ? 1000 : 1));
  if (!Number.isFinite(date.getTime()))
    throw new Error("Timestamp di luar rentang tanggal.");
  return date;
}
export function colorFormats(input) {
  let rgb;
  const hex = input.trim().match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else {
    const r = input.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    const h = input.match(
      /^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i,
    );
    if (r) {
      rgb = r.slice(1).map(Number);
      if (rgb.some((v) => v > 255))
        throw new Error("RGB harus berada di antara 0–255.");
    } else if (h) {
      const hue = Number(h[1]),
        s = Number(h[2]) / 100,
        l = Number(h[3]) / 100;
      if (![hue, s, l].every(Number.isFinite) || hue > 360 || s > 1 || l > 1)
        throw new Error("HSL di luar rentang.");
      const a = s * Math.min(l, 1 - l);
      rgb = [0, 8, 4].map((n) => {
        const k = (n + hue / 30) % 12;
        return Math.round(
          255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))),
        );
      });
    } else throw new Error("Gunakan HEX, rgb(r, g, b), atau hsl(h, s%, l%).");
  }
  const [r, g, b] = rgb.map((v) => v / 255),
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  let h = 0;
  if (d) {
    h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return {
    hex: "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join(""),
    rgb: `rgb(${rgb.join(", ")})`,
    hsl: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
  };
}
