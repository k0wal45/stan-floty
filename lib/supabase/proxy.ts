import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // Refresh session — do NOT use getSession() for auth checks.
  // getClaims() verifies the JWT signature.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  const isLoginPage = request.nextUrl.pathname.startsWith("/logowanie");
  const isSignupPage = request.nextUrl.pathname.startsWith("/rejestracja");

  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/panel") ||
    request.nextUrl.pathname.startsWith("/przedmioty") ||
    request.nextUrl.pathname.startsWith("/wypozyczenia") ||
    request.nextUrl.pathname.startsWith("/analityka") ||
    request.nextUrl.pathname.startsWith("/ustawienia") ||
    request.nextUrl.pathname.startsWith("/admin");

  // Unauthenticated user trying to access protected route OR signup → redirect to login
  if (!claims && (isDashboardRoute || isSignupPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/logowanie";
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to access login page → redirect to dashboard
  if (claims && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
