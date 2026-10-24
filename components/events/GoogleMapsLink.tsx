'use strict';
import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GoogleMapsLinkProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon';
}

export function GoogleMapsLink({
  latitude,
  longitude,
  label = 'Open in Google Maps',
  className = '',
  variant = 'outline',
  size = 'sm',
}: GoogleMapsLinkProps) {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant, size }),
        'inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors active:scale-[0.98]',
        className
      )}
    >
      <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
      <span>{label}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70" />
    </a>
  );
}
