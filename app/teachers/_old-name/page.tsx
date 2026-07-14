// app/teachers/[name]/page.tsx
'use client';

import Link from 'next/link';
import { use, useState } from 'react';

// TypeScript Şablonumuz
interface Teacher {
  name: string;
  avatar: string;
  title: string;
  price: string;
  rating: string;
  totalLessons: string;
  languages: string;
  about: string;
  lessons: string[];
  availability: Record<string, string[]>;
  reviews: { id: number; student: string; rate: string; text: string }[];
}

const teachersData: Record<string, Teacher> = {
  'ahmet-yilmaz': {
    name: 'Ahmet Yılmaz',
    avatar: '👨‍🏫',
    title: 'Kıdemli TÖMER Eğitmeni',
    price: '25$',
    rating: '4.9',
    totalLessons: '120 Ders',
    languages: 'Türkçe (Anadil), İngilizce (B2)',
    about: 'Merhaba! Ben Ahmet. 8 yıldır yabancılara Türkçe öğretiyorum. Ankara Üniversitesi TÖMER sertifikasına sahibim. Derslerimde sıkıcı dil bilgisi kuralları yerine günlük hayatta kullanabileceğiniz pratik konuşma kalıplarına odaklanıyorum.',
    lessons: ['A1-A2 Başlangıç Türkçe', 'B1-B2 Orta Seviye Pratik', 'Pratik Konuşma Odaklı Dersler'],
    availability: {
      'Pazartesi': ['09:00', '11:00', '14:00'],
      'Çarşamba': ['10:00', '15:00', '17:00'],
      'Cuma': ['09:00', '13:00', '16:00']
    },
    reviews: [
      { id: 1, student: 'John D.', rate: '⭐ 5/5', text: 'Ahmet hoca harika biri! Sıfırdan başladım ve 3 ayda günlük konuşmaları yapabilir hale geldim. Kesinlikle tavsiye ederim.' },
      { id: 2, student: 'Anna K.', rate: '⭐ 4.9/5', text: 'Dersler çok eğlenceli geçiyor, zamanın nasıl geçtiğini anlamıyorsunuz. Telaffuz geliştirmek için harika bir öğretmen.' }
    ]
  },
  'elif-kaya': {
    name: 'Elif Kaya',
    avatar: '👩‍🏫',
    title: 'Akademik Türkçe Uzmanı',
    price: '30$',
    rating: '5.0',
    totalLessons: '94 Ders',
    languages: 'Türkçe (Anadil), İngilizce (C1), Rusça (A2)',
    about: 'Akademik veya iş hayatınız için Türkçe mi öğrenmek istiyorsunuz? Doğru yerdesiniz. İstanbul Üniversitesi Dil Merkezi deneyimimle TYS (Türkçe Yeterlik Sınavı) hazırlık ve kurumsal iş Türkçesi dersleri veriyorum.',
    lessons: ['TYS Sınavına Hazırlık', 'İş Türkçesi & Mülakat Koçluğu', 'C1 İleri Seviye Akademik Türkçe'],
    availability: {
      'Salı': ['13:00', '14:00', '19:00'],
      'Perşembe': ['11:00', '15:00', '20:00'],
      'Cumartesi': ['10:00', '12:00']
    },
    reviews: [
      { id: 1, student: 'Ahmed M.', rate: '⭐ 5/5', text: 'TYS sınavını Elif hoca sayesinde kazandım. Akademik Türkçe ve kompozisyon yazma konusunda tam bir uzman.' },
      { id: 2, student: 'Sarah L.', rate: '⭐ 5/5', text: 'Very professional teacher. Her materials are well-prepared and structured.' }
    ]
  },
  'can-demir': {
    name: 'Can Demir',
    avatar: '👨‍💻',
    title: 'Konuşma (Speaking) Koçu',
    price: '20$',
    rating: '4.8',
    totalLessons: '45 Ders',
    languages: 'Türkçe (Anadil), İngilizce (C2)',
    about: 'Hey there! Türkçe dil bilgisini biliyor ama konuşmaya gelince çekiniyor musunuz? Gelin bu korkuyu beraber yenelim. Tamamen akıcılık, doğru telaffuz ve sokak Türkçesi üzerine bol muhabbetli dersler yapıyoruz.',
    lessons: ['%100 Konuşma Odaklı Ders', 'Türk Kültürü ve Sokak Dili', 'Telaffuz ve Akıcılık Geliştirme'],
    availability: {
      'Pazartesi': ['18:00', '20:00'],
      'Salı': ['19:00', '21:00'],
      'Pazar': ['13:00', '15:00', '17:00']
    },
    reviews: [
      { id: 1, student: 'David P.', rate: '⭐ 4.8/5', text: 'Can is incredibly chill and easy to talk to. My speaking confidence has boosted after just 5 lessons!' }
    ]
  },
  // ✨ Esra Nur Tüzmen Hocamız Sapasağlam Eklendi
  'esra-nur-tuzmen': {
    name: 'Esra Nur Tüzmen',
    avatar: '👩‍💻',
    title: 'Çocuklar & Gençler İçin Türkçe Uzmanı',
    price: '28$',
    rating: '4.9',
    totalLessons: '82 Ders',
    languages: 'Türkçe (Anadil), İngilizce (C1), Almanca (A1)',
    about: 'Merhaba, ben Esra Nur! Çocuklar ve genç yaştaki öğrencilere yabancı dil olarak Türkçe öğretiminde uzmanlaştım. Derslerimde sıkıcı anlatımlar yerine dijital oyunlar, hikayeler ve interaktif dramalar kullanıyorum. Öğrenirken eğlenmek garanti!',
    lessons: ['Çocuklar İçin Eğlenceli Türkçe', 'Gençler İçin Akıcı Konuşma', 'Hikayelerle Kelime Bilgisi'],
    availability: {
      'Çarşamba': ['16:00', '17:00', '18:00'],
      'Cuma': ['15:00', '16:00', '19:00'],
      'Cumartesi': ['11:00', '14:00', '16:00']
    },
    reviews: [
      { id: 1, student: 'Marc V. (Parent)', rate: '⭐ 5/5', text: 'Esra Nur teacher is amazing with kids! My 8-year-old son looks forward to his Turkish lessons every week.' },
      { id: 2, student: 'Elena S.', rate: '⭐ 4.8/5', text: 'Enerjisi çok yüksek ve çok sabırlı bir öğretmen. Malzemeleri çok renkli ve ilgi çekici.' }
    ]
  }
};

