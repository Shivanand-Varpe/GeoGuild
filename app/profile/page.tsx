'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Tag,
  CalendarCheck,
  Check,
  ArrowRight,
  ShieldCheck,
  Compass,
  Pencil,
  Radio,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCity } from '@/components/providers/CityProvider';
import { useEvents } from '@/components/providers/EventsProvider';
import { INDIAN_CITIES } from '@/lib/constants';
import { EventCard } from '@/components/events/EventCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AVAILABLE_INTEREST_TAGS = [
  'AI & Agents',
  'Hackathons',
  'Web3 & Crypto',
  'Founder Meetups',
  'Indie Acoustic',
  'Product Design',
  'Open Source',
  'Running & Fitness',
  'Pottery & Arts',
  'Coffee & Mixers',
  'Next.js & React',
  'Cloud Architecture',
];

export default function ProfilePage() {
  const { user, loading, openAuthModal, signOut, updateUserName } = useAuth();
  const { currentCity, setCity } = useCity();
  const { events, userRsvpIds, isRsvped, toggleRsvp } = useEvents();

  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Selected interest tags
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'AI & Agents',
    'Hackathons',
    'Founder Meetups',
  ]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateUserName(nameInput.trim());
      setEditNameDialogOpen(false);
    }
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) => {
      const exists = prev.includes(tag);
      const updated = exists ? prev.filter((t) => t !== tag) : [...prev, tag];
      toast.info(exists ? `Removed #${tag}` : `Added #${tag} to your radar!`);
      return updated;
    });
  };

  // Filter events user has RSVP'd to
  const rsvpedEvents = events.filter((e) => userRsvpIds.includes(e.id));

  // Protect Profile: If not signed in, show Apple-style login gate
  if (!user && !loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full p-8 rounded-3xl apple-glass-card border border-border/80 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white shadow-xl shadow-rose-500/25">
            <Radio className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Sign In to Your Profile
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Access your registered tickets, manage event RSVPs, and personalize your hyperlocal city preferences. Real verified accounts only.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button
              onClick={() => openAuthModal()}
              className="w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] shadow-md shadow-rose-600/25 transition-all cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              <span>Sign In with Real Account</span>
            </Button>

            <Link
              href="/explore"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-full h-11 rounded-2xl text-xs font-semibold apple-glass-input'
              )}
            >
              Browse Public Events
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Protected by Supabase Auth. No bots or guest shortcuts.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl apple-glass-card border border-border/80 shadow-lg flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar size="lg" className="h-20 w-20 ring-4 ring-rose-500/20 shadow-md">
            <AvatarImage
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'User'}`}
              alt={user?.name || 'Explorer'}
            />
            <AvatarFallback className="text-xl font-bold bg-muted">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {user?.name || 'Verified Explorer'}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setNameInput(user?.name || '');
                  setEditNameDialogOpen(true);
                }}
                title="Edit Name"
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <ShieldCheck className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                Verified Account
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                {currentCity.name} Hub
              </span>
            </div>
          </div>
        </div>

        {/* Auth Action */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="rounded-xl text-xs font-semibold hover:text-rose-500 hover:border-rose-500/30 active:scale-[0.98] cursor-pointer"
          >
            Sign Out
          </Button>

          <Link
            href="/profile/my-events"
            className={cn(
              buttonVariants({ variant: 'secondary', size: 'sm' }),
              'rounded-xl text-xs font-semibold gap-1.5'
            )}
          >
            <span>Organizer Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid: Preferences & City Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Default City Preference Card */}
        <div className="p-6 rounded-3xl apple-glass-card border border-border/80 space-y-4">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
            <MapPin className="h-4 w-4" />
            <span>Default Radar Hub</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">Primary Indian City</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Events on your landing page and explore feed will automatically prioritize gatherings in this city.
          </p>

          <div className="pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'w-full h-11 px-4 rounded-xl text-xs font-medium justify-between apple-glass-input cursor-pointer active:scale-[0.98]'
                )}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span className="font-semibold text-foreground">{currentCity.name}</span>
                  <span className="text-muted-foreground text-[11px]">({currentCity.state})</span>
                </div>
                <span className="text-xs text-rose-500 font-medium">Change</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-1 rounded-xl apple-glass-card shadow-xl max-h-60 overflow-y-auto">
                {INDIAN_CITIES.map((c) => (
                  <DropdownMenuItem
                    key={c.slug}
                    onClick={() => {
                      setCity(c);
                      toast.success(`Default radar city updated to ${c.name}`);
                    }}
                    className={cn(
                      'text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex justify-between',
                      currentCity.slug === c.slug ? 'bg-rose-500/10 text-rose-600 font-semibold' : ''
                    )}
                  >
                    <span>{c.name} ({c.state})</span>
                    {currentCity.slug === c.slug && <Check className="h-3.5 w-3.5 text-rose-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Interests & Topics Selection Card */}
        <div className="p-6 rounded-3xl apple-glass-card border border-border/80 space-y-4">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
            <Tag className="h-4 w-4" />
            <span>Topics & Interests</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">Personalize Your Feed</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Select the categories and themes you want to be notified about.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {AVAILABLE_INTEREST_TAGS.map((tag) => {
              const isSelected = selectedInterests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-[0.97]',
                    isSelected
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'border-border/80 hover:border-foreground/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isSelected ? `✓ #${tag}` : `#${tag}`}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* RSVP'd Events Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
              <CalendarCheck className="h-4 w-4" />
              <span>Upcoming Attendance</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              My Confirmed RSVPs ({rsvpedEvents.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              All events you have registered for with direct Google Maps directions.
            </p>
          </div>

          <Link
            href="/explore"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full text-xs font-semibold')}
          >
            <Compass className="h-3.5 w-3.5 mr-1.5" />
            Discover More
          </Link>
        </div>

        {rsvpedEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rsvpedEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                description={event.description}
                image_url={event.image_url}
                date={event.start_time}
                city={event.city}
                address={event.address}
                category={event.category}
                rsvp_count={event.rsvp_count}
                latitude={event.latitude}
                longitude={event.longitude}
                is_free={event.is_free}
                price={event.price}
                isRsvped={isRsvped(event.id)}
                onRsvpClick={toggleRsvp}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl apple-glass-card border border-dashed border-border/80 max-w-lg mx-auto">
            <CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
            <h3 className="font-bold text-base text-foreground">No Upcoming RSVPs</h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
              You haven&apos;t RSVP&apos;d to any events yet. Check out what is trending in {currentCity.name}!
            </p>
            <Link
              href="/explore"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'mt-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold'
              )}
            >
              Explore Events Now
            </Link>
          </div>
        )}
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editNameDialogOpen} onOpenChange={setEditNameDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl apple-glass-card shadow-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile Name</DialogTitle>
            <DialogDescription>
              Update your display name visible across event attendances and community walls.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveName} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-xs font-semibold">Display Name</Label>
              <Input
                id="display-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name..."
                className="apple-glass-input rounded-xl text-sm"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditNameDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
