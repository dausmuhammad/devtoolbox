"use client";
import { useEffect, useRef, useState } from "react";
import { Alert, App, Button, Input, Segmented, Tag, Upload } from "antd";
import {
  ClearOutlined,
  CopyOutlined,
  DownloadOutlined,
  InboxOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import {
  imageBytesToBase64,
  MAX_IMAGE_BYTES,
  parseBase64Image,
  SAMPLE_IMAGE,
} from "@/lib/image-base64";
function inspectImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      if (image.naturalWidth * image.naturalHeight > 40_000_000)
        reject(new Error("Resolusi gambar maksimal 40 megapiksel."));
      else resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () =>
      reject(
        new Error(
          "Data tidak dapat dibuka sebagai gambar. File mungkin rusak atau format tidak didukung browser.",
        ),
      );
    image.src = dataUrl;
  });
}
export default function ImageBase64() {
  const { message } = App.useApp();
  const [mode, setMode] = useState("encode"),
    [outputFormat, setOutputFormat] = useState("data-url"),
    [input, setInput] = useState(""),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const reset = () => {
    request.current++;
    setInput("");
    setResult(null);
    setError("");
    setBusy(false);
  };
  const fail = (e) =>
    setError(e instanceof Error ? e.message : "Gambar tidak dapat diproses.");
  const upload = async (file) => {
    const id = ++request.current;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      if (file.size > MAX_IMAGE_BYTES)
        throw new Error("Ukuran gambar maksimal 10 MB.");
      const encoded = imageBytesToBase64(
        new Uint8Array(await file.arrayBuffer()),
      );
      const dimensions = await inspectImage(encoded.dataUrl);
      if (id === request.current)
        setResult({ ...encoded, ...dimensions, name: file.name });
    } catch (e) {
      if (id === request.current) fail(e);
    } finally {
      if (id === request.current) setBusy(false);
    }
  };
  const decode = async () => {
    const id = ++request.current;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const decoded = parseBase64Image(input);
      const dimensions = await inspectImage(decoded.dataUrl);
      if (id === request.current)
        setResult({
          ...decoded,
          ...dimensions,
          name: `gambar.${decoded.extension}`,
        });
    } catch (e) {
      if (id === request.current) fail(e);
    } finally {
      if (id === request.current) setBusy(false);
    }
  };
  const output = result
    ? outputFormat === "data-url"
      ? result.dataUrl
      : result.base64
    : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      message.success("Base64 gambar berhasil disalin");
    } catch {
      message.error("Tidak dapat menyalin. Salin teks hasil secara manual.");
    }
  };
  const download = () => {
    if (!result) return;
    const blob = new Blob([new Uint8Array(result.bytes)], {
      type: result.mime,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="tool-page">
      <Link className="back-link" href="/">
        ← Semua alat
      </Link>
      <div className="tool-page-heading">
        <span className="tool-icon large">
          <PictureOutlined />
        </span>
        <div>
          <Tag variant="filled" color="cyan">
            Encode & decode
          </Tag>
          <h1>Image Base64</h1>
          <p>
            Ubah gambar menjadi Base64, atau kembalikan Base64 menjadi file
            gambar.
          </p>
        </div>
      </div>
      <div className="tool-surface">
        <div className="surface-toolbar">
          <span>
            <span className="status-dot" /> WORKSPACE LOKAL
          </span>
          <Button type="text" icon={<ClearOutlined />} onClick={reset}>
            Reset
          </Button>
        </div>
        <div className="tool-content image-tool">
          <div className="image-mode">
            <Segmented
              aria-label="Mode Image Base64"
              value={mode}
              onChange={(v) => {
                reset();
                setMode(v);
              }}
              options={[
                { value: "encode", label: "Gambar → Base64" },
                { value: "decode", label: "Base64 → Gambar" },
              ]}
            />
            <p>
              {mode === "encode"
                ? "Pilih gambar dari perangkat. Hasil tersedia sebagai Data URL atau Base64 murni."
                : "Tempel Data URL atau Base64 murni. Format gambar akan dikenali otomatis."}
            </p>
          </div>
          {error && (
            <Alert
              type="error"
              showIcon
              title="Gambar belum dapat diproses"
              description={error}
            />
          )}
          <div className="image-workspace">
            <section className="image-input">
              <div className="panel-heading">
                <div>
                  <h2>
                    {mode === "encode" ? "Gambar sumber" : "Input Base64"}
                  </h2>
                  <p>
                    {mode === "encode"
                      ? "Maksimal 10 MB · PNG, JPG, GIF, WebP, BMP, ICO, AVIF"
                      : "Data URL dan Base64 murni didukung."}
                  </p>
                </div>
              </div>
              {mode === "encode" ? (
                <Upload.Dragger
                  accept="image/png,image/jpeg,image/gif,image/webp,image/bmp,image/x-icon,image/vnd.microsoft.icon,image/avif"
                  multiple={false}
                  showUploadList={false}
                  fileList={[]}
                  disabled={busy}
                  beforeUpload={(file) => {
                    void upload(file);
                    return false;
                  }}
                >
                  <div className="upload-content">
                    <InboxOutlined className="upload-icon" />
                    <strong>
                      {busy
                        ? "Memproses gambar…"
                        : "Pilih atau tarik gambar ke sini"}
                    </strong>
                    <span>Klik untuk memilih file dari perangkat</span>
                    <span className="upload-local">
                      Diproses di browser, tanpa upload ke server
                    </span>
                  </div>
                </Upload.Dragger>
              ) : (
                <>
                  <label htmlFor="image-base64-input" className="sr-only">
                    Base64 gambar
                  </label>
                  <Input.TextArea
                    id="image-base64-input"
                    aria-label="Base64 gambar"
                    value={input}
                    rows={10}
                    spellCheck={false}
                    onChange={(e) => {
                      request.current++;
                      setBusy(false);
                      setInput(e.target.value);
                      setResult(null);
                      setError("");
                    }}
                    placeholder="data:image/png;base64,iVBORw0KGgo…"
                  />
                  <div className="action-row">
                    <Button type="primary" loading={busy} onClick={decode}>
                      Decode gambar
                    </Button>
                    <Button
                      onClick={() => {
                        request.current++;
                        setInput(SAMPLE_IMAGE);
                        setResult(null);
                        setError("");
                        setBusy(false);
                      }}
                    >
                      Contoh input
                    </Button>
                  </div>
                </>
              )}
              <div className="image-preview">
                {result ? (
                  <>
                    <div className="preview-canvas">
                      <Image
                        src={result.dataUrl}
                        alt="Preview gambar hasil konversi"
                        width={result.width}
                        height={result.height}
                        unoptimized
                      />
                    </div>
                    <div className="image-file-info">
                      <strong>{result.name}</strong>
                      <span>
                        {result.width} × {result.height} px ·{" "}
                        {(result.bytes.length / 1024).toLocaleString("id-ID", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        KB · {result.mime}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="image-empty">
                    <PictureOutlined />
                    <strong>Preview gambar</strong>
                    <p>
                      {mode === "encode"
                        ? "Pilih gambar untuk melihat preview dan hasil Base64."
                        : "Hasil decode akan ditampilkan di sini."}
                    </p>
                  </div>
                )}
              </div>
            </section>
            <section className="image-output">
              <div className="panel-heading">
                <div>
                  <h2>
                    {mode === "encode" ? "Hasil Base64" : "Hasil konversi"}
                  </h2>
                  <p>
                    {result
                      ? "Gambar siap disalin atau diunduh."
                      : "Hasil akan muncul setelah gambar diproses."}
                  </p>
                </div>
              </div>
              <div className="output-format">
                <label>Format hasil</label>
                <Segmented
                  aria-label="Format hasil gambar"
                  value={outputFormat}
                  onChange={setOutputFormat}
                  options={[
                    { value: "data-url", label: "Data URL" },
                    { value: "raw", label: "Base64 murni" },
                  ]}
                />
              </div>
              <Input.TextArea
                aria-label="Hasil Base64 gambar"
                value={output}
                readOnly
                rows={10}
                placeholder="Hasil Base64 gambar…"
                spellCheck={false}
              />
              <div className="editor-meta">
                <span>{output.length.toLocaleString("id-ID")} karakter</span>
                <span>
                  {outputFormat === "data-url"
                    ? "Siap untuk atribut src"
                    : "Tanpa prefix MIME"}
                </span>
              </div>
              <div className="action-row">
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  disabled={!result}
                  onClick={copy}
                >
                  Salin Base64
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  disabled={!result}
                  onClick={download}
                >
                  Unduh gambar
                </Button>
              </div>
              <Alert
                type="info"
                showIcon
                title="Pilih format sesuai kebutuhan"
                description={
                  outputFormat === "data-url"
                    ? "Data URL menyertakan tipe file dan prefix base64. Gunakan langsung pada src gambar di HTML atau CSS."
                    : "Base64 murni berisi data gambar saja. Cocok untuk API yang meminta string Base64 tanpa prefix."
                }
              />
            </section>
          </div>
        </div>
      </div>
      <div className="tool-privacy">
        <span className="status-dot" />
        Gambar dan hasil tidak disimpan atau dikirim ke server.
      </div>
    </div>
  );
}
