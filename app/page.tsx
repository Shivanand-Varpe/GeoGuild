'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Radio,
  ArrowRight,
  Sparkles,
  Navigation,
  Users,
  Compass,
  Cpu,
  Code,
  Music,
  BookOpen,
  Trophy,
  Palette,
  Utensils,
  ChevronRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCity } from '@/components/providers/CityProvider';
import { useEvents } from '@/components/providers/EventsProvider';
import { CATEGORIES } from '@/lib/constants';
import { EventCard } from '@/components/events/EventCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Helper for category icons
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Cpu,
  Code,
  Music,
  Users,
  BookOpen,
  Trophy,
  Palette,
  Utensils,
};

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function HomePage() {
  const router = useRouter();
  const { currentCity, setCity, cities, detectLocation, isLocating } = useCity();
  const { events, isRsvped, toggleRsvp } = useEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  const handleDetectLocation = async () => {
    toast.info('Detecting your GPS location...');
    const detected = await detectLocation();
    if (detected) {
      toast.success(`Location snapped to ${detected.name}!`);
    } else {
      toast.error('Could not detect location. Please check browser permissions.');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    params.set('city', currentCity.slug);
    router.push(`/explore?${params.toString()}`);
  };

  // Filter events for Trending section
  const trendingEvents = React.useMemo(() => {
    // Priority: current city events, then all events
    let list = events.filter(
      (ev) => ev.city.toLowerCase() === currentCity.name.toLowerCase()
    );
    if (list.length === 0) {
      list = events;
    }
    if (selectedCategoryTab !== 'all') {
      list = list.filter(
        (ev) =>
          ev.category.toLowerCase().includes(selectedCategoryTab.toLowerCase()) ||
          CATEGORIES.find((c) => c.id === selectedCategoryTab)?.name.toLowerCase() ===
            ev.category.toLowerCase()
      );
    }
    return list.slice(0, 6);
  }, [events, currentCity, selectedCategoryTab]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-rose-500/5 via-amber-500/5 to-transparent">
        {/* Ambient background light orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-rose-500/15 to-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* Radar Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full apple-glass-card shadow-xs mb-6 text-xs font-semibold text-foreground animate-in fade-in zoom-in-95 duration-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span>HYPERLOCAL RADAR ACTIVE IN</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold underline decoration-rose-500/30 underline-offset-2">
              {currentCity.name}
            </span>
          </div>

          {/* Optical tightened Headline */}
          <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-6">
            Discover What’s{' '}
            <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              Happening
            </span>{' '}
            Around You.
          </h1>

          {/* Subtitle with relaxed leading */}
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 font-normal">
            Real-time urban discovery for non-stop AI hackathons, founder coffee mixers, indie acoustic nights, and hands-on workshops across Indian metros.
          </p>

          {/* Apple Glassmorphism Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-3xl p-2 rounded-2xl apple-glass-card shadow-xl shadow-rose-950/5 flex flex-col sm:flex-row items-center gap-2 border border-white/40 dark:border-white/10"
          >
            {/* City Selector inside Search */}
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-11 px-3.5 w-full sm:w-auto justify-start sm:justify-center rounded-xl font-medium text-xs text-foreground hover:bg-muted/60 gap-2 shrink-0 cursor-pointer active:scale-[0.98]'
                )}
              >
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="truncate">{currentCity.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto sm:ml-1">Change</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1.5 rounded-xl apple-glass-card shadow-xl max-h-80 overflow-y-auto">
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
                <div className="h-px bg-border/50 my-1" />
                {cities.map((c) => (
                  <DropdownMenuItem
                    key={c.slug}
                    onClick={() => setCity(c)}
                    className="flex justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{c.state}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:block h-6 w-px bg-border/60" />

            {/* Keyword Search Input */}
            <div className="relative flex-1 w-full flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search hackathons, music, AI meetups, pottery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-sm bg-transparent rounded-xl outline-none placeholder:text-muted-foreground focus:ring-0 text-foreground"
              />
            </div>

            {/* CTA Button */}
            <Button
              type="submit"
              className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] shadow-md shadow-rose-600/20 transition-all shrink-0 cursor-pointer"
            >
              <span>Find Events Near You</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          {/* Quick Category Chips under Hero */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">Popular right now:</span>
            {['Tech & AI', 'Hackathons', 'Live Music', 'Coffee Mixers'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  router.push(`/explore?q=${encodeURIComponent(tag)}&city=${currentCity.slug}`);
                }}
                className="px-3 py-1 rounded-full text-xs font-medium border border-border/70 hover:border-rose-500/40 hover:bg-rose-500/5 text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-[0.97]"
              >
                #{tag}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* TRENDING EVENTS NEAR YOU */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs uppercase tracking-wider mb-1.5">
              <TrendingUp className="h-4 w-4" />
              <span>Happening This Week</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Trending Near {currentCity.name}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Curated experiences with high attendance and active RSVPs.
            </p>
          </div>

          <Link
            href={`/explore?city=${currentCity.slug}`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'rounded-full self-start md:self-auto gap-1.5 text-xs font-semibold hover:border-rose-500/40 hover:text-rose-500 active:scale-[0.98]'
            )}
          >
            <span>View all in {currentCity.name}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 no-scrollbar">
          <Button
            size="sm"
            variant={selectedCategoryTab === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategoryTab('all')}
            className={cn(
              'rounded-full h-8 px-4 text-xs font-medium transition-all shrink-0 cursor-pointer',
              selectedCategoryTab === 'all' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'hover:bg-muted'
            )}
          >
            All Categories
          </Button>
          {CATEGORIES.slice(0, 5).map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategoryTab === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={cn(
                'rounded-full h-8 px-4 text-xs font-medium transition-all shrink-0 cursor-pointer',
                selectedCategoryTab === cat.id ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'hover:bg-muted'
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        {trendingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingEvents.map((event) => {
              const distanceKm = calculateDistanceKm(
                currentCity.latitude,
                currentCity.longitude,
                event.latitude,
                event.longitude
              );
              return (
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
                  distanceKm={distanceKm}
                  isRsvped={isRsvped(event.id)}
                  onRsvpClick={toggleRsvp}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl apple-glass-card border border-dashed border-border/80">
            <Radio className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
            <h3 className="font-bold text-base text-foreground">No events found in this category</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Be the first to create an event in {currentCity.name} for this category!
            </p>
            <Link
              href="/create"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'mt-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white'
              )}
            >
              Host Event
            </Link>
          </div>
        )}
      </section>

      {/* BROWSE BY CATEGORY */}
      <section className="py-14 sm:py-20 bg-muted/20 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-2 text-xs font-semibold px-3 py-1 rounded-full">
              Discover Passions
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Browse by Category
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              Explore urban happenings categorized specifically for techies, creatives, and culture buffs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const IconComp = CATEGORY_ICON_MAP[cat.icon] || Compass;
              // Count matching events
              const count = events.filter((e) =>
                e.category.toLowerCase().includes(cat.name.toLowerCase()) ||
                e.category.toLowerCase().includes(cat.id.toLowerCase())
              ).length;

              return (
                <Link
                  key={cat.id}
                  href={`/explore?category=${cat.id}&city=${currentCity.slug}`}
                  className="group relative p-5 rounded-2xl apple-glass-card hover:border-rose-500/30 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                      <IconComp className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      {count} {count === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-rose-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Explore category</span>
                      <ArrowRight className="h-3 w-3 opacity-70" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW EVENTRADAR WORKS (3-STEP) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-rose-500 font-bold text-xs uppercase tracking-wider mb-2 block">
            Seamless Experience
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How EventRadar Works
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            Engineered with zero friction so you can spend less time searching and more time experiencing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="p-6 rounded-2xl apple-glass-card relative flex flex-col items-start hover:-translate-y-1 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-rose-500/20 mb-5">
              <Radio className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Step 01</span>
            <h3 className="text-lg font-bold text-foreground mb-2">1. Hyperlocal Radar</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Set your city or current locality. Our radar pulls the most active non-stop hackathons, builder mixers, and gatherings within your driving distance.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl apple-glass-card relative flex flex-col items-start hover:-translate-y-1 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20 mb-5">
              <Navigation className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Step 02</span>
            <h3 className="text-lg font-bold text-foreground mb-2">2. Instant Maps & Directions</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              One tap opens exact GPS turn-by-turn navigation in Google Maps (`https://www.google.com/maps?q=lat,lng`). Never get lost looking for a venue.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl apple-glass-card relative flex flex-col items-start hover:-translate-y-1 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20 mb-5">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Step 03</span>
            <h3 className="text-lg font-bold text-foreground mb-2">3. RSVP & Connect</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reserve your spot with a single click. Keep track of all upcoming events on your personal dashboard and connect with other attendees.
            </p>
          </div>

        </div>

        {/* Hackathon Callout Banner */}
        <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-rose-600/20">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Are you hosting a hackathon or meetup?</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Publish Your Event in 60 Seconds
            </h3>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              Get discovered by thousands of active attendees across Bengaluru, Mumbai, Delhi, and beyond. Free hosting for community organizers.
            </p>
          </div>

          <Link
            href="/create"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-12 px-8 rounded-full bg-white text-rose-600 hover:bg-white/90 font-bold text-sm shadow-md active:scale-[0.98] shrink-0 cursor-pointer'
            )}
          >
            Create Event Now
          </Link>
        </div>
      </section>
    </div>
  );
}
