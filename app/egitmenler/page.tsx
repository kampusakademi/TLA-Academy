'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LanguageToggle from '@/app/components/LanguageToggle';
import { useTranslation } from '@/lib/useTranslation';
import { useCurrency } from '@/lib/CurrencyContext';

// YouTube URL'sinden Video ID'sini çıkaran yardımcı fonksiyon
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// DİLLERİ TEMİZLEYEN FONKSİYON
const formatDiller = (diller: any) => {
  if (!diller) return '';
  try {
    let parsed = typeof diller === 'string' ? JSON.parse(diller) : diller;
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch(e) {
    return String(diller).replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).join(', ');
  }
  return String(diller);
};

export default function TeachersListPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // FİLTRELEME VE SIRALAMA STATE'LERİ
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterHedef, setFilterHedef] = useState('');
  const [filterMusaitlik, setFilterMusaitlik] = useState('');
  const [filterUlke, setFilterUlke] = useState('');
  const [sortOrder, setSortOrder] = useState('varsayilan');
  const [filterMaxFiyat, setFilterMaxFiyat] = useState<number | ''>('');

  const [hoveredTeacher, setHoveredTeacher] = useState<any>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth > 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    async function fetchTeachers() {
      const { data: teacherList, error } = await supabase.from('egitmenler').select('*');
      
      if (error) {
        console.error("Eğitmenler çekilirken hata:", error);
        setLoading(false);
        return;
      }

      const aktifEgitmenler = (teacherList || []).filter(item => {
        const durumText = String(item.durum || '').toLowerCase().trim();
        const statusText = String(item.status || '').toLowerCase().trim(); 
        if (durumText.includes('pasif') || durumText.includes('beklemede') || durumText.includes('iptal')) return false;
        if (statusText.includes('pasif') || statusText.includes('beklemede') || statusText.includes('iptal')) return false;
        if (item.aktif_mi === false) return false;
        return true;
      });

      const teachersWithStats = await Promise.all(
        aktifEgitmenler.map(async (item) => {
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

  let processedTeachers = teachers.filter((tItem) => {
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      const matchesSearch = (
        (tItem.tam_ad && tItem.tam_ad.toLowerCase().includes(lowerTerm)) ||
        (tItem.biyografi && tItem.biyografi.toLowerCase().includes(lowerTerm))
      );
      if (!matchesSearch) return false;
    }

    if (filterKategori) {
      if (filterKategori === 'Süper Öğretmen') {
        if (!(Number(tItem.gercek_puan_ortalamasi) >= 4.5 && tItem.gercek_tamamlanan_ders >= 10)) return false;
      } else if (filterKategori === 'Profesyonel Öğretmen') {
        if (!(tItem.gercek_tamamlanan_ders > 0)) return false;
      } else if (filterKategori === 'Yeni Öğretmen') {
        if (tItem.gercek_tamamlanan_ders >= 5) return false;
      }
    }

    if (filterHedef && (!tItem.amac || !tItem.amac.includes(filterHedef))) return false;
    if (filterUlke && (!tItem.konum || !tItem.konum.includes(filterUlke))) return false;
    if (filterMaxFiyat !== '' && tItem.saatlik_ucret > filterMaxFiyat) return false;

    return true;
  });

  if (sortOrder === 'fiyat-artan') {
    processedTeachers.sort((a, b) => (a.saatlik_ucret || 0) - (b.saatlik_ucret || 0));
  } else if (sortOrder === 'fiyat-azalan') {
    processedTeachers.sort((a, b) => (b.saatlik_ucret || 0) - (a.saatlik_ucret || 0));
  } else if (sortOrder === 'puan-azalan') {
    processedTeachers.sort((a, b) => (Number(b.gercek_puan_ortalamasi) || 0) - (Number(a.gercek_puan_ortalamasi) || 0));
  } else if (sortOrder === 'degerlendirme-azalan') {
    processedTeachers.sort((a, b) => (b.gercek_yorum_sayisi || 0) - (a.gercek_yorum_sayisi || 0));
  }

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

  // 🚀 Daha kompakt select tasarımı (Boşlukları azalttık)
  const selectStyle = {
    width: "100%", padding: '8px 12px', border: "1px solid #cbd5e1", borderRadius: '10px',
    outline: "none", fontSize: '0.85rem', color: '#0f172a', background: '#f8fafc', 
    boxSizing: 'border-box' as const, cursor: 'pointer', appearance: 'none' as const,
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', 
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '10px auto',
  };

  const ulkeler = [
    "Türkiye", "Amerika Birleşik Devletleri", "İngiltere", "Almanya", "Fransa", "Kanada", 
    "Avustralya", "İspanya", "İtalya", "Hollanda", "Rusya", "Japonya", "Çin", 
    "Güney Kore", "Brezilya", "Arjantin", "Mısır", "Suudi Arabistan", "Birleşik Arap Emirlikleri", "Güney Afrika"
  ];

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <nav style={{ padding: '16px 8%', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e1b4b', margin: 0, letterSpacing: '-0.5px' }}>
            Turkish Learning Academy<span style={{ color: '#fa700d' }}>.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <LanguageToggle />
        </div>
      </nav>

      {/* 🚀 Üstteki gereksiz büyük boşluklar daraltıldı (margin 15px yapıldı) */}
      <div style={{ maxWidth: '1400px', width: '100%', margin: '15px auto 0', padding: '0 20px', flex: 1 }}>
        
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => router.back()} 
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            {t.nav.back}
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            Mesleki gelişiminize katkıda bulunacak eğitmenler
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>Aşağıdaki gelişmiş filtreleri kullanarak hedeflerinize uygun uzmanı saniyeler içinde bulun.</p>
          
          {/* 🚀 DAHA KOMPAKT VE TOPLU FİLTRELEME PANELİ */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center' }}>
              
              {/* 1. Hedef */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Hedefini Seç</label>
                <select value={filterHedef} onChange={e => setFilterHedef(e.target.value)} style={selectStyle}>
                  <option value="">Tüm Hedefler</option>
                  <option value="Sınav Hazırlığı">Sınav Hazırlığı</option>
                  <option value="Kariyer ve İş">Kariyer ve İş Türkçesi</option>
                  <option value="Günlük Konuşma">Günlük Konuşma</option>
                  <option value="Çocuklar İçin Türkçe">Çocuklar İçin</option>
                </select>
              </div>

              {/* 2. Öğretmen Kategorileri */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Kategori</label>
                <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} style={selectStyle}>
                  <option value="">Tüm Eğitmenler</option>
                  <option value="Süper Öğretmen">Süper Öğretmen (⭐4.5+)</option>
                  <option value="Profesyonel Öğretmen">Profesyonel</option>
                  <option value="Yeni Öğretmen">Yeni Öğretmen</option>
                </select>
              </div>

               {/* 3. Müsaitlik Seç */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Müsaitlik Seç</label>
                <select value={filterMusaitlik} onChange={e => setFilterMusaitlik(e.target.value)} style={selectStyle}>
                  <option value="">Farketmez</option>
                  <option value="Sabah">Sabah (06:00-12:00)</option>
                  <option value="Öğle">Öğleden Sonra</option>
                  <option value="Akşam">Akşam (18:00-24:00)</option>
                </select>
              </div>

               {/* 4. Öğretmenin Ülkesi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Ülke</label>
                <select value={filterUlke} onChange={e => setFilterUlke(e.target.value)} style={selectStyle}>
                  <option value="">Her Yerden</option>
                  {ulkeler.map((ulke, idx) => (
                    <option key={idx} value={ulke}>{ulke}</option>
                  ))}
                </select>
              </div>

              {/* 5. Sıralama */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Sırala</label>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={selectStyle}>
                  <option value="varsayilan">Önerilen</option>
                  <option value="puan-azalan">En İyi Puan</option>
                  <option value="degerlendirme-azalan">Çok Değerlendirilen</option>
                  <option value="fiyat-artan">Fiyat (Düşükten)</option>
                  <option value="fiyat-azalan">Fiyat (Yüksekten)</option>
                </select>
              </div>

              {/* 6. Fiyat Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                  Ücret: {filterMaxFiyat ? `Maks. ${filterMaxFiyat}₺` : 'Farketmez'}
                </label>
                <div style={{ padding: '4px 4px 0 4px' }}>
                  <input 
                    type="range" 
                    min="100" 
                    max="2000" 
                    step="50" 
                    value={filterMaxFiyat || 2000} 
                    onChange={e => setFilterMaxFiyat(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: '#4f46e5', cursor: 'pointer' }} 
                  />
                </div>
              </div>

            </div>

            <div style={{ height: '1px', background: '#f1f5f9', margin: '14px 0' }}></div>

            {/* Arama Kutusu ve Akıllı Eşleşme */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
               <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    type="text"
                    placeholder="Eğitmen ismi veya biyografisinden kelime arayın..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: '#0f172a' }}
                  />
               </div>
               
               <button
                  onClick={() => router.push('/egitmen-bul')}
                  style={{ padding: '10px 20px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)', whiteSpace: 'nowrap' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
                  Hızlı Akıllı Eşleşme
                </button>
            </div>

          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px', color: '#64748b', fontSize: '1.2rem', fontWeight: 500 }}>
                Eğitmenler Yükleniyor...
              </div>
            ) : processedTeachers.length > 0 ? (
              processedTeachers.map((tItem) => {
                const dillerMetni = formatDiller(tItem.konustugu_diller || tItem.diller);
                const onlineStatus = isOnline(tItem.son_gorulme); 

                return (
                  <div 
                    key={tItem.id} 
                    onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)}
                    onMouseEnter={() => isDesktop && setHoveredTeacher(tItem)} 
                    style={{ 
                      backgroundColor: '#ffffff', 
                      border: hoveredTeacher?.id === tItem.id ? '2px solid #a5b4fc' : '1px solid #e2e8f0', 
                      borderRadius: '24px', 
                      padding: '24px', 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: '32px', 
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: hoveredTeacher?.id === tItem.id ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      transform: hoveredTeacher?.id === tItem.id ? 'translateY(-2px)' : 'translateY(0)'
                    }}
                  >
                    <div style={{ flexShrink: 0, width: '140px' }}>
                      <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
                        <img 
                          src={tItem.avatar_url || `https://ui-avatars.com/api/?name=${tItem.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=200&bold=true`} 
                          alt={tItem.tam_ad}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover', border: '1px solid #f1f5f9' }} 
                        />
                        {onlineStatus && (
                          <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '20px', height: '20px', backgroundColor: '#22c55e', border: '3px solid #ffffff', borderRadius: '50%' }}></div>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                          {tItem.tam_ad}
                        </h2>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#4f46e5', fontWeight: 600, marginBottom: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                          {tItem.ders_turu || 'Türkçe Eğitmeni'}
                        </span>
                        {tItem.seviye && (
                          <>
                            <div style={{ width: '4px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '50%' }}></div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                              {tItem.seviye}
                            </span>
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.9rem', marginBottom: '16px' }}>
                        {tItem.gercek_puan_ortalamasi ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{tItem.gercek_puan_ortalamasi}</span>
                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>({tItem.gercek_yorum_sayisi} değerlendirme)</span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 700, color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                            {t.teacherCard?.newTeacher || 'Yeni Eğitmen'}
                          </span>
                        )}
                        
                        <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }}></div>
                        
                        <div style={{ color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          {tItem.gercek_tamamlanan_ders || 0} Ders Tamamlandı
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                        {tItem.konum && (
                          <span style={{ padding: '6px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            {tItem.konum}
                          </span>
                        )}
                        
                        {tItem.egitim && (
                          <span style={{ padding: '6px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                            {tItem.egitim}
                          </span>
                        )}

                        {(tItem.amac || tItem.odak || '')
                          .split(',')
                          .filter((item: string) => item.trim() !== '')
                          .slice(0, 3)
                          .map((item: string, i: number) => (
                            <span key={i} style={{ padding: '6px 12px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                              {item.trim()}
                            </span>
                          ))}
                      </div>

                      {dillerMetni && (
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px', display: 'flex', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{t.listPage?.languages || 'Diller'}:</span> {dillerMetni}
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {tItem.biyografi || t.listPage?.noBio || 'Biyografi bulunmuyor.'}
                      </p>
                    </div>

                    <div style={{ flexShrink: 0, width: '180px', borderLeft: '1px solid #f1f5f9', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                          {formatPrice(tItem.saatlik_ucret || 0)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
                          / 50 dk {t.teacherCard?.perLesson || 'ders'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }}
                          style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                        >
                          {t.teacherCard?.bookTrial || 'Deneme Dersi'}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }}
                          style={{ width: '100%', padding: '12px', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                        >
                          {t.teacherCard?.profile || 'Profili Gör'}
                        </button>
                      </div>
                    </div>
                    
                    {tItem.one_cikan_etiket && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                        <span style={{ padding: '6px 12px', backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
                          {tItem.one_cikan_etiket.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <h3 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '8px', fontWeight: 800 }}>Eğitmen Bulunamadı</h3>
                <p style={{ color: '#64748b' }}>Filtreleme kriterlerinize uygun eğitmen şu an için listemizde yok.</p>
              </div>
            )}
          </div>

          {isDesktop && (
            <div style={{ width: '420px', flexShrink: 0, position: 'sticky', top: '100px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Eğitmen Önizlemesi</h3>
                {hoveredTeacher ? (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {hoveredTeacher.video_url && getYouTubeId(hoveredTeacher.video_url) ? (
                      <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a', marginBottom: '16px', position: 'relative', paddingTop: '56.25%' }}>
                        <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} src={`https://www.youtube.com/embed/${getYouTubeId(hoveredTeacher.video_url)}?autoplay=1&mute=1`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '220px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '16px' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Bu eğitmenin tanıtım videosu yok.</span>
                      </div>
                    )}

                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{hoveredTeacher.tam_ad}</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#4f46e5', fontWeight: 600 }}>{hoveredTeacher.ders_turu || 'Türkçe Eğitmeni'}</p>
                      
                      {hoveredTeacher.amac && (
                        <div style={{ fontSize: '0.9rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', lineHeight: 1.5 }}>
                          <strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>Uzmanlık:</strong>
                          {hoveredTeacher.amac}
                        </div>
                      )}

                      <button 
                        onClick={() => router.push(`/teachers/${hoveredTeacher.user_id || hoveredTeacher.id}`)}
                        style={{ width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '16px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        Profili Ziyaret Et <span style={{ fontSize: '1.2rem' }}>→</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', padding: '0 20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>Videoyu Önizle</span>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', lineHeight: 1.5 }}>Eğitmenin tanıtım videosunu görmek için farenizi bir profilin üzerine getirin.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '80px 8% 40px 8%', marginTop: '80px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '40px', marginBottom: '40px' }}>
          <div style={{ maxWidth: '300px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.5px' }}>Turkish Learning Academy.</h2>
            <p style={{ lineHeight: 1.6 }}>Dünyanın dört bir yanından Türkçe öğrenmek isteyenleri uzman eğitmenlerle buluşturan yenilikçi platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li onClick={() => router.push('/egitmenler')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Eğitmenleri Keşfet</li>
                <li onClick={() => router.push('/blog')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Blog</li>
                <li onClick={() => router.push('/become-teacher')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Öğretmen Ol</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Destek / Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>SSS / FAQ</li>
                <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>İletişim / Contact</li>
                <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Gizlilik Politikası / Privacy</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#" aria-label="Instagram" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
            <a href="#" aria-label="Facebook" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
            <a href="#" aria-label="YouTube" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg></a>
            <a href="#" aria-label="X (Twitter)" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.73 16h5L9 4H4z"></path><path d="M4 20l6.76-6.76M20 4l-6.76 6.76"></path></svg></a>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>&copy; {new Date().getFullYear()} Turkish Learning Academy. Tüm hakları saklıdır.</div>
        </div>
      </footer>
    </div>
  );
}