import Link from 'next/link';

export default function YasalHususlarPage() {
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>YASAL HUSUSLAR VE KULLANIM KOŞULLARI</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Son Güncelleme Tarihi: 14 Eylül 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1.05rem', lineHeight: 1.8, color: '#334155' }}>
          
          <p>
            Turkish Learning Academy ("TLA", "Platform", "Biz" veya "Sitemiz") web sitesine ve uygulamalarına hoş geldiniz. Lütfen sitemize erişmeden, üye olmadan veya herhangi bir hizmet satın almadan önce bu Kullanım Koşulları'nı ve Yasal Hususlar'ı ("Sözleşme") dikkatlice okuyunuz.
          </p>
          <p>
            Web sitesine erişim sağlayarak veya platformu kullanarak bu Sözleşme'de yer alan tüm şartları kabul etmiş ve TLA ile yasal olarak bağlayıcı bir sözleşme akdetmiş sayılırsınız. Şartları kabul etmiyorsanız, platformu kullanmamalısınız.
          </p>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>1. Taraflar ve Hizmetin Tanımı (Aracı Hizmet Sağlayıcı Esası)</h2>
            <p><strong>1.1.</strong> Bu sözleşme, TLA ile platformu ziyaret eden, kayıt olan, ders veren veya ders alan kullanıcılar ("Kullanıcı", "Öğrenci" veya "Eğitmen") arasında akdedilmiştir.</p>
            <p><strong>1.2.</strong> TLA, yabancılara Türkçe öğretimi alanında uzmanlaşmış bağımsız eğitmenler ile Türkçe öğrenmek isteyen öğrencileri bir araya getiren dijital bir pazar yeri ve "Aracı Hizmet Sağlayıcı"dır.</p>
            <p><strong>1.3.</strong> TLA bir dil okulu, dil hizmetleri komisyoncusu veya eğitmenlerin işvereni değildir. TLA yalnızca tarafların buluşması, planlama yapması ve güvenli ödeme işlemlerinin gerçekleşmesi için teknik altyapı sunar. TLA, Eğitmenler tarafından sunulan hizmetler üzerinde hiçbir kontrole sahip değildir ve yasaların izin verdiği azami ölçüde bu konudaki tüm sorumluluğu reddeder.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>2. Uygunluk ve Yaş Sınırı</h2>
            <p><strong>2.1.</strong> Platform, yalnızca geçerli yasalar uyarınca yasal olarak bağlayıcı sözleşmeler yapabilen <strong>18 yaş ve üzeri</strong> bireylerin kullanımına sunulmuştur.</p>
            <p><strong>2.2.</strong> 18 yaşından küçük bireyler platformu ancak yasal bir veli veya vasinin ("Veli") gözetimi ve açık onayı altında kullanabilir. Bu durumda, işbu Sözleşme TLA ile Veli arasında akdedilmiş sayılır ve Veli, çocuğunun platform kullanımından, hesap ayarlarından ve gerçekleşen tüm işlemlerden yasal olarak tek başına sorumludur.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>3. Hesap Kaydı, Güvenliği ve Üçüncü Taraf Bağlantıları</h2>
            <p><strong>3.1.</strong> Hizmetlerden yararlanabilmek için doğru, güncel ve eksiksiz bilgilerle bir hesap oluşturmanız gerekmektedir. Bir kullanıcının yalnızca bir (1) aktif hesabı olabilir. Sahte isim kullanmak veya hileli amaçlarla birden fazla hesap açmak kesinlikle yasaktır.</p>
            <p><strong>3.2.</strong> Hesabınızın ve şifrenizin güvenliğini sağlamak tamamen sizin sorumluluğunuzdadır. Hesabınız üzerinden gerçekleştirilen tüm işlemlerden (yetkisiz üçüncü şahıslarca yapılsa dahi) yasal olarak sorumlu tutulursunuz.</p>
            <p><strong>3.3.</strong> Üçüncü taraf sosyal ağ veya teknoloji hesapları (Google, Apple, Facebook vb.) ile giriş yapmanız durumunda, TLA söz konusu hesaplardan gelen profil verilerini platformda kullanma hakkına sahiptir. Bu üçüncü taraf hizmetlerin gizlilik ve güvenlik politikalarından TLA sorumlu tutulamaz.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>4. Platform Dışı İletişim ve Ödemelerin Yasaklanması</h2>
            <p><strong>4.1.</strong> TLA, güvenli bir topluluk ve ödeme altyapısı sağlamak için işlem başına komisyon (hizmet bedeli) modeliyle çalışır.</p>
            <p><strong>4.2.</strong> Öğrenciler ve Eğitmenler, platform üzerinden tanıştıkları kişilerle ders planlamalarını, mesajlaşmalarını ve tüm ödemelerini <strong>sadece TLA platformu üzerinden</strong> yapmak zorundadır.</p>
            <p><strong>4.3.</strong> Komisyon ödememek amacıyla platformu aradan çıkararak kişisel banka hesapları, nakit veya üçüncü taraf ödeme araçlarıyla (IBAN, PayPal, Western Union vb.) ödeme yapmak/almak veya bu amaçla kişisel iletişim bilgileri (e-posta, telefon numarası, Skype, Zoom linki vb.) paylaşmak kesinlikle yasaktır. Bu kuralın ihlali durumunda ilgili kullanıcıların hesapları bakiye iadesi yapılmaksızın kalıcı olarak kapatılır ve TLA doğan maddi zararlarını talep etme hakkını saklı tutar.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>5. Kullanıcı Davranış Kuralları (Kesin Yasaklar)</h2>
            <p>Kullanıcılar platformu kullanırken aşağıdaki kurallara kesinlikle uymak zorundadır:</p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>İstenmeyen İleti (Spam) ve Ticari Reklam:</strong> Diğer üyelere sürekli aynı mesajları göndermek veya platformu TLA'nın izni olmadan ticari bir ürünü/hizmeti pazarlamak için kullanmak yasaktır.</li>
              <li><strong>Flört ve Taciz:</strong> TLA sadece bir dil öğrenme platformudur. Diğer üyelerle romantik ilişki veya cinsel partner bulmak amacıyla iletişime geçmek taciz olarak değerlendirilir. Zorbalık, ısrarlı takip (stalking) ve rahatsız edici arkadaşlık istekleri yasaktır.</li>
              <li><strong>Nefret Söylemi ve Ayrımcılık:</strong> Irk, milliyet, din, cinsiyet, cinsel yönelim, engellilik veya dış görünüşe dayalı saldırgan, aşağılayıcı veya ayrımcı dil kullanmak kesinlikle yasaktır.</li>
              <li><strong>Kimliğe Bürünme ve İfşa:</strong> Başka bir kişinin kimliğini taklit etmek, başkasına ait profil fotoğrafı kullanmak veya başkalarına ait kişisel verileri (telefon, adres, şifre) rızasız paylaşmak suçtur.</li>
              <li><strong>Siyasi ve Dini Tartışmalar:</strong> Platform içi mesajlaşmalarda veya profillerde kutuplaştırıcı siyasi ve dini tartışmalar başlatmak, bu amaçla görseller paylaşmak platformun amacına aykırı olup yasaktır.</li>
              <li><strong>Zararlı İçerikler:</strong> Müstehcenlik, şiddet, kendine zarar verme (intihar, yeme bozukluğu vb. teşviki) içeren veya yasa dışı faaliyetleri destekleyen her türlü materyalin paylaşımı yasaktır.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>6. Ücretlendirme, Ödemeler ve Komisyon</h2>
            <p><strong>6.1. Ödemeler:</strong> Öğrenciler, ders rezervasyonlarını platform üzerinden, TLA'nın entegre ettiği güvenli ödeme altyapıları aracılığıyla Türk Lirası veya desteklenen diğer para birimlerinde yaparlar.</p>
            <p><strong>6.2. Komisyon:</strong> TLA, platformun sürdürülebilirliği, pazarlama faaliyetleri ve teknik altyapı maliyetleri için eğitmenlerin belirlediği ders ücretleri üzerinden belirli bir oranda komisyon/hizmet bedeli kesintisi yapar. Geçerli komisyon oranları eğitmen panelinde şeffaf olarak belirtilir.</p>
            <p><strong>6.3. Bakiye Aktarımı:</strong> Eğitmenlerin kazançları, tamamlanan derslerin ardından hak ediş süreleri ve kesintiler hesaplanarak periyodik olarak belirttikleri banka hesaplarına aktarılır.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>7. İptal, İade ve Derse Katılmama Politikası</h2>
            <p><strong>7.1. Rezervasyon İptali:</strong> Öğrenciler ve eğitmenler, planlanmış bir dersi, dersin başlangıç saatine en az <strong>24 saat</strong> kala ücretsiz olarak iptal edebilir veya yeniden planlayabilirler.</p>
            <p><strong>7.2. Geç İptaller:</strong> Derse 24 saatten az bir süre kala yapılan iptallerde veya öğrencinin derse mazeretsiz olarak katılmaması durumunda, ders ücretinin iadesi yapılmaz ve hak ediş Eğitmen'e ödenir.</p>
            <p><strong>7.3. Eğitmen Kaynaklı İptaller:</strong> Eğitmenin derse katılmaması veya son dakika iptal etmesi durumunda, öğrenciye %100 oranında para iadesi yapılır veya ders hakkı yeniden tanımlanır. Eğitmenlerin sürekli olarak ders iptal etmesi, platformdan ihraç edilmeleriyle sonuçlanabilir.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>8. Kullanıcı İçerikleri ve Lisans Hakları</h2>
            <p><strong>8.1.</strong> Platforma yüklediğiniz profil fotoğrafları, videolar, mesajlar, yorumlar, ders materyalleri ve diğer tüm içeriklerin ("Kullanıcı İçeriği") mülkiyeti size aittir.</p>
            <p><strong>8.2.</strong> TLA Kullanıcı İçeriklerinde mülkiyet iddia etmez; ancak platforma içerik yükleyerek TLA'ya; bu içerikleri platformun tanıtımı, pazarlanması, geliştirilmesi ve yayımlanması amacıyla dünya çapında, geri alınamaz, kalıcı, münhasır olmayan, telifsiz (ücretsiz) olarak kullanma, kopyalama, dağıtma, sergileme ve alt lisanslama hakkı vermiş olursunuz.</p>
            <p><strong>8.3.</strong> Platforma yüklediğiniz içeriklerin üçüncü şahısların telif, patent veya gizlilik haklarını ihlal etmediğini garanti edersiniz.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>9. Fikri Mülkiyet Hakları</h2>
            <p>Sitede yer alan logo, tasarım, yazılım kodu, metinler, grafikler ve TLA markasına ait tüm içerikler TLA'nın veya lisans verenlerinin mülkiyetindedir. TLA'nın açık yazılı izni olmadan platformun herhangi bir parçasını kopyalamak, tersine mühendislik yapmak, veri madenciliği (scraping) uygulamak veya çoğaltmak kesinlikle yasaktır.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>10. Yapay Zeka (AI) Destekli Özellikler Sorumluluk Reddi</h2>
            <p><strong>10.1.</strong> TLA, dil öğrenme deneyimini geliştirmek için zaman zaman platforma yapay zeka (AI) destekli özellikler (örneğin; öğrenme tavsiyeleri, gramer düzeltmeleri, telaffuz geri bildirimleri, otomatik mesaj özetleri) entegre edebilir.</p>
            <p><strong>10.2.</strong> Bu teknolojilerin hızlı gelişen ve deneysel doğası gereği, yapay zeka her zaman hatasız çalışmayabilir ve yanıltıcı, yanlış veya eksik (halüsinasyon) çıktılar verebilir.</p>
            <p><strong>10.3.</strong> Yapay zeka çıktılarının doğruluğunu teyit etmek tamamen sizin sorumluluğunuzdadır. TLA, yapay zeka tarafından sağlanan bilgilerin kesinliğine, güvenilirliğine veya amaca uygunluğuna dair hiçbir garanti vermez ve bu çıktıların kullanımından doğabilecek hiçbir zarardan sorumlu tutulamaz.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>11. Garanti Reddi ("Olduğu Gibi" Esası)</h2>
            <p><strong>11.1.</strong> TLA platformu ve eğitmenler tarafından sunulan dersler "olduğu gibi" ve "mevcut haliyle" sunulmaktadır.</p>
            <p><strong>11.2.</strong> TLA, eğitmenlerin profesyonel akreditasyonu, kaydı, diploma geçerliliği veya kişisel karakterleri hakkında hiçbir açık veya zımni garanti vermez. TLA hiçbir eğitmeni kusursuz olarak tavsiye etmez.</p>
            <p><strong>11.3.</strong> Öğrenciler, eğitmen seçerken ve (tanımadıkları kişilerle) çevrimiçi veya çevrimdışı iletişim kurarken kişisel güvenliklerini ve mülkiyetlerini korumak için gerekli sağduyuyu göstermek zorundadır.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>12. Sorumluluğun Sınırlandırılması</h2>
            <p>Yasaların izin verdiği en geniş ölçüde, TLA veya lisans verenleri; platformun kullanımından doğan kar kaybı, veri kaybı, itibar kaybı veya herhangi bir dolaylı, özel, cezai veya tesadüfi zarardan sorumlu tutulamaz. TLA'nın herhangi bir nedenle doğabilecek toplam mali sorumluluğu, ilgili ihtilafa konu olan hizmet için son 6 (altı) ay içinde sizden fiilen tahsil edilen hizmet bedeli (komisyon) ile sınırlıdır.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>13. Tazminat</h2>
            <p>Platformu kullanımınızdan, Sözleşme'yi ihlal etmenizden, diğer üyelerle yaşadığınız ihtilaflardan veya üçüncü şahısların fikri mülkiyet/gizlilik haklarını ihlal etmenizden doğacak her türlü yasal iddia, dava, maliyet ve avukatlık ücretine karşı TLA'yı, çalışanlarını ve yöneticilerini savunmayı, zararlarını tazmin etmeyi ve muaf tutmayı kabul edersiniz.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>14. Hesabın Askıya Alınması ve Fesih</h2>
            <p><strong>14.1.</strong> Dilediğiniz zaman hesabınızı kapatarak bu Sözleşme'yi feshedebilirsiniz.</p>
            <p><strong>14.2.</strong> TLA, bu Sözleşme'nin veya davranış kurallarının ihlal edildiğine dair makul bir şüphe duyması halinde, önceden haber vermeksizin ve herhangi bir tazminat yükümlülüğü olmaksızın hesabınızı askıya alabilir, iptal edebilir, içeriklerinizi silebilir veya kazançlarınızı dondurabilir. Fesih durumunda, platforma yeniden kayıt olmanız engellenebilir.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>15. Uyuşmazlıkların Çözümü ve Yetkili Mahkeme</h2>
            <p><strong>15.1. Gayri Resmi Çözüm:</strong> Taraflar, hukuki bir süreç veya dava başlatmadan önce ortaya çıkan anlaşmazlıkları, şikayetleri veya ihtilafları TLA müşteri hizmetleri aracılığıyla iyi niyet çerçevesinde gayri resmi yollarla (en az 30 gün boyunca) çözmek için müzakere etmeyi kabul eder. Bu aşama, dava açılmadan önce bir ön koşuldur.</p>
            <p><strong>15.2. Yetkili Mahkeme:</strong> Gayri resmi yollarla çözülemeyen ve bu Sözleşme'den doğabilecek her türlü ihtilafın çözümünde Türkiye Cumhuriyeti kanunları esastır ve ihtilafların çözümünde <strong>Ankara Mahkemeleri ile İcra Daireleri</strong> münhasıran yetkilidir.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '16px' }}>16. Sözleşmenin Bütünlüğü ve Değişiklikler</h2>
            <p><strong>16.1.</strong> Bu Sözleşme, TLA ile aranızdaki ilişkinin tamamını kapsar. TLA'nın herhangi bir hakkını kullanmaması, bu haktan feragat ettiği anlamına gelmez.</p>
            <p><strong>16.2.</strong> TLA, teknik, ticari veya yasal gereklilikler sebebiyle bu Sözleşme'yi önceden haber vermeksizin tek taraflı olarak güncelleme hakkını saklı tutar. Yapılan değişiklikler sitede yayımlandığı an yürürlüğe girer. Platformu kullanmaya devam etmeniz, değiştirilmiş şartları kabul ettiğiniz anlamına gelir.</p>
          </section>

          <section style={{ backgroundColor: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>17. İletişim Bilgileri</h2>
            <p style={{ margin: 0, marginBottom: '16px' }}>Bu Kullanım Koşulları ve Yasal Hususlar ile ilgili her türlü sorunuz, şikayetiniz veya yasal bildiriminiz için bizimle aşağıdaki kanallardan iletişime geçebilirsiniz:</p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: 600 }}>
              <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b' }}>Çevrimiçi Destek:</span> <Link href="/iletisim" style={{ color: '#3b82f6', textDecoration: 'none' }}>İletişim ve Destek Sayfası</Link></li>
              <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b' }}>E-posta:</span> <a href="mailto:destek@turkishlearningacademy.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>destek@turkishlearningacademy.com</a></li>
              <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b' }}>Posta Adresi:</span> [Şirketinizin veya Kurumunuzun Tam Açık Adresi, Çankaya / Ankara, Türkiye]</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}