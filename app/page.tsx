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

  // Dil kontrolü
  const isEn = t.nav.explore === "Find Teachers";

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAuth();
    }
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

      {/* 2. HERO SECTION - RESİM VE DÜZEN AYNEN KORUNDU */}
      <header style={{ 
        padding: '60px 8%', 
        backgroundColor: '#4f46e5', 
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '40px',
        minHeight: '480px', 
        position: 'relative'
      }}>
        
        {/* SOL METİN ALANI */}
        <div style={{ flex: '1 1 450px', maxWidth: '580px', zIndex: 10 }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff', marginBottom: '20px', letterSpacing: '-1.5px' }}>
            {t.home.heroTitle1} <br/><span style={{ color: '#4ade80' }}>{t.home.heroTitle2}</span>
          </h2>
          
          <p style={{ fontSize: '1.15rem', color: '#e0e7ff', marginBottom: '32px', lineHeight: 1.5, fontWeight: 500 }}>
            {t.home.heroDesc}
          </p>
          
          <div>
            <button 
              onClick={() => router.push('/egitmen-bul')}
              style={{ 
                padding: '16px 36px', 
                backgroundColor: '#121117', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 800, 
                fontSize: '1.1rem', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
              }} 
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }} 
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {t.home.heroBtn.replace('✨', '')} <span style={{ fontSize: '1.2rem' }}>→</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '40px', color: '#ffffff', fontSize: '0.95rem', fontWeight: 600, opacity: 0.9 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#ffffff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div> 
              {t.home.feature1}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#ffffff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div> 
              {t.home.feature2}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#ffffff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div> 
              {t.home.feature3}
            </span>
          </div>
        </div>

        {/* SAĞ GÖRSEL ALANI - SENİN DÜZENLEDİĞİN GÖRSEL SABİT */}
        <div style={{ flex: '1 1 350px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ 
            position: 'relative', 
            width: '150%', 
            maxWidth: '500px', 
            height: '400px', 
            backgroundColor: '#ffffff', 
            borderRadius: '10px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '0px solid #ffffff' 
          }}>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Online Language Learning"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
            />
          </div>
        </div>
      </header>

      {/* 3. NASIL ÇALIŞIR BÖLÜMÜ - RESİMLER VE DÜZEN AYNEN KORUNDU */}
      <section style={{ padding: '100px 8% 60px 8%', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <h3 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '40px' }}>
            {t.home.howItWorksTitle}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* KART 1: Eğitmen Bul (Senin seçtiğin resim) */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '40px 32px 32px 32px', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#a7f3d0', color: '#065f46', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', borderRadius: '6px' }}>
                  1
                </div>
                <h4 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  {t.home.step1Title.replace('1. ', '')}.
                </h4>
                <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '1.05rem', margin: 0 }}>
                  {t.home.step1Desc}
                </p>
              </div>
              <div style={{ padding: '0 32px 32px 32px' }}>
                 <div style={{ width: '60%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', boxShadow: '0 2px 20px rgba(0,0,0,0.05)' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                      alt="Find a Tutor" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} 
                    />
                 </div>
              </div>
            </div>

            {/* KART 2: Ders Ayırt (Senin seçtiğin resim) */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '40px 32px 32px 32px', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#fde68a', color: '#92400e', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', borderRadius: '6px' }}>
                  2
                </div>
                <h4 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  {t.home.step2Title.replace('2. ', '')}.
                </h4>
                <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '1.05rem', margin: 0 }}>
                  {t.home.step2Desc}
                </p>
              </div>
              <div style={{ padding: '0 32px 32px 32px' }}>
                 <div style={{ width: '60%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                      alt="Book a Lesson" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} 
                    />
                 </div>
              </div>
            </div>

            {/* KART 3: Öğrenmeye Başla (Senin seçtiğin resim) */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '40px 32px 32px 32px', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#bfdbfe', color: '#1e40af', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', borderRadius: '6px' }}>
                  3
                </div>
                <h4 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  {t.home.step3Title.replace('3. ', '')}.
                </h4>
                <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '1.05rem', margin: 0 }}>
                  {t.home.step3Desc}
                </p>
              </div>
              <div style={{ padding: '0 32px 32px 32px' }}>
                 <div style={{ width: '60%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                      alt="Start Learning Online" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} 
                    />
                 </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* KURUMSAL ŞERİT */}
      <div style={{ backgroundColor: '#4f46e5', padding: '120px 8%', textAlign: 'center', margin: '40px 0', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.2)' }}>
        <h3 style={{ color: '#ffffff', fontSize: '3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.4 }}>
          {isEn ? "We work hard to ensure you learn Turkish in the best way possible." : "En iyi şekilde Türkçe öğrenebilmeniz için çalışıyoruz."}
        </h3>
      </div>

      {/* 4. "ÖĞRETMEN OL" AFİŞİ - RESİM VE DÜZEN AYNEN KORUNDU */}
      <section style={{ padding: '40px 8% 80px 8%', backgroundColor: '#ffffff' }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          display: 'flex', 
          flexWrap: 'wrap', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' 
        }}>
          
          {/* SOL: EĞİTMEN FOTOĞRAFI (Senin seçtiğin resim) */}
          <div style={{ flex: '1 1 400px', minHeight: '400px', position: 'relative' }}>
            <img 
              src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Become a Teacher" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', top: 0, left: 0 }} 
            />
          </div>

          {/* SAĞ: İÇERİK (Mint Yeşili Arka Plan) */}
          <div style={{ flex: '1 1 400px', backgroundColor: '#3bdfa6', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '20px', letterSpacing: '-1.5px' }}>
              {isEn ? "Become a tutor" : "Öğretmen ol"}
            </h2>
            <p style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '32px', lineHeight: 1.6, fontWeight: 500, opacity: 0.9 }}>
              {isEn 
                ? "Earn money sharing your expert knowledge with students. Sign up and start tutoring online." 
                : "Uzmanlık alanını öğrencilerle paylaşarak para kazan. Platformumuza kaydol ve internet üzerinden dersler vermeye başla."}
            </p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#0f172a', borderRadius: '50%' }}></div> 
                {isEn ? "Find new students" : "Yeni öğrenciler bul"}
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#0f172a', borderRadius: '50%' }}></div> 
                {isEn ? "Grow your business" : "İşini büyüt"}
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#0f172a', borderRadius: '50%' }}></div> 
                {isEn ? "Get paid securely" : "Güvenli bir şekilde ödeme al"}
              </li>
            </ul>

            <button 
              onClick={() => router.push('/become-teacher')}
              style={{ 
                padding: '20px 40px', 
                backgroundColor: '#121117', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '12px', 
                alignSelf: 'flex-start', 
                transition: 'transform 0.2s', 
                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {t.nav.becomeTeacher} →
            </button>
          </div>

        </div>
      </section>

      {/* 🚀 5. EĞİTMENLER GRID - SADECE BU BÖLÜMÜN KART TASARIMI GÜNCELLENDİ (PROFESYONEL SAAS STİLİ) */}
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
              style={{ padding: '12px 24px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 700, color: '#4f46e5', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              {t.home.viewAll}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((tItem) => {
                const online = isOnline(tItem.son_gorulme);

                return (
                  <div 
                    key={tItem.id} 
                    onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)}
                    style={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '24px', 
                      padding: '24px', // padding biraz daraltıldı daha toplu durması için
                      cursor: 'pointer', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      position: 'relative', // etiketler için
                      gap: '16px'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; 
                      e.currentTarget.style.transform = 'translateY(-4px)'; 
                      e.currentTarget.style.borderColor = '#c7d2fe'; 
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; 
                      e.currentTarget.style.transform = 'translateY(0)'; 
                      e.currentTarget.style.borderColor = '#e2e8f0'; 
                    }}
                  >
                    <div>
                      {/* Üst Bölüm: Profil ve İsim */}
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img 
                            src={tItem.avatar_url || `https://ui-avatars.com/api/?name=${tItem.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=64&bold=true`} 
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f8fafc', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                          />
                          {online && (
                            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', backgroundColor: '#22c55e', border: '2.5px solid #ffffff', borderRadius: '50%' }}></div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{tItem.tam_ad}</h4>
                          <p style={{ margin: '2px 0 6px 0', color: '#4f46e5', fontSize: '0.9rem', fontWeight: 600 }}>{tItem.ders_turu || 'Türkçe Eğitmeni'}</p>
                          
                          {/* Puan ve Ders Sayısı - Profesyonel Dizilim */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                            {tItem.gercek_puan_ortalamasi ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#f59e0b', fontSize: '1rem' }}>★</span>
                                <span style={{ fontWeight: 800, color: '#121117' }}>{tItem.gercek_puan_ortalamasi}</span>
                                <span style={{ color: '#94a3b8', fontWeight: 500 }}>({tItem.gercek_yorum_sayisi})</span>
                              </div>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                {t.teacherCard.newTeacher}
                              </span>
                            )}
                            <div style={{ width: '1px', height: '12px', backgroundColor: '#e2e8f0' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 700 }}>
                                <span>🏆</span> 
                                <span>{tItem.gercek_tamamlanan_ders || 0} Ders</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Orta Bölüm: Etiketler (SaaS Stili Minimal Etiketler) */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                        {tItem.konum && (
                          <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📍 {tItem.konum}
                          </span>
                        )}
                        {tItem.egitim && (
                          <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📚 {tItem.egitim}
                          </span>
                        )}
                        {(tItem.amac || tItem.odak || '')
                          .split(',')
                          .filter((item: string) => item.trim() !== '')
                          .slice(0, 2)
                          .map((item: string, i: number) => (
                            <span key={i} style={{ padding: '4px 8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🎯 {item.trim()}
                            </span>
                          ))}
                      </div>

                      {/* Biyografi - Clamp korundu */}
                      <p style={{ color: '#475569', lineHeight: 1.5, fontSize: '0.9rem', height: '3em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0' }}>
                        {tItem.biyografi || 'Alanında uzman, ana dili Türkçe olan deneyimli eğitmen ile pratik yapmaya hemen başlayın.'}
                      </p>
                    </div>
                    
                    {/* Alt Bölüm: Fiyat ve Butonlar (Net ayrılmış alan) */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flexShrink: 0 }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{tItem.saatlik_ucret}₺</span>
                        <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}> / ders</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }}
                          style={{ padding: '10px 14px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#edf2f7'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        >
                          {t.teacherCard.profile}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }}
                          style={{ padding: '10px 14px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                        >
                          {t.teacherCard.bookTrial}
                        </button>
                      </div>
                    </div>

                    {/* Öne Çıkan Etiketi - Konumu sadeleştirildi */}
                    {tItem.one_cikan_etiket && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <span style={{ padding: '3px 8px', backgroundColor: '#fce7f3', color: '#9d174d', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                          ✨ {tItem.one_cikan_etiket.toUpperCase()}
                        </span>
                      </div>
                    )}
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

      {/* 6. KURUMSAL FOOTER */}
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

      {/* 7. AUTH MODAL */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                {authType === 'login' ? t.authModal.loginTitle : t.authModal.registerTitle}
              </h2>
              <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                {authType === 'login' ? t.authModal.noAccount : t.authModal.hasAccount}
                <span onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')} style={{ color: '#4f46e5', fontWeight: 700, cursor: 'pointer' }}>
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