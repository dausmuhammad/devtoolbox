"use client";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Segmented,
  Select,
  Slider,
  Tag,
} from "antd";
import {
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { TextEditor, ResultEditor } from "./tool-editor";
import {
  buildRequest,
  parseQuery,
  buildQuery,
  headersToJson,
  jsonToHeaders,
} from "@/lib/api-tools";
import {
  formatSql,
  cronSchedule,
  envToJson,
  jsonToEnv,
} from "@/lib/backend-tools";
import { htmlEntities, convertCssUnit, boxShadow } from "@/lib/frontend-tools";
function useLocalTool() {
  const { message } = App.useApp();
  const [output, setOutput] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const epoch = useRef(0);
  useEffect(
    () => () => {
      epoch.current++;
    },
    [],
  );
  const clear = () => {
    epoch.current++;
    setOutput("");
    setError("");
    setBusy(false);
  };
  const run = async (fn) => {
    const id = ++epoch.current;
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const value = await fn();
      if (id === epoch.current) setOutput(value);
    } catch (e) {
      if (id === epoch.current)
        setError(
          e instanceof Error ? e.message : "Input tidak dapat diproses.",
        );
    } finally {
      if (id === epoch.current) setBusy(false);
    }
  };
  const copy = async (value = output) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success("Hasil berhasil disalin");
    } catch {
      message.error(
        "Tidak dapat menyalin. Pilih dan salin hasil secara manual.",
      );
    }
  };
  return { output, error, busy, clear, run, copy };
}
function ToolFrame({ tool, state, onReset, onSample, children }) {
  return (
    <div className="tool-page">
      <Link href="/" className="back-link">
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
            <span className="status-dot" />
            WORKSPACE LOKAL
          </span>
          <div>
            {onSample && (
              <Button type="text" onClick={onSample}>
                Contoh input
              </Button>
            )}
            <Button type="text" icon={<ClearOutlined />} onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>
        <div className="tool-content">
          {state.error && (
            <Alert
              type="error"
              showIcon
              title="Input belum dapat diproses"
              description={state.error}
            />
          )}{" "}
          {children}
        </div>
      </div>
      <div className="tool-privacy">
        <span className="status-dot" />
        Input dan hasil tidak disimpan atau dikirim ke server.
      </div>
    </div>
  );
}
const transformSamples = {
  "http-headers":
    "Content-Type: application/json\nX-Request-ID: dev-001\nSet-Cookie: session=demo; HttpOnly\nSet-Cookie: theme=dark",
  "sql-formatter":
    "select u.id,u.name,count(o.id) as total_orders from users u left join orders o on o.user_id=u.id where u.active=true group by u.id,u.name order by total_orders desc;",
  "env-json":
    'APP_NAME="DevToolBox"\nAPP_PORT=3000\nDEBUG=true\nMESSAGE="Halo developer 👋"\n# Komentar tidak masuk ke JSON',
  "html-entities":
    '<button title="Halo developer">Simpan & lanjutkan 👋</button>',
};
function TransformTool({ tool }) {
  const state = useLocalTool();
  const [input, setInput] = useState(""),
    [reverse, setReverse] = useState(false),
    [language, setLanguage] = useState("sql"),
    [letterCase, setLetterCase] = useState("upper");
  const edit = (v) => {
    state.clear();
    setInput(v);
  };
  const sample = () => {
    state.clear();
    setReverse(false);
    setInput(transformSamples[tool.slug]);
  };
  const transform = () =>
    state.run(async () => {
      if (tool.slug === "http-headers")
        return reverse ? jsonToHeaders(input) : headersToJson(input);
      if (tool.slug === "env-json")
        return reverse ? jsonToEnv(input) : envToJson(input);
      if (tool.slug === "sql-formatter")
        return formatSql(input, language, letterCase);
      return htmlEntities(input, reverse ? "decode" : "encode");
    });
  const modes =
    tool.slug === "http-headers"
      ? ["Headers → JSON", "JSON → Headers"]
      : tool.slug === "env-json"
        ? ["ENV → JSON", "JSON → ENV"]
        : ["Encode entities", "Decode entities"];
  return (
    <ToolFrame
      tool={tool}
      state={state}
      onReset={() => edit("")}
      onSample={sample}
    >
      <div className="settings-row">
        {tool.slug === "sql-formatter" ? (
          <>
            <div className="field-stack">
              <label htmlFor="sql-dialect">Dialek SQL</label>
              <Select
                id="sql-dialect"
                aria-label="Dialek SQL"
                value={language}
                onChange={(v) => {
                  state.clear();
                  setLanguage(v);
                }}
                options={[
                  ["sql", "SQL standar"],
                  ["postgresql", "PostgreSQL"],
                  ["mysql", "MySQL"],
                  ["sqlite", "SQLite"],
                  ["transactsql", "SQL Server"],
                  ["bigquery", "BigQuery"],
                ].map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div className="field-stack">
              <label htmlFor="sql-case">Keyword</label>
              <Select
                id="sql-case"
                aria-label="Keyword SQL"
                value={letterCase}
                onChange={(v) => {
                  state.clear();
                  setLetterCase(v);
                }}
                options={[
                  { value: "upper", label: "UPPERCASE" },
                  { value: "lower", label: "lowercase" },
                  { value: "preserve", label: "Pertahankan" },
                ]}
              />
            </div>
          </>
        ) : (
          <Segmented
            aria-label="Mode konversi"
            value={reverse ? "reverse" : "forward"}
            onChange={(v) => {
              state.clear();
              setReverse(v === "reverse");
            }}
            options={[
              { value: "forward", label: modes[0] },
              { value: "reverse", label: modes[1] },
            ]}
          />
        )}
        <Button type="primary" loading={state.busy} onClick={transform}>
          {tool.slug === "sql-formatter" ? "Format SQL" : "Konversi"}
        </Button>
        <Button disabled={!state.output} onClick={() => edit(state.output)}>
          Gunakan hasil sebagai input
        </Button>
      </div>
      <div className="editor-grid">
        <TextEditor label="Input" value={input} onChange={edit} />
        <ResultEditor value={state.output} onCopy={state.copy} />
      </div>
      <p className="hint">
        {tool.slug === "http-headers"
          ? "Header berulang dipertahankan sebagai array name/value. JSON input boleh berupa array header atau objek string."
          : tool.slug === "sql-formatter"
            ? "Query hanya diformat, tidak dijalankan atau divalidasi terhadap database. Pilih dialek yang sesuai; stored procedure kompleks belum didukung."
            : tool.slug === "env-json"
              ? 'Semua nilai dipertahankan sebagai string. Mendukung komentar #, export, kutip tunggal literal, dan kutip ganda dengan escape JSON (\\n, \", \\\\). Duplikat ditolak; tanpa ekspansi ${VAR}.'
              : "Hasil ditampilkan sebagai teks, tidak dirender atau dieksekusi sebagai HTML. Decode ketat menampilkan error untuk entity yang rusak."}
      </p>
    </ToolFrame>
  );
}
function RequestBuilder({ tool }) {
  const state = useLocalTool();
  const [url, setUrl] = useState(""),
    [method, setMethod] = useState("GET"),
    [headers, setHeaders] = useState(""),
    [body, setBody] = useState(""),
    [format, setFormat] = useState("curl"),
    [generated, setGenerated] = useState(null);
  const invalidate = () => {
    state.clear();
    setGenerated(null);
  };
  const reset = () => {
    invalidate();
    setUrl("");
    setMethod("GET");
    setHeaders("");
    setBody("");
  };
  const sample = () => {
    invalidate();
    setUrl("https://api.example.com/users?active=true");
    setMethod("POST");
    setHeaders(
      "Content-Type: application/json\nAuthorization: Bearer YOUR_TOKEN",
    );
    setBody('{"name":"DevToolBox"}');
  };
  const output = generated?.[format] ?? "";
  return (
    <ToolFrame tool={tool} state={state} onReset={reset} onSample={sample}>
      <Alert
        showIcon
        type="info"
        title="Membuat kode request secara lokal"
        description="Tidak ada request yang dikirim dari alat ini. Jalankan kode hasil di terminal atau aplikasi Anda saat siap. cURL menggunakan format shell POSIX/Bash."
      />
      <div className="request-address">
        <div className="field-stack">
          <label htmlFor="request-method">Metode</label>
          <Select
            id="request-method"
            aria-label="Metode HTTP"
            value={method}
            onChange={(v) => {
              invalidate();
              setMethod(v);
              if (["GET", "HEAD"].includes(v)) setBody("");
            }}
            options={[
              "GET",
              "POST",
              "PUT",
              "PATCH",
              "DELETE",
              "HEAD",
              "OPTIONS",
            ].map((value) => ({ value, label: value }))}
          />
        </div>
        <div className="field-stack">
          <label htmlFor="request-url">URL endpoint</label>
          <Input
            id="request-url"
            aria-label="URL endpoint"
            value={url}
            onChange={(e) => {
              invalidate();
              setUrl(e.target.value);
            }}
            placeholder="https://api.example.com/users"
          />
        </div>
      </div>
      <div className="editor-grid">
        <TextEditor
          label="Headers request"
          value={headers}
          onChange={(v) => {
            invalidate();
            setHeaders(v);
          }}
          placeholder={
            "Content-Type: application/json\nAuthorization: Bearer YOUR_TOKEN"
          }
        />
        {!["GET", "HEAD"].includes(method) ? (
          <TextEditor
            label="Body request (teks mentah)"
            value={body}
            onChange={(v) => {
              invalidate();
              setBody(v);
            }}
            placeholder='{"name":"DevToolBox"}'
          />
        ) : (
          <div className="request-note">
            <h2>Request {method}</h2>
            <p>
              Metode ini tidak memakai body di Fetch API. Tambahkan query
              parameter pada URL atau pilih POST, PUT, atau PATCH untuk mengirim
              body.
            </p>
          </div>
        )}
      </div>
      <div className="action-row">
        <Button
          type="primary"
          onClick={() =>
            state.run(() => {
              const result = buildRequest({ url, method, headers, body });
              setGenerated(result);
              return result[format];
            })
          }
        >
          Buat request
        </Button>
        <Segmented
          aria-label="Format kode request"
          value={format}
          onChange={setFormat}
          options={[
            { value: "curl", label: "cURL" },
            { value: "fetch", label: "JavaScript Fetch" },
          ]}
        />
      </div>
      <ResultEditor value={output} onCopy={state.copy} rows={10} />
    </ToolFrame>
  );
}
function QueryTool({ tool }) {
  const state = useLocalTool();
  const [input, setInput] = useState(""),
    [base, setBase] = useState(""),
    [rows, setRows] = useState([]),
    [format, setFormat] = useState("query"),
    [generated, setGenerated] = useState(null);
  const ids = useRef(0);
  const invalidate = () => {
    state.clear();
    setGenerated(null);
  };
  const setEntries = (values) =>
    setRows(values.map((row) => ({ ...row, id: ++ids.current })));
  const output = generated?.[format] ?? "";
  const build = () =>
    state.run(() => {
      const result = buildQuery(
        rows.map(({ name, value }) => ({ name, value })),
        base,
      );
      setGenerated(result);
      return result[format] || result.query;
    });
  return (
    <ToolFrame
      tool={tool}
      state={state}
      onReset={() => {
        invalidate();
        setInput("");
        setBase("");
        setRows([]);
      }}
      onSample={() => {
        invalidate();
        setInput(
          "https://api.example.com/search?q=halo+dunia&tag=react&tag=nextjs",
        );
        setBase("https://api.example.com/search");
        setEntries([
          { name: "q", value: "halo dunia" },
          { name: "tag", value: "react" },
          { name: "tag", value: "nextjs" },
        ]);
      }}
    >
      <div className="field-stack">
        <label htmlFor="query-input">URL atau query string</label>
        <Input.TextArea
          id="query-input"
          aria-label="URL atau query string"
          value={input}
          onChange={(e) => {
            invalidate();
            setInput(e.target.value);
          }}
          rows={3}
          placeholder="?q=halo+dunia&tag=react&tag=nextjs"
        />
      </div>
      <div className="action-row">
        <Button
          type="primary"
          onClick={() =>
            state.run(() => {
              const values = parseQuery(input);
              setEntries(values);
              return JSON.stringify(values, null, 2);
            })
          }
        >
          Parse parameter
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => {
            invalidate();
            setRows([...rows, { id: ++ids.current, name: "", value: "" }]);
          }}
        >
          Tambah parameter
        </Button>
      </div>
      <div className="query-rows">
        {rows.length ? (
          rows.map((row, i) => (
            <div className="query-row" key={row.id}>
              <div className="field-stack">
                <label htmlFor={`query-name-${row.id}`}>Nama {i + 1}</label>
                <Input
                  id={`query-name-${row.id}`}
                  aria-label={`Nama parameter ${i + 1}`}
                  value={row.name}
                  onChange={(e) => {
                    invalidate();
                    setRows(
                      rows.map((r) =>
                        r.id === row.id ? { ...r, name: e.target.value } : r,
                      ),
                    );
                  }}
                />
              </div>
              <div className="field-stack">
                <label htmlFor={`query-value-${row.id}`}>Nilai {i + 1}</label>
                <Input
                  id={`query-value-${row.id}`}
                  aria-label={`Nilai parameter ${i + 1}`}
                  value={row.value}
                  onChange={(e) => {
                    invalidate();
                    setRows(
                      rows.map((r) =>
                        r.id === row.id ? { ...r, value: e.target.value } : r,
                      ),
                    );
                  }}
                />
              </div>
              <Button
                aria-label={`Hapus parameter ${i + 1}`}
                icon={<DeleteOutlined />}
                onClick={() => {
                  invalidate();
                  setRows(rows.filter((r) => r.id !== row.id));
                }}
              />
            </div>
          ))
        ) : (
          <div className="empty">
            Parse query atau tambahkan parameter untuk mulai.
          </div>
        )}
      </div>
      <div className="field-stack">
        <label htmlFor="query-base">
          URL dasar (opsional, query lama akan diganti)
        </label>
        <Input
          id="query-base"
          aria-label="URL dasar"
          value={base}
          onChange={(e) => {
            invalidate();
            setBase(e.target.value);
          }}
          placeholder="https://api.example.com/search"
        />
      </div>
      <div className="action-row">
        <Button type="primary" onClick={build}>
          Buat query
        </Button>
        <Segmented
          aria-label="Format hasil query"
          value={format}
          onChange={setFormat}
          options={[
            { value: "query", label: "Query string" },
            { value: "url", label: "URL lengkap" },
            { value: "json", label: "JSON" },
          ]}
        />
      </div>
      {format === "url" && !base.trim() && (
        <Alert type="info" title="Isi URL dasar untuk membuat URL lengkap." />
      )}
      <ResultEditor value={output} onCopy={state.copy} rows={5} />
      <p className="hint">
        Urutan dan nama parameter berulang dipertahankan. Spasi memakai +;
        karakter khusus dan Unicode di-encode otomatis.
      </p>
    </ToolFrame>
  );
}
function CronTool({ tool }) {
  const state = useLocalTool();
  const [expression, setExpression] = useState(""),
    [from, setFrom] = useState(""),
    [zone, setZone] = useState("Asia/Jakarta"),
    [count, setCount] = useState(5);
  const dates = state.output ? JSON.parse(state.output) : [];
  const invalidate = () => {
    state.clear();
  };
  return (
    <ToolFrame
      tool={tool}
      state={state}
      onReset={() => {
        invalidate();
        setExpression("");
        setFrom("");
      }}
      onSample={() => {
        invalidate();
        setExpression("*/15 9-17 * * 1-5");
        setFrom("2026-01-05T00:00:00Z");
        setZone("Asia/Jakarta");
      }}
    >
      <div className="field-stack">
        <label htmlFor="cron-expression">Ekspresi cron</label>
        <Input
          id="cron-expression"
          aria-label="Ekspresi cron"
          value={expression}
          onChange={(e) => {
            invalidate();
            setExpression(e.target.value);
          }}
          placeholder="*/15 9-17 * * 1-5"
        />
      </div>
      <div className="cron-fields">
        {[
          ["Menit", "0–59"],
          ["Jam", "0–23"],
          ["Tanggal", "1–31"],
          ["Bulan", "1–12"],
          ["Hari", "0–7"],
        ].map(([name, value]) => (
          <div key={name}>
            <strong>{name}</strong>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="settings-row">
        <div className="field-stack">
          <label htmlFor="cron-zone">Zona waktu IANA</label>
          <Input
            id="cron-zone"
            aria-label="Zona waktu cron"
            value={zone}
            onChange={(e) => {
              invalidate();
              setZone(e.target.value);
            }}
            placeholder="Asia/Jakarta"
          />
        </div>
        <div className="field-stack flex-field">
          <label htmlFor="cron-from">Acuan ISO 8601 (kosong = sekarang)</label>
          <Input
            id="cron-from"
            aria-label="Waktu acuan cron"
            value={from}
            onChange={(e) => {
              invalidate();
              setFrom(e.target.value);
            }}
            placeholder="2026-01-05T00:00:00Z"
          />
        </div>
        <div className="field-stack">
          <label htmlFor="cron-count">Jumlah jadwal</label>
          <InputNumber
            id="cron-count"
            aria-label="Jumlah jadwal cron"
            min={1}
            max={20}
            value={count}
            onChange={(v) => {
              invalidate();
              setCount(v ?? 5);
            }}
          />
        </div>
      </div>
      <div className="action-row">
        <Button
          type="primary"
          loading={state.busy}
          onClick={() =>
            state.run(async () => {
              const results = await cronSchedule(
                expression,
                from || new Date().toISOString(),
                zone,
                count,
              );
              return JSON.stringify(results);
            })
          }
        >
          Hitung jadwal berikutnya
        </Button>
        <Button
          disabled={!state.output}
          icon={<CopyOutlined />}
          onClick={() =>
            state.copy(
              dates
                .map((d, i) => `${i + 1}. ${d.local}\n   UTC: ${d.utc}`)
                .join("\n\n"),
            )
          }
        >
          Salin jadwal
        </Button>
      </div>
      {dates.length ? (
        <div className="cron-results">
          {dates.map((date, i) => (
            <div key={date.utc}>
              <span className="schedule-number">{i + 1}</span>
              <div>
                <strong>{date.local}</strong>
                <code>UTC: {date.utc}</code>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">Jadwal berikutnya akan muncul di sini.</div>
      )}
      <Alert
        type="info"
        showIcon
        title="Preview jadwal, bukan scheduler"
        description="Mendukung cron 5 field, detik opsional sebagai field pertama, dan alias seperti @daily. Ekspresi dihitung dalam zona waktu pilihan; tidak membuat job atau automation."
      />
    </ToolFrame>
  );
}
function CssUnits({ tool }) {
  const state = useLocalTool();
  const [value, setValue] = useState(16),
    [from, setFrom] = useState("px"),
    [to, setTo] = useState("rem"),
    [root, setRoot] = useState(16),
    [parent, setParent] = useState(16);
  const change = (setter, v) => {
    state.clear();
    setter(v);
  };
  const options = ["px", "rem", "em"].map((value) => ({ value, label: value }));
  return (
    <ToolFrame
      tool={tool}
      state={state}
      onReset={() => {
        state.clear();
        setValue(16);
        setFrom("px");
        setTo("rem");
        setRoot(16);
        setParent(16);
      }}
    >
      <div className="settings-row">
        <div className="field-stack">
          <label htmlFor="css-value">Nilai</label>
          <InputNumber
            id="css-value"
            aria-label="Nilai CSS"
            value={value}
            onChange={(v) => change(setValue, v)}
          />
        </div>
        <div className="field-stack">
          <label htmlFor="css-from">Dari</label>
          <Select
            id="css-from"
            aria-label="Unit asal"
            value={from}
            onChange={(v) => change(setFrom, v)}
            options={options}
          />
        </div>
        <div className="field-stack">
          <label htmlFor="css-to">Ke</label>
          <Select
            id="css-to"
            aria-label="Unit tujuan"
            value={to}
            onChange={(v) => change(setTo, v)}
            options={options}
          />
        </div>
      </div>
      <div className="editor-grid">
        <div className="field-stack">
          <label htmlFor="css-root">Font root (px) · dasar rem</label>
          <InputNumber
            id="css-root"
            aria-label="Font root"
            min={0.01}
            value={root}
            onChange={(v) => change(setRoot, v)}
          />
        </div>
        <div className="field-stack">
          <label htmlFor="css-parent">Font parent (px) · dasar em</label>
          <InputNumber
            id="css-parent"
            aria-label="Font parent"
            min={0.01}
            value={parent}
            onChange={(v) => change(setParent, v)}
          />
        </div>
      </div>
      <div className="action-row">
        <Button
          type="primary"
          onClick={() =>
            state.run(
              () => `${convertCssUnit(value, from, to, root, parent)}${to}`,
            )
          }
        >
          Konversi unit
        </Button>
      </div>
      <ResultEditor value={state.output} onCopy={state.copy} rows={3} />
      <p className="hint">
        rem dihitung dari font root; em dari font parent untuk properti
        font-size. Untuk properti lain, em mengikuti font elemen sendiri. Hasil
        dibulatkan hingga 6 desimal.
      </p>
    </ToolFrame>
  );
}
function ShadowTool({ tool }) {
  const state = useLocalTool();
  const initial = {
    x: 0,
    y: 12,
    blur: 32,
    spread: -4,
    color: "#000000",
    opacity: 24,
    inset: false,
  };
  const [settings, setSettings] = useState(initial);
  const [background, setBackground] = useState("#f2f6fa");
  const shadow = boxShadow(settings);
  const update = (key, value) => setSettings({ ...settings, [key]: value });
  return (
    <ToolFrame
      tool={tool}
      state={state}
      onReset={() => {
        state.clear();
        setSettings(initial);
        setBackground("#f2f6fa");
      }}
    >
      <div className="shadow-layout">
        <div className="shadow-controls">
          {[
            ["x", "Offset X", -100, 100],
            ["y", "Offset Y", -100, 100],
            ["blur", "Blur", 0, 150],
            ["spread", "Spread", -50, 100],
            ["opacity", "Opacity", 0, 100],
          ].map(([key, label, min, max]) => (
            <div key={key}>
              <label id={`shadow-${key}`}>
                {label}{" "}
                <strong>
                  {settings[key]}
                  {key === "opacity" ? "%" : "px"}
                </strong>
              </label>
              <Slider
                ariaLabelForHandle={label}
                min={min}
                max={max}
                value={settings[key]}
                onChange={(v) => update(key, v)}
              />
            </div>
          ))}
          <div className="shadow-colors">
            <label>
              Warna shadow
              <input
                type="color"
                aria-label="Warna shadow"
                value={settings.color}
                onChange={(e) => update("color", e.target.value)}
              />
            </label>
            <label>
              Background preview
              <input
                type="color"
                aria-label="Background shadow"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </label>
          </div>
          <Checkbox
            checked={settings.inset}
            onChange={(e) => update("inset", e.target.checked)}
          >
            Inset (shadow di dalam)
          </Checkbox>
        </div>
        <div className="shadow-preview" style={{ background }}>
          <div className="shadow-preview-card" style={{ boxShadow: shadow }}>
            <span>DevToolBox</span>
            <strong>Lebih berkarakter.</strong>
            <p>Preview shadow secara langsung.</p>
          </div>
        </div>
      </div>
      <ResultEditor
        value={`box-shadow: ${shadow};`}
        onCopy={state.copy}
        rows={3}
      />
    </ToolFrame>
  );
}
export default function ExtendedTools({ tool }) {
  if (tool.slug === "request-builder") return <RequestBuilder tool={tool} />;
  if (tool.slug === "query-params") return <QueryTool tool={tool} />;
  if (tool.slug === "cron") return <CronTool tool={tool} />;
  if (tool.slug === "css-units") return <CssUnits tool={tool} />;
  if (tool.slug === "box-shadow") return <ShadowTool tool={tool} />;
  return <TransformTool tool={tool} />;
}
