'use client';

import React, { useState } from 'react';
import {
  Radio,
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

type AuthTab = 'otp' | 'password';
type PasswordMode = 'signin' | 'signup';

export function AuthModal({
  isOpen,
  onClose,
  title = 'Sign In to EventRadar',
  description = 'Real-time hyperlocal event discovery, ticket reservations, and verified hosting.',
}: AuthModalProps) {
  const {
    signInWithOtp,
    verifyOtp,
    signInWithPassword,
    signUp,
    signInWithOAuth,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('otp');
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('signin');

  // OTP State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Password State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Send Magic Link / OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setOtpLoading(true);
    const res = await signInWithOtp(otpEmail.trim());
    setOtpLoading(false);
    if (res.success) {
      setOtpSent(true);
    }
  };

  // Verify 6-digit OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }
    setOtpLoading(true);
    const res = await verifyOtp(otpEmail.trim(), otpCode.trim());
    setOtpLoading(false);
    if (res.success) {
      onClose();
    }
  };

  // Password sign in or sign up
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);
    if (passwordMode === 'signup') {
      const res = await signUp(email.trim(), password, name.trim());
      setAuthLoading(false);
      if (res.success) {
        onClose();
      }
    } else {
      const res = await signInWithPassword(email.trim(), password);
      setAuthLoading(false);
      if (res.success) {
        onClose();
      }
    }
  };

  // OAuth sign in
  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      await signInWithOAuth(provider);
    } catch {
      toast.error(`Could not initiate ${provider} sign in`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl apple-glass-card border border-border/80 shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white shadow-lg shadow-rose-500/25 mb-2.5">
            <Radio className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* 1-Click Social OAuth Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth('google')}
              className="h-10 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth('github')}
              className="h-10 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </Button>
          </div>

          <div className="relative my-3 flex items-center justify-center text-xs text-muted-foreground">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <span className="relative bg-card px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Or Real Account Access
            </span>
          </div>
        </div>

        {/* Tab Selector: Magic Link / OTP vs Email & Password */}
        <div className="flex items-center p-1 rounded-xl bg-muted/60 border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('otp')}
            className={cn(
              'flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
              activeTab === 'otp'
                ? 'bg-background text-rose-600 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Magic Link / OTP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={cn(
              'flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
              activeTab === 'password'
                ? 'bg-background text-rose-600 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Email & Password</span>
          </button>
        </div>

        {/* Tab 1: Magic Link & 6-digit OTP */}
        {activeTab === 'otp' && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="otp-email" className="text-xs font-semibold">
                    Work or Personal Email
                  </Label>
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="name@company.com or name@gmail.com"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    required
                    className="h-10 text-xs rounded-xl apple-glass-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full h-10 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                >
                  {otpLoading ? 'Sending...' : 'Send Magic Sign-In Link / OTP'}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  We’ll send an instant login link and a 6-digit passcode to your real inbox.
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Passcode sent to <strong className="font-semibold">{otpEmail}</strong></span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otp-code" className="text-xs font-semibold">
                    Enter 6-Digit Verification Code
                  </Label>
                  <Input
                    id="otp-code"
                    type="text"
                    maxLength={8}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    className="h-10 text-sm font-mono tracking-widest text-center rounded-xl apple-glass-input"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOtpSent(false)}
                    className="h-10 rounded-xl text-xs font-medium"
                  >
                    Change Email
                  </Button>
                  <Button
                    type="submit"
                    disabled={otpLoading}
                    className="flex-1 h-10 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-[0.98]"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Password Sign In & Sign Up Toggle */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-1 animate-in fade-in duration-200">
            {passwordMode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name" className="text-xs font-semibold">
                  Full Name
                </Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Arya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10 pl-9 text-xs rounded-xl apple-glass-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 pl-9 text-xs rounded-xl apple-glass-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password" className="text-xs font-semibold">
                Password
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pl-9 text-xs rounded-xl apple-glass-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={authLoading}
              className="w-full h-10 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              {authLoading
                ? 'Processing...'
                : passwordMode === 'signup'
                ? 'Create Verified Account'
                : 'Sign In to Radar'}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setPasswordMode(passwordMode === 'signin' ? 'signup' : 'signin')}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline underline-offset-4"
              >
                {passwordMode === 'signin'
                  ? 'Do not have an account? Create one now'
                  : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Real accounts only. Protected by Supabase enterprise auth.</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
