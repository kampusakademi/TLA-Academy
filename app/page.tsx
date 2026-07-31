'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LanguageToggle from '@/app/components/LanguageToggle';
import { useTranslation } from '@/lib/useTranslation';

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Arama State'i
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal ve Auth State'leri
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'ogrenci' | 'ogretmen'>('ogrenci');
  
  // Form Verileri
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: teacherData, error: teacherError } = await supabase
        .from('egitmenler')
        .select('*');

      if (teacherError) {
        console.error("Eğitmenler çekilirken hata:", teacherError);
        return;
      }

      if (teacherData) {
        const aktifEgitmenler = teacherData.filter(item => {
          const d = item.durum ? item.durum.toLowerCase() : 'aktif';
          return d !== 'beklemede' && d !== 'iptal' && d !== 'pasif';
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
      }
    }
    fetchData();
  }, []);

  const isOnline = (dateStr: string) => {
    if (!dateStr) return false;
    const lastSeen = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return (now - lastSeen) < 15 * 60 * 1000;
  };

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (authType === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            }
          }
        });
        
        if (error) throw error;

        if (role === 'ogrenci') {
          router.push('/student-dashboard');
        } else {
          router.push('/teacher-dashboard');
        }

      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error("Kullanıcı bilgisi alınamadı.");

        if (role === 'ogrenci') {
          const { data: studentData } = await supabase
            .from('ogrenciler')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!studentData) {
            await supabase.auth.signOut();
            throw new Error("Yetkisiz Giriş: Bu e-posta adresi ile kayıtlı bir Öğrenci hesabı bulunmamaktadır.");
          }
          
          router.push('/student-dashboard');

        } else if (role === 'ogretmen') {
          const { data: teacherData } = await supabase
            .from('egitmenler')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!teacherData) {
            await supabase.auth.signOut();
            throw new Error("Yetkisiz Giriş: Bu e-posta adresi ile kayıtlı bir Eğitmen hesabı bulunmamaktadır.");
          }
          
          router.push('/teacher-dashboard');
        }
      }
      
      setShowAuthModal(false);
    } catch (error: any) {
      alert(error.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const redirectPath = role === 'ogretmen' ? '/teacher-dashboard' : '/student-dashboard';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Google ile bağlantı kurulamadı: ' + error.message);
    }
  };

  const handleSearch = () => {
    router.push('/egitmenler');
  };

  const filteredTeachers = teachers.filter((tItem) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      (tItem.tam_ad && tItem.tam_ad.toLowerCase().includes(lowerTerm)) ||
      (tItem.ders_turu && tItem.ders_turu.toLowerCase().includes(lowerTerm)) ||
      (tItem.biyografi && tItem.biyografi.toLowerCase().includes(lowerTerm))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAuth();
    }
  };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a', backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. GLASSMORPHISM NAVİGASYON */}
      <nav style={{ padding: '20px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b', letterSpacing: '-0.5px', margin: 0 }}>
            Turkish Learning Academy<span style={{ color: '#4f46e5' }}>.</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <LanguageToggle />

          <span onClick={handleSearch} style={{ cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
            {t.nav.explore}
          </span>
          <span 
            onClick={() => router.push('/become-teacher')} 
            style={{ cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'} 
            onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
          >
            {t.nav.becomeTeacher}
          </span>
          <button 
            onClick={() => { setAuthType('login'); setShowAuthModal(true); }} 
            style={{ padding: '12px 28px', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(30, 27, 75, 0.15)' }}
          >
            {t.nav.login}
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header style={{ 
        padding: '140px 8%', 
        background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        textAlign: 'center', 
        position: 'relative' 
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
            {t.home.heroBadge}
          </span>
          
          <h2 style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff', marginBottom: '24px', letterSpacing: '-2px' }}>
            {t.home.heroTitle1} <br/><span style={{ color: '#0efa49' }}>{t.home.heroTitle2}</span>
          </h2>
          
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '48px', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 48px' }}>
            {t.home.heroDesc}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => router.push('/egitmenler')}
              style={{ 
                padding: '20px 48px', 
                backgroundColor: '#4f46e5', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '16px', 
                fontWeight: 800, 
                fontSize: '1.2rem', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)'
              }} 
            >
              {t.home.heroBtn}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '48px', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✔️ {t.home.feature1}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✔️ {t.home.feature2}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✔️ {t.home.feature3}</span>
          </div>
        </div>
      </header>

      {/* 3. NASIL ÇALIŞIR BÖLÜMÜ */}
      <section style={{ padding: '80px 8%', backgroundColor: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>{t.home.howItWorksTitle}</h3>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '12px' }}>{t.home.howItWorksSub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#ffffff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>🔍</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>{t.home.step1Title}</h4>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>{t.home.step1Desc}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#ffffff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>📅</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>{t.home.step2Title}</h4>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>{t.home.step2Desc}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#ffffff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>💻</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>{t.home.step3Title}</h4>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>{t.home.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* 4. EĞİTMENLER GRID */}
      <section id="teachers-section" style={{ padding: '100px 8%', backgroundColor: '#f8fafc', flex: 1, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', margin: 0 }}>{t.home.featuredTitle}</h3>
              <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '12px', margin: '12px 0 0 0' }}>
                {t.home.featuredSub}
              </p>
            </div>
            <button 
              onClick={() => router.push('/egitmenler')}
              style={{ padding: '12px 24px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 700, color: '#0f172a', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {t.home.viewAll}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((tItem) => {
                const online = isOnline(tItem.son_gorulme);
                const doluYildiz = tItem.gercek_puan_ortalamasi ? Math.round(Number(tItem.gercek_puan_ortalamasi)) : 0;

                return (
                  <div 
                    key={tItem.id} 
                    onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)}
                    style={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '24px', 
                      padding: '32px', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between' 
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={tItem.avatar_url || `https://ui-avatars.com/api/?name=${tItem.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=80&bold=true`} 
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f8fafc', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                          />
                          {online && (
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', backgroundColor: '#22c55e', border: '3px solid #ffffff', borderRadius: '50%' }}></div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{tItem.tam_ad}</h4>
                          <p style={{ margin: '4px 0 8px 0', color: '#4f46e5', fontSize: '0.95rem', fontWeight: 600 }}>{tItem.ders_turu || 'Türkçe Eğitmeni'}</p>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                            {tItem.gercek_puan_ortalamasi ? (
                              <>
                                <span style={{ color: '#f59e0b', fontWeight: 800, letterSpacing: '1px' }}>
                                  {"★".repeat(doluYildiz)}{"☆".repeat(5 - doluYildiz)}
                                </span>
                                <span style={{ fontWeight: 800, color: '#121117' }}>{tItem.gercek_puan_ortalamasi}</span>
                                <span style={{ color: '#94a3b8', fontWeight: 500 }}>({tItem.gercek_yorum_sayisi})</span>
                              </>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                {t.teacherCard.newTeacher}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ padding: '4px 10px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                          🏆 {tItem.gercek_tamamlanan_ders || 0} {t.teacherCard.lessonsCompleted}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {tItem.konum && (
                          <span style={{ padding: '4px 8px', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            📍 {tItem.konum}
                          </span>
                        )}
                        {tItem.egitim && (
                          <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            📚 {tItem.egitim}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {(tItem.amac || tItem.odak || '')
                          .split(',')
                          .filter((item: string) => item.trim() !== '')
                          .slice(0, 3)
                          .map((item: string, i: number) => (
                            <span key={i} style={{ padding: '4px 10px', background: '#e0e7ff', color: '#3730a3', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                              🎯 {item.trim()}
                            </span>
                          ))}
                      </div>

                      <p style={{ color: '#475569', lineHeight: 1.5, fontSize: '0.9rem', height: '3em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 16px 0' }}>
                        {tItem.biyografi || 'Alanında uzman, ana dili Türkçe olan deneyimli eğitmen ile pratik yapmaya hemen başlayın.'}
                      </p>

                      {tItem.one_cikan_etiket && (
                        <div style={{ marginBottom: '16px' }}>
                          <span style={{ padding: '4px 10px', backgroundColor: '#fce7f3', color: '#9d174d', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                            ✨ {tItem.one_cikan_etiket}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{tItem.saatlik_ucret}₺</span>
                        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}> {t.teacherCard.perLesson}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }}
                          style={{ padding: '10px 16px', backgroundColor: '#f9a8d4', color: '#121117', border: '1px solid #121117', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 0 #121117' }}
                        >
                          {t.teacherCard.bookTrial}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }}
                          style={{ padding: '10px 16px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          {t.teacherCard.profile}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>😕</span>
                <h3>{t.home.noTutors}</h3>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. KURUMSAL FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '80px 8% 40px 8%' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '40px', marginBottom: '40px' }}>
          <div style={{ maxWidth: '300px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.5px' }}>Turkish Learning Academy.</h2>
            <p style={{ lineHeight: 1.6 }}>Dünyanın dört bir yanından Türkçe öğrenmek isteyenleri uzman eğitmenlerle buluşturan lider platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li onClick={handleSearch} style={{ cursor: 'pointer' }}>{t.nav.explore}</li>
                <li style={{ cursor: 'pointer' }}>{t.home.howItWorksTitle}</li>
                <li style={{ cursor: 'pointer' }} onClick={() => router.push('/become-teacher')}>{t.nav.becomeTeacher}</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Destek / Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ cursor: 'pointer' }}>SSS / FAQ</li>
                <li style={{ cursor: 'pointer' }}>İletişim / Contact</li>
                <li style={{ cursor: 'pointer' }}>Gizlilik Politikası / Privacy</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Turkish Learning Academy. Tüm hakları saklıdır.
        </div>
      </footer>

      {/* 🚀 6. AUTH MODAL (TAMAMEN SEÇİLEN DİLE GÖRE OTOMATİK DEĞİŞİR) */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                {authType === 'login' ? t.authModal.loginTitle : t.authModal.registerTitle}
              </h2>
              <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                {authType === 'login' ? t.authModal.noAccount : t.authModal.hasAccount}
                <span onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')} style={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>
                  {authType === 'login' ? t.authModal.signUpBtnText : t.authModal.logInBtnText}
                </span>
              </p>
            </div>

            <div style={{ padding: '0 32px 32px 32px' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '16px', display: 'flex', marginBottom: '24px' }}>
                <button 
                  onClick={() => setRole('ogrenci')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogrenci' ? '#ffffff' : 'transparent', color: role === 'ogrenci' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogrenci' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {t.authModal.studentTab}
                </button>
                <button 
                  onClick={() => setRole('ogretmen')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogretmen' ? '#ffffff' : 'transparent', color: role === 'ogretmen' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogretmen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {t.authModal.teacherTab}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {authType === 'register' && role === 'ogretmen' ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>{t.authModal.teacherApplyTitle}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                      {t.authModal.teacherApplyDesc}
                    </p>
                    <button 
                      onClick={() => { setShowAuthModal(false); router.push('/become-teacher'); }}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                    >
                      {t.authModal.teacherApplyBtn}
                    </button>
                  </div>
                ) : (
                  <>
                    {authType === 'register' && (
                      <input 
                        placeholder={t.authModal.namePlaceholder}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                      />
                    )}
                    <input 
                      type="email"
                      placeholder={t.authModal.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                    />
                    <input 
                      type="password" 
                      placeholder={t.authModal.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                    />
                    
                    <button 
                      onClick={handleAuth}
                      disabled={loading}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: loading ? '#94a3b8' : '#4f46e5', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background-color 0.2s', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)' }}
                    >
                      {loading ? t.authModal.processing : (authType === 'login' ? t.authModal.submitLogin : t.authModal.submitRegister)}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                      <span style={{ padding: '0 12px', fontWeight: 600 }}>{t.authModal.or}</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    </div>

                    <button 
                      onClick={handleGoogleAuth}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', 
                        backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', 
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {t.authModal.googleBtn}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <button onClick={() => setShowAuthModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>{t.authModal.closeBtn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}