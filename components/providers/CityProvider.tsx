'use client';

import React, { createContext, useContext, useState } from 'react';
import { INDIAN_CITIES, type City, DEFAULT_CITY } from '@/lib/constants';

interface CityContextType {
  currentCity: City;
  setCityBySlug: (slug: string) => void;
  setCity: (city: City) => void;
  cities: City[];
  detectLocation: () => Promise<City | null>;
  isLocating: boolean;
}

const CityContext = createContext<CityContextType>({
  currentCity: DEFAULT_CITY,
  setCityBySlug: () => {},
  setCity: () => {},
  cities: INDIAN_CITIES,
  detectLocation: async () => null,
  isLocating: false,
});

const STORAGE_KEY = 'eventradar_selected_city';

// Helper: Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [isLocating, setIsLocating] = useState(false);
  const [currentCity, setCurrentCityState] = useState<City>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const found = INDIAN_CITIES.find(
            (c) => c.slug === stored || c.name.toLowerCase() === stored.toLowerCase()
          );
          if (found) return found;
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    return DEFAULT_CITY;
  });

  const setCity = (city: City) => {
    setCurrentCityState(city);
    try {
      localStorage.setItem(STORAGE_KEY, city.slug);
    } catch {
      // Ignore
    }
  };

  const setCityBySlug = (slug: string) => {
    const found = INDIAN_CITIES.find(
      (c) => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase()
    );
    if (found) {
      setCity(found);
    }
  };

  const detectLocation = async (): Promise<City | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return null;
    }

    setIsLocating(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          // Find closest city
          let closestCity = INDIAN_CITIES[0];
          let minDistance = Infinity;

          for (const city of INDIAN_CITIES) {
            const dist = calculateDistance(userLat, userLon, city.latitude, city.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              closestCity = city;
            }
          }

          setCity(closestCity);
          resolve(closestCity);
        },
        (error) => {
          setIsLocating(false);
          console.warn('Geolocation failed or denied:', error.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  return (
    <CityContext.Provider
      value={{
        currentCity,
        setCityBySlug,
        setCity,
        cities: INDIAN_CITIES,
        detectLocation,
        isLocating,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}
