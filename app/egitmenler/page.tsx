'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EgitmenlerListesi() {
  const [egitmenler, setEgitmenler] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEgitmenler() {
      const { data } = await supabase.from('egitmenler').select('*');
      if (data) setEgitmenler(data);
    }
    fetchEgitmenler();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '30px' }}>Eğitmenlerimiz</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {egitmenler.map((egitmen) => (
          <div key={egitmen.id} style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            padding: '24px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            backgroundColor: 'white'
          }}>
            {/* Profil Resmi */}
            {egitmen.avatar_url && (
              <img 
                src={egitmen.avatar_url} 
                alt={egitmen.tam_ad} 
                style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px', objectFit: 'cover' }} 
              />
            )}
            
            <h3 style={{ margin: '0 0 10px 0' }}>{egitmen.tam_ad}</h3>
            
            <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '15px' }}>
              <p style={{ margin: '4px 0' }}><strong>Ders:</strong> {egitmen.ders_turu || "Belirtilmemiş"}</p>
              <p style={{ margin: '4px 0' }}><strong>Ücret:</strong> {egitmen.saatlik_ucret} {egitmen.para_birimi} / saat</p>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
              {egitmen.biyografi || "Henüz bir biyografi eklenmemiş."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}