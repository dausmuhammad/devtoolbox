import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>Alat tidak ditemukan</h1>
      <p>Periksa alamat atau temukan alat melalui pencarian.</p>
      <Link href="/">← Kembali ke semua alat</Link>
    </div>
  );
}
