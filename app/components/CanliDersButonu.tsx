'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Supabase'den gelen ders ID'si ve tarih bilgisini props olarak alıyoruz
interface CanliDersButonuProps {
  dersId: string | number;
  tarihSaat: string; // Örn: '2026-07-28T15:00:00Z'
}

export default function CanliDersButonu({ dersId, tarihSaat }: CanliDersButonuProps) {
  const [aktif, setAktif] = useState(false);
  const [mesaj, setMesaj] = useState('Hesaplanıyor...');

  useEffect(() => {
    // Saati kontrol eden fonksiyon
    const zamanKontrolu = () => {
      const suAn = new Date();
      const dersVakti = new Date(tarihSaat);

      // Farkı milisaniye cinsinden buluyoruz
      const fark = dersVakti.getTime() - suAn.getTime();
      const dakikaFarki = Math.floor(fark / (1000 * 60));

      // Derse 10 dakikadan az kaldıysa veya ders saati geçiyorsa butonu aktifleştir
      if (dakikaFarki <= 10) {
        setAktif(true);
      } else {
        setAktif(false);
        // İsteğe bağlı: Kalan süreyi veya saati ekranda gösterebiliriz
        setMesaj(`${dakikaFarki} dk kaldı`);
      }
    };

    // Sayfa açıldığında hemen kontrol et
    zamanKontrolu();

    // Sonrasında her 1 dakikada (60000 ms) bir saati tekrar kontrol et
    const zamanlayici = setInterval(zamanKontrolu, 60000);

    // Bileşen ekrandan kalkarsa zamanlayıcıyı temizle (performans için)
    return () => clearInterval(zamanlayici);
  }, [tarihSaat]);

  // VAKİT GELDİYSE GÖRÜNECEK AKTİF BUTON
  if (aktif) {
    return (
      <Link 
        href={`/ders-odasi/${dersId}`} 
        style={{ padding: '10px 20px', backgroundColor: '#22c55e', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', textAlign: 'center', transition: 'background-color 0.3s' }}
      >
        🎥 Canlı Derse Katıl
      </Link>
    );
  }

  // VAKİT GELMEDİYSE GÖRÜNECEK PASİF BUTON
  return (
    <button 
      disabled 
      style={{ padding: '10px 20px', backgroundColor: '#64748b', color: '#cbd5e1', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'not-allowed' }}
    >
      ⏳ Bekleniyor ({mesaj})
    </button>
  );
}