export default function TeacherDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = use(params);
  const nameParam = resolvedParams.name;
  const teacher = teachersData[nameParam];

  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  if (!teacher) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Öğretmen Profili Bulunamadı / Teacher Not Found</h2>
        <Link href="/teachers" style={{ color: '#1e3a8a' }}>Öğretmenler listesine geri dön</Link>
      </div>
    );
  }

  const handleBooking = () => {
    if (!selectedDay || !selectedTime) {
      alert('Lütfen takvimden bir gün ve ders saati seçiniz!');
      return;
    }
    alert(`Harika! ${teacher.name} ile ${selectedDay} günü saat ${selectedTime} için ders talebiniz oluşturuldu.`);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px 20px' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto 20px auto' }}>
        <Link href="/teachers" style={{ textDecoration: 'none', color: '#1e3a8a', fontWeight: '600' }}>
          ⬅ Listeye Dön / Back to Teachers
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '30px', maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap' }}>
        
        {/* SOL PANEL */}
        <div style={{ flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={sectionBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ fontSize: '4rem', backgroundColor: '#f1f5f9', width: '90px', height: '90px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {teacher.avatar}
              </div>
              <div>
                <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '2rem', fontWeight: '700' }}>{teacher.name}</h1>
                <p style={{ margin: 0, color: '#0369a1', fontWeight: '600' }}>{teacher.title}</p>
                <p style={{ margin: '5px 0 0 0', color: '#eab308', fontSize: '0.95rem', fontWeight: 'bold' }}>
                  ⭐ {teacher.rating} <span style={{ color: '#64748b', fontWeight: '400' }}>({teacher.totalLessons})</span>
                </p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '25px 0' }} />

            <h3 style={titleStyle}>📝 Hakkımda / About Me</h3>
            <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '1rem' }}>{teacher.about}</p>

            <h3 style={titleStyle}>🗣️ Bildi Diller / Languages</h3>
            <p style={{ color: '#475569', fontWeight: '500' }}>{teacher.languages}</p>

            <h3 style={titleStyle}>🎓 Verdiği Dersler / Offered Courses</h3>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: '1.8' }}>
              {teacher.lessons.map((lesson: string, index: number) => (
                <li key={index} style={{ fontWeight: '500' }}>{lesson}</li>
              ))}
            </ul>
          </div>

          {/* YORUMLAR */}
          <div style={sectionBoxStyle}>
            <h3 style={{ ...titleStyle, marginTop: 0 }}>💬 Öğrenci Yorumları / Student Reviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {teacher.reviews.map((review) => (
                <div key={review.id} style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#1e293b' }}>{review.student}</strong>
                    <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '0.9rem' }}>{review.rate}</span>
                  </div>
                  <p style={{ color: '#475569', margin: 0, fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.5' }}>"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: REZERVASYON & TAKVİM */}
        <div style={{ flex: '1.2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ ...sectionBoxStyle, border: '2px solid #1e3a8a', position: 'sticky', top: '20px' }}>
            <h3 style={{ color: '#64748b', margin: '0 0 5px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ders Ücreti / Price</h3>
            <div style={{ fontSize: '2.6rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '20px' }}>
              {teacher.price}<span style={{ fontSize: '1rem', fontWeight: '400', color: '#64748b' }}>/saat</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '15px 0' }} />

            <h4 style={{ color: '#0f172a', textAlign: 'left', margin: '0 0 10px 0' }}>📅 Uygun Gün ve Saat Seçin:</h4>
            
            {/* GÜNLER */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px' }}>
              {Object.keys(teacher.availability).map((day) => (
                <button
                  key={day}
                  onClick={() => { setSelectedDay(day); setSelectedTime(''); }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: selectedDay === day ? 'none' : '1px solid #cbd5e1',
                    backgroundColor: selectedDay === day ? '#1e3a8a' : '#fff',
                    color: selectedDay === day ? '#fff' : '#334155',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* SAATLER */}
            {selectedDay ? (
              <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 8px 0' }}>{selectedDay} günü için müsait saatler:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {teacher.availability[selectedDay].map((time: string) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: selectedTime === time ? 'none' : '1px solid #ea580c',
                        backgroundColor: selectedTime === time ? '#ea580c' : '#fff',
                        color: selectedTime === time ? '#fff' : '#ea580c',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '25px' }}>Saatleri görmek için önce yukarıdan bir gün seçin.</p>
            )}

            <button 
              onClick={handleBooking}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                marginBottom: '15px'
              }}
            >
              Ders Rezervasyonu Yap / Book Lesson
            </button>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>🛡️ Güvenli Ödeme - %100 İade Garantisi</p>
          </div>
        </div>

      </div>
    </div>
  );
}

const sectionBoxStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  border: '1px solid #f1f5f9',
  textAlign: 'left' as const
};

const titleStyle = {
  color: '#1e3a8a',
  marginTop: '25px',
  marginBottom: '12px',
  fontSize: '1.25rem',
  fontWeight: '700'
};