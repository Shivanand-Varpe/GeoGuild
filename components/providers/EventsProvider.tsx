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
  google_maps_url?: string | null;
  registration_link?: string | null;
  rsvps?: { id: string; user_id: string }[] | null;
}

interface EventsContextType {
  events: EventItem[];
  userRsvpIds: string[];
  isHydrated: boolean;
  isRsvped: (eventId: string) => boolean;
  toggleRsvp: (eventId: string) => Promise<void>;
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
  toggleRsvp: async () => {},
  createEvent: () => SAMPLE_EVENTS[0],
  updateEvent: () => {},
  deleteEvent: () => {},
  getEventById: () => undefined,
});

const STORAGE_EVENTS_KEY = 'eventradar_custom_events';
const STORAGE_RSVPS_KEY = 'eventradar_user_rsvps';

// Map sample event IDs to real database UUIDs
const SAMPLE_TO_DB_MAP: Record<string, string> = {
  'evt-1': '44444444-4444-4444-4444-444444444404', // Hackathon
  'evt-2': '44444444-4444-4444-4444-444444444402', // Mixer
  'evt-3': '44444444-4444-4444-4444-444444444401', // AI Summit
  'evt-4': '44444444-4444-4444-4444-444444444403', // Next.js Masterclass
  'evt-5': '44444444-4444-4444-4444-444444444405', // DevOps Day
  'evt-6': '44444444-4444-4444-4444-444444444406', // Design Jam
  'evt-7': '44444444-4444-4444-4444-444444444407', // Web3 Showcase
};

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedEvents = localStorage.getItem(STORAGE_EVENTS_KEY);
        if (storedEvents) {
          const customParsed: EventItem[] = JSON.parse(storedEvents);
          return [...customParsed, ...SAMPLE_EVENTS.filter((p) => !customParsed.some((c) => c.id === p.id))];
        }
      } catch {
        // Fallback
      }
    }
    return SAMPLE_EVENTS;
  });

  const [userRsvpIds, setUserRsvpIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedRsvps = localStorage.getItem(STORAGE_RSVPS_KEY);
        if (storedRsvps) {
          return JSON.parse(storedRsvps);
        }
      } catch {
        // Fallback
      }
    }
    return [];
  });

  // Fetch live Supabase events and real database RSVPs
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
            .select('*, categories(name, icon), rsvps(id, user_id)');

          if (!error && data && data.length > 0 && active) {
            const currentUserId = user?.id;
            const dbConfirmedRsvps: string[] = [];

            const mappedDbEvents: EventItem[] = (data as unknown as DbEventRecord[]).map((d) => {
              const liveRsvpList = d.rsvps || [];
              const hasUserRsvped = currentUserId ? liveRsvpList.some((r) => r.user_id === currentUserId) : false;

              if (hasUserRsvped) {
                dbConfirmedRsvps.push(d.id);
                // Also match reverse map for sample IDs
                for (const [sampleId, dbUuid] of Object.entries(SAMPLE_TO_DB_MAP)) {
                  if (dbUuid === d.id) dbConfirmedRsvps.push(sampleId);
                }
              }

              return {
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
                rsvp_count: liveRsvpList.length > 0 ? liveRsvpList.length : (d.view_count ? Math.round(d.view_count * 0.45) : 12),
                max_capacity: d.max_capacity || 200,
                organizer: {
                  id: d.organizer_id || 'org-live',
                  name: 'Verified Host',
                  avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${d.organizer_id || d.id}`,
                },
                tags: ['Live', d.city, d.categories?.name || 'Community'],
                status: d.status || 'published',
                google_maps_url: d.google_maps_url || d.registration_link || undefined,
              };
            });

            // Update user RSVPs from live database
            if (dbConfirmedRsvps.length > 0) {
              setUserRsvpIds((prev) => {
                const merged = Array.from(new Set([...prev, ...dbConfirmedRsvps]));
                try {
                  localStorage.setItem(STORAGE_RSVPS_KEY, JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }

            setEvents((prev) => {
              const customOnly = prev.filter((p) => p.id.startsWith('evt-custom'));
              return [...customOnly, ...mappedDbEvents, ...SAMPLE_EVENTS.filter((s) => !mappedDbEvents.some((m) => m.title === s.title))];
            });
          }
        } catch {
          // Graceful fallback
        }
      }
    }

    fetchSupabaseEvents();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const isRsvped = (eventId: string) => {
    const dbTargetId = SAMPLE_TO_DB_MAP[eventId] || eventId;
    return userRsvpIds.includes(eventId) || userRsvpIds.includes(dbTargetId);
  };

  const toggleRsvp = async (eventId: string) => {
    if (!user) {
      toast.info('Please sign in with your real account to RSVP', {
        description: 'Verified profile required — no bot or guest entries.',
      });
      openAuthModal();
      return;
    }

    const dbTargetId = SAMPLE_TO_DB_MAP[eventId] || eventId;
    const willRsvp = !isRsvped(eventId);

    // Update state optimistically
    const updatedRsvps = willRsvp
      ? Array.from(new Set([...userRsvpIds, eventId, dbTargetId]))
      : userRsvpIds.filter((id) => id !== eventId && id !== dbTargetId);

    setUserRsvpIds(updatedRsvps);
    try {
      localStorage.setItem(STORAGE_RSVPS_KEY, JSON.stringify(updatedRsvps));
    } catch {}

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId || ev.id === dbTargetId) {
          const newCount = willRsvp ? ev.rsvp_count + 1 : Math.max(0, ev.rsvp_count - 1);
          return { ...ev, rsvp_count: newCount };
        }
        return ev;
      })
    );

    const targetEvent = events.find((e) => e.id === eventId || e.id === dbTargetId);
    if (willRsvp) {
      toast.success(`You're attending "${targetEvent?.title || 'Event'}"!`, {
        description: 'Saved to Supabase database. See directions on the event page.',
      });
    } else {
      toast.info(`RSVP cancelled for "${targetEvent?.title || 'Event'}".`);
    }

    // Persist to live Supabase database with authenticated user ID
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      dbTargetId.includes('-') &&
      dbTargetId.length === 36 &&
      user?.id
    ) {
      try {
        const supabase = createClient();

        if (willRsvp) {
          const { error } = await supabase
            .from('rsvps')
            .upsert(
              {
                event_id: dbTargetId,
                user_id: user.id,
                status: 'going',
              },
              { onConflict: 'user_id,event_id' }
            );

          if (error) {
            console.error('Supabase RSVP insert error:', error.message);
          } else {
            console.info('RSVP successfully persisted to Supabase database for event:', dbTargetId);
          }
        } else {
          const { error } = await supabase
            .from('rsvps')
            .delete()
            .match({
              event_id: dbTargetId,
              user_id: user.id,
            });

          if (error) {
            console.error('Supabase RSVP delete error:', error.message);
          } else {
            console.info('RSVP successfully removed from Supabase database for event:', dbTargetId);
          }
        }
      } catch (err) {
        console.error('Failed to sync RSVP with Supabase:', err);
      }
    }
  };

  const createEvent = (eventData: Omit<EventItem, 'id' | 'rsvp_count'>): EventItem => {
    const newId = 'evt-custom-' + Date.now();
    const newEvent: EventItem = {
      ...eventData,
      id: newId,
      rsvp_count: 1,
      organizer: eventData.organizer || {
        id: user?.id || 'verified-host',
        name: user?.name || 'Verified Community Organizer',
        avatar_url: user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Host'}`,
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
            registration_link: eventData.google_maps_url || null,
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
    const dbTargetId = SAMPLE_TO_DB_MAP[id] || id;
    return events.find((e) => e.id === id || e.id === dbTargetId);
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
