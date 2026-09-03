import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // 1. Gidilmek istenen yolları (rotaları) tanımlıyoruz
  const isTeacherRoute = pathname.startsWith('/teacher-dashboard');
  const isAdminRoute = pathname.startsWith('/admin-dashboard');
  const isStudentRoute = pathname.startsWith('/dashboard'); // Öğrenci paneli

  // 2. KULLANICI HİÇ GİRİŞ YAPMAMIŞSA
  if (!user && (isTeacherRoute || isAdminRoute || isStudentRoute)) {
    // Korumalı bir yere girmeye çalışıyorsa anında ana sayfaya at
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. KULLANICI GİRİŞ YAPMIŞSA (ROL KONTROLÜ)
  if (user) {
    const userRole = user.user_metadata?.role;

    // A. Öğrenci, Öğretmen paneline girmeye çalışıyorsa
    if (isTeacherRoute && userRole !== 'ogretmen' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // B. Admin olmayan biri Admin paneline girmeye çalışıyorsa
    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

// Güvenlik görevlisinin HANGİ DOSYALAR HARİÇ çalışacağını belirliyoruz
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};