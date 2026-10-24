'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role?: 'attendee' | 'organizer';
  city?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setAuthModalOpen: (open: boolean) => void;
  signInWithOtp: (email: string) => Promise<AuthResponse>;
  verifyOtp: (email: string, token: string) => Promise<AuthResponse>;
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResponse>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signInWithEmail: (email: string) => Promise<boolean>;
  updateUserName: (newName: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  setAuthModalOpen: () => {},
  signInWithOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  signInWithPassword: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signInWithOAuth: async () => {},
  signInWithEmail: async () => false,
  updateUserName: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const supabase = React.useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email || '',
            name:
              u.user_metadata?.full_name ||
              u.user_metadata?.name ||
              u.email?.split('@')[0] ||
              'Member',
            avatar_url:
              u.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
            role: 'attendee',
          });
        }
      } catch (err) {
        console.error('Supabase initial auth check error:', err);
      } finally {
        if (mounted) setLoading(false);
      }

      // Listen for genuine Supabase auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email || '',
            name:
              u.user_metadata?.full_name ||
              u.user_metadata?.name ||
              u.email?.split('@')[0] ||
              'Member',
            avatar_url:
              u.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
            role: 'attendee',
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Real Email Magic Link / OTP via Supabase
  const signInWithOtp = async (email: string): Promise<AuthResponse> => {
    if (!supabase) {
      toast.error('Authentication service is unavailable.');
      return { success: false, error: 'Supabase client missing' };
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success('Magic link & passcode sent! Please check your email inbox.');
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to send OTP';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Verify 6-digit OTP passcode
  const verifyOtp = async (email: string, token: string): Promise<AuthResponse> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client missing' };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'email',
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name:
            data.user.user_metadata?.full_name ||
            email.split('@')[0] ||
            'Member',
          avatar_url:
            data.user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        toast.success('Signed in successfully!');
        return { success: true };
      }

      return { success: false, error: 'Verification failed' };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'OTP verification error';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Sign In with Email & Password
  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client missing' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name:
            data.user.user_metadata?.full_name ||
            email.split('@')[0] ||
            'Member',
          avatar_url:
            data.user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        toast.success('Welcome back!');
        return { success: true };
      }

      return { success: false };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Sign in error';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Sign Up with Email, Password & Name
  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client missing' };
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || email,
          name: name || email.split('@')[0] || 'Member',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.session.user.id}`,
        });
        toast.success('Account created and signed in!');
      } else {
        toast.success(
          'Account created! Please check your email inbox to verify your account.'
        );
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Sign up error';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // 1-Click Social OAuth (Google & GitHub)
  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (!supabase) {
      toast.error('Authentication service is unavailable.');
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'OAuth sign in failed');
    }
  };

  // Backward compatible helper
  const signInWithEmail = async (email: string): Promise<boolean> => {
    const res = await signInWithOtp(email);
    return res.success;
  };

  const updateUserName = async (newName: string) => {
    if (!newName.trim()) return;
    const cleanName = newName.trim();

    if (supabase && user) {
      try {
        await supabase.auth.updateUser({
          data: { full_name: cleanName },
        });
      } catch {}
    }

    setUser((prev) => (prev ? { ...prev, name: cleanName } : null));
    toast.success('Profile name updated!');
  };

  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    toast.info('Signed out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        setAuthModalOpen,
        signInWithOtp,
        verifyOtp,
        signInWithPassword,
        signUp,
        signInWithOAuth,
        signInWithEmail,
        updateUserName,
        signOut,
      }}
    >
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
