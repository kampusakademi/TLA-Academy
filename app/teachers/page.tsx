'use client';

// Giriş yapmamış ziyaretçilerin göreceği genel eğitmen listesi
const PUBLIC_TEACHERS = [
  { 
    id: 'esra',
    name: 'Esra Nur Tüzmen', 
    title: 'Profesyonel Dil Koçu & Akademisyen', 
    avatar: '👩‍🏫', 
    bio: 'Yabancılara Türkçe öğretimi konusunda 6 yıl deneyim. Canlı pratik ve günlük konuşma odaklı dersler.',
    price: 350,
    rating: 4.9
  },
  { 
    id: 'ahmet',
    name: 'Ahmet Demir', 
    title: 'İş Türkçesi Uzmanı & Eski TRT Spikeri', 
    avatar: '👨‍🏫', 
    bio: 'Diksiyon, hitabet ve kurumsal Türkçe eğitimi. İleri düzey öğrenciler için profesyonel kariyer koçluğu.', 
    price: 400,
    rating: 5.0
  },
  { 
    id: 'zeynep',
    name: 'Zeynep Kaya', 
    title: 'Çocuklar İçin Türkçe & Drama Eğitmeni', 
    avatar: '👩‍⚕️', 
    bio: '7-14 yaş arası çocuklara oyunlar ve interaktif hikayelerle eğlenceli Türkçe dersleri.', 
    price: 380,
    rating: 4.8
  },
  { 
    id: 'can',
    name: 'Can Özkan', 
    title: 'YDS / TÖMER Sınav Hazırlık Koçu', 
    avatar: '👨‍💻', 
    bio: 'Akademik Türkçe, dil bilgisi kuralları ve resmi sınavlara (TÖMER) hazırlıkta 8 yıllık tecrübe.', 
    price: 420,
    rating: 4.9
  }
];

export default function PublicTeachersPage() {
  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#0f172a', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Üst Logo ve Navigasyon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <div style={{ backgroundColor: '#4f46e5', color: '#ffffff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>T</div>
            <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>turkish learning akademy</span>
          </div>
        </div>

        {/* Başlık Alanı */}
        <header style={{ marginBottom: '50px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Eğitmen Kadromuzla Tanışın 🌟</h1>
          <p style={{ margin: '10px 0 0 0', color: '#64748b', fontSize: '1.05rem' }}>
            Giriş yapmadan önce tüm eğitmenlerimizi inceleyebilir, ders almak için hemen üye olabilirsiniz.
          </p>
        </header>

        {/* EĞİTMENLERİN YAN YANA LİSTELENDİĞİ GRID YAPISI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          {PUBLIC_TEACHERS.map((teacher) => (
            <a 
              key={teacher.id}
              href={`/teachers/${teacher.id}`} // Her hocayı kendi ID'sine yönlendirir
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
            >
              <div 
                style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.15s', width: '100%' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '16px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                      {teacher.avatar}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>{teacher.name}</h3>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>{teacher.title}</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', fontSize: '0.85rem', color: '#eab308', fontWeight: '600' }}>
                    ⭐ {teacher.rating} / 5.0 Memnuniyet
                  </div>

                  <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                    {teacher.bio}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>
                    ₺{teacher.price}<span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}> / saat</span>
                  </span>
                  
                  <span style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', display: 'inline-block' }}>
                    Detay & Rezervasyon →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}