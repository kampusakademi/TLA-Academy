import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Turkish Learning Academy',
  description: 'Learn Turkish online with professional teachers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        
        {/* Sadece Sayfa İçerikleri Yüklenecek - Gereksiz tepe menüsü kaldırıldı! */}
        <main>
          {children}
        </main>
        
      </body>
    </html>
  );
}