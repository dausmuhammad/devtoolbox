# DevToolBox

Workspace developer dengan Next.js App Router, React, JavaScript/JSX, dan Ant Design. Dua puluh tiga alat berjalan di browser tanpa login, database, analytics, atau pengiriman input ke server.

## Menjalankan

Gunakan Node.js 20.9 atau lebih baru.

```sh
npm install
npm run dev
```

Buka http://localhost:3000. Untuk produksi:

```sh
npm run build
npm start
```

## Pemeriksaan

```sh
npm run lint
npm test
npm run build
```

## Fitur

JSON formatter/validator/minifier dan unduh; JWT decoder dengan klaim waktu; Base64 Unicode; URL component/URI; UUID v4 massal; password acak kriptografis; timestamp UTC/lokal; regex worker dengan timeout; text diff per baris; SHA-256/384/512; case converter; HEX/RGB/HSL.

Tema gelap/terang, favorit, pencarian kategori/kata kunci, Ctrl/Cmd+K, navigasi URL langsung, dan drawer ponsel. Hanya tema dan favorit disimpan ke localStorage. Clipboard dan Web Crypto memerlukan HTTPS atau localhost. JWT decoding tidak memverifikasi signature. Regex dibatasi satu detik dan 2.000 hasil. Text Diff membandingkan per baris; input berdampingan di desktop dan vertikal pada ponsel. Warna mendukung HEX/RGB/HSL tanpa alpha.

## Menambahkan alat

1. Daftarkan slug, nama, kategori, ikon, deskripsi, dan keywords di `src/lib/tools.js`.
2. Tambahkan logika murni di `src/lib/transforms.js` dengan pengujian kasus normal/error di `tests/`.
3. Tambahkan panel berlabel dan aksi di `src/components/tool-panel.jsx`, gunakan pola editor, hasil, copy, dan error yang tersedia.
4. Route dan metadata otomatis mengikuti daftar alat melalui `src/app/tools/[slug]/page.jsx`.

`src/components/workspace.jsx` mengelola shell, pencarian, tema, dan favorit. Library diff dimuat hanya ketika digunakan; regex diproses di worker terpisah. Jangan menambahkan penyimpanan input sensitif atau telemetri input.

## Hasil verifikasi

- ESLint, pengujian Node.js, dan production build lulus.
- 45 pengujian otomatis mencakup konversi, input invalid, Unicode, sumber acak kriptografis, posisi/grup regex, batas hasil, dan penghentian pola berat.
- Seluruh 23 panel alat diperiksa melalui browser lokal; clipboard, pencarian Ctrl+K, favorit lintas navigasi, dan tema diuji.
- Layout desktop dan ponsel 390 px diperiksa, termasuk drawer dan editor vertikal; lebar dokumen tidak melebihi viewport ponsel.
- Browser API sensitif digunakan hanya di sisi klien. Tidak ada endpoint penerima input atau analytics aplikasi.

Komponen editor bersama berada di `src/components/tool-editor.jsx`. Untuk deployment, gunakan hosting yang mendukung Next.js dan HTTPS. Aplikasi ini belum dipublikasikan ke hosting eksternal.

## Image Base64 dan pembaruan tampilan

Buka `/tools/image-base64` untuk encode file gambar melalui pilih file/drag-and-drop atau decode Base64 murni/Data URL. Mendukung PNG, JPEG, GIF, WebP, BMP, ICO, dan AVIF sesuai dukungan browser. Hasil mencakup preview, dimensi, ukuran file, copy, dan unduh gambar. File maksimal 10 MB dan resolusi maksimal 40 megapiksel; SVG dan format non-gambar ditolak. File rusak serta MIME yang tidak cocok ditangani dengan pesan error. Tidak ada upload jaringan atau penyimpanan gambar otomatis.

Tipografi, padding, kontrol Ant Design, dan grid disusun ulang. Isi panel berjarak 24 px sehingga alert tidak menempel ke tombol; editor menggunakan font monospace 14 px, teks utama 15–16 px, dan deskripsi kartu 14 px. Di ponsel, kartu dan editor tampil satu kolom.

## AES-128 Encrypt & Decrypt

Buka `/tools/aes-128` untuk mengenkripsi JSON atau teks menggunakan AES-128-CBC dengan padding PKCS#7. Key tim dan IV ditetapkan di `src/lib/aes.js` sebagai string UTF-8 16 byte. Key tidak ditafsirkan sebagai HEX, tidak di-hash, dan tidak diproses melalui derivasi passphrase. Hasil adalah ciphertext mentah dalam HEX atau Base64, tanpa prefix, salt, atau IV tambahan. JSON divalidasi tanpa mengubah whitespace atau urutan field; tersedia mode teks biasa dan decrypt untuk pemeriksaan round trip.

