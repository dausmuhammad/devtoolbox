export async function htmlEntities(input, mode) {
  const he = await import("he");
  return mode === "encode"
    ? he.encode(input, { useNamedReferences: true })
    : he.decode(input, { strict: true });
}
export function convertCssUnit(value, from, to, root = 16, parent = 16) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value))
  )
    throw new Error("Masukkan nilai CSS berupa angka.");
  if (
    !Number.isFinite(root) ||
    root <= 0 ||
    !Number.isFinite(parent) ||
    parent <= 0
  )
    throw new Error("Ukuran font dasar harus lebih dari 0.");
  const factors = { px: 1, rem: root, em: parent };
  if (!Object.hasOwn(factors, from) || !Object.hasOwn(factors, to))
    throw new Error("Unit tidak didukung.");
  const number = (Number(value) * factors[from]) / factors[to];
  if (!Number.isFinite(number)) throw new Error("Hasil di luar rentang angka.");
  return Number(number.toFixed(6));
}
export function boxShadow({ x, y, blur, spread, color, opacity, inset }) {
  if (
    ![x, y, blur, spread, opacity].every(Number.isFinite) ||
    blur < 0 ||
    opacity < 0 ||
    opacity > 100
  )
    throw new Error("Nilai shadow tidak valid.");
  if (!/^#[\da-f]{6}$/i.test(color))
    throw new Error("Warna shadow harus berupa HEX 6 digit.");
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(${rgb.join(", ")}, ${Number((opacity / 100).toFixed(2))})`;
}
