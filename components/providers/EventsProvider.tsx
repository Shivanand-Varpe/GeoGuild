'use client';

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';
import { SAMPLE_EVENTS, type EventItem } from '@/lib/constants';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DbEventRecord {
  id: string;
  title: string;
  description?: string | null;
  categories?: { name: string; icon?: string } | null;
  city: string;
  address?: string | null;
  venue_name?: string | null;
  latitude: number | string;
  longitude: number | string;
  start_time: string;
  end_time?: string | null;
  image_url?: string | null;
  is_free?: boolean | null;
  price?: number | string | null;
  view_count?: number | null;
  max_capacity?: number | null;
  organizer_id?: string | null;
  status?: string | null;
}

interface EventsContextType {
  events: EventItem[];
  userRsvpIds: string[];
  isHydrated: boolean;
  isRsvped: (eventId: string) => boolean;
  toggleRsvp: (eventId: string) => void;
  createEvent: (eventData: Omit<EventItem, 'id' | 'rsvp_count'>) => EventItem;
  updateEvent: (eventId: string, updatedData: Partial<EventItem>) => void;
  deleteEvent: (eventId: string) => void;
  getEventById: (id: string) => EventItem | undefined;
}

const EventsContext = createContext<EventsContextType>({
  events: SAMPLE_EVENTS,
  userRsvpIds: [],
  isHydrated: false,
  isRsvped: () => false,
  toggleRsvp: () => {},
  createEvent: () => SAMPLE_EVENTS[0],
  updateEvent: () => {},
  deleteEvent: () => {},
  getEventById: () => undefined,
});

