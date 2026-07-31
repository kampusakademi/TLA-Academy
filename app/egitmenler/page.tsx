'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LanguageToggle from '@/app/components/LanguageToggle';
import { useTranslation } from '@/lib/useTranslation';

export default function TeachersListPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchTeachers() {
      const { data: teacherList, error } = await supabase.from('egitmenler').select('*');
      if (error) {
        console.error("Eğitmenler çekilirken hata:", error);
        setLoading(false);
        return;
      }

      const teachersWithStats = await Promise.all(
        (teacherList || []).map(async (item) => {
          const targetId = item.user_id || item.id;

          const { data: lessonData } = await supabase
            .from('dersler')
            .select('durum')
            .eq('user_id', targetId)
            .eq('durum', 'Tamamlanan');
          
          const tamamlananDers = lessonData ? lessonData.length : 0;

          const { data: dersYorumlari } = await supabase
            .from('dersler')
            .select('puan')
            .eq('user_id', targetId)
            .not('puan', 'is', null);

          const { data: digerYorumlar } = await supabase
            .from('yorumlar')
            .select('puan')
            .eq('egitmen_id', targetId);

          const tumPuanlar = [
            ...(dersYorumlari || []).map((y) => Number(y.puan)),
            ...(digerYorumlar || []).map((y) => Number(y.puan)),
          ].filter((p) => p > 0 && p <= 5);

          const dinamikPuan = tumPuanlar.length > 0
            ? (tumPuanlar.reduce((acc, val) => acc + val, 0) / tumPuanlar.length).toFixed(1)
            : null;

          return {
            ...item,
            gercek_tamamlanan_ders: tamamlananDers,
            gercek_puan_ortalamasi: dinamikPuan,
            gercek_yorum_sayisi: tumPuanlar.length,
          };
        })
      );

      setTeachers(teachersWithStats);
      setLoading(false);
    }

    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter((tItem) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      (tItem.tam_ad && tItem.tam_ad.toLowerCase().includes(lowerTerm)) ||
      (tItem.ders_turu && tItem.ders_turu.toLowerCase().includes(lowerTerm)) ||
      (tItem.odak && tItem.odak.toLowerCase().includes(lowerTerm)) ||
      (tItem.amac && tItem.amac.toLowerCase().includes(lowerTerm)) ||
      (tItem.seviye && tItem.seviye.toLowerCase().includes(lowerTerm))
    );
  });

  const isOnline = (dateStr: string) => {
    if (!dateStr) return false;
    const lastSeen = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return (now - lastSeen) < 15 * 60 * 1000;
  };

  const handleLogoClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/'); 
      return;
    }
    const { data: isTeacher } = await supabase.from('egitmenler').select('id').eq('user_id', user.id).maybeSingle();
    if (isTeacher) {
      router.push('/teacher-dashboard');
    } else {
      router.push('/student-dashboard');
    }
  };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#121117', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      
      <nav style={{ padding: '16px 8%', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#121117', margin: 0 }}>
            Turkish Learning Academy<span style={{ color: '#f472b6' }}>.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <LanguageToggle />
          <button onClick={() => router.push('/egitmen-bul')} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#121117', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            {t.nav.smartMatch}
          </button>
        </div>
      </nav>

      {/* ÜST GERİ DÖN BUTONU */}
      <div style={{ maxWidth: '1000px', margin: '20px auto 0', padding: '0 20px' }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px' }}
        >
          {t.nav.back}
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '20px auto 0', padding: '0 20px' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#121117', marginBottom: '16px' }}>
            {t.listPage.title}
          </h1>
          
          <input 
            type="text" 
            placeholder={t.listPage.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '16px 24px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1.05rem', outline: 'none', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280', fontSize: '1.2rem' }}>Loading...</div>
          ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map((tItem) => {
              const dillerMetni = tItem.konustugu_diller || tItem.diller || '';
              const onlineStatus = isOnline(tItem.son_gorulme); 
              const doluYildiz = tItem.gercek_puan_ortalamasi ? Math.round(Number(tItem.gercek_puan_ortalamasi)) : 0;

              return (
                <div 
                  key={tItem.id} 
                  style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '16px', padding: '24px', display: 'flex', gap: '24px', position: 'relative' }}
                >
                  <div style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={tItem.avatar_url || `https://ui-avatars.com/api/?name=${tItem.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=160&bold=true`} 
                        alt={tItem.tam_ad}
                        style={{ width: '160px', height: '160px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e5e7eb' }} 
                      />
                      {onlineStatus && (
                        <div style={{ position: 'absolute', bottom: -6, right: -6, width: '20px', height: '20px', backgroundColor: '#16a34a', border: '3px solid #ffffff', borderRadius: '50%' }}></div>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#121117', cursor: 'pointer' }}>
                        {tItem.tam_ad}
                      </h2>
                      <span title="Verified Profile" style={{ color: '#121117', fontSize: '1.1rem' }}>✔</span>
                      {tItem.konum && <span title={tItem.konum} style={{ fontSize: '1.1rem' }}>🇹🇷</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.9rem', color: '#374151', fontWeight: 600, flexWrap: 'wrap' }}>
                      {tItem.super_ogretmen && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{t.listPage.superTeacher}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🎓 {tItem.ders_turu || 'Turkish'}</span>
                      {tItem.seviye && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>📈 {tItem.seviye}</span>}
                    </div>

                    {dillerMetni && (
                      <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '2px' }}>
                        <strong>{t.listPage.languages}</strong> {dillerMetni}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {tItem.konum && (
                        <span style={{ padding: '4px 10px', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                          📍 {tItem.konum}
                        </span>
                      )}
                      {tItem.egitim && (
                        <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                          📚 {tItem.egitim}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {(tItem.amac || tItem.odak || '')
                        .split(',')
                        .filter((item: string) => item.trim() !== '')
                        .slice(0, 4)
                        .map((item: string, i: number) => (
                          <span key={i} style={{ padding: '4px 10px', background: '#e0e7ff', color: '#3730a3', borderRadius: '14px', fontSize: '0.8rem', fontWeight: 700 }}>
                            🎯 {item.trim()}
                          </span>
                        ))}
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <span style={{ padding: '4px 10px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                        🏆 {tItem.gercek_tamamlanan_ders || 0} {t.teacherCard.lessonsCompleted}
                      </span>
                    </div>

                    <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', color: '#374151', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      <strong>{tItem.biyografi ? tItem.biyografi.split('.')[0] + '.' : ''}</strong> {tItem.biyografi || t.listPage.noBio}
                    </p>
                  </div>

                  <div style={{ width: '220px', borderLeft: '1px solid #e5e7eb', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af' }}>♡</button>

                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#121117' }}>₺{tItem.saatlik_ucret || '0'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px' }}>50 min {t.teacherCard.perLesson}</div>

                      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', marginBottom: '24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {tItem.gercek_puan_ortalamasi ? (
                            <>
                              <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.95rem' }}>
                                {"★".repeat(doluYildiz)}{"☆".repeat(5 - doluYildiz)}
                              </div>
                              <div style={{ fontWeight: 800, color: '#121117', fontSize: '0.95rem' }}>
                                {tItem.gercek_puan_ortalamasi}
                              </div>
                              <div style={{ color: '#6b7280' }}>{tItem.gercek_yorum_sayisi}</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                {t.teacherCard.newTeacher}
                              </div>
                              <div style={{ color: '#94a3b8', marginTop: '4px' }}>{t.teacherCard.noRating}</div>
                            </>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: 800, color: '#121117', fontSize: '1rem' }}>{tItem.gercek_tamamlanan_ders || 0}</div>
                          <div style={{ color: '#6b7280' }}>lessons</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button 
                        onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)}
                        style={{ width: '100%', padding: '12px', backgroundColor: '#f9a8d4', color: '#121117', border: '1px solid #121117', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 2px 0 #121117' }}
                      >
                        {t.teacherCard.bookTrial}
                      </button>
                      <button 
                        onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)}
                        style={{ width: '100%', padding: '12px', backgroundColor: '#ffffff', color: '#121117', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                      >
                        {t.teacherCard.sendMessage}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #d1d5db' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🔍</span>
              <h3 style={{ fontSize: '1.4rem', color: '#121117', marginBottom: '8px' }}>{t.home.noTutors}</h3>
            </div>
          )}
        </div>

        {/* ALT GERİ DÖN BUTONU */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => router.back()} 
            style={{ background: '#ffffff', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px' }}
          >
            {t.nav.back}
          </button>
        </div>

      </div>
    </div>
  );
}