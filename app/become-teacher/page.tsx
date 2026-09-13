'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Home, Search, UserPlus, Users } from 'lucide-react';

export default function BecomeTeacher() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    telefon: '',
    price: '',
    bio: '',
    konum: '',
    sehir: '',
    egitim: '',
    okul: '',
    anaDil: ''
  });

  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [specialties, setSpecialties] = useState<{ [key: string]: string[] }>({
    amac: [],
    sure: [],
    odak: [],
    seviye: [],
    diller: []
  });

  // Seçenek Verileri
  const LOCATIONS = ['Türkiye', 'Almanya', 'Amerika Birleşik Devletleri', 'İngiltere', 'Fransa', 'Hollanda', 'Azerbaycan', 'Kuzey Kıbrıs', 'Diğer'];
  const CITIES = ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'];
  const EDUCATIONS = ['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora'];
  const LANGUAGES = ['İngilizce','İspanyolca', 'Fransızca', 'Arapça', 'Portekizce', 'Rusça', 'Endonezce', 'Japonca', 'Türkçe', 'Korece', 'İtalyanca', 'Azerbaycanca', 'Almanca'];

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

  const handleNextStep = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.telefon.trim() || !formData.price || !formData.bio.trim() || !formData.konum || !formData.sehir.trim() || !formData.egitim || !formData.okul.trim() || !formData.anaDil) {
      toast.error("⚠️ Lütfen sonraki adıma geçmeden önce bilgilerinizi eksiksiz doldurun.");
      return;
    }
    
    if (!formData.email.includes('@')) {
      toast.error("⚠️ Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasSelection = specialties.amac.length > 0 || specialties.odak.length > 0 || specialties.seviye.length > 0;
    if (!hasSelection) {
      toast.error("⚠️ Lütfen başvurunuzu tamamlamadan önce en az bir alan seçin.");
      return;
    }

    setLoading(true);

    try {
      let diplomaUrl = null;
      let certificateUrl = null;

      const safeName = formData.fullName.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

      if (diplomaFile) {
        const fileExt = diplomaFile.name.split('.').pop();
        const fileName = `${safeName}_diploma_${Date.now()}.${fileExt}`;
        const filePath = `diplomalar/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('egitmen-belgeleri').upload(filePath, diplomaFile);
        if (uploadError) throw new Error("Diploma yüklenirken hata oluştu: " + uploadError.message);
        const { data: publicUrlData } = supabase.storage.from('egitmen-belgeleri').getPublicUrl(filePath);
        diplomaUrl = publicUrlData.publicUrl;
      }

      if (certificateFile) {
        const fileExt = certificateFile.name.split('.').pop();
        const fileName = `${safeName}_sertifika_${Date.now()}.${fileExt}`;
        const filePath = `sertifikalar/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('egitmen-belgeleri').upload(filePath, certificateFile);
        if (uploadError) throw new Error("Sertifika yüklenirken hata oluştu: " + uploadError.message);
        const { data: publicUrlData } = supabase.storage.from('egitmen-belgeleri').getPublicUrl(filePath);
        certificateUrl = publicUrlData.publicUrl;
      }

      const tamKonum = `${formData.konum} - ${formData.sehir}`;
      const tamEgitim = `${formData.egitim} - ${formData.okul}`;
      const tumDiller = [`${formData.anaDil} (Ana Dil)`, ...specialties.diller];

      const { error } = await supabase
        .from('basvurular')
        .insert([{
          tam_ad: formData.fullName,
          email: formData.email,
          telefon: formData.telefon,
          saatlik_ucret: Number(formData.price),
          biyografi: formData.bio,
          konum: tamKonum,            
          egitim: tamEgitim,          
          diller: tumDiller,          
          amac: specialties.amac.join(', '),
          sure: specialties.sure.join(', '),
          odak: specialties.odak.join(', '),
          seviye: specialties.seviye.join(', '),
          diploma_url: diplomaUrl, 
          sertifika_url: certificateUrl, 
          durum: 'bekliyor'
        }]);

      if (error) throw error;

      toast.success("🎉 Başvurunuz başarıyla alındı! Giriş bilgileriniz e-posta adresinize gönderilecektir.");
      router.push('/');

    } catch (error: any) {
      toast.error("Hata oluştu: " + error.message);
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
        <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: isSelected ? 'none' : '1.5px solid #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? '#4f46e5' : 'transparent', flexShrink: 0 }}>
          {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 800 }}>✓</span>}
        </div>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>
      
      {/* SOL SİDEBAR MENÜ */}
      <aside style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 20 }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Turkish Learning<br/>Academy.</h1>
        </div>

        <nav style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>MENÜ</span>
          
          <button onClick={() => router.push('/')} style={sidebarLinkStyle(false)}>
            <Home size={20} /> Ana Sayfa
          </button>
          
          <button onClick={() => router.push('/egitmen-bul')} style={sidebarLinkStyle(false)}>
            <Search size={20} /> Eğitmenleri Keşfet
          </button>
          
          <button onClick={() => router.push('/become-teacher')} style={sidebarLinkStyle(true)}>
            <UserPlus size={20} /> Öğretmen Ol
          </button>
          
          <button onClick={() => router.push('/egitmenler')} style={sidebarLinkStyle(false)}>
            <Users size={20} /> Eğitmenler
          </button>
        </nav>
      </aside>

      {/* SAĞ ANA İÇERİK ALANI */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* ÜST BAR */}
        <header style={{ height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => router.push('/?login=true')} style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}>
            Giriş Yap / Kayıt Ol
          </button>
        </header>

        {/* 🚀 KOYU MAVİ BANNER (Form ile tamamen ayrıldı) */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '35px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.0rem', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 1px 0' }}>
            Turkish Learning Academy <span style={{ color: '#4f46e5' }}>Eğitmeni Ol</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Uzmanlığınızı paylaşın, dünyanın dört bir yanından Türkçe öğrenmek isteyen öğrencilerle buluşun ve kariyerinizi büyütün.
          </p>
        </div>

        {/* 🚀 FORM ALANI (Siyah bölümün altında ferah alan) */}
        <div style={{ padding: '40px 32px 80px 32px', display: 'flex', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '44px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
            
            {/* Adım Göstergesi */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', padding: '0 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>1</div>
                <span style={{ fontSize: '0.9rem', fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#0f172a' : '#64748b' }}>Kişisel Bilgiler</span>
              </div>
              <div style={{ flex: 1, height: '2px', background: step === 2 ? '#4f46e5' : '#e2e8f0', margin: '0 16px', transition: 'background 0.3s' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step === 2 ? '#4f46e5' : '#f1f5f9', color: step === 2 ? '#ffffff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.3s' }}>2</div>
                <span style={{ fontSize: '0.9rem', fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#0f172a' : '#94a3b8' }}>Uzmanlık Alanları</span>
              </div>
            </div>

            <form onSubmit={handleApply} style={{ width: '100%', boxSizing: 'border-box' }}>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Adınız Soyadınız</label>
                      <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} style={inputStyle} placeholder="Örn: Ayşe Yılmaz" />
                    </div>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>E-posta Adresiniz</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="ornek@email.com" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Telefon Numarası</label>
                      <input required type="tel" value={formData.telefon} onChange={e => setFormData({...formData, telefon: e.target.value})} style={inputStyle} placeholder="Örn: +90 5XX XXX XX XX" />
                    </div>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Saatlik Ders Ücretiniz (₺)</label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ ...inputStyle, paddingRight: '75px' }} placeholder="Örn: 450" />
                        <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600, fontSize: '0.88rem', pointerEvents: 'none' }}>₺ / saat</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Konum (Ülke)</label>
                      <select required value={formData.konum} onChange={e => setFormData({...formData, konum: e.target.value, sehir: ''})} style={selectStyle}>
                        <option value="" disabled>Ülke Seçiniz...</option>
                        {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                    </div>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Şehir</label>
                      {formData.konum === 'Türkiye' ? (
                        <select required value={formData.sehir} onChange={e => setFormData({...formData, sehir: e.target.value})} style={selectStyle}>
                          <option value="" disabled>Şehir Seçiniz...</option>
                          {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                      ) : (
                        <input 
                          required 
                          value={formData.sehir} 
                          onChange={e => setFormData({...formData, sehir: e.target.value})} 
                          style={inputStyle} 
                          placeholder={formData.konum ? `${formData.konum} içindeki şehriniz...` : 'Önce ülke seçiniz...'} 
                          disabled={!formData.konum}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Eğitim Seviyesi</label>
                      <select required value={formData.egitim} onChange={e => setFormData({...formData, egitim: e.target.value})} style={selectStyle}>
                        <option value="" disabled>Eğitim Seviyesi Seçiniz...</option>
                        {EDUCATIONS.map(ed => <option key={ed} value={ed}>{ed}</option>)}
                      </select>
                    </div>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>Üniversite / Okul Adı</label>
                      <input required value={formData.okul} onChange={e => setFormData({...formData, okul: e.target.value})} style={inputStyle} placeholder="Örn: Gazi Üniversitesi" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fcfcfe', padding: '16px', borderRadius: '14px', border: '1px solid #f1f5f9', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Ana Diliniz</label>
                      <select
                        required
                        value={formData.anaDil}
                        onChange={e => {
                          setFormData({...formData, anaDil: e.target.value});
                          if (specialties.diller.includes(e.target.value)) {
                            setSpecialties(prev => ({ ...prev, diller: prev.diller.filter(d => d !== e.target.value) }));
                          }
                        }}
                        style={selectStyle}
                      >
                        <option value="" disabled>Ana Dilinizi Seçiniz...</option>
                        {LANGUAGES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '8px' }}>Bildiğiniz Diğer Diller <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>(Birden fazla seçebilirsiniz)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {LANGUAGES.filter(l => l !== formData.anaDil).map(l => (
                          <OptionCheckbox key={l} label={l} group="diller" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Kısa Biyografi</label>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Profilinizde gösterilecektir</span>
                    </div>
                    <textarea required rows={4} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} placeholder="Eğitim geçmişinizden, öğretme metodunuzdan ve Türkçe öğretmenliği deneyiminizden bahsedin..." />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '4px', width: '100%' }}>
                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>🎓 Mezuniyet Diploması <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>(PDF, JPG)</span></label>
                      <div style={fileUploadContainerStyle}>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDiplomaFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="diploma-upload" />
                        <label htmlFor="diploma-upload" style={fileUploadLabelStyle}>
                          <span style={{ fontSize: '1.4rem' }}>📑</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{diplomaFile ? diplomaFile.name.substring(0,20)+'...' : 'Diploma Seç / Sürükle'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{diplomaFile ? `${(diplomaFile.size / 1024 / 1024).toFixed(2)} MB` : 'Maksimum 5 MB'}</span>
                          </div>
                        </label>
                        {diplomaFile && <button type="button" onClick={() => setDiplomaFile(null)} style={removeFileBtnStyle} title="Dosyayı Kaldır">✕</button>}
                      </div>
                    </div>

                    <div style={{ width: '100%' }}>
                      <label style={labelStyle}>📜 TÖMER / Sertifika <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>(Opsiyonel)</span></label>
                      <div style={fileUploadContainerStyle}>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCertificateFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="certificate-upload" />
                        <label htmlFor="certificate-upload" style={fileUploadLabelStyle}>
                          <span style={{ fontSize: '1.4rem' }}>🏅</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{certificateFile ? certificateFile.name.substring(0,20)+'...' : 'Sertifika Seç / Sürükle'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{certificateFile ? `${(certificateFile.size / 1024 / 1024).toFixed(2)} MB` : 'Maksimum 5 MB'}</span>
                          </div>
                        </label>
                        {certificateFile && <button type="button" onClick={() => setCertificateFile(null)} style={removeFileBtnStyle} title="Dosyayı Kaldır">✕</button>}
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={handleNextStep} style={{ ...primaryBtnStyle, marginTop: '10px' }}>
                    Sonraki Adım: Uzmanlık Alanları →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', boxSizing: 'border-box' }}>
                  
                  <div style={sectionBoxStyle}>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={sectionTitleStyle}>1. Hedef Kitle</h3>
                      <p style={sectionDescStyle}>Çalışmak istediğiniz öğrenci profillerini seçin</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {GOALS.map(g => <OptionCheckbox key={g} label={g} group="amac" />)}
                    </div>
                  </div>

                  <div style={sectionBoxStyle}>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={sectionTitleStyle}>2. Öğrenci Seviyesi</h3>
                      <p style={sectionDescStyle}>Ders verebileceğiniz Türkçe yetkinlik seviyelerini belirtin</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {LEVELS.map(l => <OptionCheckbox key={l} label={l} group="seviye" />)}
                    </div>
                  </div>

                  <div style={sectionBoxStyle}>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={sectionTitleStyle}>3. Odak Alanlarınız</h3>
                      <p style={sectionDescStyle}>Derslerinizde yoğunlaştığınız özel alanlar</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {FOCUS_AREAS.map(f => <OptionCheckbox key={f} label={f} group="odak" />)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', marginTop: '10px', width: '100%', boxSizing: 'border-box' }}>
                    <button type="button" onClick={() => setStep(1)} style={backBtnStyle}>← Geri Dön</button>
                    <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, flex: 1, backgroundColor: loading ? '#94a3b8' : '#4f46e5', cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? 'Belgeler İletiliyor...' : 'Başvurumu Tamamla ✨'}
                    </button>
                  </div>

                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// STYLES (ESKİ GENİŞ VERSİYON)
// ==========================================

const sidebarLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: isActive ? '#f8fafc' : 'transparent',
  color: isActive ? '#0f172a' : '#475569',
  fontWeight: isActive ? 700 : 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'left'
});

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px top 50%',
  backgroundSize: '12px auto',
  paddingRight: '40px',
  cursor: 'pointer'
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