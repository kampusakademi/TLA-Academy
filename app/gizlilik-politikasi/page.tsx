import Link from 'next/link';

export default function GizlilikPolitikasiPage() {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px 24px', fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* Üst Menü / Geri Dönüş */}
      <div style={{ maxWidth: '900px', margin: '0 auto', marginBottom: '24px' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }}>
          <span style={{ fontSize: '1.2rem' }}>←</span> Ana Sayfaya Dön
        </Link>
      </div>

      {/* Ana İçerik Kartı */}
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '24px', padding: '50px 60px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <header style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '24px', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>GİZLİLİK VE KİŞİSEL VERİLERİN KORUNMASI POLİTİKASI</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Son Güncelleme Tarihi: 14 Eylül 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1.05rem', lineHeight: 1.8, color: '#334155' }}>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 700, color: '#0f172a' }}>Veri Denetleyicisi:</p>
            <p style={{ margin: '0 0 4px 0' }}>Turkish Learning Academy (TLA)</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>Adres:</strong> [Şirketinizin/Kurumunuzun Adresi, Ankara, Türkiye]</p>
            <p style={{ margin: '0 0 16px 0' }}><strong>E-posta:</strong> legal@turkishlearningacademy.com</p>

            <p style={{ margin: '0 0 12px 0', fontWeight: 700, color: '#0f172a' }}>Veri Koruma ve İletişim Sorumlusu:</p>
            <p style={{ margin: 0 }}><strong>E-posta:</strong> dpo@turkishlearningacademy.com</p>
          </div>

          <p>
            Turkish Learning Academy ("TLA"), kişisel verilerinizi koruma taahhüdündedir. Bu Gizlilik Politikasını mümkün olan en açık ve sade dille yazmaya çalıştık. Amacımız, kişisel verilerinizin bizimle güvende olduğundan emin olmanızı sağlamaktır.
          </p>
          <p>
            Bu Gizlilik Politikası, TLA Platformunu kullanan kişilere (öğrenciler, eğitmenler ve ziyaretçiler) ait kişisel verileri ne zaman, nerede ve neden işlediğimizi, bunları nasıl kullandığımızı, hangi koşullar altında başkalarına ifşa edebileceğimizi ve bu verileri nasıl güvende tuttuğumuzu (KVKK ve GDPR standartları uyarınca) açıklamaktadır.
          </p>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>1. Temel Tanımlar</h2>
            <p><strong>Kişisel Veri:</strong> Sizinle ilgili olan ve tek başına veya diğer bilgilerle birlikte sizi bir birey olarak tanımlamamıza olanak tanıyan her türlü bilgidir.</p>
            <p><strong>Kişisel Verilerin İşlenmesi:</strong> Verilerin toplanması, kaydedilmesi, düzenlenmesi, depolanması, değiştirilmesi, aktarılması, silinmesi veya imha edilmesi gibi otomatik veya manuel yöntemlerle yapılan her türlü işlemdir.</p>
            <p><strong>Veri Sahibi:</strong> Kişisel verileri işlenen tanımlanabilir gerçek kişi; yani TLA kullanıcısı olarak sizsiniz.</p>
            <p><strong>Açık Rıza:</strong> Belirli bir konuya ilişkin, bilgilendirilmeye dayanan ve özgür iradeyle açıklanan onaydır.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>2. Veri İşleme Konusundaki Yasal Dayanaklarımız</h2>
            <p>TLA, kişisel verilerinizi yalnızca hukuki bir dayanağımız olduğunda işler. Bu yasal dayanaklar şunlardır:</p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Rıza (Onay):</strong> Bülten gönderimi, çerezlerin yerleştirilmesi veya yapay zeka araçlarının kullanımı gibi durumlar izninize tabidir.</li>
              <li><strong>Sözleşmenin İfası:</strong> Kullanım Koşulları uyarınca hizmetlerimizi (ders planlama, mesajlaşma, ödeme işlemleri) size sunmak için gereklidir.</li>
              <li><strong>Hukuki Yükümlülük:</strong> Vergi, muhasebe mevzuatlarına uyum ve mahkeme kararlarının yerine getirilmesi.</li>
              <li><strong>Meşru Menfaat:</strong> Platform trafiğini analiz etmek, dolandırıcılığı önlemek, algoritma aracılığıyla eğitmen sıralamalarını optimize etmek ve platform güvenliğini sağlamak meşru menfaatlerimiz kapsamındadır.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>3. Topladığımız Verilerin Kapsamı</h2>
            <p>Sizden yalnızca aşağıdaki bilgileri toplarız:</p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>Öğrenci Hesabı:</strong> Ad, soyad, e-posta adresi, saat dilimi ve tercih edilen dil. Tercihe bağlı olarak profil resmi ve ödeme tercihleri.</li>
              <li><strong>Eğitmen Hesabı:</strong> Ad, soyad, e-posta, tanıtım videosu, diploma/sertifika kopyaları, biyografi, eğitim ve iş deneyimi bilgileri, saatlik ücret ve banka ödeme altyapısı (örn. IBAN veya Stripe bağlantısı) için gerekli veriler.</li>
              <li><strong>Hizmet Kullanımı ve Çerezler:</strong> Platformdaki davranışlarınız, ziyaret süreniz, IP adresiniz, cihaz bilgileriniz ve tıklama metrikleriniz.</li>
              <li><strong>Mesajlar ve İletişim:</strong> Öğrenciler ve eğitmenler arasında platform üzerinden yapılan yazışmalar. Güvenlik ve anlaşmazlıkların çözümü amacıyla saklanır.</li>
              <li><strong>Yapay Zeka (AI) Destekli Araçlar Tarafından İşlenen Veriler:</strong> Metin girişleriniz, mesajlaşmalarınız veya ses verileriniz; kişiselleştirilmiş öğrenim önerileri sunmak, dil seviyesi değerlendirmek veya kelime kartları oluşturmak için üçüncü taraf AI araçları üzerinden işlenebilir.</li>
              <li><strong>Konuşma ve Video Analizi:</strong> Görüntülü dersler esnasında kaliteyi ölçmek için ses yüksekliği analizi yapılabilir ancak sohbetin içeriği izinsiz kaydedilmez.</li>
              <li><strong>Eğitmen Doğrulaması (Sadece Eğitmenler İçin):</strong> Kimliğinizi doğrulamak ve dolandırıcılığı önlemek amacıyla üçüncü taraf doğrulama sağlayıcıları aracılığıyla kimlik belgeleriniz ve yüz biyometriniz işlenebilir.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>4. Verileri Toplama Amaçlarımız</h2>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Hizmetlerimizin (ders rezervasyonları, mesajlaşma, arama) kesintisiz sağlanması.</li>
              <li>Üçüncü taraf ödeme sağlayıcıları (Iyzico, Stripe vb.) üzerinden güvenli ödeme/fatura işlemlerinin gerçekleştirilmesi (Kredi kartı verileriniz sunucularımızda saklanmaz).</li>
              <li>Eğitmen sıralama algoritmasının geliştirilmesi: Öğrencilerin doğru eğitmenle eşleşebilmesi için tıklama, ders tamamlama ve puanlama metriklerinin analizi.</li>
              <li>Pazarlama, tanıtım, e-posta bültenleri ve hedeflenmiş reklamlar sunulması.</li>
              <li>Dolandırıcılığın önlenmesi ve platform içi güvenliğin denetimi.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>5. Kişisel Verilerin Paylaşılması</h2>
            <p>Verilerinizi satmıyoruz. Yalnızca aşağıdaki üçüncü taraf hizmet sağlayıcı kategorileriyle güvenli (şifrelenmiş) bir şekilde paylaşabiliriz:</p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Bulut ve Veritabanı Sağlayıcıları:</strong> Verileriniz Supabase (AWS tabanlı) gibi uluslararası güvenlik standartlarına sahip sunucularda saklanır.</li>
              <li><strong>Ödeme Sağlayıcıları:</strong> Braintree, Stripe, Iyzico gibi lisanslı finans kurumları.</li>
              <li><strong>Analitik ve AI Araçları:</strong> Google Analytics, OpenAI vb. (Hizmet kalitesini artırmak için).</li>
              <li><strong>Diğer Kullanıcılar:</strong> Profil adınız, fotoğrafınız ve değerlendirmeleriniz diğer ziyaretçilere görünür.</li>
              <li><strong>Yasal Makamlar:</strong> Resmi bir mahkeme kararı veya dolandırıcılık soruşturması kapsamında yasal mercilerle paylaşılabilir.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>6. Veri Saklama Süresi</h2>
            <p>
              Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. TLA'daki son etkinliğinizin üzerinden <strong>2 yıl</strong> geçmesi halinde hesabınız inaktif kabul edilir. Hesabınızı silmeye karar vermeniz durumunda, kişisel verileriniz <strong>90 gün</strong> içerisinde (yasal olarak saklanması zorunlu finansal ve vergisel veriler hariç) sistemlerimizden tamamen silinir veya anonim hale getirilir.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>7. Veri Sahibi Olarak Haklarınız (KVKK & GDPR)</h2>
            <p>Bir veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Erişim Hakkı:</strong> Sizinle ilgili hangi verileri işlediğimizi öğrenme.</li>
              <li><strong>Düzeltme Hakkı:</strong> Eksik veya yanlış verilerin düzeltilmesini talep etme.</li>
              <li><strong>Silme Hakkı (Unutulma Hakkı):</strong> Yasal bir engel yoksa kişisel verilerinizin tamamen silinmesini isteme.</li>
              <li><strong>İtiraz Etme ve Kısıtlama:</strong> Pazarlama e-postalarına veya otomatik karar verme algoritmalarına itiraz etme.</li>
              <li><strong>Veri Taşınabilirliği:</strong> Verilerinizin makinece okunabilir bir formatta size iletilmesini isteme.</li>
            </ul>
            <p>Bu haklarınızı kullanmak için <strong>legal@turkishlearningacademy.com</strong> adresine e-posta gönderebilirsiniz. Taleplerinize en geç 30 gün içerisinde yanıt verilecektir.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>8. Diğer Gizlilik Taahhütleri</h2>
            <p><strong>8.1. Otomatik Karar Verme (Algoritma):</strong> Platformdaki eğitmen sıralamaları; dönüşüm oranları, ders sayılanı ve profil metriklerine dayalı makine öğrenimi algoritmalarıyla belirlenir. Bu kararlara insan müdahalesi talep etme hakkınız vardır.</p>
            <p><strong>8.2. Çocukların Gizliliği:</strong> TLA, ebeveyn gözetimi olmaksızın 18 yaş altı kullanıcılar için tasarlanmamıştır. 13 yaşın altındaki bireylerden bilerek veya kasıtlı olarak kişisel veri toplamıyoruz.</p>
            <p><strong>8.3. Sınır Ötesi Aktarım:</strong> Platformumuz global bir bulut altyapısı (Cloud) kullandığı için verileriniz Türkiye ve AB dışındaki (ABD gibi) sunucularda güvenle şifrelenmiş olarak işlenebilir. Bu aktarımlar standart sözleşme hükümleriyle güvence altına alınır.</p>
            <p><strong>8.4. Veri İhlali Bildirimleri:</strong> Haklarınızı olumsuz etkileyecek bir veri ihlali (siber saldırı vb.) durumunda, sizleri ve ilgili veri koruma kurullarını yasal süreler içerisinde anında bilgilendiririz.</p>
          </section>

          <section style={{ backgroundColor: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>9. İletişim Bilgileri</h2>
            <p style={{ margin: 0, marginBottom: '16px' }}>Bu Gizlilik Politikası ile ilgili her türlü sorunuz veya kişisel verilerinize dair haklarınızı kullanmak için bizimle aşağıdaki kanallardan iletişime geçebilirsiniz:</p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: 600 }}>
              <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b' }}>Hukuk & Veri Talepleri:</span> <a href="mailto:legal@turkishlearningacademy.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>legal@turkishlearningacademy.com</a></li>
              <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b' }}>Posta Adresi:</span> [Şirketinizin veya Kurumunuzun Adresi, Çankaya / Ankara, Türkiye]</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}