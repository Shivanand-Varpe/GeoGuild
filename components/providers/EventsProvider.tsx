'use client';

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';
import { SAMPLE_EVENTS, type EventItem } from '@/lib/constants';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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

  // Lazy state initializers
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedEvents = localStorage.getItem(STORAGE_EVENTS_KEY);
        if (storedEvents) {
          const customParsed: EventItem[] = JSON.parse(storedEvents);
          return [...customParsed, ...SAMPLE_EVENTS];
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
    return ['evt-1']; // Default RSVP to Vecnaverse hackathon for demo
  });

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
          const { data, error } = await supabase.from('events').select('*');
          if (!error && data && data.length > 0 && active) {
            setEvents((prev) => {
              return [...data, ...prev.filter((p) => !data.some((d) => d.id === p.id))];
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
