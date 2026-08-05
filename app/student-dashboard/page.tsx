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

  // Profil Kutucuğu (Dropdown) State'i
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Aktif Sekme Yönetimi (TypeScript hatasını çözmek için 'string' yapıldı)
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Supabase Veri State'leri
  const [stats, setStats] = useState({ seviye: '-', durum: '-', created_at: '' });
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [pastLessons, setPastLessons] = useState<any[]>([]); 
  
  // Mesajlaşma State'leri
  const [chatList, setChatList] = useState<any[]>([]);
  const [activeChatTeacher, setActiveChatTeacher] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Ayarlar Form State'leri
  const [settingsForm, setSettingsForm] = useState({ tamAd: '', telefon: '' });

  // Değerlendirme State'leri
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

        // 2. Tüm dersleri tek sorguda çekip SAATE GÖRE akıllı ayır
        const { data: allLessons } = await supabase
          .from('dersler')
          .select('*, egitmenler(user_id, tam_ad, avatar_url, ders_turu)')
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

        // 3. Sohbet Geçmişi
        const { data: initialMsgs } = await supabase
          .from('mesajlar')
          .select('gonderen_id, alici_id')
          .or(`gonderen_id.eq.${currentUser.id},alici_id.eq.${currentUser.id}`);

        if (initialMsgs) {
          const ids = new Set<string>();
          initialMsgs.forEach(m => {
            if (m.gonderen_id !== currentUser.id) ids.add(m.gonderen_id);
            if (m.alici_id !== currentUser.id) ids.add(m.alici_id);
          });
          
          const idList = Array.from(ids);
          if (idList.length > 0) {
            const { data: egitmenProfilleri } = await supabase.from('egitmenler').select('user_id, tam_ad, avatar_url').in('user_id', idList);
            const mappedTeachers = idList.map(id => {
              const profil = egitmenProfilleri?.find(p => p.user_id === id);
              return { user_id: id, tam_ad: profil?.tam_ad || `Eğitmen (${id.slice(0, 4)})`, avatar_url: profil?.avatar_url || null };
            });
            setChatList(mappedTeachers);
          }
        }
      } catch (err) {
        console.error("Veriler çekilirken bir hata oluştu:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  // Mesajlaşma Ayarları
  useEffect(() => {
    if (!activeChatTeacher || !user) return;
    async function fetchSpecificMessages() {
      const { data: msgs } = await supabase.from('mesajlar').select('*').or(`and(gonderen_id.eq.${user.id},alici_id.eq.${activeChatTeacher.user_id}),and(gonderen_id.eq.${activeChatTeacher.user_id},alici_id.eq.${user.id})`).order('olusturulma_tarihi', { ascending: true });
      if (msgs) setChatMessages(msgs);
    }
    fetchSpecificMessages();
    const channel = supabase.channel('canli-mesajlar').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesajlar' }, (payload: any) => {
      const newMsg = payload.new;
      if ((newMsg.gonderen_id === user.id && newMsg.alici_id === activeChatTeacher.user_id) || (newMsg.gonderen_id === activeChatTeacher.user_id && newMsg.alici_id === user.id)) {
        setChatMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id || (m.icerik === newMsg.icerik && m.gonderen_id === newMsg.gonderen_id));
          return exists ? prev : [...prev, newMsg];
        });
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChatTeacher, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatTeacher || !user) return;
    const mesajIcerigi = newMessage;
    const anlikMesajTaslagi = { gonderen_id: user.id, alici_id: activeChatTeacher.user_id, icerik: mesajIcerigi, olusturulma_tarihi: new Date().toISOString() };
    setChatMessages(prev => [...prev, anlikMesajTaslagi]);
    setNewMessage(''); 
    try {
      const { error } = await supabase.from('mesajlar').insert([{ gonderen_id: user.id, alici_id: activeChatTeacher.user_id, icerik: mesajIcerigi, okundu: false }]);
      if (error) throw error;
    } catch (err: any) {
      alert("Mesaj gönderilemedi: " + err.message);
      setChatMessages(prev => prev.filter(m => m !== anlikMesajTaslagi));
      setNewMessage(mesajIcerigi);
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

  // MODERN MENÜ İKONLARI
  const menu = [
    { key: 'dashboard', label: 'Genel Bakış', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
    { key: 'explore', label: 'Eğitmenleri Keşfet', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { key: 'past_lessons', label: 'Geçmiş Derslerim', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
    { key: 'messages', label: 'Mesajlar Merkezi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg> },
    { key: 'settings', label: 'Profil Ayarları', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* SOL MENÜ (DARK MODE) */}
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
                    setActiveTab(m.key); // HATA BURADA ÇÖZÜLDÜ
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
                <div style={{ color: isActive ? '#818cf8' : '#64748b', display: 'flex', alignItems: 'center' }}>
                  {m.icon}
                </div>
                {m.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* 🚀 YENİ: YUKARI ALINMIŞ MAVİ "HERO" HEADER (Profil Açılır Menüsü Burada) */}
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
            /* DİKKAT: overflow: 'hidden' buradan SİLİNDİ ki menü aşağı rahatça taşabilsin */
        }}>
          {/* Arka plan ışık efekti (Taşmaları önlemek için sadece bu katmana overflow: hidden verildi) */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', right: '15%', top: '-50%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>
              Öğrenci Paneli
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
              {activeTab === 'dashboard' && `Hoş geldin, ${userName.split(' ')[0]} 👋`}
              {activeTab === 'past_lessons' && 'Geçmiş Ders Kayıtları'}
              {activeTab === 'messages' && 'Mesajlaşma Merkezi'}
              {activeTab === 'settings' && 'Profil Ayarları'}
            </h1>
            <p style={{ color: '#a5b4fc', fontSize: '14px', margin: '8px 0 0 0', fontWeight: 500 }}>
               {activeTab === 'dashboard' && 'Gelişimini takip et, derslerine katıl ve Türkçe öğren.'}
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

            {/* Çıkış Yap Dropdown Menüsü */}
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
            <>
              {/* Not: Mavi büyük banner yukarı taşındığı için buradaki eskisini kaldırdık */}
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
            </>
          )}

          {/* SEKME 2: GEÇMİŞ DERSLER VE DEĞERLENDİRME */}
          {activeTab === 'past_lessons' && (
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
          )}

          {/* SEKME 3: CANLI MESAJLAŞMA MERKEZİ */}
          {activeTab === 'messages' && (
            <div style={{ display: 'flex', height: '100%', backgroundColor: '#ffffff', borderRight: 'none', overflow: 'hidden' }}>
              <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                <div style={{ padding: '24px', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Sohbetler
                </div>
                {chatList.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Henüz aktif bir sohbetiniz bulunmuyor.</div>
                ) : (
                  <div style={{ padding: '16px' }}>
                    {chatList.map((teacher, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveChatTeacher(teacher)}
                        style={{ padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', backgroundColor: activeChatTeacher?.user_id === teacher.user_id ? '#eef2ff' : 'transparent', border: activeChatTeacher?.user_id === teacher.user_id ? '1px solid #c7d2fe' : '1px solid transparent', transition: 'all 0.2s', marginBottom: 8 }}
                      >
                        <img src={teacher.avatar_url || `https://ui-avatars.com/api/?name=${teacher.tam_ad || 'E'}&background=e2e8f0`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: activeChatTeacher?.user_id === teacher.user_id ? '#4f46e5' : '#0f172a', fontSize: '0.95rem' }}>{teacher.tam_ad}</div>
                          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>Eğitmen</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
                {activeChatTeacher ? (
                  <>
                    <div style={{ padding: '20px 30px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img src={activeChatTeacher.avatar_url || `https://ui-avatars.com/api/?name=${activeChatTeacher.tam_ad || 'E'}&background=eef2ff&color=4f46e5`} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{activeChatTeacher.tam_ad}</div>
                        <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 8, height: 8, backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                          Çevrimiçi
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {chatMessages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Sohbeti başlatmak için ilk mesajınızı gönderin.</div>
                      )}
                      {chatMessages.map((msg, index) => {
                        const isMe = msg.gonderen_id === user.id;
                        return (
                          <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '65%', backgroundColor: isMe ? '#4f46e5' : '#f1f5f9', color: isMe ? '#ffffff' : '#0f172a', padding: '14px 20px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', border: isMe ? 'none' : '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{msg.icerik}</div>
                            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '6px', color: isMe ? '#c7d2fe' : '#94a3b8' }}>
                              {new Date(msg.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSendMessage} style={{ padding: '20px 30px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                      <input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajınızı buraya yazın..." 
                        style={{ flex: 1, padding: '16px 20px', borderRadius: '16px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
                      />
                      <button type="submit" style={{ padding: '0 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Gönder
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p style={{ marginTop: 24, fontWeight: 500, fontSize: '1.1rem', color: '#64748b' }}>Sohbete başlamak için soldan bir eğitmen seçin.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEKME 4: PROFİL AYARLARI */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
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