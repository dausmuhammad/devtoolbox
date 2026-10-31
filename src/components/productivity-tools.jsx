"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Input,
  InputNumber,
  QRCode,
  Select,
  Slider,
  Tag,
} from "antd";
import { TextEditor, ResultEditor } from "./tool-editor";
import {
  compareJson,
  generateDummy,
  toCsv,
  fitImage,
  wifiQr,
} from "@/lib/productivity-tools";

function download(href, name) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}
function downloadText(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  download(url, name);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function JsonCompare() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const edit = (setter) => (value) => {
    setter(value);
    setResult(null);
    setError("");
  };
  return (
    <>
      <div className="action-row">
        <Button
          type="primary"
          onClick={() => {
            try {
              setResult(compareJson(left, right));
              setError("");
            } catch (e) {
              setResult(null);
              setError(e.message);
            }
          }}
        >
          Bandingkan JSON
        </Button>
        <Button
          onClick={() => {
            setLeft('{"name":"Toolbox","version":1,"tags":["dev"]}');
            setRight('{"tags":["dev","tools"],"version":2,"name":"Toolbox"}');
            setResult(null);
            setError("");
          }}
        >
          Contoh input
        </Button>
      </div>
      <p>
        Urutan key objek diabaikan. Array dibandingkan berdasarkan indeks. Path
        menggunakan JSON Pointer.
      </p>
      <div className="editor-grid">
        <TextEditor
          label="JSON kiri (sebelum)"
          value={left}
          onChange={edit(setLeft)}
        />
        <TextEditor
          label="JSON kanan (sesudah)"
          value={right}
          onChange={edit(setRight)}
        />
      </div>
      {error && <Alert type="error" showIcon title={error} />}
      {result && (
        <div aria-live="polite">
          <Alert
            showIcon
            type={result.length ? "info" : "success"}
            title={
              result.length
                ? `${result.length} perbedaan ditemukan`
                : "Kedua JSON sama"
            }
          />
          {result.length > 0 && (
            <>
              <Button
                className="action-row"
                onClick={() =>
                  downloadText(
                    JSON.stringify(result, null, 2),
                    "json-diff.json",
                    "application/json",
                  )
                }
              >
                Unduh perbedaan
              </Button>
              <div className="json-changes">
                {result.map((change, i) => (
                  <article key={i}>
                    <Tag
                      color={
                        change.type === "Dihapus"
                          ? "red"
                          : change.type === "Ditambahkan"
                            ? "green"
                            : "gold"
                      }
                    >
                      {change.type}
                    </Tag>
                    <code>{change.path}</code>
                    <div className="editor-grid">
                      {["before", "after"].map((key) => (
                        <div key={key}>
                          <small>
                            {key === "before" ? "Sebelum" : "Sesudah"}
                          </small>
                          <pre>
                            {Object.hasOwn(change, key)
                              ? JSON.stringify(change[key], null, 2)
                              : "—"}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function DummyData() {
  const { message } = App.useApp();
  const [kind, setKind] = useState("users"),
    [count, setCount] = useState(10),
    [format, setFormat] = useState("json"),
    [rows, setRows] = useState([]),
    [error, setError] = useState("");
  const output = rows.length
    ? format === "json"
      ? JSON.stringify(rows, null, 2)
      : toCsv(rows)
    : "";
  return (
    <>
      <div className="settings-row">
        <label className="field-stack">
          Jenis data
          <Select
            value={kind}
            onChange={(v) => {
              setKind(v);
              setRows([]);
            }}
            options={[
              { value: "users", label: "Pengguna" },
              { value: "products", label: "Produk" },
              { value: "transactions", label: "Transaksi" },
            ]}
          />
        </label>
        <label className="field-stack">
          Jumlah baris
          <InputNumber min={1} max={1000} value={count} onChange={setCount} />
        </label>
        <label className="field-stack">
          Format
          <Select
            value={format}
            onChange={setFormat}
            options={[
              { value: "json", label: "JSON" },
              { value: "csv", label: "CSV" },
            ]}
          />
        </label>
      </div>
      <p>
        Data sintetis untuk pengujian. Harga dan nominal menggunakan rupiah;
        email memakai example.com.
      </p>
      <div className="action-row">
        <Button
          type="primary"
          onClick={() => {
            try {
              setRows(generateDummy(kind, count));
              setError("");
            } catch (e) {
              setRows([]);
              setError(e.message);
            }
          }}
        >
          Generate data
        </Button>
        <Button
          disabled={!output}
          onClick={() =>
            downloadText(
              output,
              `dummy-${kind}.${format}`,
              format === "json" ? "application/json" : "text/csv;charset=utf-8",
            )
          }
        >
          Unduh {format.toUpperCase()}
        </Button>
      </div>
      {error && <Alert type="error" title={error} />}
      <ResultEditor
        value={output}
        onCopy={async (value) => {
          try {
            await navigator.clipboard.writeText(value);
            message.success("Berhasil disalin");
          } catch {
            message.error("Tidak dapat menyalin. Salin hasil secara manual.");
          }
        }}
      />
    </>
  );
}

function QrGenerator() {
  const [mode, setMode] = useState("text"),
    [text, setText] = useState(""),
    [ssid, setSsid] = useState(""),
    [password, setPassword] = useState(""),
    [security, setSecurity] = useState("WPA"),
    [hidden, setHidden] = useState(false),
    [size, setSize] = useState(256),
    [level, setLevel] = useState("M"),
    [value, setValue] = useState(""),
    [error, setError] = useState("");
  const preview = useRef(null);
  const invalidate = (fn) => (v) => {
    fn(v);
    setValue("");
    setError("");
  };
  return (
    <>
      <div className="settings-row">
        <label className="field-stack">
          Isi QR
          <Select
            value={mode}
            onChange={invalidate(setMode)}
            options={[
              { value: "text", label: "Teks / URL" },
              { value: "wifi", label: "Wi-Fi" },
            ]}
          />
        </label>
        <label className="field-stack">
          Ukuran PNG
          <Select
            value={size}
            onChange={setSize}
            options={[128, 256, 512, 1024].map((v) => ({
              value: v,
              label: `${v} × ${v}`,
            }))}
          />
        </label>
        <label className="field-stack">
          Koreksi kesalahan
          <Select
            value={level}
            onChange={invalidate(setLevel)}
            options={["L", "M", "Q", "H"].map((v) => ({ value: v, label: v }))}
          />
        </label>
      </div>
      {mode === "text" ? (
        <TextEditor
          label="Teks atau URL"
          value={text}
          onChange={invalidate(setText)}
          placeholder="https://example.com"
        />
      ) : (
        <div className="settings-row">
          <label className="field-stack">
            Nama Wi-Fi (SSID)
            <Input
              value={ssid}
              onChange={(e) => invalidate(setSsid)(e.target.value)}
            />
          </label>
          <label className="field-stack">
            Keamanan
            <Select
              value={security}
              onChange={invalidate(setSecurity)}
              options={[
                { value: "WPA", label: "WPA / WPA2 / WPA3" },
                { value: "WEP", label: "WEP" },
                { value: "nopass", label: "Tanpa password" },
              ]}
            />
          </label>
          {security !== "nopass" && (
            <label className="field-stack">
              Password
              <Input.Password
                value={password}
                onChange={(e) => invalidate(setPassword)(e.target.value)}
              />
            </label>
          )}
          <Checkbox
            checked={hidden}
            onChange={(e) => invalidate(setHidden)(e.target.checked)}
          >
            Jaringan tersembunyi
          </Checkbox>
        </div>
      )}
      <div className="action-row">
        <Button
          type="primary"
          onClick={() => {
            try {
              const next =
                mode === "wifi"
                  ? wifiQr(ssid, password, security, hidden)
                  : text;
              if (!next.trim())
                throw new Error("Isi teks atau URL terlebih dahulu.");
              const capacities = { L: 2953, M: 2331, Q: 1663, H: 1273 };
              if (new TextEncoder().encode(next).length > capacities[level] - 4)
                throw new Error(
                  "Isi terlalu panjang untuk tingkat koreksi ini. Kurangi teks atau pilih tingkat lebih rendah.",
                );
              setValue(next);
              setError("");
            } catch (e) {
              setValue("");
              setError(e.message);
            }
          }}
        >
          Buat QR
        </Button>
        <Button
          disabled={!value}
          onClick={() => {
            const canvas = preview.current?.querySelector("canvas");
            if (canvas) download(canvas.toDataURL("image/png"), "qrcode.png");
          }}
        >
          Unduh PNG
        </Button>
      </div>
      {error && <Alert type="error" title={error} />}
      {value && (
        <div ref={preview} className="qr-preview">
          <QRCode
            type="canvas"
            value={value}
            size={size}
            errorLevel={level}
            marginSize={4}
            color="#000000"
            bgColor="#ffffff"
          />
        </div>
      )}
    </>
  );
}

function ImageResize() {
  const [files, setFiles] = useState([]),
    [width, setWidth] = useState(1920),
    [height, setHeight] = useState(1920),
    [quality, setQuality] = useState(80),
    [format, setFormat] = useState("image/webp"),
    [results, setResults] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const process = async () => {
    setBusy(true);
    setResults([]);
    setError("");
    const output = [];
    try {
      fitImage(1, 1, width, height);
      for (const file of files) {
        try {
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 20 * 1024 * 1024
          )
            throw new Error("Gunakan JPG/PNG/WebP maksimal 20 MB per file.");
          const bitmap = await createImageBitmap(file);
          try {
            if (bitmap.width * bitmap.height > 40000000)
              throw new Error("Resolusi maksimal 40 megapiksel.");
            const dimensions = fitImage(
              bitmap.width,
              bitmap.height,
              width,
              height,
            );
            const canvas = document.createElement("canvas");
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;
            const ctx = canvas.getContext("2d");
            if (!ctx)
              throw new Error("Browser tidak mendukung pemrosesan gambar.");
            if (format === "image/jpeg") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise((resolve) =>
              canvas.toBlob(resolve, format, quality / 100),
            );
            if (!blob || blob.type !== format)
              throw new Error("Format output tidak didukung browser.");
            const data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () =>
                reject(new Error("Gagal membaca hasil gambar."));
              reader.readAsDataURL(blob);
            });
            output.push({
              name: file.name,
              original: file.size,
              bytes: blob.size,
              data,
              ...dimensions,
              extension: format.split("/")[1],
            });
          } finally {
            bitmap.close();
          }
        } catch (e) {
          output.push({ name: file.name, error: e.message });
        }
      }
      setResults(output);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <label className="image-file-picker field-stack">
        Pilih gambar (maksimal 10 file)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={(e) => {
            const next = Array.from(e.target.files || []);
            setFiles(next.slice(0, 10));
            setResults([]);
            setError(
              next.length > 10 ? "Hanya 10 file pertama yang dipilih." : "",
            );
          }}
        />
      </label>
      <div className="settings-row">
        <label className="field-stack">
          Lebar maksimal (px)
          <InputNumber
            disabled={busy}
            value={width}
            min={1}
            max={40000}
            onChange={setWidth}
          />
        </label>
        <label className="field-stack">
          Tinggi maksimal (px)
          <InputNumber
            disabled={busy}
            value={height}
            min={1}
            max={40000}
            onChange={setHeight}
          />
        </label>
        <label className="field-stack">
          Format
          <Select
            disabled={busy}
            value={format}
            onChange={setFormat}
            options={[
              { value: "image/webp", label: "WebP" },
              { value: "image/jpeg", label: "JPG" },
              { value: "image/png", label: "PNG (lossless)" },
            ]}
          />
        </label>
      </div>
      <label>
        Kualitas: {quality}%
        <Slider
          disabled={busy || format === "image/png"}
          min={10}
          max={100}
          value={quality}
          onChange={setQuality}
        />
      </label>
      <p>
        Rasio gambar dipertahankan tanpa memperbesar ukuran asli. PNG tidak
        menggunakan pengaturan kualitas. Transparansi menjadi putih pada JPG.
        Hasil kompresi bisa lebih besar dari file asli.
      </p>
      <div className="action-row">
        <Button
          type="primary"
          loading={busy}
          disabled={!files.length}
          onClick={process}
        >
          Proses {files.length || ""} gambar
        </Button>
      </div>
      {error && <Alert type="warning" title={error} />}
      <div className="image-results" aria-live="polite">
        {results.map((r, i) => (
          <article key={i}>
            <strong>{r.name}</strong>
            {r.error ? (
              <Alert type="error" title={r.error} />
            ) : (
              <>
                <a href={r.data} target="_blank" rel="noreferrer">
                  Lihat hasil
                </a>
                <p>
                  {r.width} × {r.height} px · {(r.original / 1024).toFixed(1)}{" "}
                  KB → {(r.bytes / 1024).toFixed(1)} KB ·{" "}
                  {r.bytes <= r.original
                    ? `hemat ${(100 - (r.bytes / r.original) * 100).toFixed(1)}%`
                    : "ukuran bertambah"}
                </p>
                <Button
                  onClick={() =>
                    download(
                      r.data,
                      `${r.name.replace(/\.[^.]+$/, "")}-optimized.${r.extension}`,
                    )
                  }
                >
                  Unduh {r.extension.toUpperCase()}
                </Button>
              </>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

export default function ProductivityTools({ tool }) {
  const [reset, setReset] = useState(0);
  const Component = {
    "json-compare": JsonCompare,
    "image-resize": ImageResize,
    "dummy-data": DummyData,
    "qr-generator": QrGenerator,
  }[tool.slug];
  return (
    <div className="tool-page">
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
          <Button type="text" onClick={() => setReset((v) => v + 1)}>
            Reset
          </Button>
        </div>
        <div className="tool-content">
          <Component key={reset} />
        </div>
      </div>
    </div>
  );
}
