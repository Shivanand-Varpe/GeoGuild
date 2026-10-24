import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error('Supabase auth code exchange error:', error.message);
    } catch (err) {
      console.error('Failed to exchange auth code:', err);
    }
  }

  // Fallback redirect to destination or home page
  return NextResponse.redirect(`${origin}${next}`);
}
