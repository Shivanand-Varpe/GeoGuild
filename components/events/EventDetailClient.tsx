'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  ArrowLeft,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Compass,
  Copy,
  ExternalLink,
  Sparkles,
  Download,
  MessageSquare,
  Send,
  CalendarPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEvents } from '@/components/providers/EventsProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { EventCard } from '@/components/events/EventCard';
import { PaymentModal } from '@/components/events/PaymentModal';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function EventDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const { events, getEventById, isRsvped, toggleRsvp, isHydrated } = useEvents();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    timeAgo: string;
    text: string;
    isHost?: boolean;
  }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`eventradar_comments_${id}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [
      {
        id: 'c1',
        name: 'Arjun Mehta',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
        timeAgo: '2 hours ago',
        text: 'Super excited for this! Is there visitor vehicle parking available near the gate?',
      },
      {
        id: 'c2',
        name: 'Event Host',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Host',
        timeAgo: '1 hour ago',
        text: 'Yes Arjun! Dedicated basement parking is free for all registered attendees. Looking forward to meeting you!',
        isHost: true,
      },
      {
        id: 'c3',
        name: 'Pooja Iyer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja',
        timeAgo: '45 mins ago',
        text: 'Bringing 2 friends from our local AI club. Great initiative by EventRadar!',
      },
    ];
  });

  const event = getEventById(id);

  if (!event) {
    if (!isHydrated) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-rose-500 border-t-transparent mb-4" />
          <p className="text-xs text-muted-foreground">Locating event on radar...</p>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Event Not Found</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">
          The event you are looking for may have concluded, been moved, or does not exist.
        </p>
        <Link
          href="/explore"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'mt-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white'
          )}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Browse All Events
        </Link>
      </div>
    );
  }

  const isAttending = isRsvped(event.id);
  const mapsUrl = event.google_maps_url || `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;

  // Google Calendar URL helper
  const getGoogleCalendarUrl = () => {
    const formatIso = (iso: string) => new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const start = formatIso(event.start_time);
    const end = event.end_time ? formatIso(event.end_time) : formatIso(new Date(new Date(event.start_time).getTime() + 3 * 3600 * 1000).toISOString());
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent((event.address || '') + ', ' + event.city)}`;
  };

  // Apple / Outlook iCal (.ics) download
  const handleDownloadIcs = () => {
    const formatIso = (iso: string) => new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const start = formatIso(event.start_time);
    const end = event.end_time ? formatIso(event.end_time) : formatIso(new Date(new Date(event.start_time).getTime() + 3 * 3600 * 1000).toISOString());
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventRadar//Hyperlocal Discovery//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.address || ''}, ${event.city}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.substring(0, 30).replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Calendar file (.ics) downloaded!');
  };

  // RSVP with tactile celebration or payment modal
  const handleRsvpWithCelebration = () => {
    if (!event.is_free && (event.price ?? 0) > 0 && !isAttending) {
      setPaymentModalOpen(true);
      return;
    }

    if (!user && !isAttending) {
      toast.info('Please sign in with your real account to RSVP');
      openAuthModal();
      return;
    }

    const currentlyAttending = isAttending;
    toggleRsvp(event.id);
    if (!currentlyAttending) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#e11d48', '#f59e0b', '#6366f1', '#10b981'],
        });
      } catch {
        // Safe fallback if canvas not available
      }
      toast.success('🎉 RSVP confirmed! See you at the venue!');
    } else {
      toast.info('RSVP cancelled.');
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to join the community discussion');
      openAuthModal();
      return;
    }
    if (!commentInput.trim()) return;
    const newComment = {
      id: 'c_' + Date.now(),
      name: user.name || user.email.split('@')[0] || 'Community Member',
      avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      timeAgo: 'Just now',
      text: commentInput.trim(),
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    setCommentInput('');
    try {
      localStorage.setItem(`eventradar_comments_${event.id}`, JSON.stringify(updated));
    } catch {}
    toast.success('Comment posted to community wall!');
  };
  
  // Format Date
  const startDate = new Date(event.start_time);
  const formattedFullDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate capacity percentage
  const maxCap = event.max_capacity || 200;
  const percentageFilled = Math.min(100, Math.round((event.rsvp_count / maxCap) * 100));

  const handleShareClick = async () => {
    if (typeof window !== 'undefined') {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Event link copied to clipboard!');
      } catch {
        toast.info('Share URL: ' + window.location.href);
      }
    }
  };

  // Similar events in same city or category
  const similarEvents = events
    .filter((e) => e.id !== event.id && (e.city === event.city || e.category === event.category))
    .slice(0, 3);

  return (
    <div className="min-h-screen pb-20">
      
      {/* Top Navigation Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to events</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="rounded-full h-8 text-xs font-semibold gap-1.5 apple-glass-input active:scale-[0.98]"
          >
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Hero Visual Banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-[21/9] min-h-[300px] sm:min-h-[420px] w-full overflow-hidden rounded-3xl apple-glass-card border border-white/30 dark:border-white/10 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-2 z-10">
            <Badge className="bg-white/90 text-black hover:bg-white backdrop-blur-md text-xs font-bold shadow-md">
              <Tag className="h-3 w-3 mr-1 text-rose-500" />
              {event.category}
            </Badge>
            <Badge
              className={
                event.is_free
                  ? 'bg-emerald-600 text-white font-bold text-xs shadow-md'
                  : 'bg-white/90 text-black font-bold text-xs shadow-md'
              }
            >
              {event.is_free ? 'Free Event' : `₹${event.price}`}
            </Badge>
            <Badge className="bg-black/60 text-white backdrop-blur-md border border-white/20 text-xs font-semibold">
              <MapPin className="h-3 w-3 mr-1 text-rose-400" />
              {event.city}
            </Badge>
          </div>

          {/* Banner Bottom Content */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 z-10 text-white space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-rose-300">
              <Calendar className="h-3.5 w-3.5" />
              <span suppressHydrationWarning>{formattedFullDate}</span>
              <span className="opacity-60">•</span>
              <Clock className="h-3.5 w-3.5" />
              <span suppressHydrationWarning>{formattedTime}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-4xl drop-shadow-sm">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Grid: Content + Action Sidebar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Details, Venue & Organizer */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Prominent Venue & Google Maps Directions Card */}
          <div className="p-6 rounded-2xl apple-glass-card shadow-sm border border-border/80 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Venue & Location
                </span>
                <h3 className="text-lg font-bold text-foreground">{event.address}</h3>
                <p className="text-xs text-muted-foreground">{event.city}, India</p>
              </div>

              {/* Strict Requirement: Google Maps Redirect Link */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: 'default' }),
                  'h-11 px-5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer'
                )}
              >
                <MapPin className="h-4 w-4" />
                <span>Get Directions in Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            </div>

            {/* Geographic Coordinates Badge */}
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-3 border-t border-border/50">
              <span className="font-mono">
                GPS: {event.latitude.toFixed(4)}° N, {event.longitude.toFixed(4)}° E
              </span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Turn-by-turn navigation enabled</span>
            </div>
          </div>

          {/* Full Description */}
          <div className="p-6 rounded-2xl apple-glass-card shadow-sm border border-border/80 space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">About This Event</h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>

            {/* Highlights bullet points */}
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What to Expect</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90 pt-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  <span>Real-world networking & high signal talks</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Live demos & hands-on interaction</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                  <Users className="h-4 w-4 text-indigo-500" />
                  <span>Mentors & community organizers present</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                  <Tag className="h-4 w-4 text-amber-500" />
                  <span>Exclusive swag, stickers & refreshments</span>
                </div>
              </div>
            </div>

            {/* Tags list */}
            {event.tags && event.tags.length > 0 && (
              <div className="pt-4 border-t border-border/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Event Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-foreground/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Organizer Card */}
          <div className="p-6 rounded-2xl apple-glass-card shadow-sm border border-border/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Avatar size="lg" className="ring-2 ring-rose-500/20">
                <AvatarImage src={event.organizer?.avatar_url} alt={event.organizer?.name} />
                <AvatarFallback className="font-bold text-sm bg-muted">
                  {event.organizer?.name ? event.organizer.name.substring(0, 2).toUpperCase() : 'OR'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-foreground">{event.organizer?.name || 'Community Organizer'}</h4>
                  <ShieldCheck className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-xs text-muted-foreground">Verified Event Host on EventRadar</p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold h-8 px-4">
              Contact Host
            </Button>
          </div>

          {/* Community Discussion Wall */}
          <div className="p-6 rounded-2xl apple-glass-card shadow-sm border border-border/80 space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-rose-500" />
                <h3 className="text-base font-bold text-foreground">Community Wall & Questions</h3>
              </div>
              <Badge variant="secondary" className="text-[11px] font-semibold">
                {comments.length} comments
              </Badge>
            </div>

            {/* Post comment input form */}
            <form onSubmit={handlePostComment} className="flex gap-2.5">
              <input
                type="text"
                placeholder="Ask organizer a question or connect with attendees..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 h-10 px-3.5 text-xs rounded-xl apple-glass-input outline-none placeholder:text-muted-foreground text-foreground border border-border focus:border-rose-500"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentInput.trim()}
                className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 active:scale-[0.98] cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post</span>
              </Button>
            </form>

            {/* Comments Stream */}
            <div className="space-y-3.5 pt-1">
              {comments.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.avatar} alt={c.name} />
                        <AvatarFallback className="text-[10px]">{c.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold text-foreground">{c.name}</span>
                      {c.isHost && (
                        <Badge className="bg-rose-500/10 text-rose-600 text-[10px] px-1.5 py-0 h-4 border-0">
                          Host
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{c.timeAgo}</span>
                  </div>
                  <p className="text-xs text-foreground/85 pl-8 leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Sticky RSVP & Ticket Box */}
        <div className="space-y-6">
          <div className="sticky top-24 p-6 rounded-3xl apple-glass-card border border-border/80 shadow-xl space-y-6">
            
            {/* Price Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Ticket Price</span>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {event.is_free ? 'Free Admission' : `₹${event.price}`}
                </div>
              </div>
              <Badge
                variant="secondary"
                className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600"
              >
                {event.is_free ? 'Open Registration' : 'Standard Pass'}
              </Badge>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-rose-500" />
                  Capacity Status
                </span>
                <span className="text-foreground">
                  {event.rsvp_count} / {maxCap} spots ({percentageFilled}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentageFilled}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground text-right">
                {maxCap - event.rsvp_count > 0
                  ? `${maxCap - event.rsvp_count} spots remaining`
                  : 'Sold out / Full capacity'}
              </p>
            </div>

            {/* Primary RSVP Action Button */}
            <div className="space-y-2.5">
              <Button
                onClick={handleRsvpWithCelebration}
                size="lg"
                className={cn(
                  'w-full h-12 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all cursor-pointer shadow-md',
                  isAttending
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : !event.is_free
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-rose-600/25'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                )}
              >
                {isAttending ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span>✓ Attending & Ticket Confirmed (Click to cancel)</span>
                  </>
                ) : !event.is_free ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>Get Tickets — ₹{event.price}</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    <span>Reserve Spot / RSVP Now (Free)</span>
                  </>
                )}
              </Button>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'w-full h-11 rounded-2xl font-semibold text-xs apple-glass-input active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer'
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                <span>Open Location in Google Maps</span>
              </a>

              {/* Add to Calendar Options */}
              <div className="pt-2 flex items-center gap-2">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'flex-1 h-9 rounded-xl text-[11px] font-semibold border border-border/60 hover:bg-muted active:scale-[0.98] flex items-center justify-center gap-1.5'
                  )}
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-rose-500" />
                  <span>Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'flex-1 h-9 rounded-xl text-[11px] font-semibold border border-border/60 hover:bg-muted active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer'
                  )}
                >
                  <Download className="h-3.5 w-3.5 text-indigo-500" />
                  <span>iCal (.ics)</span>
                </button>
              </div>
            </div>

            {/* Quick RSVP Note */}
            <div className="p-3 rounded-xl bg-muted/40 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Zero Booking Fees</p>
              <p>Instant confirmation with no waitlist. Your spot is reserved immediately on your dashboard.</p>
            </div>

          </div>
        </div>

      </div>

      {/* Similar Events Nearby */}
      {similarEvents.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-border/40">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                More Events in {event.city}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Other upcoming gatherings you might enjoy</p>
            </div>
            <Link
              href={`/explore?city=${event.city.toLowerCase()}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs text-rose-500 font-semibold')}
            >
              See all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarEvents.map((simEvent) => (
              <EventCard
                key={simEvent.id}
                id={simEvent.id}
                title={simEvent.title}
                description={simEvent.description}
                image_url={simEvent.image_url}
                date={simEvent.start_time}
                city={simEvent.city}
                address={simEvent.address}
                category={simEvent.category}
                rsvp_count={simEvent.rsvp_count}
                latitude={simEvent.latitude}
                longitude={simEvent.longitude}
                is_free={simEvent.is_free}
                price={simEvent.price}
                isRsvped={isRsvped(simEvent.id)}
                onRsvpClick={toggleRsvp}
              />
            ))}
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl apple-glass-card">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mb-2">
              <Share2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Share This Event</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Invite friends and colleagues to join you at {event.title}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/60 border text-xs">
              <span className="truncate flex-1 font-mono text-[11px] text-muted-foreground">
                {typeof window !== 'undefined' ? window.location.href : `https://eventradar.local/event/${event.id}`}
              </span>
              <Button
                size="sm"
                onClick={handleShareClick}
                className="h-8 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shrink-0 cursor-pointer active:scale-[0.98]"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy Link
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${event.title} on EventRadar! ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl h-9 font-semibold justify-center')}
              >
                Share to WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Heading to ${event.title} in ${event.city}! Found via @EventRadar:`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl h-9 font-semibold justify-center')}
              >
                Share on X / Twitter
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paid Event Checkout & Ticket Generation Modal */}
      {!event.is_free && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          event={{
            id: event.id,
            title: event.title,
            price: event.price ?? 499,
            start_time: event.start_time,
            city: event.city,
            address: event.address,
            venue_name: event.address,
            image_url: event.image_url,
          }}
          userName={user?.name || 'Event Explorer'}
          userEmail={user?.email || 'attendee@eventradar.local'}
          onPaymentSuccess={() => {
            if (!isAttending) {
              toggleRsvp(event.id);
            }
          }}
        />
      )}
    </div>
  );
}
