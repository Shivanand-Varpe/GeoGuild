'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Tag, ArrowRight, Navigation } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GoogleMapsLink } from '@/components/events/GoogleMapsLink';

export interface EventCardProps {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  date: string;
  city: string;
  address?: string;
  category: string;
  rsvp_count: number;
  latitude: number;
  longitude: number;
  is_free?: boolean;
  price?: number;
  distanceKm?: number;
  onRsvpClick?: (id: string) => void;
  isRsvped?: boolean;
}

export function EventCard({
  id,
  title,
  description,
  image_url,
  date,
  city,
  address,
  category,
  rsvp_count,
  latitude,
  longitude,
  is_free = true,
  price,
  distanceKm,
  onRsvpClick,
  isRsvped = false,
}: EventCardProps) {
  // Format date readable
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return date;
    }
  }, [date]);

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Event Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <Link href={`/event/${id}`} className="block h-full w-full cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-md font-medium text-xs shadow-sm">
            <Tag className="h-3 w-3 mr-1 text-primary" />
            {category}
          </Badge>
          <Badge
            variant={is_free ? 'default' : 'outline'}
            className={is_free ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs' : 'bg-background/90 backdrop-blur-md text-xs font-semibold'}
          >
            {is_free ? 'Free Entry' : `₹${price || 499}`}
          </Badge>
          {distanceKm !== undefined && (
            <Badge
              variant="secondary"
              className="bg-background/95 backdrop-blur-md text-[10px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm"
            >
              <Navigation className="h-2.5 w-2.5 mr-1 text-rose-500" />
              {distanceKm} km away
            </Badge>
          )}
        </div>

        {/* City Badge */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-xs font-semibold shadow-sm">
            <MapPin className="h-3 w-3 mr-1 text-rose-500" />
            {city}
          </Badge>
        </div>

        {/* Attendees Count */}
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-xs font-semibold shadow-sm">
            <Users className="h-3 w-3 mr-1 text-indigo-500" />
            {rsvp_count} going
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <CardContent className="flex-1 p-5 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Date & Time */}
          <div className="flex items-center text-xs font-medium text-primary">
            <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span suppressHydrationWarning>{formattedDate}</span>
          </div>

          {/* Title */}
          <Link href={`/event/${id}`} className="block">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>

          {/* Short Address / Description */}
          {address && (
            <p className="line-clamp-1 text-xs text-muted-foreground flex items-center gap-1">
              <span className="font-medium text-foreground/80">{address}</span>
            </p>
          )}

          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground pt-1">
              {description}
            </p>
          )}
        </div>
      </CardContent>

      {/* Card Footer: Maps + Details / RSVP */}
      <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between gap-2 border-t pt-3 mt-auto bg-muted/20">
        <GoogleMapsLink
          latitude={latitude}
          longitude={longitude}
          label="Map"
          size="sm"
          variant="outline"
          className="text-xs h-8 px-2.5"
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isRsvped ? 'secondary' : 'default'}
            className="h-8 text-xs font-semibold px-3"
            onClick={() => onRsvpClick?.(id)}
          >
            {isRsvped ? '✓ Attending' : 'RSVP'}
          </Button>

          <Link
            href={`/event/${id}`}
            title="View event details"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-[0.98]'
            )}
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
