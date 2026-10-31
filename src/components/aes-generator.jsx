"use client";
import { useRef, useState, useEffect } from "react";
import { Alert, App, Button, Input, Segmented, Select, Tag } from "antd";
import {
  ClearOutlined,
  CopyOutlined,
  KeyOutlined,
  LockOutlined,
  UnlockOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { TextEditor } from "./tool-editor";
import {
  AES_TEAM_KEY,
  AES_TEAM_IV,
  encryptAes128,
  decryptAes128,
} from "@/lib/aes";
export default function AesGenerator() {
  const { message } = App.useApp();
  const [mode, setMode] = useState("encrypt"),
    [kind, setKind] = useState("json"),
    [format, setFormat] = useState("base64"),
    [input, setInput] = useState(""),
    [encrypted, setEncrypted] = useState(null),
    [decrypted, setDecrypted] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const invalidate = () => {
    request.current++;
    setEncrypted(null);
    setDecrypted(null);
    setBusy(false);
    setError("");
  };
  const reset = () => {
    invalidate();
    setInput("");
  };
  const output =
    mode === "encrypt" ? (encrypted?.[format] ?? "") : (decrypted ?? "");
  const hasResult =
    mode === "encrypt" ? encrypted !== null : decrypted !== null;
  const transform = async () => {
    const id = ++request.current;
    setError("");
    setEncrypted(null);
    setDecrypted(null);
    setBusy(true);
    try {
      if (!input.trim())
        throw new Error(
          mode === "encrypt"
            ? "Masukkan JSON atau teks terlebih dahulu."
            : "Masukkan ciphertext terlebih dahulu.",
        );
      if (mode === "encrypt") {
        if (kind === "json") {
          try {
            JSON.parse(input);
          } catch (e) {
            throw new Error(
              `JSON tidak valid. ${e instanceof Error ? e.message : ""}`,
            );
          }
        }
        const result = await encryptAes128(input);
        if (id === request.current) setEncrypted(result);
      } else {
        const result = await decryptAes128(input, format);
        if (id === request.current) setDecrypted(result);
      }
    } catch (e) {
      if (id === request.current)
        setError(e instanceof Error ? e.message : "Data tidak dapat diproses.");
    } finally {
      if (id === request.current) setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      message.success("Hasil berhasil disalin");
    } catch {
      message.error(
        "Tidak dapat menyalin. Pilih dan salin hasil secara manual.",
      );
    }
  };
  const roundTrip = () => {
    if (!encrypted) return;
    const value = encrypted[format];
    invalidate();
    setMode("decrypt");
    setInput(value);
  };
  return (
    <div className="tool-page">
      <Link href="/" className="back-link">
        ← Semua alat
      </Link>
      <div className="tool-page-heading">
        <span className="tool-icon large">
          <KeyOutlined />
        </span>
        <div>
          <Tag color="cyan" variant="filled">
            Generator
          </Tag>
          <h1>AES-128 Encrypt & Decrypt</h1>
          <p>
            Tempel JSON atau teks, lalu enkripsi memakai key dan IV tim. Hasil
            siap disalin sebagai HEX atau Base64.
          </p>
        </div>
      </div>
      <div className="tool-surface">
        <div className="surface-toolbar">
          <span>
            <span className="status-dot" />
            WORKSPACE LOKAL
          </span>
          <div>
            {mode === "encrypt" && (
              <Button
                type="text"
                onClick={() => {
                  invalidate();
                  setKind("json");
                  setInput('{\n  "name": "DevToolBox",\n  "active": true\n}');
                }}
              >
                Contoh JSON
              </Button>
            )}
            <Button type="text" icon={<ClearOutlined />} onClick={reset}>
              Reset
            </Button>
          </div>
        </div>
        <div className="tool-content">
          <div className="aes-mode-row">
            <Segmented
              aria-label="Mode AES"
              value={mode}
              onChange={(v) => {
                reset();
                setMode(v);
              }}
              options={[
                { value: "encrypt", label: "Encrypt" },
                { value: "decrypt", label: "Decrypt" },
              ]}
            />
            <Tag color="cyan">AES-128-CBC · PKCS#7 · UTF-8</Tag>
          </div>
          <div className="aes-config">
            <div>
              <label htmlFor="aes-team-key">Key tim · UTF-8 (16 byte)</label>
              <Input
                id="aes-team-key"
                aria-label="Key tim"
                value={AES_TEAM_KEY}
                readOnly
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="aes-team-iv">IV tim · UTF-8 (16 byte)</label>
              <Input
                id="aes-team-iv"
                aria-label="IV tim"
                value={AES_TEAM_IV}
                readOnly
                spellCheck={false}
              />
            </div>
          </div>
          <Alert
            type="warning"
            showIcon
            title="Konfigurasi tetap untuk alur tim"
            description="Key dan IV di-hardcode sesuai konfigurasi tim. Input yang sama menghasilkan ciphertext yang sama. Key di aplikasi browser bisa dilihat pengguna; IV tetap ini bukan pola untuk enkripsi data produksi yang baru."
          />
          {error && (
            <Alert
              type="error"
              showIcon
              title="Data belum dapat diproses"
              description={error}
            />
          )}
          <div className="settings-row">
            {mode === "encrypt" && (
              <>
                <label htmlFor="aes-input-kind">Input</label>
                <Select
                  id="aes-input-kind"
                  aria-label="Jenis input AES"
                  value={kind}
                  onChange={(v) => {
                    invalidate();
                    setKind(v);
                  }}
                  options={[
                    { value: "json", label: "JSON (validasi)" },
                    { value: "text", label: "Teks biasa" },
                  ]}
                />
              </>
            )}
            <label htmlFor="aes-cipher-format">
              {mode === "encrypt" ? "Format hasil" : "Format ciphertext input"}
            </label>
            <Select
              id="aes-cipher-format"
              aria-label="Format ciphertext"
              value={format}
              onChange={(v) => {
                if (mode === "decrypt") invalidate();
                setFormat(v);
              }}
              options={[
                { value: "base64", label: "Base64" },
                { value: "hex", label: "HEX" },
              ]}
            />
          </div>
          <div className="action-row">
            <Button
              type="primary"
              loading={busy}
              icon={mode === "encrypt" ? <LockOutlined /> : <UnlockOutlined />}
              onClick={transform}
            >
              {mode === "encrypt" ? "Encrypt AES-128" : "Decrypt AES-128"}
            </Button>
            {mode === "encrypt" && (
              <Button
                disabled={!encrypted}
                icon={<SwapOutlined />}
                onClick={roundTrip}
              >
                Uji decrypt hasil
              </Button>
            )}
          </div>
          <div className="editor-grid">
            <TextEditor
              label={
                mode === "decrypt"
                  ? `Ciphertext ${format === "hex" ? "HEX" : "Base64"}`
                  : kind === "json"
                    ? "Input JSON"
                    : "Input teks"
              }
              value={input}
              onChange={(v) => {
                invalidate();
                setInput(v);
              }}
              placeholder={
                mode === "decrypt"
                  ? "Tempel ciphertext di sini…"
                  : kind === "json"
                    ? '{"name": "DevToolBox"}'
                    : "Masukkan teks yang akan dienkripsi…"
              }
            />
            <div className="result-block">
              <div className="result-title">
                <label htmlFor="aes-output">
                  {mode === "encrypt"
                    ? `Ciphertext ${format === "hex" ? "HEX" : "Base64"}`
                    : "Hasil decrypt · UTF-8"}
                </label>
                <Button
                  aria-label="Salin hasil AES"
                  icon={<CopyOutlined />}
                  disabled={!hasResult}
                  onClick={copy}
                >
                  Salin
                </Button>
              </div>
              <Input.TextArea
                id="aes-output"
                aria-label="Hasil AES"
                value={output}
                readOnly
                rows={12}
                spellCheck={false}
                placeholder="Hasil akan muncul di sini…"
              />
              <div className="editor-meta" aria-live="polite">
                <span>
                  {hasResult
                    ? `${output.length.toLocaleString("id-ID")} karakter`
                    : "Menunggu proses"}
                </span>
                <span>
                  {mode === "encrypt" ? "Ciphertext mentah" : "Plaintext asli"}
                </span>
              </div>
            </div>
          </div>
          <p className="hint">
            {mode === "encrypt"
              ? "JSON hanya divalidasi; spasi, urutan field, dan baris input tetap dipertahankan. Hasil berisi ciphertext saja, tanpa prefix, salt, atau IV tambahan."
              : "Pilih format yang sesuai dengan ciphertext. Hasil decrypt dikembalikan persis sebagai teks UTF-8."}
          </p>
        </div>
      </div>
      <div className="tool-privacy">
        <span className="status-dot" />
        Input dan hasil diproses di browser, tanpa penyimpanan otomatis atau
        pengiriman ke server.
      </div>
    </div>
  );
}
