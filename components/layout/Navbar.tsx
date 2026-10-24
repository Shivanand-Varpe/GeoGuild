'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Radio, 
  MapPin, 
  PlusCircle, 
  Compass, 
  CalendarDays, 
  User as UserIcon, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Navigation,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useCity } from '@/components/providers/CityProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,

  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentCity, setCity, cities, detectLocation, isLocating } = useCity();
  const { user, signInWithEmail, signInAsGuest, signOut } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();

  const handleDetectLocation = async () => {
    toast.info('Detecting your GPS location...');
    const detected = await detectLocation();
    if (detected) {
      toast.success(`Location snapped to ${detected.name}!`);
    } else {
      toast.error('Could not detect location. Please check browser permissions.');
    }
  };
  
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/create', label: 'Create Event', icon: PlusCircle },
    { href: '/profile/my-events', label: 'My Events', icon: CalendarDays },
    { href: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setEmailLoading(true);
    await signInWithEmail(emailInput);
    setEmailLoading(false);
    setAuthDialogOpen(false);
    setEmailInput('');
  };

  const handleGuestLogin = (role: 'attendee' | 'organizer') => {
    signInAsGuest(role);
    setAuthDialogOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full apple-glass-nav transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo with Animated Radar Beacon */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group cursor-pointer select-none active:scale-[0.98] transition-transform"
          >
            <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20 group-hover:shadow-rose-500/35 transition-all">
              {/* Radar pulse ping effect */}
              <span className="absolute h-full w-full rounded-xl bg-rose-400 radar-ping-beacon pointer-events-none" />
              <Radio className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
                Event<span className="text-rose-500">Radar</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  LIVE
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium -mt-1 tracking-wide">
                Hyperlocal Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-3.5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 active:scale-[0.97]',
                    isActive
                      ? 'text-foreground bg-foreground/5 shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-rose-500' : 'text-muted-foreground')} />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-rose-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Area: City Selector + Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* City Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'apple-glass-input rounded-full h-8 px-3 gap-1.5 text-xs font-medium cursor-pointer hover:border-foreground/20 active:scale-[0.97]'
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentCity.name}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl apple-glass-card shadow-xl">
                <DropdownMenuItem
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 rounded-lg cursor-pointer mb-1 transition-colors"
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{isLocating ? 'Detecting GPS...' : 'Auto-Detect My City'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                  Select Indian City
                </div>
                {cities.map((city) => (
                  <DropdownMenuItem
                    key={city.slug}
                    onClick={() => setCity(city)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors',
                      currentCity.slug === city.slug ? 'bg-rose-500/10 text-rose-600 font-semibold' : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">{city.name}</span>
                      <span className="text-[10px] text-muted-foreground">{city.state}</span>
                    </div>
                    {currentCity.slug === city.slug && (
                      <Check className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Apple Theme Toggle (Light / Dark) */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              className="rounded-full h-8 w-8 text-foreground/80 hover:text-foreground hover:bg-muted/60 cursor-pointer active:scale-[0.95]"
              title={mounted && resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Auth Button / Profile Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full outline-hidden cursor-pointer active:scale-[0.95] transition-transform">
                  <Avatar size="sm" className="ring-2 ring-rose-500/30 ring-offset-1 hover:ring-rose-500/60 transition-all">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback className="text-xs font-bold bg-rose-500 text-white">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl apple-glass-card shadow-xl">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {user.role === 'organizer' ? 'Organizer' : 'Explorer'}
                      </span>
                      <span className="inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                        {currentCity.name}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-muted"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>My Profile & Tags</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/profile/my-events')}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-muted"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Dashboard & Events</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/create')}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer text-rose-500 font-medium hover:bg-rose-500/10"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-rose-500" />
                    <span>Host New Event</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => setAuthDialogOpen(true)}
                className="rounded-full h-8 px-3.5 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 active:scale-[0.97] transition-all shadow-xs"
              >
                <LogIn className="h-3.5 w-3.5 mr-1" />
                <span>Sign In</span>
              </Button>
            )}

            {/* Mobile Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-full h-8 w-8 text-foreground"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-4 pt-3 pb-5 space-y-2 apple-glass-nav animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all',
                    isActive
                      ? 'bg-rose-500/10 text-rose-600 font-semibold'
                      : 'text-foreground/80 hover:bg-muted'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-rose-500' : 'text-muted-foreground')} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Auth Modal Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl apple-glass-card">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/25 mb-2">
              <Radio className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Welcome to EventRadar</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Discover real-world experiences, tech hackathons, and gatherings in your city.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Demo Mode Instant Buttons */}
          <div className="space-y-3 pt-2">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                <span>Instant Hackathon Evaluation Access</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Click below to immediately simulate a live attendee or organizer session without passwords.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-9 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted active:scale-[0.98]"
                onClick={() => handleGuestLogin('attendee')}
              >
                <UserIcon className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                Sign in as Attendee
              </Button>
              <Button
                variant="outline"
                className="h-9 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted active:scale-[0.98]"
                onClick={() => handleGuestLogin('organizer')}
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                Sign in as Organizer
              </Button>
            </div>

            <div className="relative my-3 flex items-center justify-center text-xs text-muted-foreground">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <span className="relative bg-popover px-2 text-[11px] uppercase tracking-wider">
                Or with Email
              </span>
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-2.5">
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="h-9 rounded-xl text-xs apple-glass-input"
              />
              <Button
                type="submit"
                disabled={emailLoading}
                className="w-full h-9 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98] transition-all"
              >
                {emailLoading ? 'Sending link...' : 'Continue with Email'}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
