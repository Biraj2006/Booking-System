import { useState, useCallback } from 'react';
import { requestCurrentPosition, geocodeLocationName, PRESET_LOCATIONS } from '@/lib/geo';
import type { UserLocation, GeolocationStatus } from '@/types/clinic';
import { toast } from 'sonner';

const SESSION_KEY = 'medicare_user_location';

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  // Save to session storage only (not database)
  const saveLocation = useCallback((loc: UserLocation | null) => {
    setLocation(loc);
    try {
      if (loc) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(loc));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore sessionStorage issues
    }
  }, []);

  // Request browser location
  const requestLocation = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await requestCurrentPosition();
      saveLocation(result.coords);
      setStatus(result.status);
      toast.success('Location detected', {
        description: 'Showing verified clinics near your current position.',
      });
      return result.coords;
    } catch (err: any) {
      const errStatus: GeolocationStatus = err.status || 'unavailable';
      const msg: string = err.message || 'Unable to retrieve your location.';
      setStatus(errStatus);
      setErrorMessage(msg);

      if (errStatus === 'denied') {
        toast.error('Location access denied', {
          description: 'You can enter your city or neighborhood manually to find nearby clinics.',
        });
      } else {
        toast.warning('Location unavailable', {
          description: msg,
        });
      }
      return null;
    }
  }, [saveLocation]);

  // Set manual location via geocoding
  const setManualLocation = useCallback(
    async (query: string): Promise<boolean> => {
      if (!query.trim()) return false;
      setIsSearchingManual(true);
      setErrorMessage(null);

      try {
        const found = await geocodeLocationName(query);
        if (found) {
          saveLocation(found);
          setStatus('granted');
          toast.success(`Location set to ${found.addressName || query}`, {
            description: 'Updated nearby clinics list and interactive map.',
          });
          setIsSearchingManual(false);
          return true;
        } else {
          setErrorMessage(`Could not find coordinates for "${query}". Try another area or select a preset.`);
          toast.error('Location not found', {
            description: 'Please try entering a city, zip code, or neighborhood.',
          });
          setIsSearchingManual(false);
          return false;
        }
      } catch (err) {
        setErrorMessage('Failed to resolve location. Please try again.');
        setIsSearchingManual(false);
        return false;
      }
    },
    [saveLocation]
  );

  // Select a preset area
  const setPresetLocation = useCallback(
    (presetName: string) => {
      const preset = PRESET_LOCATIONS.find(
        (p) => p.name.toLowerCase() === presetName.toLowerCase()
      );
      if (preset) {
        const loc: UserLocation = {
          lat: preset.lat,
          lng: preset.lng,
          source: 'preset',
          addressName: preset.name,
        };
        saveLocation(loc);
        setStatus('granted');
        setErrorMessage(null);
        toast.info(`Location set to ${preset.name}`);
      }
    },
    [saveLocation]
  );

  // Clear location
  const clearLocation = useCallback(() => {
    saveLocation(null);
    setStatus('idle');
    setErrorMessage(null);
  }, [saveLocation]);

  return {
    location,
    status,
    errorMessage,
    isSearchingManual,
    requestLocation,
    setManualLocation,
    setPresetLocation,
    clearLocation,
    presetLocations: PRESET_LOCATIONS,
  };
}
