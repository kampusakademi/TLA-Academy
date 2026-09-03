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

  const isTeacherRoute = pathname.startsWith('/teacher-dashboard');
  const isAdminRoute = pathname.startsWith('/admin-dashboard');
  const isStudentRoute = pathname.startsWith('/dashboard');

  // 1. KULLANICI HİÇ GİRİŞ YAPMAMIŞSA
  // (Öğretmen ve Admin sayfalarının kendi içinde giriş ekranları olduğu için !user kontrolünden çıkarıldı)
  if (!user && isStudentRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. KULLANICI GİRİŞ YAPMIŞSA (ROL KONTROLÜ)
  if (user) {
    const userRole = user.user_metadata?.role;

    // A. Giriş yapmış biri Öğretmen paneline gidiyor ama rolü ogretmen veya admin değilse
    if (isTeacherRoute && userRole && userRole !== 'ogretmen' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // B. Giriş yapmış biri Admin paneline gidiyor ama rolü admin değilse
    if (isAdminRoute && userRole && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};