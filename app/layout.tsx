import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import { CurrencyProvider } from '@/lib/CurrencyContext';

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
        
        {/* 🚀 EKLENDİ: Tüm sitede çalışacak modern bildirim (Toast) sistemi */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: { background: '#1e1b4b', color: '#fff', borderRadius: '12px', fontWeight: '600' },
            success: { style: { background: '#10b981' } },
            error: { style: { background: '#ef4444' } },
          }} 
        />
        
        {/* EKLENDİ: Tüm siteyi sarmalayan Para Birimi Sağlayıcısı */}
        <CurrencyProvider>
          {/* Sadece Sayfa İçerikleri Yüklenecek - Gereksiz tepe menüsü kaldırıldı! */}
          <main>
            {children}
          </main>
        </CurrencyProvider>
        
      </body>
    </html>
  );
}