'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, MapPin, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { INDIAN_CITIES } from '@/lib/constants';
import { useCity } from '@/components/providers/CityProvider';

export function Footer() {
  const { setCity } = useCity();

  return (
    <footer className="w-full border-t bg-muted/30 text-muted-foreground mt-auto transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-sm">
                <Radio className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-foreground">
                Event<span className="text-rose-500">Radar</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hyperlocal event discovery platform connecting urban communities with real-world tech meetups, hackathons, live arts, and cultural gatherings.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Sparkles className="h-3 w-3" />
                VECNAVERSE 2026 Edition
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explore" className="hover:text-rose-500 transition-colors">
                  Explore All Events
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-rose-500 transition-colors">
                  Host & Publish Event
                </Link>
              </li>
              <li>
                <Link href="/profile/my-events" className="hover:text-rose-500 transition-colors">
                  Organizer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-rose-500 transition-colors">
                  Preferences & City Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Indian Cities Directory */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                Hyperlocal Indian Cities
              </h4>
              <span className="text-[10px] text-muted-foreground">Select to filter</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDIAN_CITIES.map((city) => (
                <button
                  key={city.slug}
                  onClick={() => {
                    setCity(city);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all text-xs group cursor-pointer active:scale-[0.98]"
                >
                  <span className="font-medium text-foreground group-hover:text-rose-600 transition-colors block">
                    {city.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {city.state}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar & VECNAVERSE Badge */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-muted-foreground">
            © 2026 EventRadar. Designed with Apple HIG principles.
          </p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-muted-foreground">
              Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for
              <strong className="text-foreground ml-1">Team GeoGuild</strong> (Shivanand, Suraj, Pranay) for <strong className="text-foreground ml-1">VECNAVERSE</strong>
            </span>
            <a
              href="https://google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] hover:text-foreground transition-colors"
            >
              <span>Powered by Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