Mode CBC adalah asumsi kompatibilitas karena mode tidak disebutkan; konfirmasi mode/padding sistem penerima sebelum mengandalkan interoperabilitas. Key/IV tetap dipakai sesuai konfigurasi yang diberikan. Konfigurasi pada browser dapat dilihat pengguna, IV tetap membocorkan kesamaan input, dan CBC tidak mengautentikasi ciphertext. Gunakan pola ini untuk kompatibilitas alur tim yang memang memerlukannya; untuk sistem baru gunakan pengelolaan key dan IV acak yang sesuai. Data input/hasil tidak disimpan atau dikirim ke server. Memerlukan HTTPS atau localhost.

Pengujian AES mencocokkan ciphertext Web Crypto dengan implementasi AES-CBC Node.js secara independen, termasuk Unicode, padding, format HEX/Base64, whitespace JSON, dan input invalid.

## Struktur JavaScript / JSX

Proyek ini memakai JavaScript biasa tanpa sintaks TypeScript:

- `src/app/**/*.jsx`: halaman, layout, metadata, dan route App Router.
- `src/components/*.jsx`: komponen React dan antarmuka alat.
- `src/lib/*.js`: logika konversi, AES, metadata alat, dan preferensi.
- `tests/*.test.js`: pengujian dengan test runner bawaan Node.js, tanpa loader tambahan.
- `next.config.mjs`: konfigurasi Next.js.
- `jsconfig.json`: alias `@/` menuju `src/` agar import tetap ringkas.

Gunakan `.jsx` saat membuat komponen yang berisi JSX dan `.js` untuk fungsi biasa. Tidak ada `tsconfig.json` atau langkah typecheck; jalankan lint, pengujian, dan build untuk memeriksa perubahan.

## API Tools, Backend Tools, dan Frontend Tools

Sembilan alat tambahan memiliki URL langsung dan terintegrasi dengan kategori, pencarian, favorit, serta shortcut yang sama:

| Kategori       | Alat                 | URL                      |
| -------------- | -------------------- | ------------------------ |
| API Tools      | API Request Builder  | `/tools/request-builder` |
| API Tools      | HTTP Headers         | `/tools/http-headers`    |
| API Tools      | Query Params Editor  | `/tools/query-params`    |
| Backend Tools  | SQL Formatter        | `/tools/sql-formatter`   |
| Backend Tools  | Cron Explorer        | `/tools/cron`            |
| Backend Tools  | ENV ↔ JSON           | `/tools/env-json`        |
| Frontend Tools | HTML Entities        | `/tools/html-entities`   |
| Frontend Tools | CSS Unit Converter   | `/tools/css-units`       |
| Frontend Tools | Box Shadow Generator | `/tools/box-shadow`      |

- Request Builder menghasilkan cURL POSIX/Bash dan Fetch; tidak mengirim request. Body adalah teks mentah, metode GET/HEAD tidak memakai body. Jalankan kode hasil secara terpisah saat diperlukan. cURL memakai escaping shell POSIX, bukan sintaks CMD/PowerShell.
- Headers memakai array name/value agar header seperti `Set-Cookie` tidak hilang karena duplikat. Query Params mempertahankan urutan dan nama berulang, dengan encoding Unicode otomatis.
- SQL mendukung beberapa dialek melalui [sql-formatter](https://github.com/sql-formatter-org/sql-formatter). Query tidak dijalankan dan bukan validator database. Stored procedure kompleks belum didukung. Maksimal 100.000 karakter.
- Cron menghitung hingga 20 jadwal dalam zona waktu IANA melalui [cron-parser](https://github.com/harrisiirak/cron-parser); mendukung 5 field, detik opsional, alias, dan DST. Waktu acuan memakai ISO 8601 dengan offset/Z; tanpa isian menggunakan waktu saat tombol ditekan. Tidak membuat job atau automation.
- ENV memakai grammar lokal yang eksplisit: `KEY=value`, `export`, komentar `#`, kutip tunggal literal, dan kutip ganda dengan escape JSON (`\n`, `\r`, `\"`, `\\`). Mendukung multiline. Nilai JSON harus string; nama duplikat/invalid ditolak dan tidak ada ekspansi `${VAR}`. Bukan parser shell atau seluruh variasi dotenv.
- HTML entities memakai [he](https://github.com/mathiasbynens/he); hasil hanya ditampilkan sebagai teks, tidak dieksekusi sebagai HTML.
- CSS Unit Converter mendukung px/rem/em dengan root/parent font terpisah. Box Shadow menyediakan slider, inset, warna, opacity, preview, dan copy CSS.

Metadata tambahan berada di `src/lib/extended-tools.js`, UI di `src/components/extended-tools.jsx`, dan logika dipisahkan ke `api-tools.js`, `backend-tools.js`, serta `frontend-tools.js`. Library formatter/parser besar menggunakan dynamic import saat aksi dijalankan. Halaman awal tidak memuat library SQL/cron/HTML entities. Seluruh sumber tetap JavaScript/JSX.
