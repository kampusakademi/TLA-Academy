'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function BecomeTeacher() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Başvuru Bilgileri
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    price: '',
    bio: '' 
  });

  // Diploma ve Sertifika Dosya State'leri
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

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

  // 1. Adım Doğrulama Kontrolü
  const handleNextStep = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.price || !formData.bio.trim()) {
      alert("⚠️ Lütfen sonraki adıma geçmeden önce kişisel bilgilerinizi eksiksiz doldurun.");
      return;
    }
    
    if (!formData.email.includes('@')) {
      alert("⚠️ Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🚀 GÜNCELLENDİ: KİŞİNİN ADIYLA DOSYA İSİMLENDİRME VE PUBLIC URL KAYDETME
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasSelection = specialties.amac.length > 0 || specialties.odak.length > 0 || specialties.seviye.length > 0;
    if (!hasSelection) {
      alert("⚠️ Lütfen başvurunuzu tamamlamadan önce en az bir hedef kitle, seviye veya odak alanı seçin.");
      return;
    }

    setLoading(true);

    try {
      let diplomaUrl = null;
      let certificateUrl = null;

      // Öğretmenin adını dosya ismi için temizle (Örn: "Ayşe Yılmaz" -> "Ayse_Yilmaz")
      const safeName = formData.fullName
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_');

      // A) DİPLOMAYI KİŞİNİN ADIYLA STORAGE'A YÜKLE
      if (diplomaFile) {
        const fileExt = diplomaFile.name.split('.').pop();
        const fileName = `${safeName}_diploma_${Date.now()}.${fileExt}`;
        const filePath = `diplomalar/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('egitmen-belgeleri')
          .upload(filePath, diplomaFile);

        if (uploadError) {
          throw new Error("Diploma yüklenirken hata oluştu: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('egitmen-belgeleri')
          .getPublicUrl(filePath);

        diplomaUrl = publicUrlData.publicUrl;
      }

      // B) SERTİFİKAYI KİŞİNİN ADIYLA STORAGE'A YÜKLE
      if (certificateFile) {
        const fileExt = certificateFile.name.split('.').pop();
        const fileName = `${safeName}_sertifika_${Date.now()}.${fileExt}`;
        const filePath = `sertifikalar/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('egitmen-belgeleri')
          .upload(filePath, certificateFile);

        if (uploadError) {
          throw new Error("Sertifika yüklenirken hata oluştu: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('egitmen-belgeleri')
          .getPublicUrl(filePath);

        certificateUrl = publicUrlData.publicUrl;
      }

      // C) TÜM FORM VERİLERİNİ VE DOĞRUDAN AÇILABİLİR LİNKLERİ KAYDET
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
          diploma_url: diplomaUrl, 
          sertifika_url: certificateUrl, 
          durum: 'bekliyor'
        }]);

      if (error) throw error;

      alert("🎉 Başvurunuz ve belgeleriniz başarıyla alındı! Bilgileriniz yönetim ekibine iletildi. İnceleme sonrası giriş bilgileriniz e-posta adresinize gönderilecektir.");
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
          padding: '10px 16px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease-in-out',
          backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
          color: isSelected ? '#4f46e5' : '#475569',
          border: isSelected ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
          boxShadow: isSelected ? '0 2px 6px rgba(79, 70, 229, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          border: isSelected ? 'none' : '1.5px solid #94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isSelected ? '#4f46e5' : 'transparent',
          flexShrink: 0
        }}>
          {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 800 }}>✓</span>}
        </div>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', fontFamily: '"Inter", sans-serif', boxSizing: 'border-box' }}>
      
      {/* Üst Navigasyon & Geri Dön */}
      <div style={{ width: '100%', maxWidth: '720px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Ana Sayfaya Dön
        </button>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
          Eğitmen Başvuru Formu
        </span>
      </div>

      {/* Ana Form Kartı */}
      <div style={{ width: '100%', maxWidth: '720px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '44px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05), 0 4px 10px -5px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
        
        {/* Başlık Alanı */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Eğitmen Ağımıza Katılın
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.98rem', lineHeight: 1.5 }}>
            Dünyanın dört bir yanından Türkçe öğrenmek isteyen öğrencilerle buluşun.
          </p>
        </div>

        {/* Adım Göstergesi (Progress Bar) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
              1
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#0f172a' : '#64748b' }}>
              Kişisel Bilgiler & Belgeler
            </span>
          </div>
          <div style={{ flex: 1, height: '2px', background: step === 2 ? '#4f46e5' : '#e2e8f0', margin: '0 16px', transition: 'background 0.3s' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step === 2 ? '#4f46e5' : '#f1f5f9', color: step === 2 ? '#ffffff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.3s' }}>
              2
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#0f172a' : '#94a3b8' }}>
              Uzmanlık & Tercihler
            </span>
          </div>
        </div>

        <form onSubmit={handleApply} style={{ width: '100%', boxSizing: 'border-box' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', boxSizing: 'border-box' }}>
              
              {/* Ad Soyad & E-posta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={labelStyle}>Adınız Soyadınız</label>
                  <input
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    style={inputStyle}
                    placeholder="Örn: Ayşe Yılmaz"
                  />
                </div>
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={labelStyle}>E-posta Adresiniz</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={inputStyle}
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              {/* Saatlik Ders Ücreti */}
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <label style={labelStyle}>Saatlik Ders Ücretiniz (₺)</label>
                <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    style={{ ...inputStyle, paddingRight: '75px' }}
                    placeholder="Örn: 450"
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600, fontSize: '0.88rem', pointerEvents: 'none' }}>
                    ₺ / saat
                  </span>
                </div>
              </div>

              {/* Biyografi */}
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Kısa Biyografi</label>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Profilinizde gösterilecektir</span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                  placeholder="Eğitim geçmişinizden, öğretme metodunuzdan ve Türkçe öğretmenliği deneyiminizden bahsedin..."
                />
              </div>

              {/* DİPLOMA VE SERTİFİKA YÜKLEME ALANLARI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '4px', width: '100%', boxSizing: 'border-box' }}>
                
                {/* Diploma Yükleme */}
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={labelStyle}>🎓 Mezuniyet Diploması <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>(PDF, JPG, PNG)</span></label>
                  <div style={fileUploadContainerStyle}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setDiplomaFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                      id="diploma-upload"
                    />
                    <label htmlFor="diploma-upload" style={fileUploadLabelStyle}>
                      <span style={{ fontSize: '1.4rem' }}>📑</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                          {diplomaFile ? diplomaFile.name : 'Diploma Seç / Sürükle'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {diplomaFile ? `${(diplomaFile.size / 1024 / 1024).toFixed(2)} MB` : 'Maksimum 5 MB'}
                        </span>
                      </div>
                    </label>
                    {diplomaFile && (
                      <button
                        type="button"
                        onClick={() => setDiplomaFile(null)}
                        style={removeFileBtnStyle}
                        title="Dosyayı Kaldır"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Sertifika Yükleme */}
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={labelStyle}>📜 TÖMER / Öğretmenlik Sertifikası <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>(İsteğe Bağlı)</span></label>
                  <div style={fileUploadContainerStyle}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setCertificateFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                      id="certificate-upload"
                    />
                    <label htmlFor="certificate-upload" style={fileUploadLabelStyle}>
                      <span style={{ fontSize: '1.4rem' }}>🏅</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                          {certificateFile ? certificateFile.name : 'Sertifika Seç / Sürükle'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {certificateFile ? `${(certificateFile.size / 1024 / 1024).toFixed(2)} MB` : 'Maksimum 5 MB'}
                        </span>
                      </div>
                    </label>
                    {certificateFile && (
                      <button
                        type="button"
                        onClick={() => setCertificateFile(null)}
                        style={removeFileBtnStyle}
                        title="Dosyayı Kaldır"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  ...primaryBtnStyle,
                  marginTop: '10px'
                }}
              >
                Sonraki Adım: Uzmanlık Alanları →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', boxSizing: 'border-box' }}>
              
              {/* 1. Hedef Kitle */}
              <div style={sectionBoxStyle}>
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={sectionTitleStyle}>1. Hedef Kitle</h3>
                  <p style={sectionDescStyle}>Çalışmak istediğiniz öğrenci profillerini seçin</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {GOALS.map(g => <OptionCheckbox key={g} label={g} group="amac" />)}
                </div>
              </div>

              {/* 2. Öğrenci Seviyesi */}
              <div style={sectionBoxStyle}>
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={sectionTitleStyle}>2. Öğrenci Seviyesi</h3>
                  <p style={sectionDescStyle}>Ders verebileceğiniz Türkçe yetkinlik seviyelerini belirtin</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {LEVELS.map(l => <OptionCheckbox key={l} label={l} group="seviye" />)}
                </div>
              </div>

              {/* 3. Odak Alanları */}
              <div style={sectionBoxStyle}>
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={sectionTitleStyle}>3. Odak Alanlarınız</h3>
                  <p style={sectionDescStyle}>Derslerinizde yoğunlaştığınız özel alanlar</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {FOCUS_AREAS.map(f => <OptionCheckbox key={f} label={f} group="odak" />)}
                </div>
              </div>

              {/* Butonlar */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '10px', width: '100%', boxSizing: 'border-box' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={backBtnStyle}
                >
                  ← Geri Dön
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...primaryBtnStyle,
                    flex: 1,
                    backgroundColor: loading ? '#94a3b8' : '#4f46e5',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Belgeler ve Başvuru İletiliyor...' : 'Başvurumu Tamamla ✨'}
                </button>
              </div>

            </div>
          )}
        </form>
      </div>

      {/* Alt Güvenlik Açıklaması */}
      <p style={{ marginTop: '24px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
        🔒 Bilgileriniz ve belgeleriniz yalnızca yönetim ekibi tarafından incelenmek amacıyla güvenle saklanır.
      </p>
    </div>
  );
}

// Stiller
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.88rem',
  color: '#334155',
  marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  fontSize: '0.95rem',
  outline: 'none',
  color: '#0f172a',
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box'
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 24px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
  boxSizing: 'border-box'
};

const backBtnStyle: React.CSSProperties = {
  padding: '14px 22px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  fontWeight: 600,
  fontSize: '0.92rem',
  color: '#475569',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  boxSizing: 'border-box'
};

const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: '#fcfcfe',
  padding: '20px',
  borderRadius: '14px',
  border: '1px solid #f1f5f9',
  boxSizing: 'border-box',
  width: '100%'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 4px 0'
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#64748b',
  margin: 0
};

const fileUploadContainerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '12px 14px',
  border: '1.5px dashed #cbd5e1',
  borderRadius: '12px',
  backgroundColor: '#f8fafc',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box'
};

const fileUploadLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  flex: 1,
  overflow: 'hidden'
};

const removeFileBtnStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#ef4444',
  border: 'none',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 700,
  flexShrink: 0,
  marginLeft: '8px'
};