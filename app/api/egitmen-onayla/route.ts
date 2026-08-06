import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin yetkileriyle Supabase client oluşturuyoruz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(req: Request) {
  try {
    const { basvuruId, email, tamAd } = await req.json();

    if (!email || !basvuruId) {
      return NextResponse.json({ error: "E-posta ve Başvuru ID zorunludur." }, { status: 400 });
    }

    // 1. BAŞVURUYU ÇEK: Önce basvurular tablosundan kişinin tüm bilgilerini alalım
    const { data: basvuru, error: fetchError } = await supabaseAdmin
      .from('basvurular')
      .select('*')
      .eq('id', basvuruId)
      .single();

    if (fetchError || !basvuru) throw new Error("Başvuru bulunamadı.");

    // 2. YENİ KULLANICI HESABI OLUŞTUR VE MAİL AT
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: tamAd, role: 'egitmen' },
      redirectTo: 'http://localhost:3000/sifre-belirle'
    });

    if (authError) throw new Error("Kullanıcı oluşturulurken hata: " + authError.message);

    const yeniUserId = authData.user.id;

    // 3. EĞİTMENLER TABLOSUNA UPSERT (Varsa Güncelle, Yoksa Ekle)
    // 🚀 ÇÖZÜM BURADA: insert yerine upsert kullanıyoruz ve çakışma durumunda ne yapacağını söylüyoruz.
    const { error: upsertError } = await supabaseAdmin
      .from('egitmenler')
      .upsert({
        user_id: yeniUserId, 
        tam_ad: basvuru.tam_ad,
        email: basvuru.email,
        saatlik_ucret: basvuru.saatlik_ucret || null,
        biyografi: basvuru.biyografi || '',
        ders_turu: basvuru.ders_turu || 'Türkçe',
        amac: basvuru.amac || '',
        odak: basvuru.odak || '',
        seviye: basvuru.seviye || '',
        durum: 'Aktif' 
      }, { onConflict: 'user_id' }); // "Eğer user_id zaten varsa hata verme, üstteki verilerle mevcut satırı ez (güncelle)" diyoruz.

    if (upsertError) throw new Error("Eğitmenler tablosuna eklenirken hata: " + upsertError.message);

    // 4. BAŞVURUYU ONAYLANDI OLARAK İŞARETLE
    await supabaseAdmin
      .from('basvurular')
      .update({ durum: 'Onaylandı' })
      .eq('id', basvuruId);

    return NextResponse.json({ 
      success: true, 
      message: 'Başvuru onaylandı! Eğitmen hesabı oluşturuldu ve davet maili gönderildi.' 
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}