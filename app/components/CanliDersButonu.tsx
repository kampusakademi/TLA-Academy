'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CanliDersButonuProps {
  dersId: string | number;
  tarihSaat: string; // Örn: '2026-07-28T15:00:00Z'
}

export default function CanliDersButonu({ dersId, tarihSaat }: CanliDersButonuProps) {
  const [aktif, setAktif] = useState(false);
  const [mesaj, setMesaj] = useState('Hesaplanıyor...');

  useEffect(() => {
    const zamanKontrolu = () => {
      const suAn = new Date();
      const dersVakti = new Date(tarihSaat);

      // Farkı dakika cinsinden buluyoruz
      // Pozitif = Derse var | Negatif = Ders saati geçti
      const fark = dersVakti.getTime() - suAn.getTime();
      const dakikaFarki = Math.floor(fark / (1000 * 60));

      // 1. DURUM: Derse 2 saatten (120 dk) FAZLA var (Henüz erken -> Kilitli)
      if (dakikaFarki > 120) {
        setAktif(false);
        const saatKaldi = Math.floor(dakikaFarki / 60);
        const dkKaldi = dakikaFarki % 60;
        setMesaj(saatKaldi > 0 ? `${saatKaldi} sa ${dkKaldi} dk kaldı` : `${dkKaldi} dk kaldı`);
      }
      // 2. DURUM: Ders saatinin üzerinden 2 saatten (120 dk) FAZLA geçti (Ders bitti -> Kilitli)
      else if (dakikaFarki < -120) {
        setAktif(false);
        setMesaj('Ders süresi doldu');
      }
      // 3. DURUM: Derse 2 saat kala açılır, ders bittikten 2 saat sonrasına kadar AKTİF kalır!
      else {
        setAktif(true);
      }
    };

    // Sayfa açıldığında hemen kontrol et
    zamanKontrolu();

    // Her 1 dakikada bir saati tekrar kontrol et
    const zamanlayici = setInterval(zamanKontrolu, 60000);

    return () => clearInterval(zamanlayici);
  }, [tarihSaat]);

  // VAKİT GELDİYSE GÖRÜNECEK AKTİF BUTON (Yeşil)
  if (aktif) {
    return (
      <Link 
        href={`/ders-odasi/${dersId}`} 
        style={{ padding: '10px 20px', backgroundColor: '#22c55e', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', textAlign: 'center', transition: 'background-color 0.3s', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
      >
        🎥 Canlı Derse Katıl
      </Link>
    );
  }

  // VAKİT GELMEDİYSE VEYA SÜRE DOLDUYSA GÖRÜNECEK PASİF BUTON (Gri)
  return (
    <button 
      disabled 
      style={{ padding: '10px 20px', backgroundColor: '#64748b', color: '#cbd5e1', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'not-allowed' }}
    >
      🔒 {mesaj === 'Ders süresi doldu' ? 'Ders Süresi Doldu' : `Bekleniyor (${mesaj})`}
    </button>
  );
}