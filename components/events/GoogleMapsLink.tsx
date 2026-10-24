'use strict';
import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapsLinkProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
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
    <Button
      variant={variant}
      size={size}
      className={`inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors ${className}`}
      asChild
    >
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
        <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
        <span>{label}</span>
        <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70" />
      </a>
    </Button>
  );
}
