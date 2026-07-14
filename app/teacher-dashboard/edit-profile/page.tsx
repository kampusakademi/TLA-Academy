'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [tamAd, setTamAd] = useState("");
  const [unvan, setUnvan] = useState("");
  const [biyografi, setBiyografi] = useState("");

  // 1. Mevcut verileri yükle
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('egitmenler')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setTamAd(data.tam_ad || "");
        setUnvan(data.unvan || "");
        setBiyografi(data.biyografi || "");
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  // 2. Güncelleme işlemi
  const handleUpdate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('egitmenler')
      .update({ tam_ad: tamAd, unvan, biyografi })
      .eq('id', user.id);

    if (error) alert("Hata: " + error.message);
    else alert("Profil başarıyla güncellendi!");
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '500px' }}>
      <h2>Profilini Düzenle</h2>
      
      <label>Ad Soyad:</label>
      <input value={tamAd} onChange={(e) => setTamAd(e.target.value)} style={{ width: '100%', marginBottom: 15 }} />
      
      <label>Unvan:</label>
      <input value={unvan} onChange={(e) => setUnvan(e.target.value)} style={{ width: '100%', marginBottom: 15 }} />
      
      <label>Biyografi:</label>
      <textarea value={biyografi} onChange={(e) => setBiyografi(e.target.value)} style={{ width: '100%', height: '100px', marginBottom: 15 }} />
      
      <button onClick={handleUpdate} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Değişiklikleri Kaydet
      </button>
    </div>
  );
}