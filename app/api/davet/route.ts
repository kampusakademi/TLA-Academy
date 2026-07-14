import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin yetkisine sahip özel Supabase bağlantısı
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Supabase üzerinden davet e-postası gönderiyoruz
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  redirectTo: 'http://localhost:3000/sifre-belirle'
});

    if (error) throw error;

    // Oluşan GERÇEK kullanıcının bilgilerini ön yüze geri gönderiyoruz
    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}