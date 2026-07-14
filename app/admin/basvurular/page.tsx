'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Page() {
  const [basvurular, setBasvurular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBasvurular() {
    setLoading(true);
    const { data, error } = await supabase.from('basvurular').select('*');
    
    if (error) {
      console.error("Supabase Hatası:", error);
      alert("Veriler çekilemedi: " + error.message);
    } else {
      setBasvurular(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBasvurular();
  }, []);

  const durumGuncelle = async (basvuru: any, yeniDurum: 'Onaylandı' | 'Reddedildi') => {
    try {
      if (yeniDurum === 'Onaylandı') {
        // Tablondaki "Not Null" kısıtlamalarına takılmamak için varsayılan değerler atandı
        const { error: insertError } = await supabase.from('egitmenler').insert([{
          email: basvuru.email,
          egitim: basvuru.sertifika_durumu || "Belirtilmemiş",
          tam_ad: basvuru.tam_ad || "İsimsiz", 
          user_id: basvuru.user_id || null 
        }]);
        
        if (insertError) throw insertError;
      }

      // Başvuruyu sil
      await supabase.from('basvurular').delete().eq('id', basvuru.id);
      
      setBasvurular(prev => prev.filter(b => b.id !== basvuru.id));
      alert("Başvuru başarıyla " + yeniDurum + " edildi.");

    } catch (err: any) {
      console.error(err);
      alert("Hata oluştu: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Eğitmen Başvuruları ({basvurular.length})</h1>
        
        {basvurular.length === 0 ? (
          <p style={{ color: '#64748b' }}>Henüz başvuru bulunmuyor.</p>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left' }}>E-posta</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Ders Türü</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {basvurular.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>{b.email}</td>
                    <td style={{ padding: '16px' }}>{b.ders_turu || "-"}</td>
                    <td style={{ padding: '16px' }}>
                      <button onClick={() => durumGuncelle(b, 'Onaylandı')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' }}>Onayla</button>
                      <button onClick={() => durumGuncelle(b, 'Reddedildi')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Reddet</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}