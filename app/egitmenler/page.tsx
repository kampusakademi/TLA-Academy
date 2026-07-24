'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function TeachersListPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchTeachers() {
      const { data, error } = await supabase.from('egitmenler').select('*');
      if (error) console.error(error);
      setTeachers(data || []);
      setLoading(false);
    }
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter((t) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      (t.tam_ad && t.tam_ad.toLowerCase().includes(lowerTerm)) ||
      (t.ders_turu && t.ders_turu.toLowerCase().includes(lowerTerm)) ||
      (t.odak && t.odak.toLowerCase().includes(lowerTerm)) ||
      (t.amac && t.amac.toLowerCase().includes(lowerTerm)) ||
      (t.seviye && t.seviye.toLowerCase().includes(lowerTerm))
    );
  });

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#121117', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* NAVBAR */}
      <nav style={{ padding: '16px 8%', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#121117', margin: 0 }}>
            Turkish Learning Academy<span style={{ color: '#f472b6' }}>.</span>
          </h1>
        </div>
        <button onClick={() => router.push('/egitmen-bul')} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#121117', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
          ✨ Akıllı Eşleşme
        </button>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '40px auto 0', padding: '0 20px' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#121117', marginBottom: '16px' }}>Hedeflerine ve programına uygun Türkçe öğretmenleri</h1>
          
          <input 
            type="text" 
            placeholder="İsim, uzmanlık alanı veya ders türü ara... (Örn: İş Türkçesi, TÖMER, Ayşe)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '16px 24px', borderRadius: '12px', border: '1px solid #d1d5db', 
              fontSize: '1.05rem', outline: 'none', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
            }}
          />
        </div>

        {/* EĞİTMEN KARTLARI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280', fontSize: '1.2rem' }}>Eğitmenler yükleniyor...</div>
          ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map((t) => {
              const dillerMetni = t.konustugu_diller || t.diller || '';
              return (
                <div 
                  key={t.id} 
                  style={{ 
                    backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '16px', 
                    padding: '24px', display: 'flex', gap: '24px', position: 'relative'
                  }}
                >
                  {/* Fotoğraf */}
                  <div style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => router.push(`/teachers/${t.user_id || t.id}`)}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={t.avatar_url || `https://ui-avatars.com/api/?name=${t.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=160&bold=true`} 
                        alt={t.tam_ad}
                        style={{ width: '160px', height: '160px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e5e7eb' }} 
                      />
                      <div style={{ position: 'absolute', bottom: -6, right: -6, width: '20px', height: '20px', backgroundColor: '#16a34a', border: '3px solid #ffffff', borderRadius: '50%' }}></div>
                    </div>
                  </div>

                  {/* Öğretmen Detayları */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 onClick={() => router.push(`/teachers/${t.user_id || t.id}`)} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#121117', cursor: 'pointer' }}>
                        {t.tam_ad}
                      </h2>
                      <span title="Onaylı Profil" style={{ color: '#121117', fontSize: '1.1rem' }}>✔</span>
                      {t.konum && <span title={t.konum} style={{ fontSize: '1.1rem' }}>🇹🇷</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.9rem', color: '#374151', fontWeight: 600, flexWrap: 'wrap' }}>
                      {t.super_ogretmen && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🏆 Süper Öğretmen</span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🎓 {t.ders_turu || 'Türkçe Eğitmeni'}</span>
                      {t.seviye && (
                        <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>📈 {t.seviye}</span>
                      )}
                    </div>

                    {/* Diller */}
                    {dillerMetni && (
                      <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '2px' }}>
                        <strong>🗣 Konuştuğu diller:</strong> {dillerMetni}
                      </div>
                    )}

                    {/* Öne Çıkan Etiket (Pembe Kutu) */}
                    {t.one_cikan_etiket && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ padding: '4px 10px', backgroundColor: '#fce7f3', color: '#9d174d', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                          ✨ {t.one_cikan_etiket}
                        </span>
                      </div>
                    )}

                    {/* Biyografi Özeti */}
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', color: '#374151', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      <strong>{t.biyografi ? t.biyografi.split('.')[0] + '.' : ''}</strong> {t.biyografi || 'Eğitmen henüz detaylı biyografi eklememiş.'}
                    </p>
                  </div>

                  {/* Sağ Kart: Fiyat & İstatistikler */}
                  <div style={{ width: '220px', borderLeft: '1px solid #e5e7eb', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af' }}>♡</button>

                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#121117' }}>₺{t.saatlik_ucret || '0'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px' }}>50 dakikalık ders</div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: 800, color: '#121117', fontSize: '1rem' }}>{t.ortalama_puan ? `${t.ortalama_puan} ★` : 'Yeni'}</div>
                          <div style={{ color: '#6b7280' }}>{t.yorum_sayisi || 0} değ.</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: 800, color: '#121117', fontSize: '1rem' }}>{t.ogrenci_sayisi || 0}</div>
                          <div style={{ color: '#6b7280' }}>öğrenci</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: 800, color: '#121117', fontSize: '1rem' }}>{t.toplam_ders_sayisi || 0}</div>
                          <div style={{ color: '#6b7280' }}>ders</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button 
                        onClick={() => router.push(`/teachers/${t.user_id || t.id}`)}
                        style={{ 
                          width: '100%', padding: '12px', backgroundColor: '#f9a8d4', color: '#121117', 
                          border: '1px solid #121117', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                          boxShadow: '0 2px 0 #121117'
                        }}
                      >
                        Deneme dersi ayırt
                      </button>
                      <button 
                        onClick={() => router.push(`/teachers/${t.user_id || t.id}`)}
                        style={{ 
                          width: '100%', padding: '12px', backgroundColor: '#ffffff', color: '#121117', 
                          border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' 
                        }}
                      >
                        Mesaj gönder
                      </button>
                    </div>
                    
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #d1d5db' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🔍</span>
              <h3 style={{ fontSize: '1.4rem', color: '#121117', marginBottom: '8px' }}>Eğitmen bulunamadı</h3>
              <p style={{ color: '#6b7280' }}>Lütfen farklı bir anahtar kelime ile tekrar arama yapın.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}