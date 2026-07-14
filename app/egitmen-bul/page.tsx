'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function FindTeacherWizard() {
  const router = useRouter();
  
  // Anket Adımları ve State'ler
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Kullanıcının Seçimleri
  const [answers, setAnswers] = useState({
    amac: '',
    sure: '',
    odak: '',
    seviye: ''
  });

  // 🎯 ÖĞRETMEN BAŞVURU SAYFASIYLA BİREBİR EŞLEŞTİRİLEN SEÇENEKLER (Kilit ve Anahtar uyumu)
  const GOALS = ['Kariyer ve İş', 'Sınav Hazırlığı', 'Çocuklar İçin Türkçe', 'Kültür ve Seyahat', 'Günlük Pratik', 'Akademik Türkçe'];
  const DURATIONS = ['1-4 Hafta', '1-3 Ay', '3-6 Ay', 'Uzun Dönem', 'Tek Seferlik Hızlı Pratik'];
  const FOCUS_AREAS = ['Gramer', 'Konuşma ve Telaffuz', 'Yazma ve Okuma', 'İş Türkçesi', 'TÖMER Hazırlık', 'Yeni Başlayanlar (A1-A2)'];
  const LEVELS = ['Hiç Bilmeyenler (A0)', 'Başlangıç (A1-A2)', 'Orta (B1-B2)', 'İleri (C1-C2)', 'Ana Dili Seviyesinde'];

  // Seçim Yapma Fonksiyonu
  const handleSelect = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value });
  };

  // Sonraki Adıma Geçiş (Son adımsa hocaları getir)
  const nextStep = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setStep(5); // Sonuçlar ekranı
      await fetchMatchingTeachers();
    }
  };

  // 🎯 GÜNCELLENDİ: Gerçek Eşleştirme Motoru
  const fetchMatchingTeachers = async () => {
    setLoading(true);
    try {
      // Sadece profilini doldurmuş tüm eğitmenleri temel al
      let query = supabase.from('egitmenler').select('*');

      // Eğer kullanıcı bir amaç seçtiyse, "amac" sütununda bu kelimeyi İÇERENLERİ filtrele (.ilike kullanımı)
      if (answers.amac) query = query.ilike('amac', `%${answers.amac}%`);
      if (answers.sure) query = query.ilike('sure', `%${answers.sure}%`);
      if (answers.odak) query = query.ilike('odak', `%${answers.odak}%`);
      if (answers.seviye) query = query.ilike('seviye', `%${answers.seviye}%`);

      // En iyi eşleşen maksimum 10 eğitmeni getir
      const { data, error } = await query.limit(10);
        
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      console.error(err);
      alert("Eğitmenler getirilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Seçim yapılmadan İleri butonunu devre dışı bırakma kontrolü
  const canProceed = () => {
    if (step === 1 && !answers.amac) return false;
    if (step === 2 && !answers.sure) return false;
    if (step === 3 && !answers.odak) return false;
    if (step === 4 && !answers.seviye) return false;
    return true;
  };

  /* ---------------- UI KART BİLEŞENİ ---------------- */
  const OptionCard = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      style={{
        width: '100%', padding: '20px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 600,
        textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: selected ? '#eef2ff' : '#ffffff',
        border: selected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
        color: selected ? '#4f46e5' : '#334155',
        boxShadow: selected ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none'
      }}
    >
      {label}
      {selected && <span style={{ width: '24px', height: '24px', background: '#4f46e5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✓</span>}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", sans-serif' }}>
      
      {/* ÜST BAR VE İLERLEME ÇUBUĞU */}
      <div style={{ background: '#fff', padding: '20px 5%', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={() => step > 1 && step < 5 ? setStep(step - 1) : router.push('/')} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>←</button>
        <div style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#4f46e5', width: `${(step / 5) * 100}%`, transition: 'width 0.3s ease' }}></div>
        </div>
        <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.9rem' }}>Adım {step} / 4</div>
      </div>

      {/* ANKET İÇERİĞİ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', textAlign: 'center' }}>Türkçe öğrenmedeki temel amacın nedir?</h1>
              <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '30px' }}>Sana en uygun eğitmeni bulmamız için bu bilgiye ihtiyacımız var.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {GOALS.map(goal => (
                  <OptionCard key={goal} label={goal} selected={answers.amac === goal} onClick={() => handleSelect('amac', goal)} />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', textAlign: 'center' }}>Ne kadar sürede öğrenmek istiyorsun?</h1>
              <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '30px' }}>Planlamanı eğitmeninle buna göre yapacağız.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {DURATIONS.map(dur => (
                  <OptionCard key={dur} label={dur} selected={answers.sure === dur} onClick={() => handleSelect('sure', dur)} />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', textAlign: 'center' }}>Odaklanmak istediğin özel bir alan var mı?</h1>
              <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '30px' }}>Eğitmeninin uzmanlık alanını belirleyelim.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {FOCUS_AREAS.map(focus => (
                  <OptionCard key={focus} label={focus} selected={answers.odak === focus} onClick={() => handleSelect('odak', focus)} />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', textAlign: 'center' }}>Mevcut dil seviyen nedir?</h1>
              <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '30px' }}>Eğitmenin dersi anlatırken kullanacağı yaklaşımı ayarlamak için soruyoruz.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {LEVELS.map(level => (
                  <OptionCard key={level} label={level} selected={answers.seviye === level} onClick={() => handleSelect('seviye', level)} />
                ))}
              </div>
            </div>
          )}

          {/* İLERİ BUTONU (1,2,3,4. adımlar için) */}
          {step < 5 && (
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.5s' }}>
              <button 
                onClick={nextStep} 
                disabled={!canProceed()}
                style={{ 
                  padding: '16px 40px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, border: 'none', cursor: canProceed() ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                  background: canProceed() ? '#4f46e5' : '#cbd5e1', color: '#fff',
                  boxShadow: canProceed() ? '0 10px 15px -3px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* 5. ADIM: SONUÇLAR (EŞLEŞEN EĞİTMENLER) */}
          {step === 5 && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
              {loading ? (
                <div style={{ padding: '60px', color: '#4f46e5', fontSize: '1.2rem', fontWeight: 700 }}>
                  <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'pulse 1s infinite' }}>✨</div>
                  Harika! Kriterlerine en uygun eğitmenler veritabanında aranıyor...
                </div>
              ) : (
                <>
                  {teachers.length > 0 ? (
                    <>
                      <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px 24px', borderRadius: '30px', display: 'inline-block', fontWeight: 700, marginBottom: '20px' }}>
                        ✅ Senin İçin {teachers.length} Harika Eğitmen Bulduk!
                      </div>
                      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Öğrenme Yolculuğun Başlıyor</h1>
                      <p style={{ color: '#64748b', marginBottom: '40px' }}>Seçtiğin <strong style={{color:'#4f46e5'}}>{answers.amac}</strong> ve <strong style={{color:'#4f46e5'}}>{answers.seviye}</strong> kriterleriyle eşleşen eğitmenler listelendi.</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', textAlign: 'left' }}>
                        {teachers.map((t) => (
                          <div key={t.id} style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                              <img src={t.avatar_url || 'https://via.placeholder.com/80'} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{t.tam_ad}</h3>
                                <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                                  ⭐ {t.odak ? t.odak.split(',')[0] : 'Uzman Eğitmen'} {/* Sadece ilk odak alanını göster */}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem' }}>{t.saatlik_ucret}₺</div>
                              <button onClick={() => router.push(`/teachers/${t.user_id || t.id}`)} style={{ padding: '8px 16px', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Profili İncele</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '60px 20px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '50px', marginBottom: '20px' }}>🕵️‍♂️</div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Tam Eşleşme Bulunamadı</h2>
                      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '30px' }}>Şu an için seçtiğin 4 kriterin <strong>tamamına</strong> aynı anda uyan bir eğitmenimiz aktif değil. Lütfen kriterlerinden bazılarını esneterek tekrar dene.</p>
                      <button onClick={() => setStep(1)} style={{ padding: '16px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Baştan Başla</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}