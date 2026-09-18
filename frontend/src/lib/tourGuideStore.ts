// lib/tourGuideStore.ts

import { INDIAN_DESTINATIONS } from './indianDestinationsSeed';

export type TourGuidePlace = {
  id: string
  name: string
  country: string
  location: string
  category: string
  season: string
  difficulty: string
  budget: string
  currency: string
  days: string
  transport: string
  rating: string
  image: string
  description: string
  highlights: string
  tips: string
  lat: number
  lng: number
  status: 'Active' | 'Inactive'
  addedBy?: string
   visitors?: number
}

export type UserRole = 'guide' | 'tourist';

export const CAT_COLOR: Record<string, string> = {
  Heritage:   '#f59e0b',
  Beach:      '#06b6d4',
  Mountain:   '#10b981',
  Wildlife:   '#84cc16',
  Spiritual:  '#a78bfa',
  Adventure:  '#f97316',
  City:       '#38bdf8',
  Hill:       '#34d399',
  Desert:     '#fbbf24',
  Backwater:  '#22d3ee',
  Nature:     '#22c55e',
}

export const CAT_BG: Record<string, string> = {
  Heritage:   '#fef3c7',
  Beach:      '#cffafe',
  Mountain:   '#d1fae5',
  Wildlife:   '#ecfccb',
  Spiritual:  '#ede9fe',
  Adventure:  '#ffedd5',
  City:       '#e0f2fe',
  Hill:       '#d1fae5',
  Desert:     '#fef9c3',
  Backwater:  '#cffafe',
  Nature:     '#dcfce7',
}

export const SEASON_COLOR: Record<string, string> = {
  Winter:       '#3b82f6',
  Summer:       '#f59e0b',
  Monsoon:      '#10b981',
  Autumn:       '#f97316',
  Spring:       '#22c55e',
  'Year-round': '#a78bfa',
}

export const SEASON_BG: Record<string, string> = {
  Winter:       '#eff6ff',
  Summer:       '#fffbeb',
  Monsoon:      '#f0fdf4',
  Autumn:       '#fff7ed',
  Spring:       '#f0fdf4',
  'Year-round': '#f5f3ff',
}

export const DIFF_COLOR: Record<string, string> = {
  Easy:     '#16a34a',
  Moderate: '#d97706',
  Hard:     '#dc2626',
  Expert:   '#9f1239',
}

export const DIFF_BG: Record<string, string> = {
  Easy:     '#f0fdf4',
  Moderate: '#fffbeb',
  Hard:     '#fef2f2',
  Expert:   '#fff1f2',
}

export const SEASON_MONTHS: Record<string, string> = {
  Winter:       'Oct – Feb',
  Summer:       'Mar – Jun',
  Monsoon:      'Jul – Sep',
  Autumn:       'Sep – Nov',
  Spring:       'Mar – May',
  'Year-round': 'Any time',
}

// Seed data
const SEED_PLACES: TourGuidePlace[] = Array.isArray(INDIAN_DESTINATIONS)
  ? INDIAN_DESTINATIONS
  : [];

const SEED_IDS = new Set(SEED_PLACES.map(p => p.id));

type Listener = (places: TourGuidePlace[]) => void;

class TourGuidePlacesStore {
  private places: TourGuidePlace[] = [];
  private listeners: Set<Listener> = new Set();

  /** Initialize store from seed + localStorage */
  init() {
    const base: TourGuidePlace[] = [...SEED_PLACES];

    try {
      const saved = localStorage.getItem('tourGuide_addedPlaces');
      if (saved) {
        const added: TourGuidePlace[] = JSON.parse(saved);
        const existingIds = new Set(base.map(p => p.id));
        added
          .filter(p => !existingIds.has(p.id))
          .forEach(p => base.push(p));
      }
    } catch {
      // localStorage unavailable — silently continue
    }

    this.places = base;
    this.notify();
  }

  getActivePlaces(): TourGuidePlace[] {
    return this.places.filter(p => p.status === 'Active');
  }

  getAllPlaces(): TourGuidePlace[] {
    return [...this.places];
  }

  /** Add a new place internally */
  addPlace(place: Omit<TourGuidePlace, 'id' | 'country' | 'currency'>): TourGuidePlace {
    const newPlace: TourGuidePlace = {
      ...place,
      id: `tg-${Date.now()}`,
      country: 'India',
      currency: '₹',
    };

    this.places = [...this.places, newPlace];
    this.persistAdded();
    this.notify();

    return newPlace;
  }

  /**
   * Add a location (only guides can add)
   * @param userRole Must be 'guide' to allow addition
   */
  addLocation(
    data: Omit<TourGuidePlace, 'id' | 'country' | 'currency'> & { addedBy?: string },
    userRole: UserRole
  ): TourGuidePlace | null {
    if (userRole !== 'guide') {
      console.warn('Only tour guides can add new locations.');
      return null;
    }
    return this.addPlace(data);
  }

  updatePlace(id: string, updates: Partial<TourGuidePlace>): void {
    this.places = this.places.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    this.persistAdded();
    this.notify();
  }

  deletePlace(id: string, userRole: UserRole): boolean {
    if (userRole !== 'guide') {
      console.warn('Only tour guides can delete locations.');
      return false;
    }
    if (SEED_IDS.has(id)) {
      console.warn(`Cannot delete seed place with id "${id}".`);
      return false;
    }

    this.places = this.places.filter(p => p.id !== id);
    this.persistAdded();
    this.notify();
    return true;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l([...this.places]));
  }

  private persistAdded(): void {
    const added = this.places.filter(p => !SEED_IDS.has(p.id));
    try {
      localStorage.setItem('tourGuide_addedPlaces', JSON.stringify(added));
    } catch {
      // localStorage unavailable
    }
  }
}

export const tourGuidePlacesStore = new TourGuidePlacesStore();