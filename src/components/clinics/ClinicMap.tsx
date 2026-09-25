import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, getDirectionsUrl } from '@/lib/geo';
import type { Clinic, UserLocation } from '@/types/clinic';

interface ClinicMapProps {
  clinics: Clinic[];
  userLocation: UserLocation | null;
  selectedClinicId?: string | null;
  onSelectClinic?: (clinic: Clinic) => void;
  className?: string;
}

export default function ClinicMap({
  clinics,
  userLocation,
  selectedClinicId,
  onSelectClinic,
  className = 'h-full min-h-[420px] w-full',
}: ClinicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  // 1. Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : clinics.length > 0 && clinics[0].latitude && clinics[0].longitude
        ? [clinics[0].latitude, clinics[0].longitude]
        : [40.7128, -74.006];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      // CartoDB Voyager or OpenStreetMap tiles for clean healthcare aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        markerMapRef.current.clear();
      }
    };
  }, []);

  // 2. Render markers when clinics or userLocation change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerMapRef.current.clear();

    const boundsPoints: [number, number][] = [];

    // Render User Location Marker (Pulsing Blue Beacon)
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      boundsPoints.push([userLocation.lat, userLocation.lng]);

      const userIcon = L.divIcon({
        className: 'user-pin-wrapper',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(layer);

      userMarker.bindTooltip(
        `<div class="font-medium text-xs text-blue-700">📍 You Are Here (${userLocation.addressName || 'Current Location'})</div>`,
        { permanent: false, direction: 'top', offset: [0, -10] }
      );
    }

    // Render Clinic Markers
    clinics.forEach((clinic) => {
      if (clinic.latitude == null || clinic.longitude == null) return;

      boundsPoints.push([clinic.latitude, clinic.longitude]);

      const isSelected = clinic.id === selectedClinicId;
      const isOpen = clinic.opening_status === 'open';
      const isLimited = clinic.opening_status === 'limited';

      // Colors based on status
      const bgColor = isOpen ? 'bg-emerald-600' : isLimited ? 'bg-amber-500' : 'bg-rose-500';
      const borderColor = isOpen ? 'border-emerald-200' : isLimited ? 'border-amber-200' : 'border-rose-200';
      const glowEffect = isSelected ? 'ring-4 ring-primary-500 scale-110 shadow-2xl' : 'shadow-md hover:scale-105';

      const clinicIcon = L.divIcon({
        className: 'clinic-pin-wrapper',
        html: `
          <div class="cursor-pointer transition-all duration-200 flex flex-col items-center">
            <div class="w-9 h-9 rounded-xl ${bgColor} ${borderColor} border-2 text-white flex items-center justify-center ${glowEffect}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 6v12m-6-6h12"/>
              </svg>
            </div>
            <div class="w-2 h-2 rotate-45 ${bgColor} -mt-1 shadow-sm"></div>
            ${
              clinic.distance_km != null
                ? `<div class="mt-0.5 px-1.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-surface-800 border border-surface-200 shadow-xs whitespace-nowrap">
                    ${formatDistance(clinic.distance_km)}
                   </div>`
                : ''
            }
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 42],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([clinic.latitude, clinic.longitude], {
        icon: clinicIcon,
        zIndexOffset: isSelected ? 500 : 100,
      }).addTo(layer);

      markerMapRef.current.set(clinic.id, marker);

      // Popup Content
      const directionsUrl = getDirectionsUrl(
        clinic.latitude,
        clinic.longitude,
        userLocation?.lat,
        userLocation?.lng
      );

      const statusBadge = isOpen
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Open Now</span>`
        : isLimited
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">🟡 Limited Hours</span>`
        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">🔴 Closed</span>`;

      const doctorBadge = clinic.has_doctor_available_now
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">👨‍⚕️ Doctor Available Now</span>`
        : '';

      const popupHtml = `
        <div class="w-64 p-1 font-sans text-surface-900">
          ${
            clinic.image_url
              ? `<div class="w-full h-24 rounded-lg overflow-hidden mb-2 bg-surface-100">
                  <img src="${clinic.image_url}" alt="${clinic.name}" class="w-full h-full object-cover" />
                 </div>`
              : ''
          }
          <div class="flex items-start justify-between gap-1 mb-1">
            <h4 class="font-bold text-sm leading-tight text-surface-900">${clinic.name}</h4>
          </div>
          <p class="text-xs text-surface-500 mb-2 truncate">${clinic.address}</p>

          <div class="flex flex-wrap gap-1 mb-3">
            ${statusBadge}
            ${
              clinic.distance_km != null
                ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">📍 ${formatDistance(clinic.distance_km)}</span>`
                : ''
            }
            ${doctorBadge}
          </div>

          ${
            clinic.doctor_count
              ? `<div class="text-[11px] text-surface-600 mb-3 flex items-center gap-1">
                  <span>${clinic.doctor_count} registered physician${clinic.doctor_count > 1 ? 's' : ''}</span>
                 </div>`
              : ''
          }

          <div class="grid grid-cols-2 gap-2 pt-1 border-t border-surface-100">
            <button
              id="map-btn-view-${clinic.id}"
              class="w-full py-1.5 px-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              View Clinic
            </button>
            <a
              href="${directionsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-1.5 px-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-lg text-xs font-semibold text-center transition-colors inline-flex items-center justify-center gap-1"
            >
              Directions ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280, className: 'clinic-map-popup' });

      // On click event
      marker.on('click', () => {
        if (onSelectClinic) onSelectClinic(clinic);
      });

      // Bind dynamic button event inside leaflet popup after it opens
      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-btn-view-${clinic.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectClinic) onSelectClinic(clinic);
          };
        }
      });
    });

    // Auto-fit bounds if we have points and not already focused on a specific clinic
    if (boundsPoints.length > 0 && !selectedClinicId) {
      map.fitBounds(boundsPoints, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }, [clinics, userLocation]);

  // 3. Pan to selected clinic when selectedClinicId changes
  useEffect(() => {
    if (!selectedClinicId || !mapInstanceRef.current) return;
    const selectedClinic = clinics.find((c) => c.id === selectedClinicId);
    if (!selectedClinic || selectedClinic.latitude == null || selectedClinic.longitude == null) return;

    mapInstanceRef.current.flyTo([selectedClinic.latitude, selectedClinic.longitude], 15, {
      duration: 1,
    });

    const marker = markerMapRef.current.get(selectedClinicId);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
    }
  }, [selectedClinicId, clinics]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-surface-200 shadow-sm bg-surface-100">
      <div ref={mapContainerRef} className={className} />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-surface-200 shadow-sm text-xs space-y-1 hidden sm:block">
        <div className="font-semibold text-surface-800 text-[11px] mb-1">Status Legend</div>
        <div className="flex items-center gap-1.5 text-surface-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Open Now</span>
        </div>
        <div className="flex items-center gap-1.5 text-surface-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Limited Availability</span>
        </div>
        <div className="flex items-center gap-1.5 text-surface-600">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span>Closed</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-1.5 text-blue-600 pt-1 border-t border-surface-200 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span>Your Location</span>
          </div>
        )}
      </div>
    </div>
  );
}
