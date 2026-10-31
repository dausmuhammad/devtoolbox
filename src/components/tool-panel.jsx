"use client";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Slider,
  Tag,
} from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  SwapOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { TextEditor, ResultEditor } from "./tool-editor";
import {
  colorFormats,
  convertCase,
  decodeBase64,
  decodeJwt,
  encodeBase64,
  formatJson,
  generatePassword,
  timestampDate,
} from "@/lib/transforms";
export default function ToolPanel({ tool }) {
  const { message } = App.useApp();
  const [input, setInput] = useState(""),
    [output, setOutput] = useState(""),
    [error, setError] = useState(""),
    [mode, setMode] = useState("component"),
    [count, setCount] = useState(5),
    [length, setLength] = useState(20),
    [sets, setSets] = useState(["upper", "lower", "number", "symbol"]),
    [unit, setUnit] = useState("seconds"),
    [date, setDate] = useState(""),
    [pattern, setPattern] = useState(""),
    [flags, setFlags] = useState("g"),
    [matches, setMatches] = useState([]),
    [busy, setBusy] = useState(false),
    [second, setSecond] = useState(""),
    [diff, setDiff] = useState([]),
    [hash, setHash] = useState("SHA-256"),
    [color, setColor] = useState("#27cbb4");
  const worker = useRef(null),
    timer = useRef(null);
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success("Berhasil disalin");
    } catch {
      message.error(
        "Tidak dapat menyalin. Pilih dan salin teks secara manual.",
      );
    }
  };
  const run = (fn) => {
    try {
      setOutput(fn());
      setError("");
    } catch (e) {
      setOutput("");
      setError(
        e instanceof URIError
          ? "Input URL tidak valid. Periksa karakter persen (%) dan encoding Unicode."
          : e instanceof Error
            ? e.message
            : "Input tidak valid.",
      );
    }
  };
  const reset = () => {
    setInput("");
    setOutput("");
    setError("");
    setMatches([]);
    setDiff([]);
    setSecond("");
    setDate("");
    setPattern("");
    setFlags("g");
    setColor("#27cbb4");
    worker.current?.terminate();
    if (timer.current) clearTimeout(timer.current);
    setBusy(false);
  };
  const sample = () => {
    const values = {
      json: '{"project":"DevToolBox","tools":12,"private":true,"tags":["developer","local-first"]}',
      jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZlbG9wZXIiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.demo",
      base64: "Halo developer 👋",
      url: "https://example.com/cari?q=halo dunia&bahasa=id",
      timestamp: "1700000000",
      regex: "Kontak: hello@example.com dan dev@toolbox.id",
      hash: "Halo DevToolBox",
      case: "hello developer workspace",
      diff: 'const name = "DevToolBox";\nconst version = 1;',
    };
    setInput(values[tool.slug] || "");
    if (tool.slug === "regex") setPattern("[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}");
    if (tool.slug === "diff")
      setSecond(
        'const name = "DevToolBox";\nconst version = 2;\nconst ready = true;',
      );
    setError("");
  };
  const editor = (label, value, onChange, placeholder) => (
    <TextEditor
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
  const result = (
    <ResultEditor
      value={output}
      onCopy={copy}
      rows={tool.slug === "password" ? 3 : tool.slug === "hash" ? 6 : 12}
    />
  );
  const regexRun = () => {
    worker.current?.terminate();
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    setError("");
    setMatches([]);
    const w = new Worker("/regex-worker.js");
    worker.current = w;
    timer.current = setTimeout(() => {
      w.terminate();
      setBusy(false);
      setError(
        "Pengujian dihentikan setelah 1 detik. Sederhanakan pola atau kurangi teks.",
      );
    }, 1000);
    w.onmessage = (e) => {
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      w.terminate();
      if (e.data.error) setError(e.data.error);
      else setMatches(e.data.matches);
    };
    w.onerror = () => {
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      w.terminate();
      setError("Worker tidak dapat menjalankan pola.");
    };
    w.postMessage({ pattern, flags, text: input });
  };
  let colorValue = null;
  try {
    colorValue = colorFormats(color);
  } catch {}
  const primary = (label, fn) => (
    <Button type="primary" onClick={fn}>
      {label}
    </Button>
  );
  return (
    <div key={tool.slug} className="tool-page">
      <Link className="back-link" href="/">
        ← Semua alat
      </Link>
      <div className="tool-page-heading">
        <span className="tool-icon large">{tool.icon}</span>
        <div>
          <Tag variant="filled" color="cyan">
            {tool.category}
          </Tag>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
        </div>
      </div>
      <div className="tool-surface">
        <div className="surface-toolbar">
          <span>
            <span className="status-dot" /> WORKSPACE LOKAL
          </span>
          <div>
            {!["uuid", "password", "color"].includes(tool.slug) && (
              <Button type="text" onClick={sample}>
                Contoh input
              </Button>
            )}
            <Button type="text" icon={<ClearOutlined />} onClick={reset}>
              Reset
            </Button>
          </div>
        </div>
        <div className="tool-content">
          {error && (
            <Alert
              className="tool-alert"
              type="error"
              showIcon
              title="Input belum dapat diproses"
              description={error}
              closable
              onClose={() => setError("")}
            />
          )}
          {tool.slug === "json" && (
            <>
              <div className="action-row">
                {primary("Format JSON", () => run(() => formatJson(input)))}
                <Button onClick={() => run(() => formatJson(input, true))}>
                  Minify
                </Button>
                <Button
                  onClick={() => {
                    try {
                      formatJson(input);
                      setError("");
                      message.success("JSON valid");
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  Validasi
                </Button>
                <Button
                  disabled={!output}
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([output], { type: "application/json" }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "devtoolbox.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Unduh
                </Button>
              </div>
              <div className="editor-grid">
                {editor("Input JSON", input, setInput, '{"hello": "world"}')}
                {result}
              </div>
            </>
          )}
          {tool.slug === "jwt" && (
            <>
              <Alert
                type="warning"
                showIcon
                title="Decoding tidak memverifikasi signature atau keaslian token."
              />
              <div className="action-row">
                {primary("Decode token", () =>
                  run(() => {
                    const decoded = decodeJwt(input);
                    const times = ["iat", "nbf", "exp"]
                      .filter((k) => typeof decoded.payload[k] === "number")
                      .map((k) => {
                        const value = decoded.payload[k];
                        const d = new Date(value * 1000);
                        return `${k}: ${Number.isFinite(d.getTime()) ? d.toISOString() : "Tanggal di luar rentang"}${k === "exp" ? (value * 1000 < Date.now() ? " — Kedaluwarsa" : " — Belum kedaluwarsa (klaim token)") : ""}`;
                      });
                    return `HEADER\n${JSON.stringify(decoded.header, null, 2)}\n\nPAYLOAD\n${JSON.stringify(decoded.payload, null, 2)}\n\nWAKTU (UTC)\n${times.join("\n") || "Tidak ada klaim waktu."}`;
                  }),
                )}
              </div>
              <div className="editor-grid">
                {editor("Token JWT", input, setInput, "eyJhbGciOi…")}
                {result}
              </div>
            </>
          )}
          {(tool.slug === "base64" || tool.slug === "url") && (
            <>
              {tool.slug === "url" && (
                <div className="settings-row">
                  <Select
                    aria-label="Mode URL"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: "component", label: "encodeURIComponent" },
                      { value: "uri", label: "encodeURI" },
                    ]}
                  />
                  <p>
                    {mode === "component"
                      ? "Untuk nilai parameter: turut meng-encode &, /, ?, dan =."
                      : "Untuk URL utuh: mempertahankan pemisah seperti /, ?, &, dan =."}
                  </p>
                </div>
              )}
              <div className="action-row">
                {primary("Encode", () =>
                  run(() =>
                    tool.slug === "base64"
                      ? encodeBase64(input)
                      : mode === "component"
                        ? encodeURIComponent(input)
                        : encodeURI(input),
                  ),
                )}
                <Button
                  onClick={() =>
                    run(() =>
                      tool.slug === "base64"
                        ? decodeBase64(input)
                        : mode === "component"
                          ? decodeURIComponent(input)
                          : decodeURI(input),
                    )
                  }
                >
                  Decode
                </Button>
                <Button
                  icon={<SwapOutlined />}
                  onClick={() => {
                    setInput(output);
                    setOutput(input);
                    setError("");
                  }}
                >
                  Tukar
                </Button>
              </div>
              <div className="editor-grid">
                {editor("Input", input, setInput)}
                {result}
              </div>
            </>
          )}
          {tool.slug === "uuid" && (
            <>
              <div className="settings-row">
                <label>
                  Jumlah UUID{" "}
                  <InputNumber
                    aria-label="Jumlah UUID"
                    min={1}
                    max={1000}
                    value={count}
                    onChange={(v) => setCount(v ?? 1)}
                  />
                </label>
                {primary("Generate UUID", () =>
                  run(() => {
                    if (!Number.isInteger(count) || count < 1 || count > 1000)
                      throw new Error("Jumlah harus 1–1000.");
                    return Array.from({ length: count }, () =>
                      crypto.randomUUID(),
                    ).join("\n");
                  }),
                )}
                {primary("Buat satu", () => run(() => crypto.randomUUID()))}
                <Button disabled={!output} onClick={() => copy(output)}>
                  Salin semua
                </Button>
              </div>
              <div className="uuid-list">
                {output ? (
                  output.split("\n").map((v, i) => (
                    <div key={i}>
                      <code>{v}</code>
                      <Button
                        icon={<CopyOutlined />}
                        aria-label={`Salin UUID ${i + 1}`}
                        onClick={() => copy(v)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="empty">UUID Anda akan muncul di sini.</div>
                )}
              </div>
            </>
          )}
          {tool.slug === "password" && (
            <>
              <div className="password-settings">
                <label>
                  Panjang password: <strong>{length}</strong>
                </label>
                <Slider min={4} max={128} value={length} onChange={setLength} />
                <Checkbox.Group
                  value={sets}
                  onChange={(v) => setSets(v)}
                  options={[
                    { label: "Huruf besar (A–Z)", value: "upper" },
                    { label: "Huruf kecil (a–z)", value: "lower" },
                    { label: "Angka (0–9)", value: "number" },
                    { label: "Simbol (!@#)", value: "symbol" },
                  ]}
                />
              </div>
              <div className="action-row">
                {primary("Generate password", () =>
                  run(() =>
                    generatePassword(
                      length,
                      sets.map(
                        (s) =>
                          ({
                            upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                            lower: "abcdefghijklmnopqrstuvwxyz",
                            number: "0123456789",
                            symbol: "!@#$%^&*()-_=+[]{};:,.?",
                          })[s],
                      ),
                    ),
                  ),
                )}
              </div>
              {result}
              <p className="hint">
                {output
                  ? `${output.length} karakter · ${sets.length} kelompok dipilih. `
                  : ""}
                Menggunakan crypto.getRandomValues. Karakteristik ini bukan
                jaminan keamanan absolut; gunakan password unik untuk setiap
                akun.
              </p>
            </>
          )}
          {tool.slug === "timestamp" && (
            <>
              <div className="settings-row">
                <Select
                  aria-label="Satuan timestamp"
                  value={unit}
                  onChange={setUnit}
                  options={[
                    { value: "seconds", label: "Detik (seconds)" },
                    {
                      value: "milliseconds",
                      label: "Milidetik (milliseconds)",
                    },
                  ]}
                />
                <Button
                  onClick={() => {
                    const now = Date.now();
                    setInput(
                      String(unit === "seconds" ? Math.floor(now / 1000) : now),
                    );
                  }}
                >
                  Sekarang
                </Button>
              </div>
              <div className="editor-grid">
                <div>
                  <label>Unix timestamp</label>
                  <Input
                    aria-label="Unix timestamp"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="1700000000"
                  />
                  <div className="action-row">
                    {primary("Konversi ke tanggal", () =>
                      run(() => {
                        const d = timestampDate(input, unit);
                        return `UTC: ${d.toISOString()}\nLokal (${Intl.DateTimeFormat().resolvedOptions().timeZone}): ${d.toLocaleString("id-ID")}\n\nDetik: ${Math.floor(d.getTime() / 1000)}\nMilidetik: ${d.getTime()}`;
                      }),
                    )}
                  </div>
                  <label>Tanggal dan waktu lokal</label>
                  <Input
                    type="datetime-local"
                    aria-label="Tanggal dan waktu lokal"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <div className="action-row">
                    <Button
                      onClick={() =>
                        run(() => {
                          const d = new Date(date);
                          if (!Number.isFinite(d.getTime()))
                            throw new Error(
                              "Pilih tanggal dan waktu yang valid.",
                            );
                          return `Detik: ${Math.floor(d.getTime() / 1000)}\nMilidetik: ${d.getTime()}\nUTC: ${d.toISOString()}\nLokal (${Intl.DateTimeFormat().resolvedOptions().timeZone}): ${d.toLocaleString("id-ID")}`;
                        })
                      }
                    >
                      Konversi ke timestamp
                    </Button>
                  </div>
                </div>
                {result}
              </div>
            </>
          )}
          {tool.slug === "regex" && (
            <>
              <div className="regex-settings">
                <div>
                  <label>Pola regex</label>
                  <Input
                    aria-label="Pola regex"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="\\w+"
                  />
                </div>
                <div>
                  <label>Flags</label>
                  <Input
                    aria-label="Flags regex"
                    value={flags}
                    onChange={(e) => setFlags(e.target.value)}
                    placeholder="gim"
                  />
                </div>
                <Button type="primary" loading={busy} onClick={regexRun}>
                  Uji pola
                </Button>
              </div>
              <div className="editor-grid">
                {editor("Teks pengujian", input, setInput)}
                <div>
                  <label>
                    Match{" "}
                    <Tag>
                      {matches.length}
                      {matches.length === 2000 ? " (batas hasil)" : ""}
                    </Tag>
                  </label>
                  <div className="highlight-output">
                    {(() => {
                      let end = 0;
                      const nodes = [];
                      matches.forEach((m, i) => {
                        nodes.push(input.slice(end, m.index));
                        nodes.push(<mark key={i}>{m.value || "∅"}</mark>);
                        end = m.index + m.value.length;
                      });
                      nodes.push(input.slice(end));
                      return nodes;
                    })()}
                  </div>
                </div>
              </div>
              <p className="hint">
                Batas waktu 1 detik · Maksimal 2.000 match · Jalankan ulang
                setelah mengubah input.
              </p>
              {matches.length > 0 && (
                <>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => copy(JSON.stringify(matches, null, 2))}
                  >
                    Salin match dan grup
                  </Button>
                  <pre className="groups">
                    {JSON.stringify(matches, null, 2)}
                  </pre>
                </>
              )}
            </>
          )}
          {tool.slug === "diff" && (
            <>
              <div className="action-row">
                {primary("Bandingkan teks", async () => {
                  const { diffLines } = await import("diff");
                  setDiff(diffLines(input, second));
                  setError("");
                })}
              </div>
              <div className="editor-grid">
                {editor("Teks asli", input, setInput)}
                {editor("Teks baru", second, setSecond)}
              </div>
              <div className="result-title">
                <label>Perubahan</label>
                <Button
                  disabled={!diff.length}
                  icon={<CopyOutlined />}
                  onClick={() =>
                    copy(
                      diff
                        .map((p) =>
                          p.value
                            .split("\n")
                            .map(
                              (line) =>
                                (p.added ? "+ " : p.removed ? "- " : "  ") +
                                line,
                            )
                            .join("\n"),
                        )
                        .join("\n"),
                    )
                  }
                >
                  Salin perubahan
                </Button>
              </div>
              <div className="diff-columns">
                {[false, true].map((isNew) => (
                  <div key={String(isNew)}>
                    <label>{isNew ? "Versi baru" : "Versi asli"}</label>
                    <div className="diff-output">
                      {diff
                        .filter((p) => (isNew ? !p.removed : !p.added))
                        .map((part, i) => (
                          <pre
                            key={i}
                            className={
                              part.added
                                ? "added"
                                : part.removed
                                  ? "removed"
                                  : "unchanged"
                            }
                          >
                            <span>
                              {part.added ? "+" : part.removed ? "−" : " "}
                            </span>
                            {part.value}
                          </pre>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="diff-output diff-unified">
                {diff.length ? (
                  diff.map((part, i) => (
                    <pre
                      key={i}
                      className={
                        part.added
                          ? "added"
                          : part.removed
                            ? "removed"
                            : "unchanged"
                      }
                    >
                      <span>{part.added ? "+" : part.removed ? "−" : " "}</span>
                      {part.value}
                    </pre>
                  ))
                ) : (
                  <p className="hint">
                    Bandingkan teks untuk melihat penambahan dan penghapusan.
                  </p>
                )}
              </div>
            </>
          )}
          {tool.slug === "hash" && (
            <>
              <div className="action-row">
                <Select
                  aria-label="Algoritma hash"
                  value={hash}
                  onChange={setHash}
                  options={["SHA-256", "SHA-384", "SHA-512"].map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      const buffer = await crypto.subtle.digest(
                        hash,
                        new TextEncoder().encode(input),
                      );
                      setOutput(
                        Array.from(new Uint8Array(buffer), (b) =>
                          b.toString(16).padStart(2, "0"),
                        ).join(""),
                      );
                      setError("");
                    } catch {
                      setError(
                        "Web Crypto tidak tersedia. Gunakan HTTPS atau localhost.",
                      );
                    }
                  }}
                >
                  Buat hash
                </Button>
              </div>
              <div className="editor-grid">
                {editor("Input teks", input, setInput)}
                {result}
              </div>
            </>
          )}
          {tool.slug === "case" && (
            <>
              <div className="action-row">
                {[
                  "UPPERCASE",
                  "lowercase",
                  "camelCase",
                  "PascalCase",
                  "snake_case",
                  "kebab-case",
                ].map((m) => (
                  <Button
                    key={m}
                    onClick={() => run(() => convertCase(input, m))}
                  >
                    {m}
                  </Button>
                ))}
              </div>
              <div className="editor-grid">
                {editor("Input teks", input, setInput)}
                {result}
              </div>
            </>
          )}
          {tool.slug === "color" && (
            <>
              <div className="color-layout">
                <div>
                  <label>Warna (HEX, RGB, atau HSL)</label>
                  <Input
                    aria-label="Warna"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#27cbb4"
                  />
                  <div
                    className="color-preview"
                    style={{ background: colorValue?.hex || "transparent" }}
                  >
                    <input
                      type="color"
                      aria-label="Pilih warna"
                      value={colorValue?.hex || "#000000"}
                      onChange={(e) => setColor(e.target.value)}
                    />
                    <span>Pilih warna ↗</span>
                  </div>
                  {!colorValue && (
                    <Alert
                      type="error"
                      title="Format warna tidak valid"
                      description="Contoh: #27cbb4, rgb(39, 203, 180), atau hsl(172, 68%, 47%)."
                    />
                  )}
                </div>
                <div>
                  {["hex", "rgb", "hsl"].map((key) => (
                    <div className="color-result" key={key}>
                      <label>{key.toUpperCase()}</label>
                      <div>
                        <code>{colorValue?.[key] || "—"}</code>
                        <Button
                          aria-label={`Salin ${key}`}
                          icon={<CopyOutlined />}
                          disabled={!colorValue}
                          onClick={() => copy(colorValue[key])}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="tool-privacy">
        <span className="status-dot" /> Input dan hasil tidak disimpan atau
        dikirim ke server.
      </div>
    </div>
  );
}
