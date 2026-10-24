'use client';

import React, { createContext, useContext, useState } from 'react';
import { INDIAN_CITIES, type City, DEFAULT_CITY } from '@/lib/constants';

interface CityContextType {
  currentCity: City;
  setCityBySlug: (slug: string) => void;
  setCity: (city: City) => void;
  cities: City[];
}

const CityContext = createContext<CityContextType>({
  currentCity: DEFAULT_CITY,
  setCityBySlug: () => {},
  setCity: () => {},
  cities: INDIAN_CITIES,
});

const STORAGE_KEY = 'eventradar_selected_city';

export function CityProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <CityContext.Provider value={{ currentCity, setCityBySlug, setCity, cities: INDIAN_CITIES }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}
