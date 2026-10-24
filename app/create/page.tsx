'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  Navigation,
  UploadCloud,
  X,
  FileImage,
  Radio,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useEvents } from '@/components/providers/EventsProvider';
import { useCity } from '@/components/providers/CityProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { INDIAN_CITIES, CATEGORIES, type City } from '@/lib/constants';
import { parseGoogleMapsCoordinates } from '@/lib/maps';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Tech & Hackathon', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Conference / Summit', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Networking & Coffee', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Live Concert & Music', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Hands-on Workshop', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Fitness & Sports', url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80' },
];

const SUGGESTED_TAGS = [
  'AI & Agents',
  'Hackathon',
  'Web3',
  'Startups',
  'Networking',
  'Live Music',
  'Workshops',
  'Fitness',
  'Pottery',
  'Design',
  'Next.js',
];

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEvents();
  const { currentCity } = useCity();
  const { user, loading, openAuthModal } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0].name);
  const [city, setCity] = useState<City>(currentCity);
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [mapsParseFeedback, setMapsParseFeedback] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number>(currentCity.latitude);
  const [longitude, setLongitude] = useState<number>(currentCity.longitude);
  const [date, setDate] = useState('2026-10-30');
  const [time, setTime] = useState('14:00');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState<number>(499);
  const [maxCapacity, setMaxCapacity] = useState<number>(150);
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGE_PRESETS[0].url);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-select Tags State
  const [selectedTags, setSelectedTags] = useState<string[]>(['AI & Agents', 'Hackathon']);
  const [customTagInput, setCustomTagInput] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Handle Google Maps Link change and parse GPS coordinates automatically
  const handleMapsUrlChange = (url: string) => {
    setGoogleMapsUrl(url);
    if (!url.trim()) {
      setLatitude(city.latitude);
      setLongitude(city.longitude);
      setMapsParseFeedback(null);
      return;
    }
    const result = parseGoogleMapsCoordinates(url, {
      latitude: city.latitude,
      longitude: city.longitude,
      cityName: city.name,
    });
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setMapsParseFeedback(result.description);
  };

  // Update lat/long when city changes
  const handleCitySelect = (selected: City) => {
    setCity(selected);
    if (!googleMapsUrl.trim()) {
      setLatitude(selected.latitude);
      setLongitude(selected.longitude);
      setMapsParseFeedback(null);
    } else {
      const result = parseGoogleMapsCoordinates(googleMapsUrl, {
        latitude: selected.latitude,
        longitude: selected.longitude,
        cityName: selected.name,
      });
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setMapsParseFeedback(result.description);
    }
  };

  // Handle Tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim().replace(/^#/, '');
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setCustomTagInput('');
    }
  };

  // Image Upload Dropzone handler
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
        setUploadedFileName(file.name);
        toast.success(`Loaded "${file.name}" as event banner`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!address.trim()) {
      toast.error('Please enter a venue address');
      return;
    }

    setSubmitting(true);

    try {
      const startTimeIso = new Date(`${date}T${time}:00`).toISOString();

      const newEvent = createEvent({
        title: title.trim(),
        description:
          description.trim() || 'Join us for this exciting hyperlocal gathering!',
        category,
        city: city.name,
        address: address.trim(),
        latitude,
        longitude,
        google_maps_url: googleMapsUrl.trim() || undefined,
        start_time: startTimeIso,
        image_url: imageUrl,
        is_free: isFree,
        price: isFree ? 0 : Number(price) || 0,
        max_capacity: Number(maxCapacity) || 100,
        tags: selectedTags.length > 0 ? selectedTags : ['Community', city.name],
        organizer: {
          id: user?.id || 'verified-host',
          name: user?.name || 'Verified Community Organizer',
          avatar_url:
            user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Org'}`,
        },
      });

      router.push(`/event/${newEvent.id}`);
    } catch {
      toast.error('Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Protect /create: If not signed in, show Apple-style login gate
  if (!user && !loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full p-8 rounded-3xl apple-glass-card border border-border/80 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white shadow-xl shadow-rose-500/25">
            <Radio className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Sign In to Host an Event
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Publishing events on EventRadar requires a verified organizer account. Real human hosts only — no bot entries or guest shortcuts.
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
              Explore Existing Events
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Protected by Supabase Auth. 1-click Google, GitHub, or Magic Link.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Host in Your City</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Publish a New Event
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Fill in details about your hackathon, workshop, or meetup. It will appear on the live radar immediately.
        </p>
      </div>

      {/* Main Creation Card Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-3xl apple-glass-card shadow-xl space-y-8"
      >
        {/* Basic Info Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500 flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            1. Event Overview
          </h3>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-semibold">
              Event Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g. Next.js & AI Agent Hackathon 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-11 rounded-xl text-sm apple-glass-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Category *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className="w-full h-11 px-3.5 rounded-xl border text-xs font-medium apple-glass-input flex items-center justify-between cursor-pointer"
                >
                  <span>{category}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-1 rounded-xl apple-glass-card shadow-xl max-h-60 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => setCategory(cat.name)}
                      className={cn(
                        'text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex justify-between',
                        category === cat.name ? 'bg-rose-500/10 text-rose-600 font-semibold' : ''
                      )}
                    >
                      <span>{cat.name}</span>
                      {category === cat.name && (
                        <Check className="h-3.5 w-3.5 text-rose-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* City Dropdown */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Metro City *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className="w-full h-11 px-3.5 rounded-xl border text-xs font-medium apple-glass-input flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>{city.name}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-1 rounded-xl apple-glass-card shadow-xl max-h-60 overflow-y-auto">
                  {INDIAN_CITIES.map((c) => (
                    <DropdownMenuItem
                      key={c.slug}
                      onClick={() => handleCitySelect(c)}
                      className={cn(
                        'text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex justify-between',
                        city.slug === c.slug ? 'bg-rose-500/10 text-rose-600 font-semibold' : ''
                      )}
                    >
                      <span>
                        {c.name} ({c.state})
                      </span>
                      {city.slug === c.slug && (
                        <Check className="h-3.5 w-3.5 text-rose-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold">
              Event Description & Agenda
            </Label>
            <textarea
              id="description"
              rows={4}
              placeholder="Tell attendees what to expect: schedule, speaker lineup, prerequisites, food, or parking details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs rounded-xl apple-glass-input outline-none text-foreground resize-y"
            />
          </div>
        </div>

        {/* Date, Time & Location Section */}
        <div className="space-y-4 pt-4 border-t border-border/60">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            2. Date, Time & Venue
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold">
                Event Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-11 rounded-xl text-xs apple-glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs font-semibold">
                Start Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="h-11 rounded-xl text-xs apple-glass-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              Venue Street Address *
            </Label>
            <Input
              id="address"
              placeholder="e.g. 80 Feet Road, 6th Block, Koramangala, Bengaluru"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="h-11 rounded-xl text-xs apple-glass-input"
            />
          </div>

          {/* Google Maps Link Field (Replaces manual GPS coordinates) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="googleMapsUrl" className="text-xs font-semibold flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-rose-500" />
                Google Maps Link
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Auto GPS Detection
              </span>
            </div>
            <Input
              id="googleMapsUrl"
              placeholder="e.g. https://maps.app.goo.gl/... or https://maps.google.com/?q=... or venue link"
              value={googleMapsUrl}
              onChange={(e) => handleMapsUrlChange(e.target.value)}
              className="h-11 rounded-xl text-xs apple-glass-input"
            />
            {mapsParseFeedback ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{mapsParseFeedback}</span>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Paste any Google Maps link from your browser or app. GPS coordinates will be extracted automatically, defaulting to {city.name} center if no pin is found.
              </p>
            )}
          </div>
        </div>

        {/* Pricing, Capacity & Visuals */}
        <div className="space-y-4 pt-4 border-t border-border/60">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            3. Ticketing & Visuals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Free or Paid Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Entry Type</Label>
              <div className="flex items-center p-1 rounded-xl bg-muted/60 border h-11">
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={cn(
                    'flex-1 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    isFree
                      ? 'bg-background shadow-xs text-emerald-600'
                      : 'text-muted-foreground'
                  )}
                >
                  Free Entry
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={cn(
                    'flex-1 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    !isFree
                      ? 'bg-background shadow-xs text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  Paid
                </button>
              </div>
            </div>

            {/* Price input (if paid) */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs font-semibold">
                Price (INR ₹)
              </Label>
              <Input
                id="price"
                type="number"
                disabled={isFree}
                value={isFree ? 0 : price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="h-11 rounded-xl text-xs apple-glass-input disabled:opacity-50"
              />
            </div>

            {/* Max Capacity */}
            <div className="space-y-2">
              <Label htmlFor="maxCapacity" className="text-xs font-semibold">
                Max Capacity
              </Label>
              <Input
                id="maxCapacity"
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="h-11 rounded-xl text-xs apple-glass-input"
              />
            </div>
          </div>

          {/* Image Upload Dropzone & Presets */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-rose-500" />
              Event Banner Image (Upload Dropzone or Preset)
            </Label>

            {/* Interactive Upload Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2',
                isDragging
                  ? 'border-rose-500 bg-rose-500/10 scale-[1.01]'
                  : 'border-border/80 hover:border-rose-500/40 hover:bg-muted/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <UploadCloud className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">
                  Drag and drop your event banner image, or{' '}
                  <span className="text-rose-600 underline">browse files</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Supports PNG, JPG, or WEBP up to 5MB. Instant preview below.
                </p>
              </div>

              {uploadedFileName && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                  <FileImage className="h-3.5 w-3.5" />
                  <span>Uploaded: {uploadedFileName}</span>
                </div>
              )}
            </div>

            {/* Banner Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                Or pick a curated high-res preset:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SAMPLE_IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      setUploadedFileName(null);
                    }}
                    className={cn(
                      'relative h-16 rounded-xl overflow-hidden border-2 text-left p-2 cursor-pointer transition-all active:scale-[0.98]',
                      imageUrl === preset.url
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="absolute inset-0 w-full h-full object-cover -z-10"
                    />
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input fallback */}
            <Input
              placeholder="Or paste custom Image URL (https://...)"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setUploadedFileName(null);
              }}
              className="h-10 rounded-xl text-xs apple-glass-input"
            />
          </div>

          {/* Interactive Multi-Select Tags */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-rose-500" />
              Event Tags (Multi-select Chips)
            </Label>

            {/* Suggested Chip Choices */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-[0.97]',
                      isSelected
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'border-border/80 hover:border-foreground/30 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {isSelected ? `✓ #${tag}` : `+ #${tag}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Add custom tag (e.g. LLMs, OpenMic)..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                className="h-9 rounded-xl text-xs apple-glass-input flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomTag}
                className="h-9 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
              >
                Add Tag
              </Button>
            </div>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">
                  Selected:
                </span>
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:text-rose-800 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            By publishing, your event will immediately be accessible via Google Maps links across the platform.
          </p>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto h-12 px-8 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] shadow-md shadow-rose-600/25 transition-all cursor-pointer"
          >
            <span>{submitting ? 'Publishing...' : 'Publish Event Live'}</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
