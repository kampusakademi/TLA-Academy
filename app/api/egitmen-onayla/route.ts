import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// DİKKAT: Bu işlem yetkili bir işlem olduğu için anon_key değil, SERVICE_ROLE_KEY gereklidir.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

// Admin yetkileriyle Supabase client oluşturuyoruz
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(req: Request) {
  try {
    // Admin panelinden gönderilen başvuru verilerini alıyoruz
    const { basvuruId, email, tamAd } = await req.json();

    if (!email || !basvuruId) {
      return NextResponse.json({ error: "E-posta ve Başvuru ID zorunludur." }, { status: 400 });
    }

    // 1. Supabase Auth'a Eğitmeni Davet Et
    // (Bu komut çalıştığında öğretmenin mail adresine "Şifrenizi Belirleyip Giriş Yapın" bağlantısı gider)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: tamAd, role: 'egitmen' }
    });

    if (authError) throw authError;

    const yeniUserId = authData.user.id;

    // 2. Veritabanındaki Eğitmen Kaydını Güncelle
    // Başvuruyu 'Aktif' statüsüne geçiriyoruz ve Supabase Auth ID'sini (user_id) bağlıyoruz
    const { error: dbError } = await supabaseAdmin
      .from('egitmenler') 
      .update({ 
        durum: 'Aktif',
        user_id: yeniUserId // Auth ile veritabanı profilini birbirine zincirledik
      })
      .eq('id', basvuruId);

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      message: 'Başvuru onaylandı ve öğretmene davet/şifre maili gönderildi!' 
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}