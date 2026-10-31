export const productivityTools = [
  {
    slug: "json-compare",
    name: "JSON Compare",
    category: "Format & validasi",
    icon: "≠",
    description: "Bandingkan nilai JSON dan temukan perubahan di setiap path.",
    keywords: "json diff compare pembanding object array",
  },
  {
    slug: "image-resize",
    name: "Image Compress & Resize",
    category: "Konverter",
    icon: "▧",
    description:
      "Kompres dan ubah ukuran gambar JPG, PNG, atau WebP secara lokal.",
    keywords: "gambar image compress resize kompres foto ukuran",
  },
  {
    slug: "dummy-data",
    name: "Dummy Data Generator",
    category: "Generator",
    icon: "▤",
    description:
      "Buat data pengguna, produk, dan transaksi dalam JSON atau CSV.",
    keywords: "fake mock dummy data csv json seed",
  },
  {
    slug: "qr-generator",
    name: "QR Generator",
    category: "Generator",
    icon: "▦",
    description: "Buat QR untuk teks, URL, dan Wi-Fi, lalu unduh sebagai PNG.",
    keywords: "qr code barcode wifi link png",
  },
];

export function compareJson(left, right) {
  const parse = (text, side) => {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`JSON ${side} tidak valid.`);
    }
  };
  const changes = [];
  const walk = (a, b, path) => {
    if (Object.is(a, b)) return;
    if (
      a !== null &&
      b !== null &&
      typeof a === "object" &&
      typeof b === "object" &&
      Array.isArray(a) === Array.isArray(b)
    ) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const next = `${path}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`;
        if (!Object.hasOwn(a, key))
          changes.push({ path: next, type: "Ditambahkan", after: b[key] });
        else if (!Object.hasOwn(b, key))
          changes.push({ path: next, type: "Dihapus", before: a[key] });
        else walk(a[key], b[key], next);
      }
    } else
      changes.push({
        path: path || "(root)",
        type: "Diubah",
        before: a,
        after: b,
      });
  };
  walk(parse(left, "kiri"), parse(right, "kanan"), "");
  return changes;
}

export function generateDummy(kind, count) {
  if (!Number.isInteger(count) || count < 1 || count > 1000)
    throw new Error("Jumlah data harus 1–1000.");
  if (!["users", "products", "transactions"].includes(kind))
    throw new Error("Jenis data tidak dikenal.");
  const names = [
    "Andi",
    "Budi",
    "Citra",
    "Dewi",
    "Eka",
    "Farah",
    "Gilang",
    "Hana",
  ];
  const cities = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Medan"];
  const pick = (values) => values[Math.floor(Math.random() * values.length)];
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    if (kind === "users")
      return {
        id,
        name: `${pick(names)} ${pick(["Pratama", "Putri", "Wijaya", "Saputra"])}`,
        email: `user${id}@example.com`,
        city: pick(cities),
        active: Math.random() > 0.3,
      };
    if (kind === "products")
      return {
        id,
        sku: `DEMO-${String(id).padStart(5, "0")}`,
        name: `${pick(["Keyboard", "Mouse", "Monitor", "Headset"])} ${id}`,
        price: (1 + Math.floor(Math.random() * 100)) * 10000,
        stock: Math.floor(Math.random() * 200),
      };
    return {
      id,
      reference: `TRX-${String(id).padStart(6, "0")}`,
      user_id: 1 + Math.floor(Math.random() * 50),
      amount: (1 + Math.floor(Math.random() * 100)) * 10000,
      currency: "IDR",
      status: pick(["pending", "paid", "cancelled"]),
    };
  });
}

export function toCsv(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const quote = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [
    keys.map(quote).join(","),
    ...rows.map((row) => keys.map((key) => quote(row[key])).join(",")),
  ].join("\r\n");
}

export function fitImage(width, height, maxWidth, maxHeight) {
  if (
    ![width, height, maxWidth, maxHeight].every(
      (v) => Number.isInteger(v) && v > 0 && v <= 40000,
    )
  )
    throw new Error(
      "Ukuran harus bilangan bulat positif, maksimal 40000 piksel.",
    );
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function wifiQr(ssid, password, security, hidden) {
  if (!ssid.trim()) throw new Error("Nama Wi-Fi wajib diisi.");
  const escape = (value) => value.replace(/[\\;,:\"]/g, "\\$&");
  return `WIFI:T:${security};S:${escape(ssid)};P:${security === "nopass" ? "" : escape(password)};H:${hidden ? "true" : "false"};;`;
}
