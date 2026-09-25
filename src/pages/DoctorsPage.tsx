import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useDoctors } from '@/hooks/useDoctors';
import DoctorCard from '@/components/doctors/DoctorCard';
import DoctorFiltersBar from '@/components/doctors/DoctorFilters';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';

export default function DoctorsPage() {
  const {
    doctors,
    specializations,
    filters,
    setFilters,
    isLoading,
    error,
    resetFilters,
  } = useDoctors();

  const [searchParams] = useSearchParams();

  // Pick up search query from URL (from home page search)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== filters.search) {
      setFilters((prev) => ({ ...prev, search: urlSearch }));
    }
  }, [searchParams, setFilters, filters.search]);

  return (
    <div className="py-8 md:py-12">
      <div className="container-app">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 mb-2">
            Find a Doctor
          </h1>
          <p className="text-surface-600">
            Search our experienced medical professionals and book your appointment today.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <DoctorFiltersBar
            filters={filters}
            specializations={specializations}
            onFilterChange={setFilters}
            onReset={resetFilters}
            totalResults={doctors.length}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={resetFilters}
              className="text-primary-600 hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={32} />}
            title="No Doctors Found"
            description="We couldn't find any doctors matching your search criteria. Try adjusting your filters or search terms."
            action={
              <button
                onClick={resetFilters}
                className="text-primary-600 hover:underline text-sm font-medium cursor-pointer"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
