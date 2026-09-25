import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  Navigation,
  Compass,
  AlertCircle,
  Siren,
  Stethoscope,
  RefreshCw,
  List,
  Map as MapIcon,
  X,
  Info,
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getNearbyClinics } from '@/lib/clinic-service';
import { formatDistance, PRESET_LOCATIONS } from '@/lib/geo';
import type { Clinic, ClinicFilters } from '@/types/clinic';
import ClinicMap from '@/components/clinics/ClinicMap';
import ClinicCard from '@/components/clinics/ClinicCard';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import { cn } from '@/lib/utils';

const RADIUS_OPTIONS = [
  { value: 2, label: 'Within 2 km' },
  { value: 5, label: 'Within 5 km (Default)' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
  { value: 50, label: 'Within 50 km' },
  { value: 9999, label: 'All Distances' },
];

const SPECIALIZATION_OPTIONS = [
  'General Medicine',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Dentistry',
  'Neurology',
  'Emergency Care',
];

export default function NearbyClinicsPage() {
  const [searchParams] = useSearchParams();

  // Geolocation hook
  const {
    location,
    status: geoStatus,
    errorMessage: geoError,
    isSearchingManual,
    requestLocation,
    setManualLocation,
    setPresetLocation,
    clearLocation,
  } = useGeolocation();

  // Component states
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [manualSearchText, setManualSearchText] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');

  // Filter state
  const [filters, setFilters] = useState<ClinicFilters>({
    search: '',
    radiusKm: 5, // Default 5 km
    openNowOnly: false,
    doctorAvailableNowOnly: false,
    emergencyOnly: false,
    specialization: '',
    service: '',
    onlineConsultation: false,
  });

  // Doctor selection modal state
  const [doctorModalClinic, setDoctorModalClinic] = useState<Clinic | null>(null);

  // Check URL query parameters on load (e.g. ?auto=true or ?radius=10)
  useEffect(() => {
    const autoLocate = searchParams.get('locate');
    if (autoLocate === 'true' && !location && geoStatus === 'idle') {
      requestLocation();
    }
  }, [searchParams, location, geoStatus, requestLocation]);

  // Load clinics when location or filters change
  const loadClinics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNearbyClinics(location, filters);
      setClinics(data);

      // Auto-select first clinic if none selected
      if (data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching clinics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [location, filters, selectedClinicId]);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  // Handle manual search submission
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchText.trim()) return;
    await setManualLocation(manualSearchText);
  };

  // Expand radius helper when no clinics found
  const handleExpandRadius = (newRadius: number) => {
    setFilters((prev) => ({ ...prev, radiusKm: newRadius }));
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.openNowOnly) count++;
    if (filters.doctorAvailableNowOnly) count++;
    if (filters.emergencyOnly) count++;
    if (filters.specialization) count++;
    if (filters.service) count++;
    if (filters.onlineConsultation) count++;
    if (filters.radiusKm !== 5) count++;
    return count;
  }, [filters]);

  const resetAllFilters = () => {
    setFilters({
      search: '',
      radiusKm: 5,
      openNowOnly: false,
      doctorAvailableNowOnly: false,
      emergencyOnly: false,
      specialization: '',
      service: '',
      onlineConsultation: false,
    });
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* ============================================================ */}
      {/* 1. Header & Location Search Bar                             */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-surface-200 pt-8 pb-6 shadow-xs">
        <div className="container-app">
          {/* Breadcrumb / Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-2">
                <Compass size={14} className="animate-spin-slow" />
                <span>24/7 Clinical Care Network</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-surface-900 tracking-tight">
                Find Clinics Near You
              </h1>
              <p className="text-sm sm:text-base text-surface-500 mt-1 max-w-2xl">
                Locate nearby verified medical centers, check real-time doctor availability,
                and book an immediate or scheduled appointment.
              </p>
            </div>

            {/* Quick Status / Auto-detect Button */}
            <div className="flex items-center gap-2">
              <Button
                variant={location ? 'outline' : 'primary'}
                size="md"
                onClick={requestLocation}
                disabled={geoStatus === 'loading'}
                className="gap-2 shadow-xs"
              >
                {geoStatus === 'loading' ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={16} className={location ? 'text-primary-600' : ''} />
                    <span>{location ? 'Update My Location' : '📍 Use Current Location'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-5 bg-surface-50 px-3 py-2 rounded-xl border border-surface-200/80">
            <Info size={14} className="text-primary-600 shrink-0" />
            <span>
              <strong>Privacy Guaranteed:</strong> We use your coordinates solely in your browser
              to measure distance to registered clinics. Your location is never stored permanently in
              our database.
            </span>
          </div>

          {/* Location Controls: Search area + Current Location display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Current Active Location Pill */}
            <div className="lg:col-span-5 bg-surface-100 rounded-xl p-2.5 flex items-center justify-between border border-surface-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                    Current Search Center
                  </div>
                  <div className="text-sm font-bold text-surface-900 truncate">
                    {location?.addressName ||
                      (location
                        ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : 'No location selected (Showing all clinics)')}
                  </div>
                </div>
              </div>

              {location && (
                <button
                  type="button"
                  onClick={clearLocation}
                  className="p-1 text-surface-400 hover:text-surface-700 rounded-md transition-colors"
                  title="Clear location"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Manual Search Area Form */}
            <form onSubmit={handleManualSearch} className="lg:col-span-7 flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400"
                />
                <input
                  type="text"
                  placeholder="Enter your city, area, zip code, or address manually..."
                  value={manualSearchText}
                  onChange={(e) => setManualSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 bg-white text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSearchingManual || !manualSearchText.trim()}
                className="shrink-0"
              >
                {isSearchingManual ? <RefreshCw size={16} className="animate-spin" /> : 'Search Area'}
              </Button>
            </form>
          </div>

          {/* Quick Preset Location Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-surface-100 text-xs">
            <span className="text-surface-500 font-medium mr-1">Quick Select:</span>
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setPresetLocation(preset.name)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer',
                  location?.addressName === preset.name
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-surface-600 hover:bg-surface-50 border-surface-200'
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Geolocation Denied / Warning Alert */}
          {geoError && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>{geoError}</span>
              </div>
              <span className="font-semibold text-amber-800 shrink-0">
                You can choose any area above!
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. Filter Bar & Controls                                     */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-surface-200 py-3 sticky top-16 z-30 shadow-xs">
        <div className="container-app flex flex-wrap items-center justify-between gap-3">
          {/* Left: Quick Pill Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Radius Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by distance radius"
                value={filters.radiusKm}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, radiusKm: Number(e.target.value) }))
                }
                className="pl-3 pr-8 py-1.5 bg-surface-100 hover:bg-surface-200 text-surface-800 text-xs font-semibold rounded-lg border border-surface-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    📍 {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle: Open Now */}
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({ ...prev, openNowOnly: !prev.openNowOnly }))
              }
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1.5 cursor-pointer',
                filters.openNowOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-surface-700 hover:bg-surface-50 border-surface-200'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  filters.openNowOnly ? 'bg-white' : 'bg-emerald-500'
                )}
              />
              Open Now
            </button>

            {/* Toggle: Doctor Available Now */}
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  doctorAvailableNowOnly: !prev.doctorAvailableNowOnly,
                }))
              }
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1.5 cursor-pointer',
                filters.doctorAvailableNowOnly
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-surface-700 hover:bg-surface-50 border-surface-200'
              )}
            >
              <Stethoscope size={13} />
              Doctor Available Now
            </button>

            {/* Toggle: Emergency Service */}
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({ ...prev, emergencyOnly: !prev.emergencyOnly }))
              }
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1.5 cursor-pointer',
                filters.emergencyOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-surface-700 hover:bg-surface-50 border-surface-200'
              )}
            >
              <Siren size={13} />
              24/7 Emergency
            </button>

            {/* Specialization Filter Dropdown */}
            <div className="relative hidden sm:block">
              <select
                aria-label="Filter by doctor specialization"
                value={filters.specialization}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, specialization: e.target.value }))
                }
                className="pl-3 pr-8 py-1.5 bg-surface-100 hover:bg-surface-200 text-surface-800 text-xs font-medium rounded-lg border border-surface-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Specialties</option>
                {SPECIALIZATION_OPTIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold px-2 py-1 underline cursor-pointer"
              >
                Reset filters ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Right: Results Count & Mobile View Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-surface-500 hidden md:block">
              Showing <strong>{clinics.length}</strong> clinic{clinics.length !== 1 ? 's' : ''}
            </span>

            {/* Mobile View Toggle (Map vs List) */}
            <div className="lg:hidden flex items-center bg-surface-100 rounded-lg p-1 border border-surface-200">
              <button
                type="button"
                onClick={() => setMobileViewMode('list')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                  mobileViewMode === 'list'
                    ? 'bg-white text-surface-900 shadow-xs'
                    : 'text-surface-600 hover:text-surface-900'
                )}
              >
                <List size={14} />
                List ({clinics.length})
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('map')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                  mobileViewMode === 'map'
                    ? 'bg-white text-surface-900 shadow-xs'
                    : 'text-surface-600 hover:text-surface-900'
                )}
              >
                <MapIcon size={14} />
                Map
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. Main Body: Split Interactive Map & Clinic List            */}
      {/* ============================================================ */}
      <main className="container-app pt-6">
        {isLoading ? (
          <div className="py-24 text-center">
            <Spinner size="lg" className="mx-auto mb-4 text-primary-600" />
            <h3 className="text-lg font-bold text-surface-800">
              Finding nearest clinical facilities...
            </h3>
            <p className="text-sm text-surface-500 mt-1">
              Calculating distances and verifying real-time doctor availability.
            </p>
          </div>
        ) : clinics.length === 0 ? (
          /* ============================================================ */
          /* No Clinics Found Within Radius — Banner + Expansion Button    */
          /* ============================================================ */
          <div className="max-w-2xl mx-auto py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} />
            </div>
            <h2 className="text-2xl font-bold text-surface-900">
              Within {filters.radiusKm} km: No clinics found
            </h2>
            <p className="text-surface-600 mt-2 text-sm sm:text-base">
              There are no registered medical centers matching your filters within a{' '}
              {filters.radiusKm} km radius.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {filters.radiusKm < 10 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleExpandRadius(10)}
                  className="shadow-sm"
                >
                  Try searching within 10 km
                </Button>
              )}

              {filters.radiusKm < 25 && (
                <Button
                  variant={filters.radiusKm >= 10 ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => handleExpandRadius(25)}
                >
                  Try searching within 25 km
                </Button>
              )}

              <Button variant="ghost" size="md" onClick={() => handleExpandRadius(9999)}>
                View All Clinics
              </Button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* Two-Column Responsive Layout                                 */
          /* Desktop: Map (sticky left or right) & Clinic List            */
          /* Mobile: Swappable List or Map View                           */
          /* ============================================================ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Interactive Map Column (On mobile, visible if mobileViewMode === 'map') */}
            <div
              className={cn(
                'lg:col-span-6 xl:col-span-7 lg:sticky lg:top-36 order-2 lg:order-1',
                mobileViewMode === 'map' ? 'block' : 'hidden lg:block'
              )}
            >
              <div className="h-[480px] lg:h-[calc(100vh-180px)] w-full rounded-2xl overflow-hidden shadow-card border border-surface-200">
                <ClinicMap
                  clinics={clinics}
                  userLocation={location}
                  selectedClinicId={selectedClinicId}
                  onSelectClinic={(c) => {
                    setSelectedClinicId(c.id);
                  }}
                />
              </div>

              {/* Map footnote */}
              <div className="text-[11px] text-surface-500 mt-2 text-center lg:text-left">
                💡 Click any clinic marker on the map to view instant directions, doctor schedules,
                and details.
              </div>
            </div>

            {/* Clinic List Column (On mobile, visible if mobileViewMode === 'list') */}
            <div
              className={cn(
                'lg:col-span-6 xl:col-span-5 space-y-4 order-1 lg:order-2',
                mobileViewMode === 'list' ? 'block' : 'hidden lg:block'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                  <span>Registered Clinics</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 text-surface-700 font-semibold">
                    {clinics.length}
                  </span>
                </h2>
                <span className="text-xs text-surface-500">Sorted by distance</span>
              </div>

              {clinics.map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  userLocation={location}
                  isSelected={clinic.id === selectedClinicId}
                  onSelect={() => setSelectedClinicId(clinic.id)}
                  onBookAppointment={(selected) => {
                    setDoctorModalClinic(selected);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* 4. Doctor Selection Modal for 1-Click Booking Flow            */}
      {/* ============================================================ */}
      {doctorModalClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-modal border border-surface-200 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-100">
              <div>
                <span className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
                  Book Appointment
                </span>
                <h3 className="text-lg font-bold text-surface-900 mt-0.5">
                  {doctorModalClinic.name}
                </h3>
                <p className="text-xs text-surface-500 flex items-center gap-1 mt-1">
                  <MapPin size={13} className="text-surface-400" />
                  <span>{doctorModalClinic.address}</span>
                  {doctorModalClinic.distance_km != null && (
                    <strong className="text-primary-600">
                      • {formatDistance(doctorModalClinic.distance_km)}
                    </strong>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDoctorModalClinic(null)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Doctors List */}
            <div className="py-4 space-y-3">
              <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">
                Select an Available Doctor:
              </h4>

              {doctorModalClinic.doctors && doctorModalClinic.doctors.length > 0 ? (
                doctorModalClinic.doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-surface-200 hover:border-primary-400 hover:bg-primary-50/20 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          doc.photo_url ||
                          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={doc.full_name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-surface-200 shrink-0"
                      />
                      <div>
                        <h5 className="font-bold text-sm text-surface-900 leading-tight">
                          {doc.full_name}
                        </h5>
                        <p className="text-xs text-primary-700 font-medium">
                          {doc.specializations?.[0]?.name || doc.department || 'Specialist'}
                        </p>
                        <p className="text-[11px] text-surface-500 mt-0.5">
                          {doc.experience_years} yrs exp • {doc.qualification}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/booking/${doc.id}?clinicId=${doctorModalClinic.id}`}
                      className="px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                    >
                      Book Slot ➔
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-surface-500 text-xs">
                  No doctors currently registered for this clinic.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-surface-100 flex items-center justify-between">
              <Link
                to={`/clinics/${doctorModalClinic.id}`}
                className="text-xs text-primary-600 font-semibold hover:underline"
              >
                View Full Clinic Profile & Services ↗
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDoctorModalClinic(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
