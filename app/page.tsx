'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LanguageToggle from '@/app/components/LanguageToggle';
import { useTranslation } from '@/lib/useTranslation';
import { useCurrency, currencies, CurrencyCode } from '@/lib/CurrencyContext';
import { Search, CalendarCheck, PlayCircle, ChevronDown, Globe } from 'lucide-react';

// ==============================================================================
// PARA BİRİMİ SEÇİM MENÜSÜ
// ==============================================================================
function CurrencyToggle() {
    const { selectedCurrency, setSelectedCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: isOpen ? '#f1f5f9' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#334155',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => !isOpen && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => !isOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{currencies[selectedCurrency].symbol}</span>
                {selectedCurrency}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 998 }} />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                        zIndex: 999,
                        minWidth: '140px',
                        padding: '6px',
                        animation: 'fadeIn 0.15s ease-out'
                    }}>
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                        {Object.keys(currencies).map((code) => {
                            const currency = currencies[code as CurrencyCode];
                            const isSelected = selectedCurrency === code;
                            return (
                                <button
                                    key={code}
                                    onClick={() => {
                                        setSelectedCurrency(code as CurrencyCode);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        border: 'none',
                                        backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                                        color: isSelected ? '#0f172a' : '#475569',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: isSelected ? 700 : 500,
                                        fontSize: '0.9rem',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                                            e.currentTarget.style.color = '#0f172a';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 800, color: isSelected ? '#4f46e5' : '#94a3b8', width: '20px', textAlign: 'center', fontSize: '1.1rem' }}>
                                            {currency.symbol}
                                        </span>
                                        {code}
                                    </div>
                                    {isSelected && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// ==============================================================================
// ÖĞRENCİ YORUMLARI (TESTIMONIAL) SLIDER
// ==============================================================================
const testimonials = [
  {
    id: 1,
    quote: "Platform ile kendime güvenim geldi ve şunu fark ettim; bunu gerçekten başarabilirim.",
    quoteEn: "With this platform, I gained confidence and realized: I can actually do this.",
    image: "https://images.unsplash.com/photo-1548142813-c348350df52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    quote: "Eğitmenler gerçekten çok profesyonel. Sadece 3 ayda Türkçe konuşma pratiğimi inanılmaz geliştirdim.",
    quoteEn: "The tutors are incredibly professional. I improved my Turkish speaking skills in just 3 months.",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    quote: "Kendi hızımda, esnek saatlerle çalışabilmek harika. Kesinlikle herkese tavsiye ediyorum.",
    quoteEn: "Being able to study at my own pace with flexible hours is amazing. Highly recommended.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  }
];

function TestimonialSlider({ isEn }: { isEn: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const nextSlide = () => setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  const current = testimonials[currentIndex];

  return (
    <section style={{ padding: '100px 8%', backgroundColor: '#ffffff', textAlign: 'center' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '16px' }}>
          {isEn ? "Growth begins with the right tutor" : "Gelişim, doğru öğretmen seçimiyle başlar"}
        </h2>
        <p style={{ color: '#475569', fontSize: '1.1rem', fontWeight: 500, marginBottom: '60px' }}>
          {isEn 
            ? "Thousands of students. Expert tutors. Personalized (and proven) growth." 
            : "Binlerce öğrenci. Alanında uzman eğitmenler. Kişiye özel (ve ispatlanmış) gelişim."}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <button onClick={prevSlide} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '320px', height: '420px', flexShrink: 0 }}>
              <div style={{ position: 'absolute', left: '-40px', top: '40px', width: '100%', height: '100%', backgroundColor: '#f1f5f9', borderRadius: '24px' }}></div>
              <div style={{ position: 'absolute', left: '-20px', top: '20px', width: '100%', height: '100%', backgroundColor: '#e2e8f0', borderRadius: '24px' }}></div>
              <img key={current.image} src={current.image} alt="Student" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px', zIndex: 10, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', animation: 'fadeIn 0.5s ease' }} />
            </div>
            <div style={{ maxWidth: '400px', textAlign: 'left', animation: 'fadeIn 0.5s ease' }} key={current.id}>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.4, letterSpacing: '-0.5px', marginBottom: '24px' }}>
                "{isEn ? current.quoteEn : current.quote}"
              </h3>
              <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                {isEn ? "Platform Student" : "Platform öğrencisi"}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '32px' }}>
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIndex(i)} style={{ width: i === currentIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: i === currentIndex ? '#f43f5e' : '#cbd5e1', border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={nextSlide} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </section>
  );
}

