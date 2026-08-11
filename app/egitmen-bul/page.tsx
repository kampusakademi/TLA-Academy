'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// 🚀 SİTEDE DAHA ÖNCE HİÇ KULLANILMAMIŞ, YEPYENİ EĞİTİM GÖRSELLERİ
const STEP_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop', // Hedef planlama / Analiz
  2: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=1200&auto=format&fit=crop', // Zaman yönetimi / Süre
  3: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop', // Odaklanma / Kütüphanede ders
  4: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop', // Seviye / Not defterine yazan öğrenci
  5: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop'  // Eşleşme / Başarı ve kutlama yapan kişiler
};

export default function FindTeacherWizard() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [answers, setAnswers] = useState({
    amac: '',
    sure: '',
    odak: '',
    seviye: ''
  });

  const GOALS = ['Kariyer ve İş', 'Sınav Hazırlığı', 'Çocuklar İçin Türkçe', 'Kültür ve Seyahat', 'Günlük Pratik', 'Akademik Türkçe'];
  const DURATIONS = ['1-4 Hafta', '1-3 Ay', '3-6 Ay', 'Uzun Dönem', 'Tek Seferlik Hızlı Pratik'];
  const FOCUS_AREAS = ['Gramer', 'Konuşma ve Telaffuz', 'Yazma ve Okuma', 'İş Türkçesi', 'TÖMER Hazırlık', 'Yeni Başlayanlar (A1-A2)'];
  const LEVELS = ['Hiç Bilmeyenler (A0)', 'Başlangıç (A1-A2)', 'Orta (B1-B2)', 'İleri (C1-C2)', 'Ana Dili Seviyesinde'];

  const handleSelect = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value });
  };

  const nextStep = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setStep(5);
      await fetchMatchingTeachers();
    }
  };

  const fetchMatchingTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('egitmenler').select('*');
      if (error) throw error;
      
      const allTeachers = data || [];

      const scoredTeachers = allTeachers.map(teacher => {
        let score = 0;
        if (teacher.amac && teacher.amac.toLowerCase().includes(answers.amac.toLowerCase())) score += 10;
        if (teacher.sure && teacher.sure.toLowerCase().includes(answers.sure.toLowerCase())) score += 10;
        if (teacher.odak && teacher.odak.toLowerCase().includes(answers.odak.toLowerCase())) score += 10;
        if (teacher.seviye && teacher.seviye.toLowerCase().includes(answers.seviye.toLowerCase())) score += 10;
        if (teacher.ders_turu && teacher.ders_turu.toLowerCase().includes(answers.odak.toLowerCase())) score += 5;
        
        return { ...teacher, matchScore: score };
      });

      const matchedTeachers = scoredTeachers.filter(teacher => teacher.matchScore > 0);
      matchedTeachers.sort((a, b) => b.matchScore - a.matchScore);
      setTeachers(matchedTeachers.slice(0, 10)); 

    } catch (err: any) {
      console.error(err);
      alert("Eğitmenler getirilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1 && !answers.amac) return false;
    if (step === 2 && !answers.sure) return false;
    if (step === 3 && !answers.odak) return false;
    if (step === 4 && !answers.seviye) return false;
    return true;
  };

  // 🎯 EKRAN GÖRÜNTÜSÜNDEKİ BİREBİR RADYO BUTON TASARIMI
  const OptionCard = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      style={{
        width: '100%', padding: '16px 20px', borderRadius: '10px', fontSize: '1rem', fontWeight: 500,
        textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
        border: selected ? '2px solid #0f172a' : '1px solid #cbd5e1',
        color: '#0f172a',
      }}
    >
      {label}
      <div style={{ 
        width: '20px', height: '20px', borderRadius: '50%', 
        border: selected ? '6px solid #0f172a' : '1px solid #cbd5e1', 
        background: '#ffffff',
        transition: 'all 0.2s ease' 
      }}></div>
    </button>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff', fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        /* Tam olarak görseldeki gibi 50/50 bölünmüş ekran tasarımı */
        .left-panel { flex: 1; display: none; position: relative; overflow: hidden; background: #f8fafc; }
        @media(min-width: 900px) { .left-panel { display: block; } }
        
        .right-panel { flex: 1; display: flex; flex-direction: column; position: relative; }
        
        /* Form yukarı yaslandı */
        .content-wrapper { 
          max-width: 480px; 
          width: 100%; 
          margin: 0 auto; 
          padding: 100px 24px 40px 24px; 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          justify-content: flex-start; 
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes imageFade { from { opacity: 0.8; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* 🚀 SOL BÖLÜM: BÜYÜK BOY EKRANI KAPLAYAN GÖRSEL */}
      <div className="left-panel">
        <img 
          key={step} 
          src={STEP_IMAGES[step]} 
          alt={`Step ${step} background`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'imageFade 0.6s ease-out' }} 
        />
      </div>

      {/* 🚀 SAĞ BÖLÜM: FORM VE İÇERİK */}
      <div className="right-panel">
        
        {/* ÜST BAR: Geri Butonu */}
        <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
          <button 
            onClick={() => step > 1 && step < 5 ? setStep(step - 1) : router.push('/')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
        </div>

        {/* ANKET İÇERİĞİ */}
        <div className="content-wrapper">
          
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Türkçe öğrenmedeki temel amacın nedir?</h1>
              <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.95rem' }}>Bu bilgi, sana uygun öğretmenleri seçmemize yardımcı olur.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {GOALS.map(goal => (
                  <OptionCard key={goal} label={goal} selected={answers.amac === goal} onClick={() => handleSelect('amac', goal)} />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Ne kadar sürede öğrenmek istiyorsun?</h1>
              <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.95rem' }}>Ders planlamasını bu zaman dilimine göre organize edeceğiz.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {DURATIONS.map(dur => (
                  <OptionCard key={dur} label={dur} selected={answers.sure === dur} onClick={() => handleSelect('sure', dur)} />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Odaklanmak istediğin özel bir alan var mı?</h1>
              <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.95rem' }}>Eğitmeninin uzmanlığını tam olarak aradığın alana göre belirleyeceğiz.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {FOCUS_AREAS.map(focus => (
                  <OptionCard key={focus} label={focus} selected={answers.odak === focus} onClick={() => handleSelect('odak', focus)} />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Mevcut dil seviyen nedir?</h1>
              <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.95rem' }}>Dersin seviyesini başlangıç noktana en uygun şekilde ayarlayacağız.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {LEVELS.map(level => (
                  <OptionCard key={level} label={level} selected={answers.seviye === level} onClick={() => handleSelect('seviye', level)} />
                ))}
              </div>
            </div>
          )}

          {/* İLERİ BUTONU */}
          {step < 5 && (
            <div style={{ marginTop: '32px', animation: 'fadeIn 0.5s ease' }}>
              <button 
                onClick={nextStep} 
                disabled={!canProceed()}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: 700, border: 'none', cursor: canProceed() ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                  background: canProceed() ? '#4f46e5' : '#cbd5e1', color: '#fff',
                }}
              >
                Devam et
              </button>
            </div>
          )}

          {/* 5. ADIM: SONUÇLAR EKRANI */}
          {step === 5 && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#0f172a', fontWeight: 700 }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1s infinite' }}>✨</div>
                  <p style={{ fontSize: '1.2rem' }}>Kriterlerin analiz ediliyor...</p>
                  <p style={{ color: '#64748b', fontWeight: 500 }}>En uygun eğitmenler listeleniyor.</p>
                </div>
              ) : (
                <>
                  {teachers.length > 0 ? (
                    <div>
                      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Senin İçin En Uygun Eğitmenler</h2>
                      <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.95rem' }}>Verdiğin cevaplara göre en yüksek uyum puanına sahip {teachers.length} eğitmeni sıraladık.</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
                        {teachers.map((t) => (
                          <div key={t.id} style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', transition: 'all 0.2s' }}
                               onMouseEnter={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
                               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                              <img src={t.avatar_url || 'https://via.placeholder.com/80'} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{t.tam_ad}</h3>
                                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px', fontWeight: 500 }}>
                                  {t.odak ? t.odak.split(',')[0] : 'Uzman Eğitmen'}
                                </div>
                                <div style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 700, marginTop: '4px' }}>
                                  Uyum: %{Math.min(t.matchScore * 2.5, 100).toFixed(0)}
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem', marginBottom: '8px' }}>{t.saatlik_ucret}₺</div>
                              <button onClick={() => router.push(`/teachers/${t.user_id || t.id}`)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              >
                                Profili Gör
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Eşleşme Bulunamadı</h2>
                      <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '24px' }}>Bu spesifik kriterlere uygun aktif eğitmen bulunmuyor.</p>
                      <button onClick={() => setStep(1)} style={{ padding: '14px 28px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>Baştan Başla</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}