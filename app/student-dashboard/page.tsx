'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CanliDersButonu from '@/app/components/CanliDersButonu';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState('Öğrenci');
  const [loading, setLoading] = useState(true);

  // Profil Kutucuğu State'i
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Aktif Sekme
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // 🚀 BİLDİRİM SAYACI
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const [stats, setStats] = useState({ seviye: '-', durum: '-', created_at: '' });
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [pastLessons, setPastLessons] = useState<any[]>([]); 
  
  const [favoriteTeachers, setFavoriteTeachers] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState({ tamAd: '', telefon: '' });

  const [degerlendirmeModali, setDegerlendirmeModali] = useState<string | null>(null);
  const [secilenPuan, setSecilenPuan] = useState(0);
  const [yazilanYorum, setYazilanYorum] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          router.push('/');
          return;
        }
        
        const currentUser = session.user;
        setUser(currentUser);
        
        let fetchedName = currentUser.user_metadata?.full_name;

        // 1. Öğrenci Verilerini Çek
        const { data: profile } = await supabase
          .from('ogrenciler')
          .select('tam_ad, email, seviye, durum, created_at')
          .eq('user_id', currentUser.id)
          .maybeSingle();
          
        if (profile) {
          fetchedName = profile.tam_ad || fetchedName;
          setStats({
            seviye: profile.seviye || '-',
            durum: profile.durum || '-',
            created_at: profile.created_at || new Date().toISOString()
          });
          setSettingsForm({ tamAd: profile.tam_ad || '', telefon: '' });
        } else {
          const newStudentData = {
            user_id: currentUser.id,
            email: currentUser.email,
            tam_ad: currentUser.user_metadata?.full_name || 'Yeni Öğrenci',
            seviye: 'Belirlenmedi',
            durum: 'Aktif'
          };
          const { data: newProfile, error: insertError } = await supabase.from('ogrenciler').insert([newStudentData]).select().single();
          if (!insertError && newProfile) {
            fetchedName = newProfile.tam_ad;
            setStats({ seviye: newProfile.seviye || '-', durum: newProfile.durum || '-', created_at: newProfile.created_at || new Date().toISOString() });
            setSettingsForm({ tamAd: newProfile.tam_ad || '', telefon: '' });
          }
        }
        setUserName(fetchedName || 'Öğrenci');

        // 2. Dersleri Çek
        const { data: allLessons } = await supabase
          .from('dersler')
          .select('*, egitmenler(user_id, id, tam_ad, avatar_url, ders_turu)')
          .eq('ogrenci_id', currentUser.id)
          .order('tarih_saat', { ascending: true });

        if (allLessons) {
          const suAn = new Date().getTime();

          const guncelYaklasanlar = allLessons.filter(ders => {
            const dersZamani = new Date(ders.tarih_saat).getTime();
            const dakikaFarki = (dersZamani - suAn) / (1000 * 60);
            const iptalVeyaTamam = ['Tamamlanan', 'İptal', 'İptal Edildi', 'İptal Edilen'].includes(ders.durum);
            return !iptalVeyaTamam && dakikaFarki >= -120;
          });

          const guncelGecmis = allLessons.filter(ders => {
            const dersZamani = new Date(ders.tarih_saat).getTime();
            const dakikaFarki = (dersZamani - suAn) / (1000 * 60);
            const iptalVeyaTamam = ['Tamamlanan', 'İptal', 'İptal Edildi', 'İptal Edilen'].includes(ders.durum);
            return iptalVeyaTamam || dakikaFarki < -120;
          }).reverse(); 

          setUpcomingLessons(guncelYaklasanlar);
          setPastLessons(guncelGecmis);
        }

        // 3. Favori Eğitmenleri Çek
        const { data: favData } = await supabase
          .from('favoriler')
          .select('egitmen_id')
          .eq('ogrenci_id', currentUser.id);

        if (favData && favData.length > 0) {
          const egitmenIds = favData.map((f: any) => f.egitmen_id);
          const { data: favTeachers } = await supabase
            .from('egitmenler')
            .select('id, user_id, tam_ad, avatar_url, ders_turu, saatlik_ucret')
            .in('user_id', egitmenIds);
            
          if (favTeachers) setFavoriteTeachers(favTeachers);
        } else {
          setFavoriteTeachers([]);
        }

      } catch (err) {
        console.error("Veriler çekilirken bir hata oluştu:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  // 🚀 CANLI BİLDİRİM VE SAYAÇ DİNLEYİCİSİ
  useEffect(() => {
    if (!user?.id) return;
    loadUnreadCount();

    const channel = supabase.channel('student-schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesajlar' }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  async function loadUnreadCount() {
    if (!user?.id) return;
    const { count, error } = await supabase
      .from('mesajlar')
      .select('id', { count: 'exact', head: true })
      .eq('alici_id', user.id)
      .eq('okundu', false);
    
    if (!error && count !== null) {
      setUnreadMsgCount(count);
    }
  }

  const handleRemoveFavorite = async (egitmenId: string) => {
    if (!user) return;
    try {
      await supabase
        .from('favoriler')
        .delete()
        .eq('ogrenci_id', user.id)
        .eq('egitmen_id', egitmenId);
      
      setFavoriteTeachers(prev => prev.filter(t => (t.user_id || t.id) !== egitmenId));
    } catch (error: any) {
      alert("Favorilerden çıkarılırken hata oluştu: " + error.message);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('ogrenciler').update({ tam_ad: settingsForm.tamAd }).eq('user_id', user.id);
      if (error) throw error;
      setUserName(settingsForm.tamAd);
      alert("Profil ayarlarınız başarıyla güncellendi!");
    } catch (err: any) {
      alert("Güncelleme başarısız: " + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSubmitRating = async (dersId: string) => {
    if (secilenPuan === 0) return alert("Lütfen 1 ile 5 arası bir yıldız seçin!");
    setRatingLoading(true);
    try {
      const response = await fetch("/api/ders-degerlendir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dersId, puan: secilenPuan, yorum: yazilanYorum }),
      });
      if (response.ok) {
        alert("Değerlendirmeniz başarıyla kaydedildi!");
        setPastLessons(pastLessons.map(d => d.id === dersId ? { ...d, puan: secilenPuan, yorum: yazilanYorum } : d));
        setDegerlendirmeModali(null);
        setSecilenPuan(0);
        setYazilanYorum("");
      } else {
        alert("Değerlendirme kaydedilirken bir hata oluştu.");
      }
    } catch (error) { console.error(error); } finally { setRatingLoading(false); }
  };

  const handleDeleteRating = async (dersId: string, targetTeacherId?: string) => {
    const onay = confirm("Bu değerlendirmeyi silmek istediğinize emin misiniz? Eğitmenin profilinden de kaldırılacaktır.");
    if (!onay) return;

    try {
      const { error: dersError } = await supabase
        .from('dersler')
        .update({ puan: null, yorum: null })
        .eq('id', dersId)
        .eq('ogrenci_id', user.id);

      if (dersError) throw dersError;

      if (targetTeacherId) {
        await supabase
          .from('yorumlar')
          .delete()
          .eq('egitmen_id', targetTeacherId)
          .eq('ogrenci_adi', userName);
      }
      
      setPastLessons(prev => prev.map(d => d.id === dersId ? { ...d, puan: null, yorum: null } : d));

    } catch (error: any) {
      console.error("Silme hatası:", error);
      alert("Değerlendirme silinirken bir hata oluştu: " + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Paneliniz hazırlanıyor...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const menu = [
    { key: 'dashboard', label: 'Genel Bakış', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
    { key: 'explore', label: 'Eğitmenleri Keşfet', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { key: 'favorites', label: 'Favori Eğitmenlerim', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> },
    { key: 'past_lessons', label: 'Geçmiş Derslerim', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
    { key: 'messages', 
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          Mesajlar Merkezi
          {unreadMsgCount > 0 && (
            <span style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
              +{unreadMsgCount}
            </span>
          )}
        </div>
      ), 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg> 
    },
    { key: 'settings', label: 'Profil Ayarları', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* SOL MENÜ */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: '#94a3b8', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '32px 24px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingLeft: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', lineHeight: 1.2, margin: 0 }}>
            Turkish Learning<br /><span style={{ color: '#818cf8', fontSize: 13, fontWeight: 600 }}>Academy</span>
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {menu.map(m => {
            const isActive = activeTab === m.key && m.key !== 'explore';
            return (
              <button
                key={m.key}
                onClick={() => {
                  if (m.key === 'explore') {
                    router.push('/egitmenler');
                  } else {
                    setActiveTab(m.key);
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? '#1e293b' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
                onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.color = '#94a3b8'; }}
              >
                <div style={{ color: isActive ? (m.key === 'favorites' ? '#f43f5e' : '#818cf8') : '#64748b', display: 'flex', alignItems: 'center', width: 24 }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>{m.label}</div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        <header style={{ 
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
            padding: '24px 60px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexShrink: 0, 
            position: 'relative', 
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', right: '15%', top: '-50%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>
              Öğrenci Paneli
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
              {activeTab === 'dashboard' && `Hoş geldin, ${userName.split(' ')[0]} 👋`}
              {activeTab === 'favorites' && 'Favori Eğitmenlerim'}
              {activeTab === 'past_lessons' && 'Geçmiş Ders Kayıtları'}
              {activeTab === 'messages' && 'Mesajlaşma Merkezi'}
              {activeTab === 'settings' && 'Profil Ayarları'}
            </h1>
            <p style={{ color: '#a5b4fc', fontSize: '14px', margin: '8px 0 0 0', fontWeight: 500 }}>
               {activeTab === 'dashboard' && 'Gelişimini takip et, derslerine katıl ve Türkçe öğren.'}
               {activeTab === 'favorites' && 'Kaydettiğiniz ve takip ettiğiniz eğitmenler.'}
               {activeTab === 'past_lessons' && 'Tamamlanan ve iptal edilen tüm ders kayıtlarınız.'}
               {activeTab === 'messages' && 'Eğitmenlerinizle anında iletişime geçin.'}
               {activeTab === 'settings' && 'Hesap ve iletişim bilgilerinizi güncelleyin.'}
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', 
                padding: '6px 16px 6px 6px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.2)', 
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                {userName.split(' ')[0]}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="2" style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {isProfileMenuOpen && (
              <>
                <div onClick={() => setIsProfileMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, minWidth: 160, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100 }}>
                  <div 
                    onClick={handleLogout}
                    style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600, fontSize: 14, cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    Çıkış Yap
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <div style={{ flex: 1, padding: activeTab === 'messages' ? '0' : '40px 60px', overflowY: 'auto' }}>
          
          {/* SEKME 1: ANA GÖRÜNÜM */}
          {activeTab === 'dashboard' && (
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Dil Seviyesi</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{stats.seviye}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Hesap Durumu</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{stats.durum}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>Kayıt Tarihi</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{new Date(stats.created_at).toLocaleDateString('tr-TR')}</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yaklaşan Canlı Dersleriniz</h3>
                </div>
                
                {upcomingLessons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>Şu an "Yaklaşan" durumunda bir canlı dersiniz bulunmuyor.</p>
                    <button onClick={() => router.push('/egitmenler')} style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Eğitmen Keşfet</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {upcomingLessons.map((ders, idx) => {
                      const egitmenId = ders.egitmenler?.user_id || ders.egitmenler?.id || ders.user_id;

                      return (
                        <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          
                          <div 
                            onClick={() => egitmenId && router.push(`/teachers/${egitmenId}`)}
                            style={{ display: 'flex', gap: '16px', alignItems: 'center', cursor: egitmenId ? 'pointer' : 'default', transition: 'opacity 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                            title="Eğitmen profiline git"
                          >
                            <img src={ders.egitmenler?.avatar_url || `https://ui-avatars.com/api/?name=${ders.egitmenler?.tam_ad || 'E'}&background=eef2ff&color=4f46e5`} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {ders.egitmenler?.tam_ad}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                              </h4>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{ders.egitmenler?.ders_turu || 'Ders'} • Birebir Görüşme</p>
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                            <div style={{ color: '#4f46e5', fontWeight: 800 }}>
                              {new Date(ders.tarih_saat).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <CanliDersButonu dersId={ders.id} tarihSaat={ders.tarih_saat} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEKME: FAVORİ EĞİTMENLER */}
          {activeTab === 'favorites' && (
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {favoriteTeachers.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💔</div>
                    <h3 style={{ fontSize: '1.3rem', color: '#0f172a', marginBottom: '8px', fontWeight: 800 }}>Henüz favori eğitmeniniz yok.</h3>
                    <p style={{ color: '#64748b', fontWeight: 500 }}>Eğitmenleri keşfederek beğendiğiniz profilleri favorilerinize ekleyebilirsiniz.</p>
                    <button onClick={() => router.push('/egitmenler')} style={{ marginTop: '20px', padding: '14px 28px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s' }}>
                      Eğitmenleri Keşfet
                    </button>
                  </div>
                ) : (
                  favoriteTeachers.map((teacher, idx) => (
                    <div 
                      key={idx} 
                      style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src={teacher.avatar_url || `https://ui-avatars.com/api/?name=${teacher.tam_ad || 'E'}&background=eef2ff&color=4f46e5`} style={{ width: '70px', height: '70px', borderRadius: '16px', objectFit: 'cover', border: '1px solid #f1f5f9' }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{teacher.tam_ad}</h4>
                          <p style={{ margin: 0, color: '#4f46e5', fontSize: '0.95rem', fontWeight: 700 }}>{teacher.ders_turu || 'Türkçe Öğretmeni'}</p>
                        </div>
                        
                        <button 
                          onClick={() => handleRemoveFavorite(teacher.user_id || teacher.id)} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} 
                          title="Favorilerden Çıkar"
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.3rem' }}>
                          {teacher.saatlik_ucret || 0}₺ <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>/ ders</span>
                        </div>
                        <button 
                          onClick={() => router.push(`/teachers/${teacher.user_id || teacher.id}`)} 
                          style={{ padding: '10px 20px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        >
                          Profili İncele
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SEKME 2: GEÇMİŞ DERSLER VE DEĞERLENDİRME */}
          {activeTab === 'past_lessons' && (
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.01)' }}>
                {pastLessons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>Geçmişte tamamlanmış veya iptal edilmiş bir dersiniz bulunmuyor.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {pastLessons.map((ders) => (
                      <div key={ders.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        
                        <div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: "#0f172a" }}>{ders.egitmenler?.ders_turu || 'Özel Ders'}</h4>
                            {ders.durum.includes('İptal') ? (
                              <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>İptal Edildi</span>
                            ) : (
                              <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Tamamlandı</span>
                            )}
                          </div>
                          
                          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            {ders.egitmenler?.tam_ad} • 
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: 4}}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                            {new Date(ders.tarih_saat).toLocaleDateString('tr-TR')}
                          </p>
                          
                          {/* Puan verildiyse göster */}
                          {ders.puan && (
                            <div style={{ marginTop: "16px", backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", border: "1px solid #e2e8f0", maxWidth: "500px" }}>
                              <div>
                                <span style={{ color: "#f59e0b", fontSize: "1rem", letterSpacing: "2px", display: "flex", gap: 2 }}>
                                  {[1,2,3,4,5].map((i) => (
                                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={ders.puan >= i ? "#f59e0b" : "none"} stroke={ders.puan >= i ? "#f59e0b" : "#cbd5e1"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                  ))}
                                </span>
                                {ders.yorum && <p style={{ fontSize: "0.9rem", color: "#334155", marginTop: "8px", fontStyle: "italic", margin: "8px 0 0 0" }}>"{ders.yorum}"</p>}
                              </div>

                              <button
                                onClick={() => handleDeleteRating(ders.id, ders.egitmenler?.user_id || ders.egitmenler?.id || ders.user_id)}
                                style={{
                                  background: "none",
                                  border: "1px solid #fecaca",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  fontWeight: "600",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  backgroundColor: "#fef2f2",
                                  transition: "all 0.2s",
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                title="Değerlendirmeyi Sil"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                Kaldır
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Değerlendirme Butonu */}
                        {!ders.puan && !ders.durum.includes('İptal') && (
                          <button 
                            onClick={() => setDegerlendirmeModali(ders.id)}
                            style={{ backgroundColor: "#ffffff", color: "#0f172a", padding: "12px 20px", borderRadius: "10px", border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: "700", whiteSpace: "nowrap", display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Değerlendir
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEKME 3: MESAJLAŞMA MERKEZİ (ÖĞRENCİ) */}
          {activeTab === 'messages' && (
            <Messages userId={user?.id} onMessageRead={loadUnreadCount} />
          )}

          {/* SEKME 4: PROFİL AYARLARI */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Kişisel Bilgiler</h3>
                </div>
                <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#0f172a', fontSize: '0.95rem' }}>Ad Soyad</label>
                    <input value={settingsForm.tamAd} onChange={e => setSettingsForm({...settingsForm, tamAd: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', color: '#0f172a', transition: 'border 0.2s' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#0f172a', fontSize: '0.95rem' }}>Telefon Numarası</label>
                    <input value={settingsForm.telefon} onChange={e => setSettingsForm({...settingsForm, telefon: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', color: '#0f172a', transition: 'border 0.2s' }} placeholder="+90" />
                  </div>
                  <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Değişiklikleri Kaydet
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DEĞERLENDİRME MODALI (POPUP) */}
      {degerlendirmeModali && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "24px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, backgroundColor: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "900", margin: "0 0 8px 0", color: "#0f172a" }}>Dersi Nasıl Buldunuz?</h3>
              <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>Eğitmenimize destek olmak için puan verin.</p>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", cursor: "pointer", marginBottom: "32px" }}>
              {[1, 2, 3, 4, 5].map((yildiz) => (
                <svg 
                  key={yildiz} 
                  onClick={() => setSecilenPuan(yildiz)}
                  width="40" height="40" viewBox="0 0 24 24" 
                  fill={secilenPuan >= yildiz ? "#f59e0b" : "none"} 
                  stroke={secilenPuan >= yildiz ? "#f59e0b" : "#cbd5e1"} 
                  strokeWidth="2"
                  style={{ transition: "all 0.2s" }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>

            <textarea 
              placeholder="Ders hakkındaki düşünceleriniz... (İsteğe bağlı)"
              value={yazilanYorum}
              onChange={(e) => setYazilanYorum(e.target.value)}
              style={{ width: "100%", height: "120px", padding: "16px", borderRadius: "16px", border: "1px solid #cbd5e1", marginBottom: "32px", resize: "none", outline: "none", fontSize: "0.95rem", backgroundColor: "#f8fafc", color: '#0f172a' }}
            />

            <div style={{ display: "flex", gap: "16px" }}>
              <button 
                onClick={() => { setDegerlendirmeModali(null); setSecilenPuan(0); setYazilanYorum(""); }} 
                style={{ flex: 1, padding: "16px", backgroundColor: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: "1rem" }}
              >
                İptal
              </button>
              <button 
                onClick={() => handleSubmitRating(degerlendirmeModali)}
                disabled={ratingLoading}
                style={{ flex: 2, padding: "16px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: "1rem" }}
              >
                {ratingLoading ? "Kaydediliyor..." : "Puanı Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- 6. MESSAGES COMPONENT (🚀 SİLME & HAYALET FİLTRE EKLENDİ) ---------------- */
function Messages({ userId, onMessageRead }: any) {
  const [teachers, setTeachers] = useState<any[]>([]); 
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null); 
  const [messages, setMessages] = useState<any[]>([]); 
  const [text, setText] = useState('');
  const [showChatMenu, setShowChatMenu] = useState(false);

  useEffect(() => { if (!userId) return; loadTeachers(); }, [userId]);
  
  useEffect(() => {
    if (!selectedTeacher || !userId) return;

    const fetchAndMarkMessages = async () => {
      const { data: unreadData } = await supabase
        .from('mesajlar')
        .select('id')
        .eq('alici_id', userId)
        .eq('gonderen_id', selectedTeacher.id)
        .eq('okundu', false);
        
      if (unreadData && unreadData.length > 0) {
          await supabase
            .from('mesajlar')
            .update({ okundu: true })
            .in('id', unreadData.map(m => m.id));
            
          setTimeout(() => { if (onMessageRead) onMessageRead(); }, 300);
      }

      const { data } = await supabase
        .from('mesajlar')
        .select('*')
        .or(`and(gonderen_id.eq.${userId},alici_id.eq.${selectedTeacher.id}),and(gonderen_id.eq.${selectedTeacher.id},alici_id.eq.${userId})`)
        .order('olusturulma_tarihi', { ascending: true });
      
      // 🚀 HAYALET FİLTRE 1: Öğrenci, "Sistem Bildirimi" ile başlayan kendi otomatik mesajlarını görmez!
      const filteredMessages = (data || []).filter(m => !(m.gonderen_id === userId && m.icerik && m.icerik.includes('📌 Sistem Bildirimi')));
      setMessages(filteredMessages);
    };

    fetchAndMarkMessages();

    const channel = supabase.channel('chat-room-student').on('postgres_changes', { event: '*', schema: 'public', table: 'mesajlar' }, async (payload: any) => {
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const msg = payload.new;
        const isRelevant = (msg.gonderen_id === userId && msg.alici_id === selectedTeacher.id) || (msg.gonderen_id === selectedTeacher.id && msg.alici_id === userId);
        
        // Hayalet filtre 1 (Canlı dinlemede de çalışmalı)
        if (isRelevant && !(msg.gonderen_id === userId && msg.icerik && msg.icerik.includes('📌 Sistem Bildirimi'))) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === msg.id || (m.icerik === msg.icerik && m.gonderen_id === msg.gonderen_id && !m.id));
            if (exists) return prev.map(m => (m.id === msg.id || (m.icerik === msg.icerik && m.gonderen_id === msg.gonderen_id && !m.id)) ? msg : m);
            return [...prev, msg];
          });

          if (msg.alici_id === userId && msg.gonderen_id === selectedTeacher.id && !msg.okundu) {
            await supabase.from('mesajlar').update({ okundu: true }).eq('id', msg.id);
            if (onMessageRead) setTimeout(() => onMessageRead(), 300);
          }
        } else {
           // Bize gelen mesajsa (öğretmenden) ve okunmamışsa rozeti güncelle
           if (msg.alici_id === userId && !msg.okundu) {
             loadTeachers();
           }
        }
      }
      else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id;
        setMessages(prev => prev.filter(m => m.id !== deletedId));
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTeacher, userId]);

  async function loadTeachers() {
    // 🚀 HAYALET FİLTRE 2 İÇİN 'icerik' SÜTUNUNU DA ÇEKİYORUZ
    const { data, error } = await supabase.from('mesajlar').select('gonderen_id, alici_id, okundu, icerik').or(`gonderen_id.eq.${userId},alici_id.eq.${userId}`);
    if (!data || error) return;
    
    const ids = new Set<string>();
    const unreadMap = new Map<string, number>();

    data.forEach(m => { 
      // 🚀 HAYALET FİLTRE 2: Sadece "Sistem Bildirimi" olan mesajı atladıysak o kişi listeye eklenmez!
      if (m.gonderen_id === userId && m.icerik && m.icerik.includes('📌 Sistem Bildirimi')) {
         return; // Geç, bunu sayma
      }

      const isMeSender = m.gonderen_id === userId;
      const otherId = isMeSender ? m.alici_id : m.gonderen_id;
      if (otherId) ids.add(otherId); 
      
      if (!isMeSender && !m.okundu && otherId) {
        unreadMap.set(otherId, (unreadMap.get(otherId) || 0) + 1);
      }
    });

    const idList = Array.from(ids);
    if (idList.length === 0) {
       setTeachers([]);
       return;
    }
    
    // EĞİTMENLERİ ÇEK
    const { data: egitmenProfilleri } = await supabase.from('egitmenler').select('user_id, id, tam_ad, avatar_url, ders_turu').in('user_id', idList);
    
    const mappedTeachers = idList.map(id => {
      const profil = egitmenProfilleri?.find(p => p.user_id === id || p.id === id);
      return { 
        id: id, 
        tam_ad: profil?.tam_ad || `Eğitmen`, 
        avatar_url: profil?.avatar_url || null,
        ders_turu: profil?.ders_turu || 'Türkçe Öğretmeni',
        unread: unreadMap.get(id) || 0 
      };
    });

    mappedTeachers.sort((a, b) => b.unread - a.unread);
    setTeachers(mappedTeachers);
  }

  const markAllAsRead = async () => {
    await supabase.from('mesajlar').update({ okundu: true }).eq('alici_id', userId).eq('okundu', false);
    if (onMessageRead) onMessageRead();
    loadTeachers();
  };

  async function send() {
    if (!text.trim() || !selectedTeacher) return;
    const mesajIcerigi = text.trim();
    
    const tempId = `temp-${Date.now()}`;
    const anlikMesajTaslagi = { id: tempId, gonderen_id: userId, alici_id: selectedTeacher.id, icerik: mesajIcerigi, olusturulma_tarihi: new Date().toISOString(), okundu: false };
    
    setMessages(prev => [...prev, anlikMesajTaslagi]);
    setText(''); 
    
    const { data, error } = await supabase.from('mesajlar')
      .insert({ gonderen_id: userId, alici_id: selectedTeacher.id, icerik: mesajIcerigi, okundu: false })
      .select()
      .single();
      
    if (error) { 
      alert("Mesaj iletilemedi: " + error.message); 
      setMessages(prev => prev.filter(m => m.id !== tempId)); 
      setText(mesajIcerigi); 
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  }

  // TEK MESAJ SİLME
  const deleteMessage = async (msgId: string) => {
    if (!msgId || msgId.startsWith('temp-')) return;
    const onay = confirm("Bu mesajı silmek istediğinize emin misiniz?");
    if (!onay) return;
    try {
      const { error } = await supabase.from('mesajlar').delete().eq('id', msgId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) {
      alert("Silme hatası: " + err.message);
    }
  };

  // 🚀 TÜM SOHBETİ SİLME (Dropdown)
  const clearChat = async () => {
    const onay = confirm("Bu kişiyle olan TÜM sohbet geçmişinizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.");
    if (!onay) return;
    try {
      const { error } = await supabase
        .from('mesajlar')
        .delete()
        .or(`and(gonderen_id.eq.${userId},alici_id.eq.${selectedTeacher.id}),and(gonderen_id.eq.${selectedTeacher.id},alici_id.eq.${userId})`);
      
      if (error) throw error;
      
      setMessages([]); 
      setSelectedTeacher(null);
      loadTeachers(); 
      if (onMessageRead) onMessageRead();
    } catch (err: any) {
      alert("Sohbet silinemedi: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      
      {/* SOL: SOHBET LİSTESİ */}
      <div style={{ width: '340px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Sohbetler
          </div>
          {teachers.some(s => s.unread > 0) && (
             <button onClick={markAllAsRead} title="Tümünü Okundu İşaretle" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L7 17l-5-5"/><path d="M22 10l-5.5 5.5"/></svg>
             </button>
          )}
        </div>
        
        {teachers.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Henüz aktif bir sohbetiniz bulunmuyor.</div>
        ) : (
          <div style={{ padding: '16px' }}>
            {teachers.map((s, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedTeacher(s)} 
                style={{ 
                  padding: '16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '10px', 
                  transition: 'all 0.2s', 
                  background: selectedTeacher?.id === s.id ? '#ffffff' : 'transparent', 
                  border: selectedTeacher?.id === s.id ? '1px solid #cbd5e1' : '1px solid transparent',
                  boxShadow: selectedTeacher?.id === s.id ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                }}
                onMouseEnter={(e) => { if (selectedTeacher?.id !== s.id) e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { if (selectedTeacher?.id !== s.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={s.avatar_url || `https://ui-avatars.com/api/?name=${s.tam_ad || 'E'}&background=eef2ff&color=4f46e5`} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: '2px' }}>{s.tam_ad}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      {s.ders_turu}
                    </div>
                  </div>
                  {s.unread > 0 && (
                     <div style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                        {s.unread}
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* SAĞ: SOHBET EKRANI */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, pointerEvents: 'none', backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {selectedTeacher ? (
          <>
            {/* 🚀 SOHBET HEADER & 3 NOKTA (DROPDOWN) */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src={selectedTeacher.avatar_url || `https://ui-avatars.com/api/?name=${selectedTeacher.tam_ad || 'E'}&background=eef2ff&color=4f46e5`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{selectedTeacher.tam_ad}</div>
                  <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                    Eğitmen
                  </div>
                </div>
              </div>

              {/* SOHBETİ SİL (3 Nokta İkonu) */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowChatMenu(!showChatMenu)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#64748b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
                {showChatMenu && (
                  <>
                    <div onClick={() => setShowChatMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', minWidth: '160px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100 }}>
                      <button 
                        onClick={() => {
                          clearChat();
                          setShowChatMenu(false);
                        }}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        Sohbeti Sil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Mesaj Alanı */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 5 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👋</div>
                  Sohbeti başlatmak için bir mesaj gönderin.
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.gonderen_id === userId;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ 
                      maxWidth: '70%', 
                      padding: '14px 20px', 
                      borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                      fontSize: '0.95rem', 
                      lineHeight: 1.6, 
                      backgroundColor: isMe ? '#4f46e5' : '#ffffff', 
                      color: isMe ? '#ffffff' : '#0f172a', 
                      border: isMe ? 'none' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{m.icerik}</div>
                      <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '8px', color: isMe ? '#c7d2fe' : '#94a3b8', fontWeight: 500, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                        {new Date(m.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        
                        {/* 🚀 TEK MESAJ SİLME BUTONU (Sadece kendi mesajlarında çıkar) */}
                        {isMe && m.id && !m.id.toString().startsWith('temp-') && (
                          <button 
                            onClick={() => deleteMessage(m.id)} 
                            style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} 
                            title="Mesajı Sil"
                            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={e => e.currentTarget.style.color = '#a5b4fc'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Mesaj Gönderme Çubuğu */}
            <div style={{ padding: '24px 32px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderTop: '1px solid #f1f5f9', position: 'relative', zIndex: 10 }}>
              <form 
                onSubmit={(e) => { e.preventDefault(); send(); }} 
                style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}
              >
                <textarea 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }} 
                  placeholder="Mesajınızı yazın... (Göndermek için Enter)" 
                  style={{ 
                    flex: 1, padding: '16px 20px', borderRadius: '16px', border: '1px solid #cbd5e1', 
                    backgroundColor: '#f8fafc', fontSize: '1rem', outline: 'none', transition: 'all 0.2s',
                    resize: 'none', height: '60px', fontFamily: 'inherit'
                  }} 
                  onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
                <button 
                  type="submit" 
                  disabled={!text.trim()}
                  style={{ 
                    height: '60px', padding: '0 32px', backgroundColor: text.trim() ? '#4f46e5' : '#cbd5e1', 
                    color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', 
                    cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 10, 
                    transition: 'all 0.2s', boxShadow: text.trim() ? '0 10px 15px -3px rgba(79,70,229,0.3)' : 'none' 
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Gönder
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', position: 'relative', zIndex: 5 }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Sohbete Başlayın</h3>
            <p style={{ marginTop: '8px', fontWeight: 500, fontSize: '1rem', color: '#64748b' }}>Eğitmenlerle iletişime geçmek için soldan bir sohbet seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 7. EARNINGS COMPONENT ---------------- */
function Earnings({ profile, stats }: any) {
  const tahminiKazanc = (stats.completedLessons || 0) * (profile?.saatlik_ucret || 0);
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={grid}>
        <Box title="Toplam Kazanılan Tutar" value={`${tahminiKazanc} TL`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} color="#f0fdf4" textColor="#16a34a" />
        <Box title="Tamamlanan Toplam Ders" value={`${stats.completedLessons} Saat`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} />
        <Box title="Mevcut Saatlik Ücret" value={`${profile?.saatlik_ucret || 0} TL`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
      </div>
    </div>
  );
}

/* ---------------- 8. SETTINGS COMPONENT ---------------- */
function Settings({ profile, stats, userId, onProfileUpdate }: any) {
  const localInputStyle = { width: "100%", padding: '14px 16px', border: "1px solid #cbd5e1", borderRadius: '12px', outline: "none", fontSize: '15px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const, transition: 'all 0.2s', marginTop: '6px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' };
  const localSelectStyle = { ...localInputStyle, appearance: 'none' as const, WebkitAppearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto', paddingRight: '40px', cursor: 'pointer' };

  const LOCATIONS = ['Türkiye', 'Almanya', 'Amerika Birleşik Devletleri', 'İngiltere', 'Fransa', 'Hollanda', 'Azerbaycan', 'Kuzey Kıbrıs', 'Diğer'];
  const CITIES = ['Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Erzurum', 'Eskişehir', 'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya', 'Mersin', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Trabzon', 'Van', 'Diğer'];
  const EDUCATIONS = ['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora'];
  const LANGUAGES = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'Arapça', 'Rusça', 'Çince'];

  const [name, setName] = useState(profile?.tam_ad || "");
  const [bio, setBio] = useState(profile?.biyografi || "");
  const [price, setPrice] = useState(profile?.saatlik_ucret || 250);
  const [subject, setSubject] = useState(profile?.ders_turu || "Türkçe Eğitmeni");
  const [metodoloji, setMetodoloji] = useState(profile?.metodoloji || "");
  const [videoUrl, setVideoUrl] = useState(profile?.video_url || "");
  const [amac, setAmac] = useState(profile?.amac || "");
  const [odak, setOdak] = useState(profile?.odak || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const [konumUlke, setKonumUlke] = useState("");
  const [konumSehir, setKonumSehir] = useState("");
  const [egitimSeviye, setEgitimSeviye] = useState("");
  const [egitimOkul, setEgitimOkul] = useState("");
  const [anaDil, setAnaDil] = useState("");
  const [digerDiller, setDigerDiller] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.tam_ad || ""); setBio(profile.biyografi || ""); setPrice(profile.saatlik_ucret || 250); setSubject(profile.ders_turu || "Türkçe Eğitmeni"); setMetodoloji(profile.metodoloji || ""); setAvatarUrl(profile.avatar_url || ""); setVideoUrl(profile.video_url || ""); setAmac(profile.amac || ""); setOdak(profile.odak || "");
      if (profile.konum) { const parts = profile.konum.split(' - '); setKonumUlke(parts[0]?.trim() || ""); setKonumSehir(parts[1]?.trim() || ""); }
      if (profile.egitim) { const parts = profile.egitim.split(' - '); setEgitimSeviye(parts[0]?.trim() || ""); setEgitimOkul(parts[1]?.trim() || ""); }
      if (profile.diller) {
        const dillerStr = typeof profile.diller === 'string' ? profile.diller : JSON.stringify(profile.diller);
        let aDil = ""; let dDiller: string[] = [];
        LANGUAGES.forEach(lang => { if (dillerStr.includes(`${lang} (Ana Dil)`)) { aDil = lang; } else if (dillerStr.includes(lang)) { dDiller.push(lang); } });
        setAnaDil(aDil); setDigerDiller(dDiller);
      } else { setAnaDil(""); setDigerDiller([]); }
    }
  }, [profile]);

  const handleDilToggle = (dil: string) => { setDigerDiller(prev => { const cleanDil = dil.trim(); if (prev.includes(cleanDil)) return prev.filter(d => d !== cleanDil); return [...prev, cleanDil]; }); };
  
  async function handleAvatarUpload(event: any) {
    try { setUploading(true); if (!event.target.files || event.target.files.length === 0) throw new Error('Lütfen bir resim seçin.'); const file = event.target.files[0]; const fileExt = file.name.split('.').pop(); const fileName = `${userId}-${Math.random()}.${fileExt}`; const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true }); if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName); setAvatarUrl(publicUrl); alert("Fotoğraf yüklendi! Lütfen değişiklikleri kaydedin."); } catch (error: any) { alert('Hata: ' + error.message); } finally { setUploading(false); }
  }
  
  async function handleSave() {
    if (!userId) return alert("Kullanıcı oturumu bulunamadı.");
    try {
      setSaving(true);
      const tamKonum = konumUlke && konumSehir ? `${konumUlke.trim()} - ${konumSehir.trim()}` : konumUlke.trim();
      const tamEgitim = egitimSeviye && egitimOkul ? `${egitimSeviye.trim()} - ${egitimOkul.trim()}` : egitimSeviye.trim();
      const tumDiller = anaDil ? [`${anaDil} (Ana Dil)`, ...digerDiller] : digerDiller;
      const updateData = { user_id: userId, tam_ad: name, biyografi: bio, saatlik_ucret: Number(price), ders_turu: subject, konum: tamKonum, egitim: tamEgitim, diller: tumDiller, metodoloji: metodoloji, avatar_url: avatarUrl, video_url: videoUrl, amac: amac, odak: odak };
      let error;
      if (profile?.id) { const { error: err } = await supabase.from('egitmenler').update(updateData).eq('user_id', userId); error = err; } else { const { error: err } = await supabase.from('egitmenler').insert([updateData]); error = err; }
      if (error) throw error;
      alert("Değişiklikler başarıyla kaydedildi! 🎉 Profilinize anında yansıdı.");
      onProfileUpdate();
    } catch (err: any) { console.error(err); alert("Hata: " + err.message); } finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Profil Bilgileri</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#e2e8f0', backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{!avatarUrl && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}</div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '6px' }}>Profil Fotoğrafı</label>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>JPEG veya PNG formatında profesyonel bir fotoğraf yükleyin.</p>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ fontSize: '14px', color: '#475569', cursor: 'pointer' }} />
              {uploading && <span style={{ fontSize: '13px', color: '#4f46e5', marginLeft: '12px', fontWeight: 700 }}>Yükleniyor...</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div><label style={labelStyle}>Ad Soyad</label><input value={name} onChange={(e) => setName(e.target.value)} style={localInputStyle} /></div>
            <div><label style={labelStyle}>Vitrin Metni <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>(Örn: Türkçe Öğretmeni)</span></label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Örn: TÖMER Uzmanı, Türkçe Öğretmeni..." style={localInputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Konum (Ülke)</label>
                <select value={konumUlke} onChange={(e) => { setKonumUlke(e.target.value); setKonumSehir(""); }} style={localSelectStyle}><option value="" disabled>Ülke Seçiniz...</option>{LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
              </div>
              <div>
                <label style={labelStyle}>Şehir</label>
                {konumUlke === 'Türkiye' ? <select value={konumSehir} onChange={(e) => setKonumSehir(e.target.value)} style={localSelectStyle}><option value="" disabled>Şehir Seçiniz...</option>{CITIES.map(city => <option key={city} value={city}>{city}</option>)}</select> : <input value={konumSehir} onChange={(e) => setKonumSehir(e.target.value)} placeholder={konumUlke ? "Şehrinizi yazın..." : "Önce ülke seçiniz..."} style={localInputStyle} disabled={!konumUlke} />}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Eğitim Seviyesi</label>
                <select value={egitimSeviye} onChange={(e) => setEgitimSeviye(e.target.value)} style={localSelectStyle}><option value="" disabled>Seviye Seçiniz...</option>{EDUCATIONS.map(ed => <option key={ed} value={ed}>{ed}</option>)}</select>
              </div>
              <div><label style={labelStyle}>Üniversite / Okul Adı</label><input value={egitimOkul} onChange={(e) => setEgitimOkul(e.target.value)} placeholder="Örn: Gazi Üniversitesi" style={localInputStyle} /></div>
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Ana Diliniz</label>
              <select value={anaDil} onChange={(e) => { setAnaDil(e.target.value); if (digerDiller.includes(e.target.value)) setDigerDiller(prev => prev.filter(d => d !== e.target.value)); }} style={localSelectStyle}><option value="">-- Ana Dil Seçimini Temizle --</option>{LANGUAGES.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Bildiğiniz Diğer Diller <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>(Birden fazla seçebilirsiniz)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {LANGUAGES.filter(l => l !== anaDil).map(dil => {
                  const isSelected = digerDiller.includes(dil);
                  return (
                    <button key={dil} type="button" onClick={() => handleDilToggle(dil)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', background: isSelected ? '#eef2ff' : '#ffffff', color: isSelected ? '#4f46e5' : '#475569', border: isSelected ? '1.5px solid #4f46e5' : '1px solid #cbd5e1' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: isSelected ? 'none' : '1.5px solid #94a3b8', background: isSelected ? '#4f46e5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSelected && <span style={{ color: 'white', fontSize: '10px', fontWeight: 800 }}>✓</span>}</div>
                      {dil}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div><label style={labelStyle}>Saatlik Ücret (TL)</label><input value={price} type="number" onChange={(e) => setPrice(Number(e.target.value))} style={localInputStyle} /></div>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ ...labelStyle, marginBottom: '4px', color: '#64748b' }}>Tamamlanan Toplam Ders</label>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>{stats?.completedLessons || 0} Ders</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div><label style={labelStyle}>Hedeflenen Amaçlar <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>(Virgülle ayırın)</span></label><input value={amac} onChange={(e) => setAmac(e.target.value)} placeholder="Örn: Sınav Hazırlığı, İş Türkçesi" style={localInputStyle} /></div>
            <div><label style={labelStyle}>Odak Noktaları <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>(Virgülle ayırın)</span></label><input value={odak} onChange={(e) => setOdak(e.target.value)} placeholder="Örn: Gramer, Telaffuz" style={localInputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Tanıtım Videosu (YouTube Linki)</label><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Örn: https://www.youtube.com/watch?v=dQw4w9WgXcQ" style={localInputStyle} /></div>
          <div><label style={labelStyle}>Hakkımda (Biyografi)</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...localInputStyle, height: 140, resize: 'vertical' }} /></div>
          <div><label style={labelStyle}>Öğretim Yaklaşımı & Metodoloji</label><textarea value={metodoloji} onChange={(e) => setMetodoloji(e.target.value)} placeholder="Derslerinizi hangi yaklaşımlarla işliyorsunuz?" style={{ ...localInputStyle, height: 140, resize: 'vertical' }} /></div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ marginTop: 40, width: "100%", padding: 18, borderRadius: '16px', border: "none", background: saving ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)", color: "white", fontWeight: 800, fontSize: '1.1rem', cursor: saving ? "default" : "pointer", transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: saving ? 'none' : '0 10px 20px -5px rgba(79, 70, 229, 0.4)' }}>
          {saving ? "Kaydediliyor..." : <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Değişiklikleri Kaydet ve Yayınla</>}
        </button>
      </div>
    </div>
  );
}

function Box({ title, value, icon, color, textColor }: any) {
  return (
    <div style={{ background: color || 'white', padding: '24px', borderRadius: '20px', border: color ? 'none' : '1px solid #e2e8f0', boxShadow: color ? 'none' : '0 4px 6px -1px rgb(0 0 0 / 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div><div style={{ fontSize: '14px', fontWeight: 600, color: textColor || '#64748b', marginBottom: '8px' }}>{title}</div><div style={{ fontSize: '28px', fontWeight: 900, color: textColor || '#0f172a', letterSpacing: '-0.5px' }}>{value}</div></div>{icon && <div style={{ opacity: 0.9 }}>{icon}</div>}
    </div>
  );
}

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' };
const cardStyle = { background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' };
const cardTitleStyle = { fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 };
const labelStyle = { fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'block' };