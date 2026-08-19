'use client';

import { useRouter } from 'next/navigation';

export default function CanliDersButonu({ dersId, tarihSaat }: { dersId: string; tarihSaat: string }) {
  const router = useRouter();

  // 🚀 NOT: Kullanıcıyı video odasına yönlendireceğiniz linki buraya yazın.
  // Kendi sisteminize göre "/ders-odasi/...", "/toplanti/..." gibi değiştirebilirsiniz.
  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation(); // Kartın tıklanmasını engeller, sadece butona tıklar
    router.push(`/ders-odasi/${dersId}`); 
  };

  return (
    <button 
      onClick={handleJoin}
      style={{
        background: 'linear-gradient(135deg, #1308a7 0%, #1308a7 100%)', // Modern Zümrüt Yeşili Gradyan
        color: '#ffffff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '12px',
        fontSize: '0.95rem',
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(41, 3, 206, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 8, 129, 0.3)';
      }}
    >
      {/* 🔴 Yanan Sönen (Pulse) Canlı Yayın Noktası */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px' }}>
        <span style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: '50%', opacity: 0.8, animation: 'pingPulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
        <span style={{ position: 'relative', width: '6px', height: '6px', backgroundColor: '#ffffff', borderRadius: '50%' }}></span>
      </div>

      {/* 🎥 Profesyonel Video Kamera SVG İkonu */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z"></path>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
      </svg>

      Canlı Derse Katıl

      {/* CSS Animasyonu (Sayfa render edildiğinde otomatik çalışır) */}
      <style>{`
        @keyframes pingPulse {
          75%, 100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}