'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tüm verileri tek bir yapıda (obje) tutmak kodu inanılmaz kısaltır
  const [formData, setFormData] = useState({
    tam_ad: "",
    ders_turu: "", // Senin kodundaki 'unvan'a denk geliyor
    biyografi: "",
    saatlik_ucret: "",
    konustugu_diller: "",
    one_cikan_etiket: "",
    konum: "",
    video_url: ""
  });

  // 1. Mevcut verileri veritabanından çek (Senin yazdığın mantık)
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('egitmenler')
        .select('*')
        .eq('user_id', user.id) // Güvenlik için id yerine user_id eşleşmesi yapıyoruz
        .single();

      if (data) {
        setFormData({
          tam_ad: data.tam_ad || "",
          ders_turu: data.ders_turu || "",
          biyografi: data.biyografi || "",
          saatlik_ucret: data.saatlik_ucret || "",
          konustugu_diller: data.konustugu_diller || "",
          one_cikan_etiket: data.one_cikan_etiket || "",
          konum: data.konum || "",
          video_url: data.video_url || ""
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  // İnputlara yazı yazıldıkça state'i güncelleyen ortak fonksiyon
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Güncelleme işlemi (Senin yazdığın mantık)
  const handleUpdate = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('egitmenler')
      .update({
        tam_ad: formData.tam_ad,
        ders_turu: formData.ders_turu,
        biyografi: formData.biyografi,
        saatlik_ucret: Number(formData.saatlik_ucret), // Rakam olarak kaydet
        konustugu_diller: formData.konustugu_diller,
        one_cikan_etiket: formData.one_cikan_etiket,
        konum: formData.konum,
        video_url: formData.video_url
      })
      .eq('user_id', user.id);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      alert("Profil başarıyla güncellendi! Vitrinde anında değişti.");
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '40px', fontWeight: 600 }}>Bilgileriniz yükleniyor...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', color: '#121117' }}>Profilini Düzenle</h2>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>Öğrencilerin sizi daha iyi tanıması için bilgilerinizi eksiksiz doldurun.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Ad Soyad:</label>
          <input name="tam_ad" value={formData.tam_ad} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Unvan / Uzmanlık:</label>
          <input name="ders_turu" value={formData.ders_turu} onChange={handleChange} placeholder="Örn: Profesyonel Türkçe Eğitmeni" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Saatlik Ücret (₺):</label>
          <input type="number" name="saatlik_ucret" value={formData.saatlik_ucret} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Konuştuğu Diller:</label>
          <input name="konustugu_diller" value={formData.konustugu_diller} onChange={handleChange} placeholder="Örn: Türkçe (Ana dil), İngilizce (B2)" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Öne Çıkan Etiket (Pembe Kutu):</label>
          <input name="one_cikan_etiket" value={formData.one_cikan_etiket} onChange={handleChange} placeholder="Örn: Etkileşimli, samimi ve sabırlı" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Konum (Ülke, Şehir):</label>
          <input name="konum" value={formData.konum} onChange={handleChange} placeholder="Örn: İstanbul, Türkiye" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Tanıtım Videosu Linki (YouTube):</label>
          <input name="video_url" value={formData.video_url} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Biyografi & Metodoloji:</label>
          <textarea name="biyografi" value={formData.biyografi} onChange={handleChange} style={{ ...inputStyle, height: '120px', resize: 'vertical' }} />
        </div>

        <button onClick={handleUpdate} disabled={saving} style={{ 
          padding: '14px 20px', 
          backgroundColor: saving ? '#9ca3af' : '#121117', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: saving ? 'not-allowed' : 'pointer',
          fontWeight: 700,
          fontSize: '1rem',
          marginTop: '10px'
        }}>
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>

      </div>
    </div>
  );
}

// İnputlar düzgün görünsün diye ufak bir stil objesi
const inputStyle = {
  width: '100%', 
  padding: '12px', 
  borderRadius: '8px', 
  border: '1px solid #d1d5db', 
  outline: 'none',
  fontSize: '1rem'
};