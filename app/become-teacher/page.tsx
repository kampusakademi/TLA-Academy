'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function BecomeTeacher() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Başvuru Bilgileri (Şifre tamamen kaldırıldı)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    price: '',
    bio: '' 
  });

  // Çoklu Seçim State'i
  const [specialties, setSpecialties] = useState<{ [key: string]: string[] }>({
    amac: [],
    sure: [],
    odak: [],
    seviye: []
  });

  const GOALS = ['Kariyer ve İş', 'Sınav Hazırlığı', 'Çocuklar İçin Türkçe', 'Kültür ve Seyahat', 'Günlük Pratik', 'Akademik Türkçe'];
  const DURATIONS = ['1-4 Hafta', '1-3 Ay', '3-6 Ay', 'Uzun Dönem', 'Tek Seferlik Hızlı Pratik'];
  const FOCUS_AREAS = ['Gramer', 'Konuşma ve Telaffuz', 'Yazma ve Okuma', 'İş Türkçesi', 'TÖMER Hazırlık', 'Yeni Başlayanlar (A1-A2)'];
  const LEVELS = ['Hiç Bilmeyenler (A0)', 'Başlangıç (A1-A2)', 'Orta (B1-B2)', 'İleri (C1-C2)', 'Ana Dili Seviyesinde'];

  const handleToggle = (group: string, label: string) => {
    setSpecialties(prev => {
      const currentList = prev[group] || [];
      if (currentList.includes(label)) {
        return { ...prev, [group]: currentList.filter(item => item !== label) };
      } else {
        return { ...prev, [group]: [...currentList, label] };
      }
    });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🎯 DOĞRUDAN BASVURULAR TABLOSUNA EKLEME YAPIYORUZ (Auth ile işimiz yok)
      const { error } = await supabase
        .from('basvurular')
        .insert([{
          tam_ad: formData.fullName,
          email: formData.email,
          saatlik_ucret: Number(formData.price),
          biyografi: formData.bio,
          amac: specialties.amac.join(', '),
          sure: specialties.sure.join(', '),
          odak: specialties.odak.join(', '),
          seviye: specialties.seviye.join(', '),
          durum: 'bekliyor'
        }]);

      if (error) throw error;

      alert("🎉 Başvurunuz başarıyla alındı! Bilgileriniz yönetim ekibine iletildi. İnceleme sonrası giriş bilgileriniz e-posta adresinize gönderilecektir.");
      router.push('/');

    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const OptionCheckbox = ({ label, group }: { label: string, group: string }) => {
    const isSelected = specialties[group].includes(label);
    return (
      <button
        type="button"
        onClick={() => handleToggle(group, label)}
        style={{
          padding: '12px 18px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          backgroundColor: isSelected ? '#eef2ff' : '#f8fafc',
          color: isSelected ? '#4f46e5' : '#475569',
          border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
          boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}
      >
        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: isSelected ? 'none' : '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? '#4f46e5' : 'transparent' }}>
           {isSelected && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
        </div>
        {label}
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '750px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '50px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🌍</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-1px' }}>Eğitmen Ağımıza Katılın</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1.15rem', lineHeight: 1.6 }}>Uzmanlığınızı paylaşın, dünyanın dört bir yanından Türkçe öğrenmek isteyen öğrencilerle buluşun.</p>
        </div>

        <form onSubmit={handleApply}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Adınız Soyadınız</label>
                  <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} style={inputStyle} placeholder="Örn: Ayşe Yılmaz" />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>E-posta Adresiniz</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="İletişim kurulacak e-posta" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Saatlik Ders Ücretiniz (₺)</label>
                <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={inputStyle} placeholder="Örn: 250" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Kısa Biyografi (Öğrenciler Görecek)</label>
                <textarea required rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} style={{ ...inputStyle, resize: 'none' }} placeholder="Kendinizden ve eğitim geçmişinizden kısaca bahsedin..." />
              </div>
              <button type="button" onClick={() => setStep(2)} style={nextBtnStyle}>Sonraki Adım: Uzmanlık Alanları →</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', animation: 'fadeIn 0.4s' }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>1. Hedef Kitle <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>(Birden fazla seçebilirsiniz)</span></h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '15px' }}>
                  {GOALS.map(g => <OptionCheckbox key={g} label={g} group="amac" />)}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>2. Öğrenci Seviyesi <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>(Birden fazla seçebilirsiniz)</span></h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '15px' }}>
                  {LEVELS.map(l => <OptionCheckbox key={l} label={l} group="seviye" />)}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>3. Odak Alanlarınız <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>(Birden fazla seçebilirsiniz)</span></h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '15px' }}>
                  {FOCUS_AREAS.map(f => <OptionCheckbox key={f} label={f} group="odak" />)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <button type="button" onClick={() => setStep(1)} style={{ padding: '18px 30px', borderRadius: '14px', border: '1px solid #cbd5e1', background: 'transparent', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>← Geri Dön</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '18px', borderRadius: '14px', border: 'none', background: loading ? '#94a3b8' : '#4f46e5', color: 'white', fontWeight: 800, fontSize: '1.15rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)' }}>
                  {loading ? 'İşleniyor...' : 'Başvurumu Tamamla ✨'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '18px 24px', borderRadius: '16px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '1.05rem', outline: 'none', color: '#0f172a' };
const nextBtnStyle = { width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 800, fontSize: '1.15rem', cursor: 'pointer', marginTop: '10px' };