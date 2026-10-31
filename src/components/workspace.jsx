"use client";
import { App, Button, ConfigProvider, Drawer, Input, Modal, theme } from "antd";
import idID from "antd/locale/id_ID";
import { useEffect, useMemo, useState } from "react";
import { usePreference } from "@/lib/preferences";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  SunOutlined,
  MoonOutlined,
  MenuOutlined,
  ArrowRightOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import { categories, categoryIcons, searchTools, tools } from "@/lib/tools";
export default function Workspace({ children }) {
  const [storedTheme, setStoredTheme] = usePreference(
    "devtoolbox-theme",
    "dark",
  );
  const light = storedTheme === "light";
  const [storedFavorites, setStoredFavorites] = usePreference(
    "devtoolbox-favorites",
    "[]",
  );
  const favorites = useMemo(() => {
    try {
      const saved = JSON.parse(storedFavorites);
      return Array.isArray(saved)
        ? saved.filter(
            (s) => typeof s === "string" && tools.some((t) => t.slug === s),
          )
        : [];
    } catch {
      return [];
    }
  }, [storedFavorites]);
  const [query, setQuery] = useState(""),
    [search, setSearch] = useState(false),
    [drawer, setDrawer] = useState(false),
    [category, setCategory] = useState("Semua alat");
  const path = usePathname();
  const current = tools.find((t) => path === `/tools/${t.slug}`);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light]);
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const toggle = (slug) => {
    const next = favorites.includes(slug)
      ? favorites.filter((s) => s !== slug)
      : [...favorites, slug];
    setStoredFavorites(JSON.stringify(next));
  };
  const nav = (
    <>
      <Link href="/" className="brand" onClick={() => setDrawer(false)}>
        <span className="brand-symbol">
          <CodeOutlined />
        </span>
        DevTool<span>Box</span>
        <small>WORKSPACE</small>
      </Link>
      <button className="sidebar-search" onClick={() => setSearch(true)}>
        <SearchOutlined /> Cari alat… <kbd>⌘ K</kbd>
      </button>
      <div className="nav-caption">WORKSPACE</div>
      <Link
        className={`nav-item ${path === "/" && category === "Semua alat" ? "selected" : ""}`}
        href="/"
        onClick={() => {
          setCategory("Semua alat");
          setDrawer(false);
        }}
      >
        <span>▦</span> Semua alat <small>{tools.length}</small>
      </Link>
      <Link
        className={`nav-item ${path === "/" && category === "Favorit" ? "selected" : ""}`}
        href="/"
        onClick={() => {
          setCategory("Favorit");
          setDrawer(false);
        }}
      >
        <StarOutlined /> Favorit <small>{favorites.length}</small>
      </Link>
      <div className="nav-caption">KATEGORI ALAT</div>
      {categories.map((c) => (
        <Link
          key={c}
          className={`nav-item ${(path === "/" && category === c) || current?.category === c ? "selected" : ""}`}
          href="/"
          onClick={() => {
            setCategory(c);
            setDrawer(false);
          }}
        >
          <span>{categoryIcons[c] || "▦"}</span>
          {c}
        </Link>
      ))}
      <div className="nav-caption">AKSES CEPAT</div>
      {tools
        .filter((t) => favorites.includes(t.slug))
        .map((t) => (
          <Link
            key={t.slug}
            className={`nav-item ${current?.slug === t.slug ? "selected" : ""}`}
            href={`/tools/${t.slug}`}
            onClick={() => setDrawer(false)}
          >
            <span>{t.icon}</span>
            {t.name}
          </Link>
        ))}
      <div className="sidebar-foot">
        <span className="status-dot" /> Semua proses di browser
        <p>Data Anda tetap milik Anda.</p>
        <span className="version">DevToolBox v1.0</span>
      </div>
    </>
  );
  const card = (t) => (
    <article className="tool-card" key={t.slug}>
      <div className="card-top">
        <Link
          href={`/tools/${t.slug}`}
          aria-label={`Buka ${t.name}`}
          className={`tool-icon icon-${t.slug}`}
        >
          {t.icon}
        </Link>
        <Button
          type="text"
          aria-label={`${favorites.includes(t.slug) ? "Hapus dari" : "Tambahkan ke"} favorit: ${t.name}`}
          icon={
            favorites.includes(t.slug) ? (
              <StarFilled style={{ color: "#e3b85d" }} />
            ) : (
              <StarOutlined />
            )
          }
          onClick={() => toggle(t.slug)}
        />
      </div>
      <Link href={`/tools/${t.slug}`} className="card-body">
        <h3>{t.name}</h3>
        <p>{t.description}</p>
        <div className="card-bottom">
          <span>{t.category}</span>
          <ArrowRightOutlined />
        </div>
      </Link>
    </article>
  );
  const filtered = searchTools(query).filter(
    (t) =>
      category === "Semua alat" ||
      (category === "Favorit" && favorites.includes(t.slug)) ||
      category === t.category,
  );
  return (
    <ConfigProvider
      locale={idID}
      theme={{
        algorithm: light ? theme.defaultAlgorithm : theme.darkAlgorithm,
        token: {
          colorPrimary: "#27cbb4",
          fontSize: 15,
          controlHeight: 42,
          controlHeightSM: 34,
          padding: 20,
          paddingSM: 14,
          paddingLG: 28,
          colorBgBase: light ? "#f5f7fa" : "#10151e",
          colorText: light ? "#202b3d" : "#e7edf7",
          borderRadius: 10,
          fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        },
        components: {
          Button: { primaryColor: "#061c19" },
          Input: { activeShadow: "0 0 0 2px #27cbb422" },
        },
      }}
    >
      <App>
        <div className="workspace">
          <aside className="sidebar">{nav}</aside>
          <Drawer
            title="Navigasi"
            placement="left"
            open={drawer}
            onClose={() => setDrawer(false)}
          >
            {nav}
          </Drawer>
          <div className="main-wrap">
            <header className="topbar">
              <div>
                <Button
                  className="mobile-menu"
                  type="text"
                  aria-label="Buka navigasi"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawer(true)}
                />
                <span className="breadcrumb">
                  Workspace <span>/</span>{" "}
                  <strong>{current?.name || category}</strong>
                </span>
              </div>
              <div className="header-actions">
                <button
                  className="search-shortcut"
                  onClick={() => setSearch(true)}
                  aria-label="Cari alat"
                >
                  <SearchOutlined />
                  <kbd>Ctrl K</kbd>
                </button>
                <span className="header-divider" />
                <Button
                  type="text"
                  aria-label={
                    light ? "Gunakan tema gelap" : "Gunakan tema terang"
                  }
                  icon={light ? <MoonOutlined /> : <SunOutlined />}
                  onClick={() => {
                    setStoredTheme(!light ? "light" : "dark");
                  }}
                />
                <span className="avatar">D</span>
              </div>
            </header>
            <main>
              {current || path !== "/" ? (
                children
              ) : (
                <>
                  <section className="hero">
                    <div className="eyebrow">
                      <span className="status-dot" /> TOOLKIT UNTUK DEVELOPER
                    </div>
                    <div className="hero-heading">
                      <div>
                        <h1>
                          Alat kecil. <span>Produktivitas besar.</span>
                        </h1>
                        <p>
                          Satu workspace untuk pekerjaan developer sehari-hari.
                          <br />
                          Cepat, praktis, dan sepenuhnya di browser Anda.
                        </p>
                      </div>
                      <div className="hero-emblem">
                        {"{"}
                        <span>_</span>
                        {"}"}
                      </div>
                    </div>
                    <Input
                      className="main-search"
                      size="large"
                      prefix={<SearchOutlined />}
                      placeholder="Cari alat, kategori, atau kata kunci…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      suffix={<kbd>{tools.length} alat</kbd>}
                      aria-label="Cari seluruh alat"
                    />
                    <div className="hero-notes">
                      <span>✓ Tanpa login</span>
                      <span>◈ Privasi terjaga</span>
                      <span>ϟ Siap digunakan</span>
                    </div>
                  </section>
                  {!query && category === "Semua alat" && (
                    <section className="favorites-section">
                      <h2>
                        <StarOutlined /> Favorit Anda
                      </h2>
                      {favorites.length ? (
                        <div className="tool-grid">
                          {tools
                            .filter((t) => favorites.includes(t.slug))
                            .map(card)}
                        </div>
                      ) : (
                        <div className="favorites-empty">
                          <StarOutlined /> Alat andalan, selalu dekat. Klik
                          bintang pada kartu untuk menambahkan favorit.
                        </div>
                      )}
                    </section>
                  )}
                  <section className="tools-section">
                    <div className="section-heading">
                      <h2>
                        {category === "Semua alat"
                          ? "Jelajahi semua alat"
                          : category}{" "}
                        <span>{filtered.length}</span>
                      </h2>
                      <span className="section-note">
                        Dibuat untuk alur kerja Anda
                      </span>
                    </div>
                    <div className="category-tabs">
                      {["Semua alat", ...categories].map((c) => (
                        <button
                          key={c}
                          className={category === c ? "active" : ""}
                          onClick={() => setCategory(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="tool-grid">{filtered.map(card)}</div>
                    {!filtered.length && (
                      <div className="empty">
                        Tidak ada alat ditemukan. Coba kata kunci lain atau
                        tambahkan favorit.
                      </div>
                    )}
                  </section>
                  <div className="privacy-strip">
                    <span className="privacy-icon">◈</span>
                    <div>
                      <strong>Input Anda tidak ke mana-mana.</strong>
                      <p>
                        Semua alat berjalan di perangkat Anda. Tanpa akun, tanpa
                        pelacakan, tanpa penyimpanan input.
                      </p>
                    </div>
                    <span className="local-badge">LOCAL FIRST</span>
                  </div>
                </>
              )}
              <footer>
                Dirancang untuk membuat pekerjaan Anda lebih ringan.
                <span>
                  DevToolBox <b> / </b> Developer essentials
                </span>
              </footer>
            </main>
          </div>
        </div>
        <Modal
          title="Cari alat"
          open={search}
          footer={null}
          onCancel={() => setSearch(false)}
        >
          <Input
            autoFocus
            prefix={<SearchOutlined />}
            placeholder="Nama, kategori, atau kata kunci…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="search-results">
            {searchTools(query).map((t) => (
              <Link
                href={`/tools/${t.slug}`}
                key={t.slug}
                onClick={() => {
                  setSearch(false);
                  setQuery("");
                }}
              >
                <span className="tool-icon">{t.icon}</span>
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.category}</small>
                </div>
                <ArrowRightOutlined />
              </Link>
            ))}
          </div>
        </Modal>
      </App>
    </ConfigProvider>
  );
}
