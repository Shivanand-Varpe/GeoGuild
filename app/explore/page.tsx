'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Filter,
  X,
  Compass,
  Calendar,
  Users,
  Eye,
  Check,
  ChevronDown,
  Navigation,
  ArrowUpDown,
} from 'lucide-react';
import { useCity } from '@/components/providers/CityProvider';
import { useEvents } from '@/components/providers/EventsProvider';
import { CATEGORIES, INDIAN_CITIES, type EventItem } from '@/lib/constants';
import { EventCard } from '@/components/events/EventCard';
import { GoogleMapsLink } from '@/components/events/GoogleMapsLink';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Haversine Distance Formula in Kilometers
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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

// Date Filter Comparison Helper
function isMatchingDateFilter(
  startTimeIso: string,
  filter: string,
  customDate?: string
): boolean {
  if (filter === 'all') return true;

  const eventDate = new Date(startTimeIso);
  // Current reference: use event year if running mock 2026 data, or actual date if matching
  const now = new Date();
  const refYear = eventDate.getFullYear();
  const refNow =
    now.getFullYear() >= refYear
      ? now
      : new Date('2026-10-24T12:00:00.000Z');

  const evYear = eventDate.getFullYear();
  const evMonth = eventDate.getMonth();
  const evDay = eventDate.getDate();
  const evDayOfWeek = eventDate.getDay(); // 0 = Sun, 6 = Sat

  if (filter === 'today') {
    return (
      evYear === refNow.getFullYear() &&
      evMonth === refNow.getMonth() &&
      evDay === refNow.getDate()
    );
  }

  if (filter === 'weekend') {
    return evDayOfWeek === 0 || evDayOfWeek === 6;
  }

  if (filter === 'week') {
    const diffTime = eventDate.getTime() - refNow.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= -1 && diffDays <= 7;
  }

  if (filter === 'month') {
    return evYear === refNow.getFullYear() && evMonth === refNow.getMonth();
  }

  if (filter === 'custom' && customDate) {
    const custom = new Date(customDate);
    return (
      evYear === custom.getFullYear() &&
      evMonth === custom.getMonth() &&
      evDay === custom.getDate()
    );
  }

  return true;
}

interface EventWithDistance extends EventItem {
  distanceKm: number;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const { currentCity, setCityBySlug } = useCity();
  const { events, isRsvped, toggleRsvp } = useEvents();

