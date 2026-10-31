export const AES_TEAM_KEY = "12345abc67890def";
export const AES_TEAM_IV = "abc12345def67890";
function parameters(keyText, ivText) {
  const encoder = new TextEncoder();
  const key = encoder.encode(keyText),
    iv = encoder.encode(ivText);
  if (key.length !== 16)
    throw new Error("Key AES-128 harus tepat 16 byte UTF-8.");
  if (iv.length !== 16)
    throw new Error("IV AES-CBC harus tepat 16 byte UTF-8.");
  if (!globalThis.crypto?.subtle)
    throw new Error("Web Crypto tidak tersedia. Gunakan HTTPS atau localhost.");
  return { key, iv };
}
function encodeCiphertext(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return {
    hex: Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""),
    base64: btoa(binary),
  };
}
export function parseCiphertext(input, encoding) {
  const value = input.replace(/\s/g, "");
  if (!value) throw new Error("Masukkan ciphertext terlebih dahulu.");
  let bytes;
  if (encoding === "hex") {
    if (!/^[\da-f]+$/i.test(value) || value.length % 2 !== 0)
      throw new Error(
        "HEX tidak valid. Gunakan pasangan karakter 0–9 dan a–f.",
      );
    bytes = Uint8Array.from(value.match(/.{2}/g), (h) => parseInt(h, 16));
  } else {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0)
      throw new Error("Base64 tidak valid. Periksa karakter dan padding =.");
    try {
      bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    } catch {
      throw new Error("Base64 tidak valid. Periksa karakter dan padding =.");
    }
  }
  if (bytes.length % 16 !== 0)
    throw new Error("Ciphertext AES-CBC harus berupa kelipatan 16 byte.");
  return bytes;
}
export async function encryptAes128(
  plaintext,
  keyText = AES_TEAM_KEY,
  ivText = AES_TEAM_IV,
) {
  const { key, iv } = parameters(keyText, ivText);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt"],
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    new TextEncoder().encode(plaintext),
  );
  return encodeCiphertext(new Uint8Array(ciphertext));
}
export async function decryptAes128(
  ciphertext,
  encoding,
  keyText = AES_TEAM_KEY,
  ivText = AES_TEAM_IV,
) {
  const { key, iv } = parameters(keyText, ivText);
  const bytes = parseCiphertext(ciphertext, encoding);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["decrypt"],
  );
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      bytes,
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(plain);
  } catch {
    throw new Error(
      "Decrypt gagal. Periksa ciphertext, key, IV, mode AES-CBC, dan padding PKCS#7.",
    );
  }
}
