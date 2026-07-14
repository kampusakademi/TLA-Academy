'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Ortak Veri Seti
export const TEACHERS_DATA = [
  { 
    id: 'esra',
    name: 'Esra Nur Tüzmen', 
    title: 'Profesyonel Dil Koçu & Akademisyen', 
    avatar: '👩‍🏫', 
    bio: 'Yabancılara Türkçe öğretimi konusunda 6 yıl deneyim. Canlı pratik ve günlük konuşma odaklı dersler.',
    price: 350
  },
  { 
    id: 'ahmet',
    name: 'Ahmet Demir', 
    title: 'İş Türkçesi Uzmanı & Eski TRT Spikeri', 
    avatar: '👨‍🏫', 
    bio: 'Diksiyon, hitabet ve kurumsal Türkçe eğitimi. İleri düzey öğrenciler için profesyonel kariyer koçluğu.', 
    price: 400
  }
];

// 1. DEĞİŞİKLİK BURADA: Adını DashboardContent yaptık ve export default'u sildik
function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'teachers' | 'schedule' | 'messages' | 'ai_chat'>('home');
  const [selectedTeacherChat, setSelectedTeacherChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  // AI CHAT STATE'LERİ
  const [aiMessages, setAiMessages] = useState([
    { id: 1, sender: 'ai', text: 'Merhaba John! Ben senin yapay zeka destekli Türkçe pratik arkadaşınım. Bugünü nasıl geçirdin? Benimle her konuda konuşabilirsin, hatalarını düzeltmek için buradayım! 🤖✨', time: 'Şimdi' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Ders Programı State'i
  const [mySchedule, setMySchedule] = useState([
    { id: 1, teacherName: 'Esra Nur Tüzmen', avatar: '👩‍🏫', date: 'Bugün', time: '18:00 - 19:00', status: 'Yaklaşıyor', statusColor: '#eab308', bgColor: '#fef9c3' },
    { id: 2, teacherName: 'Ahmet Demir', avatar: '👨‍🏫', date: 'Yarın', time: '11:00 - 12:00', status: 'Onaylandı', statusColor: '#2563eb', bgColor: '#dbeafe' },
  ]);

  const [chats, setChats] = useState<{ [key: string]: Array<{ id: number, sender: string, text: string, time: string }> }>({
    'Esra Nur Tüzmen': [{ id: 1, sender: 'Esra Nur Tüzmen', text: 'John, bugünkü ödevini harika tamamlamışsın! 👋', time: '14:20' }],
    'Ahmet Demir': [{ id: 1, sender: 'Ahmet Demir', text: 'Merhaba John, yarınki İş Türkçesi dersi için hazır mısın?', time: 'Dün' }]
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams ? searchParams.get('tab') : null;
    const teacherName = searchParams ? searchParams.get('teacher') : null;
    const lessonTime = searchParams ? searchParams.get('time') : null;

    if (teacherName && lessonTime) {
      const isAlreadyAdded = mySchedule.some(item => item.teacherName === teacherName && item.time === lessonTime);
      if (!isAlreadyAdded) {
        const newLesson = {
          id: Date.now(),
          teacherName: decodeURIComponent(teacherName),
          avatar: teacherName.includes('Esra') ? '👩‍🏫' : '👨‍🏫',
          date: 'Yeni Rezervasyon',
          time: decodeURIComponent(lessonTime),
          status: 'Onaylandı ⚡',
          statusColor: '#2563eb',
          bgColor: '#dbeafe'
        };
        setMySchedule(prev => [newLesson, ...prev]);
        setActiveTab('schedule');
        return;
      }
    }

    if (['home', 'teachers', 'schedule', 'messages', 'ai_chat'].includes(tabParam || '')) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeacherChat) return;
    const currentChat = chats[selectedTeacherChat] || [];
    setChats({
      ...chats,
      [selectedTeacherChat]: [...currentChat, { id: currentChat.length + 1, sender: 'Ben', text: newMessage, time: 'Şimdi' }]
    });
    setNewMessage('');
  };

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput;
    const updatedMessages = [...aiMessages, { id: Date.now(), sender: 'student', text: userText, time: 'Şimdi' }];
    setAiMessages(updatedMessages);
    setAiInput('');
    setIsAiTyping(true);

    try {
      const filteredMessages = updatedMessages[0]?.sender === 'ai' 
        ? updatedMessages.slice(1) 
        : updatedMessages;

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

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#0f172a', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: '#ffffff', padding: '30px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'fixed', height: '100vh', boxSizing: 'border-box', zIndex: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
            <div style={{ backgroundColor: '#4f46e5', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>T</div>
            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>turkish learning akademy</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div onClick={() => setActiveTab('home')} style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'home' ? '#1e293b' : 'transparent', color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>🏠 Ana Sayfa</div>
            <div onClick={() => setActiveTab('schedule')} style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'schedule' ? '#1e293b' : 'transparent', color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>📅 Ders Programım</div>
            <div onClick={() => setActiveTab('ai_chat')} style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'ai_chat' ? '#4f46e5' : 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', boxShadow: activeTab === 'ai_chat' ? '0 4px 12px rgba(79,70,229,0.3)' : 'none' }}>🤖 AI Pratik Arkadaşı</div>
            <div onClick={() => setActiveTab('teachers')} style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'teachers' ? '#1e293b' : 'transparent', color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>🔍 Eğitmenlerim</div>
            <div onClick={() => setActiveTab('messages')} style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: activeTab === 'messages' ? '#1e293b' : 'transparent', color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>💬 Mesajlarım</div>
          </nav>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👨‍🎓</div>
            <div>
              <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700' }}>John Doe</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Öğrenci</span>
            </div>
          </div>
          <button onClick={() => window.location.href = '/'} style={{ width: '100%', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>Güvenli Çıkış 🚪</button>
        </div>
      </aside>

      {/* İÇERİK ALANI */}
      <div style={{ flex: 1, marginLeft: '280px', padding: '40px 50px', boxSizing: 'border-box' }}>
        
        {/* 1. SEKME: ANA SAYFA */}
        {activeTab === 'home' && (
          <div>
            <header style={{ marginBottom: '35px' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '850' }}>Tekrar Hoş Geldin, John! 👋</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Bugün Türkçe pratiği yapmak için harika bir gün. İlerlemeni buradan takip edebilirsin.</p>
            </header>

            {/* AI Banner Daveti */}
            <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', padding: '24px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🤖</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#6b21a8' }}>7/24 Türkçe Konuşacak Birini mi Arıyorsun?</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#7e22ce', fontSize: '0.88rem' }}>AI Pratik arkadaşın seni bekliyor. İstediğin an yazış, hatalarını anında düzeltsin!</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('ai_chat')} style={{ backgroundColor: '#a855f7', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>Sohbete Başla ⚡</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Kalan Canlı Derslerin</span>
                <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: '900', marginTop: '5px', color: '#4f46e5' }}>{mySchedule.length} Saat</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>En Yakın Ders</span>
                <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', marginTop: '10px', color: '#0f172a' }}>Bugün, 18:00</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Mevcut Seviye</span>
                <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: '900', marginTop: '5px', color: '#10b981' }}>B1</span>
              </div>
            </div>
          </div>
        )}

        {/* YENİ SEKME: AI CHATBOT ODASI */}
        {activeTab === 'ai_chat' && (
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <header style={{ marginBottom: '25px' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '850' }}>🤖 AI Türkçe Pratik Odası</h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.92rem' }}>Burada yapacağın hatalar tamamen gizli! İstediğin kadar yazış, takıldığın yerde yardım iste.</p>
            </header>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '550px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              
              {/* SOHBET PENCERESİ */}
              <div style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {aiMessages.map((msg) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isAi ? 'flex-start' : 'flex-end' }}>
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '14px 20px', 
                        borderRadius: isAi ? '4px 20px 20px 20px' : '20px 4px 20px 20px',
                        backgroundColor: isAi ? '#f1f5f9' : '#4f46e5',
                        color: isAi ? '#0f172a' : '#ffffff',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        fontWeight: '500',
                        whiteSpace: 'pre-line'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                {isAiTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '12px 20px', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.88rem', fontStyle: 'italic' }}>
                      AI Pratik Arkadaşın düşünüyor... 🧠⚡
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT ALANI */}
              <form onSubmit={handleSendAiMessage} style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: '#f8fafc', borderRadius: '0 0 24px 24px' }}>
                <input 
                  type="text" 
                  value={aiInput} 
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Türkçe bir şeyler yazın..." 
                  style={{ flex: 1, padding: '15px 20px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                />
                <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '0 25px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}>
                  Gönder 🚀
                </button>
              </form>

            </div>
          </div>
        )}

        {/* DERS PROGRAMIM SEKMESİ */}
        {activeTab === 'schedule' && (
          <div>
            <header style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '850' }}>📅 Canlı Ders Programım</h1>
            </header>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '10px' }}>
              {mySchedule.map((lesson) => (
                <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontWeight: '750' }}>{lesson.avatar} {lesson.teacherName}</span>
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{lesson.date} - {lesson.time}</span>
                  <span style={{ backgroundColor: lesson.bgColor, color: lesson.statusColor, fontSize: '0.8rem', fontWeight: '700', padding: '6px 14px', borderRadius: '10px' }}>{lesson.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EĞİTMENLER SEKMESİ */}
        {activeTab === 'teachers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
            {TEACHERS_DATA.map((teacher) => (
              <div onClick={() => window.location.href = `/teachers/${teacher.id}`} key={teacher.id} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <h3>{teacher.avatar} {teacher.name}</h3>
                <p style={{ fontSize: '0.88rem', color: '#475569' }}>{teacher.bio}</p>
                <span style={{ color: '#4f46e5', fontWeight: '700' }}>Profili incele →</span>
              </div>
            ))}
          </div>
        )}

        {/* MESAJLAR SEKMESİ */}
        {activeTab === 'messages' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', minHeight: '450px' }}>
            <div style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '20px 0' }}>
              {Object.keys(chats).map(name => (
                <div key={name} onClick={() => setSelectedTeacherChat(name)} style={{ padding: '15px 20px', cursor: 'pointer', fontWeight: '700', backgroundColor: selectedTeacherChat === name ? '#ffffff' : 'transparent' }}>{name}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
              {selectedTeacherChat ? (
                <>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chats[selectedTeacherChat].map(m => <div key={m.id} style={{ margin: '10px 0' }}><strong>{m.sender}:</strong> {m.text}</div>)}
                  </div>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                    <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: '700' }}>Gönder</button>
                  </form>
                </>
              ) : <p>Sohbet seçin.</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// 2. DEĞİŞİKLİK BURADA: Bütün kodunu Suspense'in içine koyup export default ile dışarı verdik
export default function StudentDashboard() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', fontWeight: 'bold' }}>Sayfa Yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
}