'use client';

import { useState } from 'react';
import { Search, CalendarCheck, PlayCircle } from 'lucide-react';

export default function NasilCalisir() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: "Eğitmeninizi Bulun",
      desc: "Uzmanlık alanlarına, fiyatlara ve öğrenci yorumlarına göre size en uygun eğitmeni seçin.",
      icon: <Search size={22} />,
      color: "#4f46e5", // Modern İndigo
      bgColor: "#eef2ff",
      // Unsplash'ten profesyonel örnek görseller koydum, istersen kendi görsellerinle değiştirebilirsin
      img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop" 
    },
    {
      id: 2,
      title: "Dersinizi Ayırtın",
      desc: "Eğitmenin takviminden size en uygun saati seçerek birebir dersinizi anında rezerve edin.",
      icon: <CalendarCheck size={22} />,
      color: "#10b981", // Zümrüt Yeşili
      bgColor: "#dcfce7",
      img: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Öğrenmeye Başlayın",
      desc: "Ders saati geldiğinde platformumuz üzerinden görüntülü görüşmeye katılın ve pratik yapın.",
      icon: <PlayCircle size={22} />,
      color: "#f59e0b", // Kehribar Sarısı
      bgColor: "#fef3c7",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
    }
  ];

  return (
    <section style={{ padding: '100px 24px', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Başlık Alanı */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{ color: '#4f46e5', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '12px' }}>
            Nasıl Çalışır?
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', margin: 0 }}>
            Sadece 3 Adımda Öğrenmeye Başlayın
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '16px auto 0', lineHeight: 1.6 }}>
            Yeni bir dil öğrenmek hiç bu kadar kolay olmamıştı. Hedeflerinize ulaşmak için hemen ilk adımı atın.
          </p>
        </div>

        {/* Kartlar Izgarası (Responsive) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '32px',
          position: 'relative'
        }}>
          
          {steps.map((step, index) => {
            const isHovered = hoveredCard === step.id;
            
            return (
              <div 
                key={step.id}
                onMouseEnter={() => setHoveredCard(step.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                  boxShadow: isHovered 
                    ? '0 20px 40px -10px rgba(0,0,0,0.1)' 
                    : '0 4px 6px -1px rgba(0,0,0,0.05)',
                }}
              >
                {/* Görsel Alanı */}
                <div style={{ 
                  height: '220px', 
                  width: '100%', 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: step.color,
                    opacity: isHovered ? 0 : 0.1,
                    transition: 'opacity 0.4s ease',
                    zIndex: 1
                  }} />
                  <img 
                    src={step.img} 
                    alt={step.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                    }}
                  />
                </div>

                {/* Yüzen Numara Rozeti (Floating Badge) */}
                <div style={{
                  position: 'absolute',
                  top: '196px', // Görsel ile içeriğin tam kesişim noktası (220 - 24)
                  left: '32px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  backgroundColor: step.color,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  boxShadow: `0 10px 20px -5px ${step.color}80`,
                  zIndex: 2,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0)'
                }}>
                  {step.id}
                </div>

                {/* İçerik Alanı */}
                <div style={{ padding: '48px 32px 40px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ 
                      color: step.color, 
                      backgroundColor: step.bgColor,
                      padding: '8px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {step.icon}
                    </div>
                    <h3 style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 800, 
                      color: '#0f172a',
                      margin: 0,
                      letterSpacing: '-0.5px'
                    }}>
                      {step.title}
                    </h3>
                  </div>
                  
                  <p style={{ 
                    color: '#475569', 
                    fontSize: '1rem', 
                    lineHeight: 1.7,
                    margin: 0
                  }}>
                    {step.desc}
                  </p>
                </div>

                {/* Alt Kısımdaki İnce Renkli Çizgi (Vurgu) */}
                <div style={{
                  height: '4px',
                  width: '100%',
                  backgroundColor: step.color,
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}