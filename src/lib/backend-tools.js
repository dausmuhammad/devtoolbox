export async function formatSql(
  input,
  language = "sql",
  keywordCase = "upper",
) {
  if (!input.trim()) throw new Error("Masukkan query SQL terlebih dahulu.");
  if (input.length > 100000) throw new Error("SQL maksimal 100.000 karakter.");
  const { format } = await import("sql-formatter");
  return format(input, { language, keywordCase, tabWidth: 2 });
}
export async function cronSchedule(
  expression,
  from,
  timeZone = "Asia/Jakarta",
  count = 5,
) {
  if (!expression.trim()) throw new Error("Masukkan ekspresi cron.");
  if (expression.length > 500)
    throw new Error("Ekspresi cron terlalu panjang.");
  if (!Number.isInteger(count) || count < 1 || count > 20)
    throw new Error("Jumlah jadwal harus 1–20.");
  try {
    new Intl.DateTimeFormat("id-ID", { timeZone }).format(new Date());
  } catch {
    throw new Error("Zona waktu IANA tidak valid.");
  }
  if (typeof from === "string" && !/(?:Z|[+-]\d{2}:\d{2})$/i.test(from))
    throw new Error(
      "Waktu acuan harus mencantumkan zona, misalnya 2026-01-05T00:00:00Z.",
    );
  const date = new Date(from);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Waktu acuan tidak valid.");
  const { CronExpressionParser } =
    await import("cron-parser/dist/CronExpressionParser.js");
  const interval = CronExpressionParser.parse(expression, {
    currentDate: date,
    tz: timeZone,
  });
  return Array.from({ length: count }, () => {
    const date = interval.next().toDate();
    return {
      utc: date.toISOString(),
      local: new Intl.DateTimeFormat("id-ID", {
        timeZone,
        dateStyle: "full",
        timeStyle: "long",
      }).format(date),
    };
  });
}
// Grammar ENV yang didukung: KEY=value, export KEY=value, komentar #,
// single quote literal dan double quote dengan escape JSON. Tanpa ekspansi variabel.
export function envToJson(input) {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const output = Object.create(null);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(
      raw,
    );
    if (!match) throw new Error(`ENV baris ${i + 1} harus berupa KEY=value.`);
    const name = match[1];
    let value = match[2];
    if (Object.hasOwn(output, name))
      throw new Error(`Variabel ${name} muncul lebih dari sekali.`);
    if (value.startsWith('"')) {
      let text = value;
      while (true) {
        let end = -1;
        for (let p = 1; p < text.length; p++) {
          if (text[p] === "\\") {
            p++;
            continue;
          }
          if (text[p] === '"') {
            end = p;
            break;
          }
        }
        if (end >= 0) {
          if (
            text.slice(end + 1).trim() &&
            !text
              .slice(end + 1)
              .trim()
              .startsWith("#")
          )
            throw new Error(
              `Nilai ${name} memiliki karakter setelah penutup kutip.`,
            );
          try {
            value = JSON.parse(text.slice(0, end + 1).replace(/\n/g, "\\n"));
          } catch {
            throw new Error(
              `Escape double quote pada ${name} tidak valid. Gunakan \\n, \\" dan \\\\.`,
            );
          }
          break;
        }
        if (++i >= lines.length)
          throw new Error(`Kutip pada ${name} belum ditutup.`);
        text += "\n" + lines[i];
      }
    } else if (value.startsWith("'")) {
      let text = value;
      while (text.indexOf("'", 1) < 0) {
        if (++i >= lines.length)
          throw new Error(`Kutip pada ${name} belum ditutup.`);
        text += "\n" + lines[i];
      }
      const end = text.indexOf("'", 1);
      if (
        text.slice(end + 1).trim() &&
        !text
          .slice(end + 1)
          .trim()
          .startsWith("#")
      )
        throw new Error(`Karakter setelah kutip ${name} tidak valid.`);
      value = text.slice(1, end);
    } else value = value.split("#")[0].trim();
    output[name] = value;
  }
  if (!Object.keys(output).length)
    throw new Error("Tidak ada variabel ENV ditemukan.");
  return JSON.stringify(output, null, 2);
}
export function jsonToEnv(input) {
  const data = JSON.parse(input);
  if (!data || Array.isArray(data) || typeof data !== "object")
    throw new Error("JSON harus berupa objek key/value.");
  return Object.entries(data)
    .map(([name, value]) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
        throw new Error(`Nama variabel ${name} tidak valid.`);
      if (typeof value !== "string")
        throw new Error(
          `Nilai ${name} harus berupa string agar konversi tidak mengubah tipe.`,
        );
      return `${name}=${JSON.stringify(value)}`;
    })
    .join("\n");
}
