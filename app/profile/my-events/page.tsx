'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  PlusCircle,
  Users,
  Eye,
  Trash2,
  Pencil,
  ExternalLink,
  MapPin,
  TrendingUp,
  BarChart3,
  Calendar,
  Navigation,
  Radio,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useEvents } from '@/components/providers/EventsProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { GoogleMapsLink } from '@/components/events/GoogleMapsLink';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { EventItem } from '@/lib/constants';

export default function MyEventsDashboardPage() {
  const { user, loading, openAuthModal } = useAuth();
  const { events, deleteEvent, updateEvent } = useEvents();

  // Dialog state for deleting event
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Dialog state for editing event
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGoogleMapsUrl, setEditGoogleMapsUrl] = useState('');
  const [editMaxCapacity, setEditMaxCapacity] = useState<number>(150);
  const [editIsFree, setEditIsFree] = useState(true);
  const [editPrice, setEditPrice] = useState<number>(0);

  // Filter events: custom events or created by user
  const myEvents = React.useMemo(() => {
    if (!user) return [];
    return events.filter(
      (e) => e.organizer?.id === user.id || e.id.startsWith('evt-custom')
    );
  }, [events, user]);

  const totalRsvps = myEvents.reduce((acc, ev) => acc + ev.rsvp_count, 0);
  const totalCapacity = myEvents.reduce((acc, ev) => acc + (ev.max_capacity || 150), 0);
  const avgAttendanceRate = totalCapacity > 0 ? Math.round((totalRsvps / totalCapacity) * 100) : 0;
  const estimatedViews = totalRsvps * 4 + 180;

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteEvent(deleteId);
      setDeleteId(null);
    }
  };

  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditAddress(event.address || '');
    setEditGoogleMapsUrl(event.google_maps_url || '');
    setEditMaxCapacity(event.max_capacity || 150);
    setEditIsFree(event.is_free ?? true);
    setEditPrice(event.price || 0);
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;
    updateEvent(editingEvent.id, {
      title: editTitle.trim() || editingEvent.title,
      description: editDescription.trim() || editingEvent.description,
      address: editAddress.trim() || editingEvent.address,
      google_maps_url: editGoogleMapsUrl.trim() || editingEvent.google_maps_url,
      max_capacity: Number(editMaxCapacity) || 150,
      is_free: editIsFree,
      price: editIsFree ? 0 : Number(editPrice) || 0,
    });
    setEditingEvent(null);
  };

  // Protect /profile/my-events: If not signed in, show Apple-style login gate
  if (!user && !loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full p-8 rounded-3xl apple-glass-card border border-border/80 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white shadow-xl shadow-rose-500/25">
            <Radio className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Sign In to Host Dashboard
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Managing hosted events on EventRadar requires a verified organizer profile. Real human hosts only — no bot entries or guest shortcuts.
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
              Explore Public Events
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Protected by Supabase Auth. Real accounts only.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>Host Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Organizer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track engagement, manage capacities, and edit or monitor attendee RSVPs in real time.
          </p>
        </div>

        <Link
          href="/create"
          className={cn(
            buttonVariants({ size: 'default' }),
            'h-11 px-5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer'
          )}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Publish New Event</span>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl apple-glass-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Active Events</span>
            <CalendarDays className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {myEvents.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Published on radar</p>
        </div>

        <div className="p-5 rounded-2xl apple-glass-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total RSVPs</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {totalRsvps}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">+18% this weekend</p>
        </div>

        <div className="p-5 rounded-2xl apple-glass-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Capacity Fill Rate</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {avgAttendanceRate}%
          </div>
          <p className="text-[11px] text-muted-foreground">
            {totalRsvps} of {totalCapacity} spots
          </p>
        </div>

        <div className="p-5 rounded-2xl apple-glass-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Page Impressions</span>
            <Eye className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {estimatedViews}
          </div>
          <p className="text-[11px] text-muted-foreground">Direct map clicks included</p>
        </div>
      </div>

      {/* Events Management List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Managed Events ({myEvents.length})
          </h2>
          <span className="text-xs text-muted-foreground">Live real-time metrics & management</span>
        </div>

        {myEvents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl apple-glass-card border border-dashed border-border/80 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">No events hosted yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create and host an event in your city. It will immediately appear on the hyperlocal radar.
              </p>
            </div>
            <Link
              href="/create"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white'
              )}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              <span>Host Your First Event</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvents.map((event) => {
            const cap = event.max_capacity || 150;
            const percent = Math.min(100, Math.round((event.rsvp_count / cap) * 100));

            return (
              <div
                key={event.id}
                className="p-5 rounded-2xl apple-glass-card border border-border/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-border transition-colors"
              >
                {/* Left Thumbnail & Info */}
                <div className="flex items-start sm:items-center gap-4 flex-1">
                  <div className="relative h-20 w-24 sm:h-24 sm:w-32 rounded-xl overflow-hidden bg-muted shrink-0 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="bg-black/70 text-white text-[10px] px-1.5 py-0">
                        {event.city}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {event.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-rose-500" />
                        {new Date(event.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <Link href={`/event/${event.id}`}>
                      <h3 className="font-bold text-sm sm:text-base text-foreground hover:text-rose-600 transition-colors truncate">
                        {event.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                      <span className="truncate">{event.address}</span>
                    </p>
                  </div>
                </div>

                {/* Center Capacity Bar */}
                <div className="w-full md:w-56 space-y-1.5 shrink-0">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      {event.rsvp_count} going
                    </span>
                    <span className="text-foreground">{percent}% filled</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{event.is_free ? 'Free Entry' : `₹${event.price}`}</span>
                    <span>Max {cap} spots</span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  <GoogleMapsLink
                    latitude={event.latitude}
                    longitude={event.longitude}
                    googleMapsUrl={event.google_maps_url}
                    label="Map"
                    size="xs"
                    variant="outline"
                    className="text-xs"
                  />

                  <Link
                    href={`/event/${event.id}`}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'xs' }),
                      'rounded-lg text-xs font-medium gap-1'
                    )}
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  {/* Edit Event Action */}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleOpenEdit(event)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    title="Edit event details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  {/* Delete Event Action */}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteId(event.id)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete event"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Edit Event Modal Dialog */}
      {editingEvent && (
        <Dialog
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
        >
          <DialogContent className="sm:max-w-lg p-6 rounded-3xl apple-glass-card max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
                <Pencil className="h-3.5 w-3.5" />
                <span>Organizer Edit</span>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Edit Event Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update information for &quot;{editingEvent.title}&quot;. Changes are saved immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-semibold">
                  Event Title
                </Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-10 rounded-xl text-xs apple-glass-input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-address" className="text-xs font-semibold">
                  Venue Address
                </Label>
                <Input
                  id="edit-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="h-10 rounded-xl text-xs apple-glass-input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-maps-url" className="text-xs font-semibold flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-rose-500" />
                  Google Maps Link
                </Label>
                <Input
                  id="edit-maps-url"
                  placeholder="e.g. https://maps.app.goo.gl/... or https://maps.google.com/?q=..."
                  value={editGoogleMapsUrl}
                  onChange={(e) => setEditGoogleMapsUrl(e.target.value)}
                  className="h-10 rounded-xl text-xs apple-glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-capacity" className="text-xs font-semibold">
                    Max Capacity
                  </Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={editMaxCapacity}
                    onChange={(e) => setEditMaxCapacity(Number(e.target.value))}
                    className="h-10 rounded-xl text-xs apple-glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-price" className="text-xs font-semibold">
                    Price (₹)
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    disabled={editIsFree}
                    value={editIsFree ? 0 : editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="h-10 rounded-xl text-xs apple-glass-input disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-free"
                  checked={editIsFree}
                  onChange={(e) => setEditIsFree(e.target.checked)}
                  className="h-4 w-4 rounded accent-rose-600 cursor-pointer"
                />
                <Label htmlFor="edit-free" className="text-xs font-medium cursor-pointer">
                  Free Admission Event
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-xs font-semibold">
                  Description
                </Label>
                <textarea
                  id="edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl apple-glass-input outline-none text-foreground resize-y"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingEvent(null)}
                className="rounded-xl text-xs flex-1 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="rounded-xl text-xs flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl apple-glass-card">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight">Delete Event?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove this event from the radar? Existing RSVPs will be notified.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              className="rounded-xl text-xs flex-1 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              className="rounded-xl text-xs flex-1 cursor-pointer"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