const STORAGE_EVENTS_KEY = 'eventradar_custom_events';
const STORAGE_RSVPS_KEY = 'eventradar_user_rsvps';

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Initialize with SSR-safe initial state (identical on server and client)
  const [events, setEvents] = useState<EventItem[]>(SAMPLE_EVENTS);
  const [userRsvpIds, setUserRsvpIds] = useState<string[]>(['evt-1']);

  // Client-side hydration from localStorage
  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (storedEvents) {
        const customParsed: EventItem[] = JSON.parse(storedEvents);
        setEvents((prev) => [...customParsed, ...prev.filter(p => !customParsed.some(c => c.id === p.id))]);
      }

      const storedRsvps = localStorage.getItem(STORAGE_RSVPS_KEY);
      if (storedRsvps) {
        setUserRsvpIds(JSON.parse(storedRsvps));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Try fetching from live Supabase if credentials are provided
  useEffect(() => {
    let active = true;

    async function fetchSupabaseEvents() {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      ) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('events')
            .select('*, categories(name, icon)');

          if (!error && data && data.length > 0 && active) {
            const mappedDbEvents: EventItem[] = (data as unknown as DbEventRecord[]).map((d) => ({
              id: d.id,
              title: d.title,
              description: d.description || '',
              category: d.categories?.name || 'Tech & AI',
              city: d.city === 'Bangalore' ? 'Bengaluru' : d.city,
              address: d.address || d.venue_name || '',
              latitude: Number(d.latitude),
              longitude: Number(d.longitude),
              start_time: d.start_time,
              end_time: d.end_time || undefined,
              image_url: d.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
              is_free: d.is_free ?? true,
              price: Number(d.price) || 0,
              rsvp_count: d.view_count ? Math.round(d.view_count * 0.45) : 34,
              max_capacity: d.max_capacity || 200,
              organizer: {
                id: d.organizer_id || 'org-live',
                name: 'Verified Host',
                avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${d.organizer_id || d.id}`,
              },
              tags: ['Live', d.city, d.categories?.name || 'Community'],
              status: d.status || 'published',
            }));

            setEvents((prev) => {
              // Combine live DB events and local custom created events
              const customOnly = prev.filter((p) => p.id.startsWith('evt-custom'));
              return [...customOnly, ...mappedDbEvents, ...SAMPLE_EVENTS.filter((s) => !mappedDbEvents.some((m) => m.title === s.title))];
            });
          }
        } catch {
          // Graceful fallback to SAMPLE_EVENTS
        }
      }
    }

    fetchSupabaseEvents();

    return () => {
      active = false;
    };
  }, []);

  const isRsvped = (eventId: string) => {
    return userRsvpIds.includes(eventId);
  };

  const toggleRsvp = (eventId: string) => {
    const willRsvp = !userRsvpIds.includes(eventId);
    const updatedRsvps = willRsvp
      ? [...userRsvpIds, eventId]
      : userRsvpIds.filter((id) => id !== eventId);

    setUserRsvpIds(updatedRsvps);
    try {
      localStorage.setItem(STORAGE_RSVPS_KEY, JSON.stringify(updatedRsvps));
    } catch {}

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const newCount = willRsvp ? ev.rsvp_count + 1 : Math.max(0, ev.rsvp_count - 1);
          return { ...ev, rsvp_count: newCount };
        }
        return ev;
      })
    );

    const targetEvent = events.find((e) => e.id === eventId);
    if (willRsvp) {
      toast.success(`You're attending "${targetEvent?.title || 'Event'}"!`, {
        description: 'See you there! Get directions from the event page.',
      });
    } else {
      toast.info(`RSVP cancelled for "${targetEvent?.title || 'Event'}".`);
    }

    // Sync with live Supabase database
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      eventId.includes('-') &&
      eventId.length === 36
    ) {
      try {
        const supabase = createClient();
        if (willRsvp) {
          supabase
            .from('rsvps')
            .insert({
              event_id: eventId,
              user_id: user?.id || '33333333-3333-3333-3333-333333333301',
              status: 'going',
            })
            .then(({ error }) => {
              if (error) console.info('Supabase live RSVP sync note:', error.message);
            });
        } else {
          supabase
            .from('rsvps')
            .delete()
            .match({
              event_id: eventId,
              user_id: user?.id || '33333333-3333-3333-3333-333333333301',
            })
            .then(({ error }) => {
              if (error) console.info('Supabase live RSVP delete sync note:', error.message);
            });
        }
      } catch {}
    }
  };

  const createEvent = (eventData: Omit<EventItem, 'id' | 'rsvp_count'>): EventItem => {
    const newId = 'evt-custom-' + Date.now();
    const newEvent: EventItem = {
      ...eventData,
      id: newId,
      rsvp_count: 1, // creator is first attendee
      organizer: eventData.organizer || {
        id: user?.id || 'demo-user',
        name: user?.name || 'Local Organizer',
        avatar_url: user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Org',
      },
    };

    setEvents((prev) => {
      const updated = [newEvent, ...prev];
      try {
        const stored = localStorage.getItem(STORAGE_EVENTS_KEY);
        const existingCustom: EventItem[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify([newEvent, ...existingCustom]));
      } catch {}
      return updated;
    });

    // Automatically RSVP organizer
    setUserRsvpIds((prev) => {
      const updated = [...prev, newId];
      try {
        localStorage.setItem(STORAGE_RSVPS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    toast.success('Event published successfully!', {
      description: 'Your event is now live on the Hyperlocal Radar.',
    });

    // Sync with live Supabase database if available
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    ) {
      try {
        const supabase = createClient();
        supabase
          .from('events')
          .insert({
            title: eventData.title,
            description: eventData.description,
            city: eventData.city,
            address: eventData.address,
            latitude: eventData.latitude,
            longitude: eventData.longitude,
            start_time: eventData.start_time,
            is_free: eventData.is_free,
            price: eventData.price || 0,
            max_capacity: eventData.max_capacity || 150,
            image_url: eventData.image_url,
            status: 'published',
          })
          .then(({ error }) => {
            if (error) console.info('Supabase live event creation note:', error.message);
          });
      } catch {}
    }

    return newEvent;
  };

  const updateEvent = (eventId: string, updatedData: Partial<EventItem>) => {
    setEvents((prev) => {
      const updated = prev.map((ev) => (ev.id === eventId ? { ...ev, ...updatedData } : ev));
      try {
        const stored = localStorage.getItem(STORAGE_EVENTS_KEY);
        if (stored) {
          const custom: EventItem[] = JSON.parse(stored);
          const updatedCustom = custom.map((ev) =>
            ev.id === eventId ? { ...ev, ...updatedData } : ev
          );
          localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updatedCustom));
        }
      } catch {}
      return updated;
    });
    toast.success('Event updated successfully!');
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== eventId);
      try {
        const stored = localStorage.getItem(STORAGE_EVENTS_KEY);
        if (stored) {
          const custom: EventItem[] = JSON.parse(stored);
          localStorage.setItem(
            STORAGE_EVENTS_KEY,
            JSON.stringify(custom.filter((e) => e.id !== eventId))
          );
        }
      } catch {}
      return updated;
    });
    toast.info('Event removed');
  };

  const getEventById = (id: string) => {
    return events.find((e) => e.id === id);
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        userRsvpIds,
        isHydrated,
        isRsvped,
        toggleRsvp,
        createEvent,
        updateEvent,
        deleteEvent,
        getEventById,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  return useContext(EventsContext);
}
