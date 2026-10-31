const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
export function parseHeaders(text) {
  const rows = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    if (index === 0 && /^HTTP\/\d(?:\.\d)?\s+\d{3}\b/.test(line)) return;
    const colon = line.indexOf(":");
    if (colon < 1)
      throw new Error(`Header baris ${index + 1} harus berupa Nama: Nilai.`);
    const name = line.slice(0, colon).trim(),
      value = line.slice(colon + 1).trim();
    if (!HEADER_NAME.test(name) || /[\r\n\0]/.test(value))
      throw new Error(`Header baris ${index + 1} tidak valid.`);
    rows.push([name, value]);
  });
  return rows;
}
export function headersToJson(text) {
  return JSON.stringify(
    parseHeaders(text).map(([name, value]) => ({ name, value })),
    null,
    2,
  );
}
export function jsonToHeaders(text) {
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed)
    ? parsed.map((row) => {
        if (
          !row ||
          typeof row.name !== "string" ||
          typeof row.value !== "string"
        )
          throw new Error(
            "Array harus berisi objek name dan value berupa string.",
          );
        return [row.name, row.value];
      })
    : parsed && typeof parsed === "object"
      ? Object.entries(parsed)
      : null;
  if (!rows) throw new Error("Gunakan objek JSON atau array header.");
  return rows
    .map(([name, value]) => {
      if (
        !HEADER_NAME.test(name) ||
        typeof value !== "string" ||
        /[\r\n\0]/.test(value)
      )
        throw new Error(
          "Nama/nilai header tidak valid atau mengandung baris baru.",
        );
      return `${name}: ${value}`;
    })
    .join("\n");
}
function shellQuote(value) {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}
export function buildRequest({ url, method = "GET", headers = "", body = "" }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "Masukkan URL lengkap, misalnya https://api.example.com/users.",
    );
  }
  if (!["http:", "https:"].includes(parsed.protocol))
    throw new Error("URL hanya mendukung HTTP atau HTTPS.");
  if (parsed.username || parsed.password)
    throw new Error(
      "Gunakan header Authorization untuk kredensial, bukan username/password di URL.",
    );
  const verb = method.toUpperCase();
  if (
    !["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(verb)
  )
    throw new Error("Metode HTTP tidak didukung.");
  if (["GET", "HEAD"].includes(verb) && body)
    throw new Error(
      `${verb} tidak memakai body di Fetch API. Kosongkan body atau pilih metode lain.`,
    );
  const rows = parseHeaders(headers);
  const parts = [
    verb === "HEAD" ? "curl --head" : "curl --request " + verb,
    "  --url " + shellQuote(parsed.href),
    ...rows.map(([n, v]) => "  --header " + shellQuote(`${n}: ${v}`)),
  ];
  if (body) parts.push("  --data-raw " + shellQuote(body));
  const options = { method: verb, headers: rows };
  if (body) options.body = body;
  return {
    curl: parts.join(" \\\n"),
    fetch: `const response = await fetch(${JSON.stringify(parsed.href)}, ${JSON.stringify(options, null, 2)});\nconst body = await response.text();\nif (!response.ok) {\n  throw new Error(\`HTTP \${response.status}: \${body}\`);\n}\nconsole.log(body);`,
  };
}
export function parseQuery(input) {
  let value = input.trim();
  if (!value) return [];
  if (/^https?:\/\//i.test(value)) {
    value = new URL(value).search.slice(1);
  } else value = value.replace(/^\?/, "").split("#")[0];
  if (/%(?![\da-f]{2})/i.test(value))
    throw new Error("Percent encoding tidak valid pada query.");
  for (const segment of value.split("&"))
    for (const part of segment.split("="))
      try {
        decodeURIComponent(part.replace(/\+/g, " "));
      } catch {
        throw new Error("Query mengandung encoding UTF-8 yang tidak valid.");
      }
  return [...new URLSearchParams(value).entries()].map(([name, value]) => ({
    name,
    value,
  }));
}
export function buildQuery(rows, base = "") {
  const params = new URLSearchParams();
  for (const row of rows) {
    if (!row.name) throw new Error("Nama parameter tidak boleh kosong.");
    params.append(row.name, row.value);
  }
  const query = params.toString();
  let url = "";
  if (base.trim()) {
    let parsed;
    try {
      parsed = new URL(base);
    } catch {
      throw new Error("URL dasar harus berupa URL lengkap.");
    }
    if (!["http:", "https:"].includes(parsed.protocol))
      throw new Error("URL dasar hanya HTTP/HTTPS.");
    parsed.search = query;
    url = parsed.href;
  }
  return { query, url, json: JSON.stringify(rows, null, 2) };
}
