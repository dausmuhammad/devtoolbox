"use client";
import { useId } from "react";
import { Button, Input } from "antd";
import { CopyOutlined } from "@ant-design/icons";
export function TextEditor({
  label,
  value,
  onChange,
  placeholder = "Masukkan teks di sini…",
}) {
  const id = useId();
  return (
    <div className="editor-block">
      <label htmlFor={id}>{label}</label>
      <Input.TextArea
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        spellCheck={false}
      />
      <div className="editor-meta">
        {value.length.toLocaleString("id-ID")} karakter <span>UTF-8</span>
      </div>
    </div>
  );
}
export function ResultEditor({ value, onCopy, rows = 12 }) {
  const id = useId();
  return (
    <div className="result-block">
      <div className="result-title">
        <label htmlFor={id}>Hasil</label>
        <Button
          aria-label="Salin hasil"
          size="small"
          icon={<CopyOutlined />}
          disabled={!value}
          onClick={() => onCopy(value)}
        >
          Salin
        </Button>
      </div>
      <Input.TextArea
        id={id}
        aria-label="Hasil"
        value={value}
        readOnly
        rows={rows}
        placeholder="Hasil akan muncul di sini…"
        spellCheck={false}
      />
      <div className="editor-meta" aria-live="polite">
        {value ? "Siap disalin" : "Menunggu input"}
        <span>Diproses secara lokal</span>
      </div>
    </div>
  );
}
