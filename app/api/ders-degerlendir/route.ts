import { NextResponse } from "next/server";
// Supabase client'ını kendi projendeki yola göre import etmelisin. 
// Örn: import { supabase } from "@/lib/supabase" veya benzeri bir yol.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { dersId, puan, yorum } = await req.json();

    if (!dersId || !puan) {
      return NextResponse.json({ error: "Ders ID ve Puan zorunludur." }, { status: 400 });
    }

    // Supabase'deki 'dersler' tablosunu güncelliyoruz
    const { error } = await supabase
      .from('dersler')
      .update({ puan: puan, yorum: yorum })
      .eq('id', dersId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Değerlendirme kaydedildi!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}