'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState('Öğrenci');
  const [loading, setLoading] = useState(true);

  // Aktif Sekme Yönetimi
  const [activeTab, setActiveTab] = useState<'dashboard' | 'teachers' | 'messages' | 'settings'>('dashboard');

  // Supabase Veri State'leri
  const [stats, setStats] = useState({ seviye: '-', durum: '-', created_at: '' });
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  
  // Mesajlaşma State'leri
  const [chatList, setChatList] = useState<any[]>([]);
  const [activeChatTeacher, setActiveChatTeacher] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Ayarlar Form State'leri
  const [settingsForm, setSettingsForm] = useState({ tamAd: '', telefon: '' });

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
          .single();
          
        if (profile) {
          fetchedName = fetchedName || profile.tam_ad;
          setStats({
            seviye: profile.seviye || '-',
            durum: profile.durum || '-',
            created_at: profile.created_at || new Date().toISOString()
          });
          setSettingsForm({
            tamAd: profile.tam_ad || '',
            telefon: '' 
          });
        }
        setUserName(fetchedName || 'Öğrenci');

        // 2. Yaklaşan Dersleri Çek
        const { data: lessons } = await supabase
          .from('dersler')
          .select('*, egitmenler(user_id, tam_ad, avatar_url, ders_turu)')
          .eq('ogrenci_id', currentUser.id)
          .gte('tarih_saat', new Date().toISOString())
          .order('tarih_saat', { ascending: true });
          
        if (lessons) setUpcomingLessons(lessons);

        // 3. Tüm Eğitmenleri Çek
        const { data: teachersData } = await supabase.from('egitmenler').select('*');
        if (teachersData) setAllTeachers(teachersData);

        // 4. 🎯 GÜNCELLENDİ: Sohbet Geçmişindeki Eğitmenleri 'egitmenler' Tablosundan Çek
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
            // EĞİTMENLER tablosundan isimleri ve avatarları alıyoruz
            const { data: egitmenProfilleri } = await supabase
              .from('egitmenler')
              .select('user_id, tam_ad, avatar_url')
              .in('user_id', idList);
            
            const mappedTeachers = idList.map(id => {
              const profil = egitmenProfilleri?.find(p => p.user_id === id);
              return {
                user_id: id,
                tam_ad: profil?.tam_ad || `Eğitmen (${id.slice(0, 4)})`,
                avatar_url: profil?.avatar_url || null
              };
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

  // Aktif Sohbet Değiştiğinde Mesajları Getir ve Canlı Dinle
  useEffect(() => {
    if (!activeChatTeacher || !user) return;

    async function fetchSpecificMessages() {
      const { data: msgs } = await supabase
        .from('mesajlar')
        .select('*')
        .or(`and(gonderen_id.eq.${user.id},alici_id.eq.${activeChatTeacher.user_id}),and(gonderen_id.eq.${activeChatTeacher.user_id},alici_id.eq.${user.id})`)
        .order('olusturulma_tarihi', { ascending: true });

      if (msgs) setChatMessages(msgs);
    }

    fetchSpecificMessages();

    const channel = supabase
      .channel('canli-mesajlar')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesajlar' }, (payload: any) => {
        const newMsg = payload.new;
        if (
          (newMsg.gonderen_id === user.id && newMsg.alici_id === activeChatTeacher.user_id) ||
          (newMsg.gonderen_id === activeChatTeacher.user_id && newMsg.alici_id === user.id)
        ) {
          // 🎯 Çift mesaj eklenmesini engelle
          setChatMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id || (m.icerik === newMsg.icerik && m.gonderen_id === newMsg.gonderen_id));
            return exists ? prev : [...prev, newMsg];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatTeacher, user]);

  // 🎯 GÜNCELLENDİ: Mesajın Anında Ekrana Basılması (Kaybolma sorunu çözüldü)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatTeacher || !user) return;

    const mesajIcerigi = newMessage;
    
    // 1. Önce ekrana anında yazdırıyoruz
    const anlikMesajTaslagi = {
      gonderen_id: user.id,
      alici_id: activeChatTeacher.user_id,
      icerik: mesajIcerigi,
      olusturulma_tarihi: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, anlikMesajTaslagi]);
    setNewMessage(''); // Inputu temizle

    // 2. Arka planda Supabase'e gönderiyoruz
    try {
      const { error } = await supabase
        .from('mesajlar')
        .insert([{
          gonderen_id: user.id,
          alici_id: activeChatTeacher.user_id,
          icerik: mesajIcerigi,
          okundu: false
        }]);

      if (error) throw error;
    } catch (err: any) {
      alert("Mesaj gönderilemedi: " + err.message);
      // Hata olursa mesajı ekrandan sil ve inputa geri koy
      setChatMessages(prev => prev.filter(m => m !== anlikMesajTaslagi));
      setNewMessage(mesajIcerigi);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('ogrenciler')
        .update({ tam_ad: settingsForm.tamAd })
        .eq('user_id', user.id);

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

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#4f46e5', fontSize: '1.2rem', fontWeight: 600 }}>TLA yüklüyor...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* SOL MENÜ (SIDEBAR) */}
      <aside style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '30px 20px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ marginBottom: '40px', paddingLeft: '10px' }}>
          <h2 onClick={() => router.push('/')} style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e1b4b', letterSpacing: '-0.5px', margin: 0, cursor: 'pointer' }}>
            Turkish Learning Academy<span style={{ color: '#4f46e5' }}>.</span>
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button onClick={() => setActiveTab('dashboard')} style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: activeTab === 'dashboard' ? '#eef2ff' : 'transparent', color: activeTab === 'dashboard' ? '#4f46e5' : '#64748b', fontWeight: 700, border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
            📊 Ana Görünüm
          </button>
          <button onClick={() => setActiveTab('teachers')} style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: activeTab === 'teachers' ? '#eef2ff' : 'transparent', color: activeTab === 'teachers' ? '#4f46e5' : '#64748b', fontWeight: 700, border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
            👨‍🏫 Eğitmenleri Keşfet
          </button>
          <button onClick={() => setActiveTab('messages')} style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: activeTab === 'messages' ? '#eef2ff' : 'transparent', color: activeTab === 'messages' ? '#4f46e5' : '#64748b', fontWeight: 700, border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
            ✉️ Mesajlar Merkezi
          </button>
          <button onClick={() => setActiveTab('settings')} style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: activeTab === 'settings' ? '#eef2ff' : 'transparent', color: activeTab === 'settings' ? '#4f46e5' : '#64748b', fontWeight: 700, border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
            ⚙️ Profil Ayarları
          </button>
        </nav>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: 'none', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            🚪 Çıkış Yap
          </button>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Üst Profil Barı */}
        <header style={{ padding: '24px 60px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              {activeTab === 'dashboard' && `Tekrar hoş geldin, ${userName} 👋`}
              {activeTab === 'teachers' && 'Eğitmen Havuzu'}
              {activeTab === 'messages' && 'Mesajlaşma Merkezi'}
              {activeTab === 'settings' && 'Hesap Ayarları'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{userName}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Öğrenci Paneli</div>
            </div>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#4f46e5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* DİNAMİK İÇERİK DEĞİŞİM ALANI */}
        <div style={{ flex: 1, padding: activeTab === 'messages' ? '0' : '40px 60px', overflowY: 'auto' }}>
          
          {/* SEKME 1: ANA GÖRÜNÜM (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <>
              {/* İstatistik Kartları */}
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

              {/* Yaklaşan Ders Paneli */}
              <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.01)' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '1.3rem', fontWeight: 800 }}>Yaklaşan Canlı Dersleriniz</h3>
                {upcomingLessons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>Planlanmış bir canlı dersiniz bulunmuyor.</p>
                    <button onClick={() => setActiveTab('teachers')} style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Eğitmen Keşfet</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {upcomingLessons.map((ders, idx) => (
                      <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <img src={ders.egitmenler?.avatar_url || 'https://via.placeholder.com/80'} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>{ders.egitmenler?.tam_ad}</h4>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{ders.egitmenler?.ders_turu} • Birebir Görüşme</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#4f46e5', fontWeight: 800, marginBottom: '6px' }}>{new Date(ders.tarih_saat).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                          <button style={{ padding: '8px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Sınıfa Giriş Yap</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* SEKME 2: EĞİTMENLERİ KEŞFET */}
          {activeTab === 'teachers' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {allTeachers.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => router.push(`/teachers/${t.user_id || t.id}`)}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img src={t.avatar_url || 'https://via.placeholder.com/80'} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{t.tam_ad}</h4>
                      <p style={{ margin: '4px 0 0 0', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 600 }}>{t.ders_turu}</p>
                    </div>
                  </div>
                  <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, height: '3em', overflow: 'hidden' }}>{t.biyografi || 'Deneyimli öğretmen ile Türkçe pratik yapın.'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t.saatlik_ucret} ₺ <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>/ ders</span></span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveChatTeacher(t); setActiveTab('messages'); }}
                      style={{ padding: '8px 16px', backgroundColor: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', zIndex: 2 }}
                    >
                      Mesaj Gönder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SEKME 3: CANLI MESAJLAŞMA MERKEZİ */}
          {activeTab === 'messages' && (
            <div style={{ display: 'flex', height: '100%', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              
              {/* Sol Sohbet Listesi */}
              <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', backgroundColor: '#fff' }}>
                {chatList.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Henüz aktif bir sohbetiniz bulunmuyor.</div>
                ) : (
                  chatList.map((teacher, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveChatTeacher(teacher)}
                      style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', backgroundColor: activeChatTeacher?.user_id === teacher.user_id ? '#f8fafc' : 'transparent', transition: 'background 0.2s' }}
                    >
                      <img src={teacher.avatar_url || 'https://via.placeholder.com/80'} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{teacher.tam_ad}</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>Eğitmen</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sağ Sohbet Penceresi */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
                {activeChatTeacher ? (
                  <>
                    {/* Chat Başlığı */}
                    <div style={{ padding: '20px 30px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img src={activeChatTeacher.avatar_url || 'https://via.placeholder.com/80'} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{activeChatTeacher.tam_ad}</div>
                        <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>• Çevrimiçi</div>
                      </div>
                    </div>

                    {/* Mesaj Akışı */}
                    <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {chatMessages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Sohbeti başlatmak için ilk mesajınızı gönderin.</div>
                      )}
                      {chatMessages.map((msg, index) => {
                        const isMe = msg.gonderen_id === user.id;
                        return (
                          <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '60%', backgroundColor: isMe ? '#4f46e5' : '#ffffff', color: isMe ? '#ffffff' : '#0f172a', padding: '14px 20px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: isMe ? 'none' : '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{msg.icerik}</div>
                            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '6px', color: isMe ? '#c7d2fe' : '#94a3b8' }}>
                              {new Date(msg.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mesaj Yazma Paneli */}
                    <form onSubmit={handleSendMessage} style={{ padding: '20px 30px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                      <input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajınızı buraya yazın..." 
                        style={{ flex: 1, padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none' }}
                      />
                      <button type="submit" style={{ padding: '16px 32px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Gönder</button>
                    </form>
                  </>
                ) : (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>Sohbete başlamak için soldan bir eğitmen seçin.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEKME 4: PROFİL AYARLARI */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.3rem', fontWeight: 800 }}>Kişisel Bilgiler</h3>
              <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>Ad Soyad</label>
                  <input value={settingsForm.tamAd} onChange={e => setSettingsForm({...settingsForm, tamAd: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>Telefon Numarası</label>
                  <input value={settingsForm.telefon} onChange={e => setSettingsForm({...settingsForm, telefon: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} placeholder="+90" />
                </div>
                <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}>Ayarları Kaydet</button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}