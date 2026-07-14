import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ÜST MENÜ (Header) */}
      {/* Eğitmenler ve Eğitmen Panelim linkleri buradan kaldırıldı */}
      <header className="p-4 border-b flex justify-between items-center bg-white">
        <div className="text-xl font-bold">Logo</div>
        <nav className="flex gap-4">
          {/* Yukarıda kalmasını istediğin diğer menü elemanlarını buraya ekleyebilirsin */}
          <Link href="/kurslar" className="hover:text-blue-600">Kurslar</Link>
          <Link href="/hakkimizda" className="hover:text-blue-600">Hakkımızda</Link>
        </nav>
      </header>

      {/* ANA İÇERİK (Main) */}
      <main className="flex-grow p-8">
        <h1 className="text-3xl font-bold mb-4">Hoş Geldiniz</h1>
        <p>Platformun ana içerik alanı, tanıtımlar veya giriş butonları buraya yerleştirilebilir.</p>
      </main>

      {/* ALT KISIM (Footer) */}
      {/* Anasayfa linki buraya taşındı */}
      <footer className="bg-gray-50 p-6 border-t border-gray-200">
        <nav className="flex justify-center gap-6">
          <Link href="/" className="font-medium hover:text-blue-600">
            Anasayfa
          </Link>
        </nav>
        <div className="text-center text-sm text-gray-500 mt-4">
          © {new Date().getFullYear()} Tüm Hakları Saklıdır.
        </div>
      </footer>

    </div>
  );
}