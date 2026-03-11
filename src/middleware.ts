import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session
    const { data: { user } } = await supabase.auth.getUser();

    const isLoginPage = request.nextUrl.pathname === '/login';
    const isPublicAsset = request.nextUrl.pathname.includes('.') || request.nextUrl.pathname.startsWith('/images/');
    const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/');

    // 1. Allow public stuff
    if (isPublicAsset || isLoginPage || isAuthCallback) {
        if (user && isLoginPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return response;
    }

    // 2. Strict Auth Check
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Strict Profile Check ("100% Logged In")
    // Note: We use a lightweight check. If user exists but profile lookup fails, we force logout.
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
    
    if (!profile) {
        // Partial session detected (auth exists but no DB profile)
        // We redirect to login and the AuthContext will handle the cleanup/signOut
        return NextResponse.redirect(new URL('/login?error=incomplete_profile', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
    ],
};