// ==============================================================================
// ANA SAYFA BİLEŞENİ
// ==============================================================================
export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'ogrenci' | 'ogretmen'>('ogrenci');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const isEn = t.nav.explore === "Find Teachers";

  // 🚀 YÜZ TANIMALI VE BOYUTLANDIRILMIŞ GÖRSELLER (crop=faces&w=800&h=500)
  const steps = [
    {
      id: 1,
      title: t.home.step1Title.replace('1. ', ''),
      desc: t.home.step1Desc,
      icon: <Search size={22} />,
      color: "#4f46e5", 
      bgColor: "#eef2ff",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&crop=faces&q=80",
      imgPosition: "center" 
    },
    {
      id: 2,
      title: t.home.step2Title.replace('2. ', ''),
      desc: t.home.step2Desc,
      icon: <CalendarCheck size={22} />,
      color: "#10b981", 
      bgColor: "#dcfce7",
      img: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      imgPosition: "center"
    },
    {
      id: 3,
      title: t.home.step3Title.replace('3. ', ''),
      desc: t.home.step3Desc,
      icon: <PlayCircle size={22} />,
      color: "#f59e0b", 
      bgColor: "#fef3c7",
      img: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      imgPosition: "center"
    }
  ];

  // SUPABASE ŞİFRE SIFIRLAMA YAKALAYICISI (DÜZELTİLDİ)
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const fullUrl = window.location.href;

    // SADECE URL'de gerçekten 'type=recovery' (şifre sıfırlama) etiketi varsa yönlendir.
    // 'code=' kontrolünü kaldırdık ki Google (OAuth) girişini sabote etmesin!
    if (fullUrl.includes('type=recovery')) {
      window.location.href = `/sifre-yenile${search}${hash}`;
    }
  }, []);

  // 2. EĞİTMENLERİ ÇEKEN KOD
  useEffect(() => {
    async function fetchData() {
      const { data: teacherData, error: teacherError } = await supabase.from('egitmenler').select('*');
      if (teacherError) return;
      if (teacherData) {
        const aktifEgitmenler = teacherData.filter(item => {
          const d = item.durum ? item.durum.toLowerCase() : 'aktif';
          return d !== 'beklemede' && d !== 'iptal' && d !== 'pasif';
        });

        const teachersWithStats = await Promise.all(
          aktifEgitmenler.map(async (item) => {
            const targetId = item.user_id || item.id;
            const { data: lessonData } = await supabase.from('dersler').select('durum').eq('user_id', targetId).eq('durum', 'Tamamlanan');
            const tamamlananDers = lessonData ? lessonData.length : 0;
            const { data: dersYorumlari } = await supabase.from('dersler').select('puan').eq('user_id', targetId).not('puan', 'is', null);
            const { data: digerYorumlar } = await supabase.from('yorumlar').select('puan').eq('egitmen_id', targetId);
            const tumPuanlar = [...(dersYorumlari || []).map((y) => Number(y.puan)), ...(digerYorumlar || []).map((y) => Number(y.puan))].filter((p) => p > 0 && p <= 5);
            const dinamikPuan = tumPuanlar.length > 0 ? (tumPuanlar.reduce((acc, val) => acc + val, 0) / tumPuanlar.length).toFixed(1) : null;
            return { ...item, gercek_tamamlanan_ders: tamamlananDers, gercek_puan_ortalamasi: dinamikPuan, gercek_yorum_sayisi: tumPuanlar.length };
          })
        );
        setTeachers(teachersWithStats);
      }
    }
    fetchData();
  }, []);

  const isOnline = (dateStr: string) => {
    if (!dateStr) return false;
    return (new Date().getTime() - new Date(dateStr).getTime()) < 15 * 60 * 1000;
  };

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (authType === 'register') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role: role } } });
        if (error) throw error;
        router.push(role === 'ogrenci' ? '/student-dashboard' : '/teacher-dashboard');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        const userId = authData.user?.id;
        if (!userId) throw new Error("Kullanıcı bilgisi alınamadı.");

        if (role === 'ogrenci') {
          const { data: studentData } = await supabase.from('ogrenciler').select('id').eq('user_id', userId).maybeSingle();
          if (!studentData) { await supabase.auth.signOut(); throw new Error("Yetkisiz Giriş: Öğrenci hesabı bulunmamaktadır."); }
          router.push('/student-dashboard');
        } else if (role === 'ogretmen') {
          const { data: teacherData } = await supabase.from('egitmenler').select('id').eq('user_id', userId).maybeSingle();
          if (!teacherData) { await supabase.auth.signOut(); throw new Error("Yetkisiz Giriş: Eğitmen hesabı bulunmamaktadır."); }
          router.push('/teacher-dashboard');
        }
      }
      setShowAuthModal(false);
    } catch (error: any) { alert(error.message); } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    try {
      // Kullanıcının niyetini (rol ve mod) geri dönüş URL'sine parametre olarak ekliyoruz
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        options: { 
          redirectTo: `${window.location.origin}/auth/callback?role=${role}&mode=${authType}` 
        } 
      });
      if (error) throw error;
    } catch (error: any) { alert('Hata: ' + error.message); }
  };

  const handleSearch = () => router.push('/egitmenler'); 
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !loading) handleAuth(); };

  const filteredTeachers = teachers.filter((tItem) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return ((tItem.tam_ad && tItem.tam_ad.toLowerCase().includes(lowerTerm)) || (tItem.ders_turu && tItem.ders_turu.toLowerCase().includes(lowerTerm)) || (tItem.biyografi && tItem.biyografi.toLowerCase().includes(lowerTerm)));
  });

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a', backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. NAVİGASYON */}
      <nav style={{ padding: '20px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b', letterSpacing: '-0.5px', margin: 0 }}>
            Turkish Learning Academy<span style={{ color: '#4f46e5' }}>.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LanguageToggle />
            <div style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
            <CurrencyToggle />
          </div>
          <span onClick={handleSearch} style={{ cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>{t.nav.explore}</span>
          <span onClick={() => router.push('/blog')} style={{ cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>TLA Blog</span>
          <span onClick={() => router.push('/become-teacher')} style={{ cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>{t.nav.becomeTeacher}</span>
          <button onClick={() => { setAuthType('login'); setShowAuthModal(true); }} style={{ padding: '12px 28px', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(30, 27, 75, 0.15)' }}>{t.nav.login}</button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header style={{ padding: '60px 8%', backgroundColor: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', flexWrap: 'wrap', minHeight: '520px', position: 'relative', overflow: 'hidden' }}>
        
        {/* ARKA PLAN GÖRSELİ (Daha dar alan, daha küçük görünüm) */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', zIndex: 0 }}>
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Online Language Learning" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, objectPosition: 'center' }} 
          />
          {/* Mor renk geçişi maskesi */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, #4f46e5 0%, rgba(79, 70, 229, 0.4) 40%, transparent 100%)' }}></div>
        </div>

        {/* ÖN PLANDAKİ YAZILAR VE BUTONLAR */}
        <div style={{ position: 'relative', flex: '1 1 100%', maxWidth: '650px', zIndex: 10 }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff', marginBottom: '20px', letterSpacing: '-1.5px' }}>{t.home.heroTitle1} <br/><span style={{ color: '#4ade80' }}>{t.home.heroTitle2}</span></h2>
          <p style={{ fontSize: '1.15rem', color: '#e0e7ff', marginBottom: '32px', lineHeight: 1.5, fontWeight: 500 }}>{t.home.heroDesc}</p>
          <div>
            <button onClick={() => router.push('/egitmen-bul')} style={{ padding: '16px 36px', backgroundColor: '#121117', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s ease', display: 'inline-flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
              {t.home.heroBtn.replace('✨', '')} <span style={{ fontSize: '1.2rem' }}>→</span>
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '40px', color: '#ffffff', fontSize: '0.95rem', fontWeight: 600, opacity: 0.9 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '18px', height: '18px', backgroundColor: '#ffffff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div> {t.home.feature1}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '18px', height: '18px', backgroundColor: '#ffffff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div> {t.home.feature2}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '18px', height: '18px', backgroundColor: '#ffffff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div> {t.home.feature3}</span>
          </div>
        </div>
      </header>

      {/* 3. NASIL ÇALIŞIR BÖLÜMÜ */}
      <section style={{ padding: '100px 8%', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ color: '#4f46e5', fontWeight: 800, fontSize: '3.00rem', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '12px' }}>
              {isEn ? "How it Works?" : "Nasıl Çalışır?"}
            </span>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', margin: 0 }}>
              {isEn ? "Start Learning in 3 Simple Steps" : "Sadece 3 Adımda Öğrenmeye Başlayın"}
            </h3>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '16px auto 0', lineHeight: 1.6 }}>
              {isEn ? "Learning a new language has never been this easy. Take the first step to reach your goals." : "Yeni bir dil öğrenmek hiç bu kadar kolay olmamıştı. Hedeflerinize ulaşmak için hemen ilk adımı atın."}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', position: 'relative' }}>
            {steps.map((step) => {
              const isHovered = hoveredCard === step.id;
              return (
                <div 
                  key={step.id}
                  onMouseEnter={() => setHoveredCard(step.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: isHovered ? '0 20px 40px -10px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ height: '220px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: step.color, opacity: isHovered ? 0 : 0.1, transition: 'opacity 0.4s ease', zIndex: 1 }} />
                    <img 
                      src={step.img} 
                      alt={step.title} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        objectPosition: step.imgPosition, 
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', 
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)' 
                      }} 
                    />
                  </div>

                  <div style={{ position: 'absolute', top: '196px', left: '32px', width: '48px', height: '48px', borderRadius: '16px', backgroundColor: step.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', boxShadow: `0 10px 20px -5px ${step.color}80`, zIndex: 2, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0)' }}>
                    {step.id}
                  </div>

                  <div style={{ padding: '48px 32px 40px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ color: step.color, backgroundColor: step.bgColor, padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {step.icon}
                      </div>
                      <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{step.title}</h4>
                    </div>
                    <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                  </div>

                  <div style={{ height: '4px', width: '100%', backgroundColor: step.color, position: 'absolute', bottom: 0, left: 0, transform: isHovered ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DİĞER BÖLÜMLER */}
      <div style={{ backgroundColor: '#4f46e5', padding: '120px 8%', textAlign: 'center', margin: '40px 0', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.2)' }}>
        <h3 style={{ color: '#ffffff', fontSize: '3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.4 }}>
          {isEn ? "We work hard to ensure you learn Turkish in the best way possible." : "En iyi şekilde Türkçe öğrenebilmeniz için çalışıyoruz."}
        </h3>
      </div>

      <TestimonialSlider isEn={isEn} />

      {/* ÖĞRETMEN OL */}
      <section style={{ padding: '40px 8% 80px 8%', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ flex: '1 1 400px', minHeight: '400px', position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Become a Teacher" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', top: 0, left: 0 }} />
          </div>
          <div style={{ flex: '1 1 400px', backgroundColor: '#3bdfa6', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '20px', letterSpacing: '-1.5px' }}>{isEn ? "Become a tutor" : "Öğretmen ol"}</h2>
            <p style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '32px', lineHeight: 1.6, fontWeight: 500, opacity: 0.9 }}>{isEn ? "Earn money sharing your expert knowledge with students. Sign up and start tutoring online." : "Uzmanlığınızı öğrencilerle paylaşın, bilgi birikiminizi kazanca dönüştürün. Platformumuza katılarak online ders vermeye başlayın."}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}><div style={{ width: '6px', height: '6px', backgroundColor: '#0f172a', borderRadius: '50%' }}></div> {isEn ? "Find new students" : "Yeni öğrenciler bul"}</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}><div style={{ width: '6px', height: '6px', backgroundColor: '#0f172a', borderRadius: '50%' }}></div> {isEn ? "Grow your business" : "İşini büyüt"}</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}><div style={{ width: '6px', height: '6px', backgroundColor: '#0f172a', borderRadius: '50%' }}></div> {isEn ? "Get paid securely" : "Güvenli bir şekilde ödeme al"}</li>
            </ul>
            <button onClick={() => router.push('/become-teacher')} style={{ padding: '20px 40px', backgroundColor: '#121117', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '12px', alignSelf: 'flex-start', transition: 'transform 0.2s', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>{t.nav.becomeTeacher} →</button>
          </div>
        </div>
      </section>

      {/* EĞİTMENLER GRID */}
      <section id="teachers-section" style={{ padding: '100px 8%', backgroundColor: '#f8fafc', flex: 1, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', margin: 0 }}>{t.home.featuredTitle}</h3>
              <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '12px', margin: '12px 0 0 0' }}>{t.home.featuredSub}</p>
            </div>
            <button onClick={() => router.push('/egitmenler')} style={{ padding: '12px 24px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 700, color: '#4f46e5', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>{t.home.viewAll}</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((tItem) => {
                const online = isOnline(tItem.son_gorulme);
                let dillerArray: string[] = [];
                if (tItem.diller) {
                  const rawData = typeof tItem.diller === 'string' ? tItem.diller : JSON.stringify(tItem.diller);
                  dillerArray = rawData.replace(/[\[\]"]/g, '').split(',').map((d: string) => d.trim()).filter((d: string) => d !== "");
                }

                return (
                  <div key={tItem.id} onClick={() => router.push(`/teachers/${tItem.user_id || tItem.id}`)} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', gap: '16px' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#c7d2fe'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                          <img src={tItem.avatar_url || `https://ui-avatars.com/api/?name=${tItem.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=80&bold=true`} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', border: '1px solid #f1f5f9' }} />
                          {online && <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '18px', height: '18px', backgroundColor: '#22c55e', border: '3px solid #ffffff', borderRadius: '50%' }}></div>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{tItem.tam_ad}</h4>
                          <p style={{ margin: '4px 0 8px 0', color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>{tItem.ders_turu || 'Türkçe Eğitmeni'}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
                            {tItem.gercek_puan_ortalamasi ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★</span><span style={{ fontWeight: 800, color: '#0f172a' }}>{tItem.gercek_puan_ortalamasi}</span><span style={{ color: '#94a3b8', fontWeight: 500 }}>({tItem.gercek_yorum_sayisi})</span></div>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#4f46e5', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>{t.teacherCard?.newTeacher || 'Yeni Eğitmen'}</span>
                            )}
                            {tItem.gercek_puan_ortalamasi && <div style={{ width: '4px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '50%' }}></div>}
                            <div style={{ color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#94a3b8'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> {tItem.gercek_tamamlanan_ders || 0} Ders</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {tItem.konum && <span style={{ padding: '4px 10px 4px 6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '22px', height: '22px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>{tItem.konum}</span>}
                        {tItem.egitim && <span style={{ padding: '4px 10px 4px 6px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '22px', height: '22px', background: '#fef3c7', color: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>{tItem.egitim}</span>}
                        {(tItem.amac || tItem.odak || '').split(',').filter((item: string) => item.trim() !== '').slice(0, 3).map((item: string, i: number) => <span key={i} style={{ padding: '6px 12px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>{item.trim()}</span>)}
                      </div>
                      <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '0.95rem', height: '3em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{tItem.biyografi || 'Alanında uzman, ana dili Türkçe olan deneyimli eğitmen ile pratik yapmaya hemen başlayın.'}</p>
                      {dillerArray.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '-4px' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Konuştuğu Diller:</strong>
                          {dillerArray.slice(0, 3).map((dil: string, index: number) => {
                            const isAnaDil = dil.includes('(Ana Dil)');
                            return <span key={index} style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: isAnaDil ? 700 : 600, backgroundColor: isAnaDil ? '#eef2ff' : '#f8fafc', color: isAnaDil ? '#4f46e5' : '#475569', border: isAnaDil ? '1px solid #c7d2fe' : '1px solid #e2e8f0' }}>{dil.replace('(Ana Dil)', '').trim()}</span>;
                          })}
                          {dillerArray.length > 3 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>+{dillerArray.length - 3}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{formatPrice(tItem.saatlik_ucret)}</span><span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}> / {t.teacherCard?.perLesson || 'ders'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }} style={{ padding: '10px 16px', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>{t.teacherCard?.profile || 'Profil'}</button>
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/teachers/${tItem.user_id || tItem.id}`); }} style={{ padding: '10px 20px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}>{t.teacherCard?.bookTrial || 'Deneme Dersi'}</button>
                      </div>
                    </div>
                    {tItem.one_cikan_etiket && <div style={{ position: 'absolute', top: '-12px', right: '24px' }}><span style={{ padding: '4px 12px', backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>✨ {tItem.one_cikan_etiket}</span></div>}
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#64748b' }}><span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>😕</span><h3>{t.home.noTutors}</h3></div>
            )}
          </div>
        </div>
      </section>

      {/* 6. KURUMSAL FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '80px 8% 40px 8%' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '40px', marginBottom: '40px' }}>
          <div style={{ maxWidth: '300px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.5px' }}>Turkish Learning Academy.</h2>
            <p style={{ lineHeight: 1.6 }}>Dünyanın dört bir yanından Türkçe öğrenmek isteyenleri uzman eğitmenlerle buluşturan yenilikçi platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li onClick={handleSearch} style={{ cursor: 'pointer' }}>{t.nav.explore}</li>
                <li style={{ cursor: 'pointer' }} onClick={() => router.push('/blog')}>{isEn ? "Blog" : "Blog"}</li>
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

      {/* 7. AUTH MODAL */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{authType === 'login' ? t.authModal.loginTitle : t.authModal.registerTitle}</h2>
              <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>{authType === 'login' ? t.authModal.noAccount : t.authModal.hasAccount} <span onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')} style={{ color: '#4f46e5', fontWeight: 700, cursor: 'pointer' }}>{authType === 'login' ? t.authModal.signUpBtnText : t.authModal.logInBtnText}</span></p>
            </div>
            <div style={{ padding: '0 32px 32px 32px' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '16px', display: 'flex', marginBottom: '24px' }}>
                <button onClick={() => setRole('ogrenci')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogrenci' ? '#ffffff' : 'transparent', color: role === 'ogrenci' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogrenci' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{t.authModal.studentTab}</button>
                <button onClick={() => setRole('ogretmen')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogretmen' ? '#ffffff' : 'transparent', color: role === 'ogretmen' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogretmen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{t.authModal.teacherTab}</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {authType === 'register' && role === 'ogretmen' ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>{t.authModal.teacherApplyTitle}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>{t.authModal.teacherApplyDesc}</p>
                    <button onClick={() => { setShowAuthModal(false); router.push('/become-teacher'); }} style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{t.authModal.teacherApplyBtn}</button>
                  </div>
                ) : (
                  <>
                    {authType === 'register' && <input placeholder={t.authModal.namePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} />}
                    <input type="email" placeholder={t.authModal.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} />
                    <input type="password" placeholder={t.authModal.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} />
                    {authType === 'login' && (
  <div style={{ textAlign: 'right', marginTop: '-8px' }}>
    <button onClick={() => { setShowAuthModal(false); router.push('/sifremi-unuttum'); }} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
      Şifremi Unuttum?
    </button>
  </div>
)}
                    <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: loading ? '#94a3b8' : '#4f46e5', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background-color 0.2s', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)' }}>{loading ? t.authModal.processing : (authType === 'login' ? t.authModal.submitLogin : t.authModal.submitRegister)}</button>
                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '0.85rem' }}><div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div><span style={{ padding: '0 12px', fontWeight: 600 }}>{t.authModal.or}</span><div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div></div>
                    <button onClick={handleGoogleAuth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>{t.authModal.googleBtn}</button>
                  </>
                )}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}><button onClick={() => setShowAuthModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>{t.authModal.closeBtn}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}