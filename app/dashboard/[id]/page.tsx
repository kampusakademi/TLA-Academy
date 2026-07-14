'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const newTeacherParam = searchParams ? searchParams.get('newTeacher') : null;
  const newTimeParam = searchParams ? searchParams.get('newTime') : null;

  const [activeTab, setActiveTab] = useState<string>('home');

  // CANLI DERS PLANLARI LİSTESİ
  const [myLessons, setMyLessons] = useState([
    { id: 'les-1', teacherName: 'Esra Nur Tüzmen', subject: 'A1 Türkçe Konuşma Pratiği', time: '14:00 - 15:00', status: 'tamamlandi' },
    { id: 'les-2', teacherName: 'Ahmet Demir', subject: 'Genel Türkçe Pratiği', time: '18:00 - 19:00', status: 'hazir' },
  ]);

  // AI CHAT DURUMLARI (STATE)
  const [aiMessages, setAiMessages] = useState([
    { id: 1, sender: 'ai', text: "Merhaba John! Ben senin AI Pratik Arkadaşınım. Bugün benimle Türkçe pratik yapmaya hazır mısın? 🌟", time: 'Şimdi' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Profil sayfasından satın alınıp gelindiğinde dersi yakalama mekanizması
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    if (newTeacherParam && newTimeParam) {
      const decodedTeacher = decodeURIComponent(newTeacherParam);
      const decodedTime = decodeURIComponent(newTimeParam);

      // Mükerrer eklemeyi engelleme kontrolü
      const isAlreadyAdded = myLessons.some(les => les.time === decodedTime && les.teacherName === decodedTeacher);
      
      if (!isAlreadyAdded) {
        const purchasedLesson = {
          id: `les-${Date.now()}`,
          teacherName: decodedTeacher,
          subject: 'Profil Sayfasından Satın Alınan Canlı Ders ⚡',
          time: decodedTime,
          status: 'hazir'
        };
        setMyLessons(prev => [purchasedLesson, ...prev]);
        // URL'i temizleyerek sayfa yenilendiğinde tekrar eklenmesini önleriz
        router.replace('/dashboard?tab=my-lessons');
      }
    }
  }, [tabParam, newTeacherParam, newTimeParam]);

  // GÜVENLİ VE FİLTRELENMİŞ API TABANLI GEMINI ENTEGRASYONU
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput;
    const updatedMessages = [...aiMessages, { id: Date.now(), sender: 'student', text: userText, time: 'Şimdi' }];
    setAiMessages(updatedMessages);
    setAiInput('');
    setIsAiTyping(true);

    try {
      // Gemini'ın ilk mesaj kuralı (First content should be with role 'user') ihlalini önlemek için hoş geldiniz mesajını eliyoruz
      const filteredMessages = updatedMessages.filter(msg => msg.id !== 1);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updatedMessages: filteredMessages, userText }),
      });

      const data = await response.json();

      if (response.ok && data.text) {
        setAiMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: data.text, time: 'Şimdi' }]);
      } else {
        throw new Error(data.error || "Sunucu yanıt vermedi.");
      }
    } catch (error) {
      console.error("Gemini İstek Hatası:", error);
      setAiMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "Ufak bir bağlantı sorunu yaşadım John, lütfen tekrar yazar mısın? 🌟", time: 'Şimdi' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Aktif eğitmen kadrosu verisi
  const [teachers] = useState([
    { id: 'esra', name: 'Esra Nur Tüzmen', title: 'Profesyonel Dil Koçu & Akademisyen', price: '350', avatar: '👩‍🏫' },
    { id: 'ahmet', name: 'Ahmet Demir', title: 'İş Türkçesi Uzmanı & Eski TRT Spikeri', price: '400', avatar: '👨‍🏫' },
    { id: 'zeynep', name: 'Zeynep Kaya', title: 'Çocuklar İçin Türkçe & Drama Eğitmeni', price: '380', avatar: '👩‍⚕️' },
    { id: 'can', name: 'Can Özkan', title: 'YDS / TÖMER Sınav Hazırlık Koçu', price: '420', avatar: '👨‍💻' }
  ]);

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#0f172a', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
      
      {/* SOL YAN MENÜ */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: '#ffffff', padding: '30px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'fixed', height: '100vh', boxSizing: 'border-box', zIndex: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <div style={{ backgroundColor: '#4f46e5', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>T</div>
            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>Turkish Academy</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div 
              onClick={() => { setActiveTab('home'); router.push('/dashboard?tab=home'); }}
              style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'home' ? '#1e293b' : 'transparent', color: activeTab === 'home' ? '#ffffff' : '#94a3b8', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              🏠 Ana Sayfa
            </div>

            <div 
              onClick={() => { setActiveTab('my-lessons'); router.push('/dashboard?tab=my-lessons'); }}
              style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'my-lessons' ? '#1e293b' : 'transparent', color: activeTab === 'my-lessons' ? '#ffffff' : '#94a3b8', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              📅 Canlı Ders Planları ({myLessons.length})
            </div>
            
            <div 
              onClick={() => { setActiveTab('teachers'); router.push('/dashboard?tab=teachers'); }}
              style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'teachers' ? '#1e293b' : 'transparent', color: activeTab === 'teachers' ? '#ffffff' : '#94a3b8', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              👩‍🏫 Eğitmenler (Profil İncele)
            </div>

            {/* YENİ EKLENEN MESSAGES SEKME BUTONU */}
            <div 
              onClick={() => { setActiveTab('messages'); router.push('/dashboard?tab=messages'); }}
              style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'messages' ? '#1e293b' : 'transparent', color: activeTab === 'messages' ? '#ffffff' : '#94a3b8', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              💬 AI Pratik Arkadaşı
            </div>
          </nav>
        </div>
      </aside>

      {/* SAĞ ANA İÇERİK ALANI */}
      <div style={{ flex: 1, marginLeft: '280px', padding: '40px 50px', boxSizing: 'border-box' }}>
        
        {/* SEKME 1: ANA SAYFA */}
        {activeTab === 'home' && (
          <div style={{ maxWidth: '750px' }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900' }}>Öğrenci Paneline Hoş Geldiniz 👋</h1>
            <p style={{ color: '#64748b', marginTop: '6px' }}>Sol menüden Eğitmenler sayfasına giderek dilediğiniz hocanın profilinden canlı ders satın alabilirsiniz.</p>
          </div>
        )}

        {/* SEKME 2: CANLI DERS PLANLAMA EKRANI */}
        {activeTab === 'my-lessons' && (
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '850', marginBottom: '20px' }}>📅 Rezervasyon Yapılan Canlı Ders Planları</h1>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myLessons.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>Henüz planlanmış bir canlı dersiniz yok.</p>
                ) : (
                  myLessons.map((les) => (
                    <div key={les.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', border: '1px solid #f1f5f9', borderRadius: '16px', backgroundColor: '#f8fafc' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>{les.teacherName}</strong>
                        <span style={{ fontSize: '0.88rem', color: '#64748b', display: 'block', marginTop: '4px' }}>{les.subject}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px' }}>⏰ {les.time}</span>
                        <span style={{ fontSize: '0.85rem', color: les.status === 'hazir' ? '#1e40af' : '#10b981', fontWeight: '700', backgroundColor: les.status === 'hazir' ? '#dbeafe' : '#d1fae5', padding: '6px 12px', borderRadius: '8px' }}>
                          {les.status === 'hazir' ? '⏳ Derse Katılmaya Hazır' : '✓ Tamamlandı'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEKME 3: EĞİTMENLER SEKMESİ */}
        {activeTab === 'teachers' && (
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '850', marginBottom: '20px' }}>👩‍🏫 Aktif Eğitmen Kadromuz</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {teachers.map(t => (
                <div key={t.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ fontSize: '2.5rem' }}>{t.avatar}</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t.name}</h3>
                      <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{t.title}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push(`/teachers/${t.id}`)} 
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Profili İncele →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YENİ EKLENEN SEKME 4: AI PRATİK ARKADAŞI (MESSAGES) CHAT INTERFACE */}
        {activeTab === 'messages' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '850', marginBottom: '6px' }}>💬 AI Pratik Arkadaşı</h1>
            <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '0.95rem' }}>B1 seviyesinde Türkçe konuşma pratiği yapın. Hatalarınızı otomatik düzeltir!</p>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', display: 'flex', flexDirection: 'column', height: '60vh', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              
              {/* MESAJ AKIŞ ALANI */}
              <div style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fafafa' }}>
                {aiMessages.map((msg) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isAi ? 'flex-start' : 'flex-end' }}>
                      <div style={{ maxWidth: '75%', backgroundColor: isAi ? '#ffffff' : '#4f46e5', color: isAi ? '#0f172a' : '#ffffff', padding: '14px 18px', borderRadius: '18px', border: isAi ? '1px solid #e2e8f0' : 'none', boxShadow: isAi ? '0 1px 3px rgba(0,0,0,0.02)' : 'none', whiteSpace: 'pre-line', fontSize: '0.98rem', lineHeight: '1.5' }}>
                        {msg.text}
                        <span style={{ display: 'block', fontSize: '0.75rem', color: isAi ? '#94a3b8' : '#c7d2fe', marginTop: '6px', textAlign: 'right' }}>{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
                {isAiTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ backgroundColor: '#ffffff', color: '#64748b', padding: '12px 18px', borderRadius: '18px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      Pratik arkadaşın yazıyor... ⏳
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT FORM ALANI */}
              <form onSubmit={handleSendAiMessage} style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: '#ffffff' }}>
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Türkçe bir şeyler yazın... (Örn: Bugün hava çok güzel)"
                  disabled={isAiTyping}
                  style={{ flex: 1, border: '1px solid #cbd5e1', padding: '14px 18px', borderRadius: '14px', fontSize: '1rem', outline: 'none', transition: 'border 0.2s' }}
                />
                <button 
                  type="submit" 
                  disabled={isAiTyping || !aiInput.trim()}
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '0 24px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', opacity: (!aiInput.trim() || isAiTyping) ? 0.6 : 1 }}
                >
                  Gönder 🚀
                </button>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
}