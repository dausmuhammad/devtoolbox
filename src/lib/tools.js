import { extendedToolDefinitions } from "./extended-tools.js";
import { productivityTools } from "./productivity-tools.js";
export const tools = [
  {
    slug: "json",
    name: "JSON Formatter",
    category: "Format & validasi",
    icon: "{}",
    description: "Rapikan, validasi, dan minify data JSON.",
    keywords: "validator pretty object",
  },
  {
    slug: "jwt",
    name: "JWT Decoder",
    category: "Encode & decode",
    icon: "◈",
    description: "Baca header, payload, dan masa berlaku token.",
    keywords: "token auth signature",
  },
  {
    slug: "base64",
    name: "Base64",
    category: "Encode & decode",
    icon: "64",
    description: "Encode dan decode teks, termasuk Unicode.",
    keywords: "encoding unicode",
  },
  {
    slug: "image-base64",
    name: "Image Base64",
    category: "Encode & decode",
    icon: "▧",
    description: "Ubah gambar ke Base64 atau decode kembali ke gambar.",
    keywords:
      "image gambar foto png jpg jpeg webp data url encode decode upload",
  },
  {
    slug: "url",
    name: "URL Encoder",
    category: "Encode & decode",
    icon: "↗",
    description: "Konversi karakter URL dengan mudah.",
    keywords: "uri component percent",
  },
  {
    slug: "uuid",
    name: "UUID Generator",
    category: "Generator",
    icon: "#",
    description: "Buat identitas unik UUID v4 dalam sekejap.",
    keywords: "random id bulk",
  },
  {
    slug: "password",
    name: "Password Generator",
    category: "Generator",
    icon: "✳",
    description: "Buat password acak sesuai kebutuhan.",
    keywords: "random secure kata sandi",
  },
  {
    slug: "timestamp",
    name: "Timestamp Converter",
    category: "Konverter",
    icon: "◷",
    description: "Ubah Unix timestamp menjadi tanggal dan waktu.",
    keywords: "date time unix epoch",
  },
  {
    slug: "regex",
    name: "Regex Tester",
    category: "Format & validasi",
    icon: ".*",
    description: "Uji pola, temukan match, dan periksa grup.",
    keywords: "regular expression pattern",
  },
  {
    slug: "diff",
    name: "Text Diff",
    category: "Teks & kode",
    icon: "±",
    description: "Lihat perbedaan di antara dua versi teks.",
    keywords: "compare bandingkan",
  },
  {
    slug: "hash",
    name: "Hash Generator",
    category: "Generator",
    icon: "⌗",
    description: "Hitung hash SHA menggunakan Web Crypto.",
    keywords: "sha256 sha384 sha512 digest",
  },
  {
    slug: "case",
    name: "Case Converter",
    category: "Teks & kode",
    icon: "Aa",
    description: "Ubah gaya penulisan untuk setiap kebutuhan.",
    keywords: "camel snake kebab pascal uppercase lowercase",
  },
  {
    slug: "color",
    name: "Color Converter",
    category: "Konverter",
    icon: "◐",
    description: "Jelajahi warna dalam HEX, RGB, dan HSL.",
    keywords: "warna picker hex rgb hsl",
  },
  {
    slug: "aes-128",
    name: "AES-128 Encrypt & Decrypt",
    category: "Generator",
    icon: "⚿",
    description: "Enkripsi JSON atau teks dengan key tim ke HEX atau Base64.",
    keywords:
      "aes 128 cbc pkcs7 json text key iv kunci encryption decryption enkripsi dekripsi crypto",
  },
  ...extendedToolDefinitions,
  ...productivityTools,
];
export const categories = [...new Set(tools.map((t) => t.category))];
export function searchTools(query) {
  const q = query.toLowerCase().trim();
  return tools.filter((t) =>
    `${t.name} ${t.category} ${t.keywords} ${t.description}`
      .toLowerCase()
      .includes(q),
  );
}

export const categoryIcons = {
  "Format & validasi": "{}",
  "Encode & decode": "⇄",
  Generator: "✳",
  Konverter: "◷",
  "Teks & kode": "Aa",
  "API Tools": "⇥",
  "Backend Tools": "▤",
  "Frontend Tools": "▧",
};
