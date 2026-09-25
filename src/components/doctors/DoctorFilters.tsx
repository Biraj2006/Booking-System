import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { DoctorFilters, Specialization } from '@/types/doctor';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface DoctorFiltersBarProps {
  filters: DoctorFilters;
  specializations: Specialization[];
  onFilterChange: (filters: DoctorFilters) => void;
  onReset: () => void;
  totalResults: number;
}

export default function DoctorFiltersBar({
  filters,
  specializations,
  onFilterChange,
  onReset,
  totalResults,
}: DoctorFiltersBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const updateFilter = <K extends keyof DoctorFilters>(key: K, value: DoctorFilters[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search ||
    filters.specialization ||
    filters.consultation_type ||
    filters.min_experience !== null;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by doctor name or qualification..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-surface-200 text-surface-800 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className={cn(
            'lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer',
            showMobileFilters || hasActiveFilters
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-white border-surface-200 text-surface-600'
          )}
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Filter Controls */}
      <div className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
        showMobileFilters ? 'block' : 'hidden lg:grid'
      )}>
        {/* Specialization */}
        <div className="relative">
          <select
            value={filters.specialization}
            onChange={(e) => updateFilter('specialization', e.target.value)}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg bg-white border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
          >
            <option value="">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec.id} value={spec.id}>{spec.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        </div>

        {/* Consultation Type */}
        <div className="relative">
          <select
            value={filters.consultation_type}
            onChange={(e) => updateFilter('consultation_type', e.target.value as DoctorFilters['consultation_type'])}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg bg-white border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
          >
            <option value="">All Consultation Types</option>
            <option value="online">Online</option>
            <option value="offline">In-Person</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        </div>

        {/* Experience */}
        <div className="relative">
          <select
            value={filters.min_experience ?? ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value) : null;
              updateFilter('min_experience', val);
            }}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg bg-white border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
          >
            <option value="">Any Experience</option>
            <option value="1">1+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
            <option value="10">10+ years</option>
            <option value="15">15+ years</option>
            <option value="20">20+ years</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <X size={16} />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-surface-500">
        {totalResults === 0
          ? 'No doctors found matching your criteria'
          : `Showing ${totalResults} doctor${totalResults !== 1 ? 's' : ''}`
        }
        {hasActiveFilters && ' (filtered)'}
      </div>
    </div>
  );
}
