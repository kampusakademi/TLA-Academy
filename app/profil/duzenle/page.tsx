'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilDuzenle() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<any>({ 
    tam_ad: '', 
    biyografi: '', 
    saatlik_ucret: '', 
    ders_turu: '' 
  });
  const [yeniSifre, setYeniSifre] = useState("");

  useEffect(() => {
    async function getProfile() {
      // 1. Giriş yapan kullanıcıyı al
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 2. Eğitmenler tablosundan o kişinin bilgilerini email ile bul
        const { data, error } = await supabase
          .from('egitmenler')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (data) setProfil(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  const bilgileriGuncelle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('egitmenler')
      .update(profil)
      .eq('email', user.email);

    if (error) alert("Bilgiler güncellenemedi: " + error.message);
    else alert("Profil bilgileriniz başarıyla güncellendi!");
  };

  const sifreDegistir = async () => {
    if (yeniSifre.length < 6) {
      alert("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: yeniSifre });
    if (error) alert("Şifre güncellenemedi: " + error.message);
    else { alert("Şifreniz başarıyla değiştirildi."); setYeniSifre(""); }
  };

  if (loading) return <div style={{ padding: 40 }}>Yükleniyor...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Profilini Düzenle</h1>
      
      {/* Profil Formu */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Ad Soyad</label>
        <input type="text" value={profil.tam_ad} onChange={e => setProfil({...profil, tam_ad: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px' }} />
        
        <label style={{ display: 'block', marginBottom: '5px' }}>Biyografi</label>
        <textarea value={profil.biyografi} onChange={e => setProfil({...profil, biyografi: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', height: '100px' }} />
        
        <label style={{ display: 'block', marginBottom: '5px' }}>Saatlik Ücret</label>
        <input type="number" value={profil.saatlik_ucret} onChange={e => setProfil({...profil, saatlik_ucret: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px' }} />
        
        <button onClick={bilgileriGuncelle} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Bilgileri Kaydet</button>
      </div>

      {/* Şifre Alanı */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
        <h3>Şifreni Değiştir</h3>
        <input type="password" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)} placeholder="Yeni şifreniz" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <button onClick={sifreDegistir} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Şifreyi Güncelle</button>
      </div>
    </div>
  );
}