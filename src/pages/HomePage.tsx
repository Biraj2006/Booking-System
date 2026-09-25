import { Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  Stethoscope,
  Video,
  Heart,
  Microscope,
  Siren,
  ShieldCheck,
  ArrowRight,
  Clock,
  Star,
  Users,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { APP_NAME, ROUTES, CLINIC, CLINIC_SERVICES, FAQ_DATA } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';
import type { Doctor, Specialization } from '@/types/doctor';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Spinner from '@/components/common/Spinner';
import { useState, useEffect } from 'react';

// Icon map for services
const iconMap: Record<string, React.ReactNode> = {
  Stethoscope: <Stethoscope size={28} />,
  Video: <Video size={28} />,
  Heart: <Heart size={28} />,
  Microscope: <Microscope size={28} />,
  Siren: <Siren size={28} />,
  ShieldCheck: <ShieldCheck size={28} />,
};

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <NearbyClinicsBanner />
      <ServicesSection />
      <FeaturedDoctorsSection />
      <EmergencyBanner />
      <FAQSection />
      <ContactSection />
    </div>
  );
}

/* ===== HERO ===== */
function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <section className="relative gradient-hero text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="container-app relative py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* 24/7 badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
            <Clock size={16} className="text-primary-300" />
            <span className="text-sm font-medium">24/7 Healthcare Available</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
            Your Health,{' '}
            <span className="text-primary-300">Our Priority</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl leading-relaxed">
            Book appointments with trusted doctors anytime, anywhere. Quality healthcare is just a click away at {APP_NAME}.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-lg">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search doctors, specializations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-surface-800 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <Link to={searchQuery ? `${ROUTES.DOCTORS}?search=${searchQuery}` : ROUTES.DOCTORS}>
              <Button size="lg" className="bg-white !text-primary-700 hover:bg-primary-50 hover:!text-primary-800 w-full sm:w-auto">
                <Search size={18} />
                Find Doctor
              </Button>
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`${ROUTES.NEARBY_CLINICS}?locate=true`}>
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-900/30 border border-emerald-400/40 animate-pulse hover:animate-none"
              >
                <MapPin size={20} className="text-white fill-white/20" />
                📍 Find Clinics Near Me
              </Button>
            </Link>
            <Link to={ROUTES.DOCTORS}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                <Calendar size={18} />
                Book Appointment
              </Button>
            </Link>
            <Link to={ROUTES.EMERGENCY}>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <Siren size={18} />
                Emergency
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/20">
            {[
              { icon: <Users size={20} />, value: '10,000+', label: 'Patients Served' },
              { icon: <Stethoscope size={20} />, value: '50+', label: 'Expert Doctors' },
              { icon: <Star size={20} />, value: '4.9', label: 'Average Rating' },
              { icon: <Clock size={20} />, value: '24/7', label: 'Available' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== NEARBY CLINICS PROMO BANNER ===== */
function NearbyClinicsBanner() {
  return (
    <section className="py-10 bg-gradient-to-r from-primary-900 via-primary-800 to-teal-900 text-white relative overflow-hidden border-y border-primary-700/40">
      <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="container-app relative flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <MapPin size={28} className="text-primary-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Clinic & Doctor Finder
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">Travelling or Suddenly Sick in an Unfamiliar Area?</h3>
            <p className="text-white/80 text-xs sm:text-sm max-w-2xl mt-1">
              Find registered clinics near you right now, check which clinics are currently open, see on-duty doctors, and book an immediate appointment.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
          <Link to={`${ROUTES.NEARBY_CLINICS}?locate=true`} className="w-full sm:w-auto">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold w-full sm:w-auto shadow-md">
              <MapPin size={18} />
              📍 Find Clinics Near Me
            </Button>
          </Link>
          <Link to={ROUTES.NEARBY_CLINICS} className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 w-full sm:w-auto">
              Browse Map View
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===== SERVICES ===== */
function ServicesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-app">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">Our Services</span>
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mt-2 mb-4">
            Comprehensive Healthcare Services
          </h2>
          <p className="text-surface-600 max-w-2xl mx-auto">
            We provide a wide range of medical services to meet all your healthcare needs under one roof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {CLINIC_SERVICES.map((service) => (
            <Card key={service.title} hover className="group">
              <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 mb-4 group-hover:bg-primary-100 transition-colors">
                {iconMap[service.icon] || <Heart size={28} />}
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">{service.title}</h3>
              <p className="text-sm text-surface-600 leading-relaxed">{service.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== FEATURED DOCTORS ===== */
function FeaturedDoctorsSection() {
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        // Fetch top verified doctors with their specializations and ratings
        const { data: doctors } = await supabase
          .from('doctors')
          .select(`
            *,
            clinic:clinics(*),
            doctor_specializations(
              specialization:specializations(*)
            )
          `)
          .eq('is_active', true)
          .eq('is_verified', true)
          .order('experience_years', { ascending: false })
          .limit(4);

        if (doctors && doctors.length > 0) {
          // Fetch ratings
          const doctorIds = doctors.map((d) => d.id);
          const { data: ratings } = await supabase
            .from('doctor_ratings')
            .select('*')
            .in('doctor_id', doctorIds);

          const ratingMap = new Map(
            (ratings || []).map((r) => [r.doctor_id, r])
          );

          const transformed: Doctor[] = doctors.map((doc) => {
            const rating = ratingMap.get(doc.id);
            return {
              ...doc,
              specializations: doc.doctor_specializations
                ?.map((ds: { specialization: Specialization }) => ds.specialization)
                .filter(Boolean) || [],
              average_rating: rating?.average_rating || 0,
              total_reviews: rating?.total_reviews || 0,
            };
          });

          // Sort by rating descending, then experience
          transformed.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
          setFeaturedDoctors(transformed);
        }
      } catch (err) {
        console.error('Error fetching featured doctors:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <section className="py-20 bg-surface-50">
      <div className="container-app">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">Our Experts</span>
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mt-2 mb-4">
            Meet Our Top Doctors
          </h2>
          <p className="text-surface-600 max-w-2xl mx-auto">
            Our team of experienced medical professionals is dedicated to providing the highest quality care.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : featuredDoctors.length === 0 ? (
          /* Fallback to placeholder cards when no doctors exist in DB yet */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} hover padding="none" className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <Stethoscope size={48} className="text-primary-300" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-surface-900">Doctor Name</h3>
                  <p className="text-sm text-primary-600 mb-2">Specialization</p>
                  <div className="flex items-center gap-1 text-sm text-surface-500 mb-3">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span>4.8</span>
                    <span className="text-surface-300">•</span>
                    <span>10+ yrs exp</span>
                  </div>
                  <Link to={ROUTES.DOCTORS}>
                    <Button variant="outline" size="sm" fullWidth>
                      View Profile
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Real doctor cards from Supabase */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {featuredDoctors.map((doctor) => (
              <Card key={doctor.id} hover padding="none" className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center relative">
                  {doctor.photo_url ? (
                    <img
                      src={doctor.photo_url}
                      alt={doctor.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-700">
                        {getInitials(doctor.full_name)}
                      </span>
                    </div>
                  )}
                  {doctor.is_verified && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary-700 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-surface-900 truncate">{doctor.full_name}</h3>
                  <p className="text-sm text-primary-600 mb-2 truncate">
                    {doctor.specializations?.map((s) => s.name).join(', ') || doctor.qualification}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-surface-500 mb-3">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span>{(doctor.average_rating || 0).toFixed(1)}</span>
                    <span className="text-surface-300">•</span>
                    <span>{doctor.experience_years}+ yrs exp</span>
                  </div>
                  <Link to={`/doctors/${doctor.id}`}>
                    <Button variant="outline" size="sm" fullWidth>
                      View Profile
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to={ROUTES.DOCTORS}>
            <Button variant="secondary" size="lg">
              View All Doctors
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===== EMERGENCY BANNER ===== */
function EmergencyBanner() {
  return (
    <section className="bg-red-600 text-white py-12">
      <div className="container-app flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center animate-pulse-soft">
            <Siren size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Medical Emergency?</h3>
            <p className="text-red-100 text-sm">
              Call emergency services immediately. Online booking is not for emergencies.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <a href={`tel:${CLINIC.emergencyPhone}`}>
            <Button size="lg" className="bg-white !text-red-600 hover:bg-red-50 hover:!text-red-700">
              Call {CLINIC.emergencyPhone}
            </Button>
          </a>
          <Link to={ROUTES.EMERGENCY}>
            <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
              More Info
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===== FAQ ===== */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-white">
      <div className="container-app max-w-3xl">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mt-2 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((faq, index) => (
            <div
              key={index}
              className="border border-surface-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full px-6 py-4 text-left cursor-pointer"
                aria-expanded={openIndex === index}
              >
                <span className="text-sm font-semibold text-surface-800 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-surface-400 shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 animate-fade-in">
                  <p className="text-sm text-surface-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== CONTACT ===== */
function ContactSection() {
  return (
    <section className="py-20 bg-surface-50">
      <div className="container-app text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
          Ready to Book Your Appointment?
        </h2>
        <p className="text-surface-600 max-w-xl mx-auto mb-8">
          Find the right doctor and book your appointment in minutes. We're here for you 24/7.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={ROUTES.DOCTORS}>
            <Button size="lg">
              <Calendar size={20} />
              Book Appointment
            </Button>
          </Link>
          <Link to={ROUTES.CONTACT}>
            <Button variant="outline" size="lg">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