  // Search & Filters state
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialCitySlug = searchParams.get('city') || currentCity.slug;

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCitySlug, setSelectedCitySlug] = useState(initialCitySlug);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [radiusFilter, setRadiusFilter] = useState<string>('any');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'popularity'>('date');

  // Quick View Modal
  const [quickViewEvent, setQuickViewEvent] = useState<EventWithDistance | null>(null);

  // Sync with searchParams if URL changes without cascading effects
  const [prevParamsKey, setPrevParamsKey] = useState(() => searchParams.toString());
  const currentParamsKey = searchParams.toString();
  if (currentParamsKey !== prevParamsKey) {
    setPrevParamsKey(currentParamsKey);
    const q = searchParams.get('q');
    if (q !== null) setQuery(q);
    const cat = searchParams.get('category');
    if (cat !== null) setSelectedCategory(cat);
    const city = searchParams.get('city');
    if (city !== null) setSelectedCitySlug(city);
  }

  // Sync city when selection changes
  const handleCityChange = (slug: string) => {
    setSelectedCitySlug(slug);
    if (slug !== 'all') {
      setCityBySlug(slug);
    }
  };

  // Find reference coordinates for distance computation
  const referenceCity = useMemo(() => {
    if (selectedCitySlug !== 'all') {
      const found = INDIAN_CITIES.find((c) => c.slug === selectedCitySlug);
      if (found) return found;
    }
    return currentCity;
  }, [selectedCitySlug, currentCity]);

  // Comprehensive Filter & Distance Logic
  const filteredEvents = useMemo(() => {
    const list: EventWithDistance[] = [];

    for (const ev of events) {
      // 1. City Filter
      if (selectedCitySlug !== 'all') {
        const cityObj = INDIAN_CITIES.find((c) => c.slug === selectedCitySlug);
        if (cityObj && ev.city.toLowerCase() !== cityObj.name.toLowerCase()) {
          continue;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
        const matchCategory =
          ev.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          (catObj && ev.category.toLowerCase() === catObj.name.toLowerCase());
        if (!matchCategory) continue;
      }

      // 3. Price Filter
      if (priceFilter === 'free' && !ev.is_free) continue;
      if (priceFilter === 'paid' && ev.is_free) continue;

      // 4. Date Filter
      if (!isMatchingDateFilter(ev.start_time, dateFilter, customDate)) {
        continue;
      }

      // 5. Search Query (title, description, tags, address)
      if (query.trim()) {
        const q = query.toLowerCase();
        const inTitle = ev.title.toLowerCase().includes(q);
        const inDesc = ev.description.toLowerCase().includes(q);
        const inAddress = ev.address.toLowerCase().includes(q);
        const inTags = ev.tags?.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inAddress && !inTags) {
          continue;
        }
      }

      // 6. Calculate Haversine Distance
      const distance = calculateDistanceKm(
        referenceCity.latitude,
        referenceCity.longitude,
        ev.latitude,
        ev.longitude
      );

      // 7. Radius Filter
      if (radiusFilter !== 'any') {
        const maxRadius = parseFloat(radiusFilter);
        if (distance > maxRadius) {
          continue;
        }
      }

      list.push({
        ...ev,
        distanceKm: distance,
      });
    }

    // Sort Results
    list.sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === 'popularity') {
        return b.rsvp_count - a.rsvp_count;
      }
      // default: soonest date
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

    return list;
  }, [
    events,
    selectedCitySlug,
    selectedCategory,
    priceFilter,
    dateFilter,
    customDate,
    query,
    radiusFilter,
    sortBy,
    referenceCity,
  ]);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedCitySlug('all');
    setPriceFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setRadiusFilter('any');
    setSortBy('date');
  };

  const activeCityName =
    selectedCitySlug === 'all'
      ? 'All Metros'
      : INDIAN_CITIES.find((c) => c.slug === selectedCitySlug)?.name || 'India';

  const dateFilterLabels: Record<string, string> = {
    all: 'All Dates',
    today: 'Today',
    weekend: 'This Weekend',
    week: 'Next 7 Days',
    month: 'This Month',
    custom: customDate ? `Date: ${customDate}` : 'Custom Date',
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header & Title */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs uppercase tracking-wider">
          <Compass className="h-4 w-4" />
          <span>Hyperlocal Event Finder</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Explore Events in {activeCityName}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Browse vetted tech summits, 24-hr hackathons, cultural festivals, and community mixers.
        </p>
      </div>

      {/* Main Filter Bar */}
      <div className="p-4 rounded-2xl apple-glass-card shadow-sm mb-6 space-y-3.5">
        {/* Row 1: Search + City + Date + Price + Radius */}
        <div className="flex flex-col lg:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by event title, host, topic, or venue..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-10 pr-8 text-xs rounded-xl apple-glass-input"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
            {/* City Dropdown Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'h-10 px-3.5 rounded-xl text-xs font-medium w-full sm:w-auto justify-between gap-2 apple-glass-input cursor-pointer active:scale-[0.98]'
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">City: {activeCityName}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1 rounded-xl apple-glass-card shadow-xl max-h-72 overflow-y-auto"
              >
                <DropdownMenuItem
                  onClick={() => handleCityChange('all')}
                  className={cn(
                    'text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex justify-between',
                    selectedCitySlug === 'all'
                      ? 'bg-rose-500/10 text-rose-600 font-semibold'
                      : ''
                  )}
                >
                  <span>All Indian Metros</span>
                  {selectedCitySlug === 'all' && (
                    <Check className="h-3.5 w-3.5 text-rose-500" />
                  )}
                </DropdownMenuItem>
                {INDIAN_CITIES.map((c) => (
                  <DropdownMenuItem
                    key={c.slug}
                    onClick={() => handleCityChange(c.slug)}
                    className={cn(
                      'text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex justify-between',
                      selectedCitySlug === c.slug
                        ? 'bg-rose-500/10 text-rose-600 font-semibold'
                        : ''
                    )}
                  >
                    <span>{c.name}</span>
                    {selectedCitySlug === c.slug && (
                      <Check className="h-3.5 w-3.5 text-rose-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'h-10 px-3.5 rounded-xl text-xs font-medium w-full sm:w-auto justify-between gap-1.5 apple-glass-input cursor-pointer active:scale-[0.98]'
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{dateFilterLabels[dateFilter]}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 p-1 rounded-xl apple-glass-card shadow-xl"
              >
                {[
                  { id: 'all', label: 'All Dates' },
                  { id: 'today', label: 'Today' },
                  { id: 'weekend', label: 'This Weekend' },
                  { id: 'week', label: 'Next 7 Days' },
                  { id: 'month', label: 'This Month' },
                ].map((d) => (
                  <DropdownMenuItem
                    key={d.id}
                    onClick={() => {
                      setDateFilter(d.id);
                      setCustomDate('');
                    }}
                    className={cn(
                      'text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex justify-between',
                      dateFilter === d.id && !customDate
                        ? 'bg-rose-500/10 text-rose-600 font-semibold'
                        : ''
                    )}
                  >
                    <span>{d.label}</span>
                    {dateFilter === d.id && !customDate && (
                      <Check className="h-3.5 w-3.5 text-rose-500" />
                    )}
                  </DropdownMenuItem>
                ))}
                <div className="p-2 border-t mt-1">
                  <label className="text-[10px] text-muted-foreground font-semibold block mb-1">
                    Pick exact date:
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter('custom');
                    }}
                    className="w-full text-xs p-1.5 rounded-lg border bg-background text-foreground"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Price Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border w-full sm:w-auto shrink-0 justify-center h-10">
              <button
                onClick={() => setPriceFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer h-full',
                  priceFilter === 'all'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              <button
                onClick={() => setPriceFilter('free')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer h-full',
                  priceFilter === 'free'
                    ? 'bg-background shadow-xs text-emerald-600 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Free
              </button>
              <button
                onClick={() => setPriceFilter('paid')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer h-full',
                  priceFilter === 'paid'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Paid
              </button>
            </div>

            {/* Radius / Distance Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'h-10 px-3.5 rounded-xl text-xs font-medium w-full sm:w-auto justify-between gap-1.5 apple-glass-input cursor-pointer active:scale-[0.98]'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-rose-500" />
                  <span>
                    Radius: {radiusFilter === 'any' ? 'Any' : `≤ ${radiusFilter} km`}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 p-1 rounded-xl apple-glass-card shadow-xl"
              >
                {['any', '5', '10', '25', '50'].map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => setRadiusFilter(r)}
                    className="text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex justify-between"
                  >
                    <span>{r === 'any' ? 'Any Distance' : `Within ${r} km`}</span>
                    {radiusFilter === r && (
                      <Check className="h-3.5 w-3.5 text-rose-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 no-scrollbar border-t border-border/40">
          <Button
            size="sm"
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'h-7 px-3 rounded-full text-xs font-medium shrink-0 cursor-pointer transition-all active:scale-[0.98]',
              selectedCategory === 'all'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'hover:bg-muted'
            )}
          >
            All Categories
          </Button>

          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'h-7 px-3 rounded-full text-xs font-medium shrink-0 cursor-pointer transition-all active:scale-[0.98]',
                selectedCategory === cat.id
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'hover:bg-muted'
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Header: Count & Sort options */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-foreground">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
          </span>
          <span className="text-muted-foreground">
            relative to{' '}
            <strong className="text-foreground">{referenceCity.name} center</strong>
          </span>
          {(query ||
            selectedCategory !== 'all' ||
            selectedCitySlug !== 'all' ||
            priceFilter !== 'all' ||
            dateFilter !== 'all' ||
            radiusFilter !== 'any') && (
            <button
              onClick={resetFilters}
              className="text-rose-500 hover:underline font-semibold ml-2 cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px]">Sort:</span>
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 text-xs">
            <button
              onClick={() => setSortBy('date')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                sortBy === 'date'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('distance')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                sortBy === 'distance'
                  ? 'bg-background shadow-xs text-rose-600 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Nearest
            </button>
            <button
              onClick={() => setSortBy('popularity')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                sortBy === 'popularity'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Popular
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative group/card">
              <EventCard
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
                distanceKm={event.distanceKm}
                isRsvped={isRsvped(event.id)}
                onRsvpClick={toggleRsvp}
              />
              {/* Quick View Button on Card Hover */}
              <button
                onClick={() => setQuickViewEvent(event)}
                className="absolute top-3 right-3 z-20 h-7 px-2 rounded-lg apple-glass-card text-[11px] font-semibold text-foreground opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex items-center gap-1 shadow-sm hover:text-rose-500 cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                <span>Quick View</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 px-6 text-center rounded-2xl apple-glass-card border border-dashed border-border/80 max-w-xl mx-auto my-8">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            No events found matching your criteria
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-md mx-auto">
            We couldn&apos;t find any events in {activeCityName} with these exact filters. Try
            widening your distance radius, clearing your search term, or selecting &quot;All Dates&quot;.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="rounded-full text-xs font-semibold cursor-pointer"
            >
              Clear Filters
            </Button>
            <Link
              href="/create"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
              )}
            >
              Host Event in {activeCityName}
            </Link>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL DIALOG */}
      {quickViewEvent && (
        <Dialog
          open={!!quickViewEvent}
          onOpenChange={(open) => !open && setQuickViewEvent(null)}
        >
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl apple-glass-card">
            {/* Banner Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={quickViewEvent.image_url}
                alt={quickViewEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <Badge className="bg-background/90 backdrop-blur-md text-foreground text-xs font-semibold">
                  {quickViewEvent.category}
                </Badge>
                <Badge
                  className={
                    quickViewEvent.is_free
                      ? 'bg-emerald-600 text-white text-xs'
                      : 'bg-background/90 backdrop-blur-md text-foreground text-xs font-semibold'
                  }
                >
                  {quickViewEvent.is_free ? 'Free Entry' : `₹${quickViewEvent.price}`}
                </Badge>
                {quickViewEvent.distanceKm !== undefined && (
                  <Badge className="bg-background/90 backdrop-blur-md text-rose-600 font-bold text-xs flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {quickViewEvent.distanceKm} km away
                  </Badge>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {quickViewEvent.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                  <Calendar className="h-3.5 w-3.5 text-rose-500" />
                  <span>
                    {new Date(quickViewEvent.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* Venue & Location */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30 border text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      {quickViewEvent.city}
                    </span>
                    <span className="text-muted-foreground block text-[11px] leading-snug">
                      {quickViewEvent.address}
                    </span>
                  </div>
                </div>
                <GoogleMapsLink
                  latitude={quickViewEvent.latitude}
                  longitude={quickViewEvent.longitude}
                  label="Maps"
                  size="xs"
                />
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {quickViewEvent.description}
              </p>

              {/* Tags */}
              {quickViewEvent.tags && quickViewEvent.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickViewEvent.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-[10px] font-normal px-2 py-0.5"
                    >
                      #{t}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t gap-3">
                <Button
                  onClick={() => toggleRsvp(quickViewEvent.id)}
                  variant={isRsvped(quickViewEvent.id) ? 'secondary' : 'default'}
                  className={cn(
                    'flex-1 rounded-xl text-xs font-semibold h-9 active:scale-[0.98] transition-all',
                    isRsvped(quickViewEvent.id) ? '' : 'bg-rose-600 hover:bg-rose-700 text-white'
                  )}
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {isRsvped(quickViewEvent.id) ? '✓ Attending' : 'RSVP Now'}
                </Button>

                <Link
                  href={`/event/${quickViewEvent.id}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'rounded-xl text-xs font-semibold h-9 px-4 active:scale-[0.98]'
                  )}
                >
                  Full Details →
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-16 text-center text-muted-foreground">
          Loading Explore Radar...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
