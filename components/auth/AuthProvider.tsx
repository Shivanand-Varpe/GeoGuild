'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role?: 'attendee' | 'organizer';
  city?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithEmail: (email: string) => Promise<boolean>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signInAsGuest: (role?: 'attendee' | 'organizer') => void;
  updateUserName: (newName: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDemoMode: false,
  signInWithEmail: async () => false,
  signInWithOAuth: async () => {},
  signInAsGuest: () => {},
  updateUserName: () => {},
  signOut: async () => {},
});

const DEMO_USER_KEY = 'eventradar_demo_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const supabase = React.useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // First check for active demo user in localStorage
      try {
        const storedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (storedDemo) {
          const parsed = JSON.parse(storedDemo);
          if (mounted) {
            setUser(parsed);
            setIsDemoMode(true);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Continue
      }

      // Check live Supabase session if configured
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || 'user@eventradar.local',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Explorer',
              avatar_url: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
            });
            setIsDemoMode(false);
          }
        } catch (err) {
          console.warn('Supabase auth session check fell back to offline demo mode:', err);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const signInWithEmail = async (email: string): Promise<boolean> => {
    // If live supabase is configured
    if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          },
        });
        if (error) throw error;
        toast.success('Magic sign-in link sent to your email!');
        return true;
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Sign in error');
      }
    }

    // Demo fallback sign-in
    const demoUser: AuthUser = {
      id: 'demo-user-' + Math.random().toString(36).substring(2, 7),
      email: email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: 'attendee',
      city: 'Bengaluru',
    };

    setUser(demoUser);
    setIsDemoMode(true);
    try {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    } catch {}
    toast.success(`Welcome back, ${demoUser.name}!`);
    return true;
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        return;
      } catch (err: unknown) {
        toast.error((err as Error).message || 'OAuth sign in failed');
      }
    }

    // Demo fallback OAuth
    signInAsGuest('attendee');
  };

  const signInAsGuest = (role: 'attendee' | 'organizer' = 'attendee') => {
    const isOrg = role === 'organizer';
    const guestUser: AuthUser = {
      id: isOrg ? 'org-vecnaverse' : 'guest-attendee-01',
      email: isOrg ? 'organizer@vecnaverse.dev' : 'attendee@eventradar.local',
      name: isOrg ? 'Arya Sharma (Organizer)' : 'Guest Explorer',
      avatar_url: isOrg
        ? 'https://api.dicebear.com/7.x/bottts/svg?seed=VecnaverseOrg'
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=GuestRadar',
      role,
      city: 'Bengaluru',
    };

    setUser(guestUser);
    setIsDemoMode(true);
    try {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(guestUser));
    } catch {}
    toast.success(`Signed in as ${guestUser.name}`);
  };

  const updateUserName = (newName: string) => {
    if (!newName.trim()) return;
    setUser((prev) => {
      const updated = prev
        ? { ...prev, name: newName.trim() }
        : {
            id: 'guest-explorer',
            email: 'guest@eventradar.local',
            name: newName.trim(),
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newName)}`,
            role: 'attendee' as const,
          };
      try {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success('Profile name updated!');
  };

  const signOut = async () => {
    if (supabase && !isDemoMode) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    setIsDemoMode(false);
    try {
      localStorage.removeItem(DEMO_USER_KEY);
    } catch {}
    toast.info('Signed out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        signInWithEmail,
        signInWithOAuth,
        signInAsGuest,
        updateUserName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
