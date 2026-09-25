import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, Calendar,
  CheckCircle2, XCircle, Clock, TrendingUp,
  Shield, Search, Activity, Plus, Edit2, DollarSign,
  Building2, Phone, Mail, Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { APPOINTMENT_STATUS_CONFIG } from '@/lib/constants';
import { formatDate, formatTime, getInitials } from '@/lib/utils';
import { approveDoctor, rejectDoctor, toggleDoctorActive } from '@/lib/doctor-service';
import type { AppointmentStatus } from '@/types';
import type { Doctor, Specialization } from '@/types/doctor';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import DoctorModal from '@/components/doctors/DoctorModal';
import DoctorCredentialsDialog from '@/components/doctors/DoctorCredentialsDialog';

type AdminTab = 'overview' | 'doctors' | 'patients' | 'appointments' | 'specializations';
type DoctorStatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  pendingDoctors: number;
}

export default function AdminDashboardPage() {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (location.pathname.includes('doctors')) return 'doctors';
    if (location.pathname.includes('patients')) return 'patients';
    if (location.pathname.includes('appointments')) return 'appointments';
    if (location.pathname.includes('specializations')) return 'specializations';
    return 'overview';
  });

  const [stats, setStats] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter>('all');

  // Doctor Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [createdDoctor, setCreatedDoctor] = useState<Doctor | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | undefined>(undefined);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync tab with route changes
  useEffect(() => {
    if (location.pathname.includes('doctors')) setActiveTab('doctors');
    else if (location.pathname.includes('patients')) setActiveTab('patients');
    else if (location.pathname.includes('appointments')) setActiveTab('appointments');
    else if (location.pathname.includes('specializations')) setActiveTab('specializations');
    else setActiveTab('overview');
  }, [location.pathname]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch stats and records in parallel
      const [patientsRes, doctorsRes, appointmentsRes, specsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'patient').order('created_at', { ascending: false }),
        supabase.from('doctors').select(`
          *,
          clinic:clinics(name),
          doctor_specializations(
            specialization:specializations(*)
          ),
          availability:doctor_availability(*)
        `).order('created_at', { ascending: false }),
        supabase.from('appointments').select(`
          *,
          doctor:doctors(full_name, qualification),
          patient:profiles!appointments_patient_id_fkey(full_name, email)
        `).order('created_at', { ascending: false }).limit(100),
        supabase.from('specializations').select('*').order('name'),
      ]);

      const patientsData = patientsRes.data || [];
      const rawDoctorsData = doctorsRes.data || [];
      const appointmentsData = appointmentsRes.data || [];
      const specsData = (specsRes.data || []) as Specialization[];

      // Flatten specializations array on each doctor
      const transformedDoctors: Doctor[] = rawDoctorsData.map((doc: any) => ({
        ...doc,
        status: doc.status || (doc.is_verified ? 'approved' : 'pending'),
        specializations: doc.doctor_specializations
          ?.map((ds: any) => ds.specialization)
          .filter(Boolean) || [],
      }));

      setPatients(patientsData);
      setDoctors(transformedDoctors);
      setAppointments(appointmentsData);
      setSpecializations(specsData);

      setStats({
        totalPatients: patientsData.length,
        totalDoctors: transformedDoctors.length,
        pendingDoctors: transformedDoctors.filter((d) => d.status === 'pending').length,
        totalAppointments: appointmentsData.length,
        todayAppointments: appointmentsData.filter((a: any) => a.appointment_date === today).length,
        completedAppointments: appointmentsData.filter((a: any) => a.status === 'completed').length,
        cancelledAppointments: appointmentsData.filter((a: any) => a.status === 'cancelled').length,
        pendingAppointments: appointmentsData.filter((a: any) => a.status === 'pending' || a.status === 'confirmed').length,
      });
    } catch (err) {
      console.error('Error loading admin data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Approve Doctor
  const handleApprove = async (doc: Doctor) => {
    setActionLoadingId(doc.id);
    const { error } = await approveDoctor(doc.id);
    if (error) {
      toast.error('Failed to approve doctor: ' + error.message);
    } else {
      toast.success(`Dr. ${doc.full_name} has been approved!`);
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, status: 'approved', is_verified: true, is_active: true } : d
        )
      );
    }
    setActionLoadingId(null);
  };

  // Handle Reject Doctor
  const handleReject = async (doc: Doctor) => {
    if (!confirm(`Are you sure you want to reject the application for Dr. ${doc.full_name}?`)) {
      return;
    }
    setActionLoadingId(doc.id);
    const { error } = await rejectDoctor(doc.id);
    if (error) {
      toast.error('Failed to reject doctor: ' + error.message);
    } else {
      toast.success(`Doctor application marked as rejected`);
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, status: 'rejected', is_active: false } : d
        )
      );
    }
    setActionLoadingId(null);
  };

  // Toggle Doctor Active / Deactivate
  const handleToggleActive = async (doc: Doctor) => {
    const action = doc.is_active ? 'deactivate' : 'activate';
    if (doc.is_active && !confirm(`Deactivating Dr. ${doc.full_name} will hide them from the patient booking search. Continue?`)) {
      return;
    }

    setActionLoadingId(doc.id);
    const { error } = await toggleDoctorActive(doc.id, doc.is_active);
    if (error) {
      toast.error(`Failed to ${action} doctor`);
    } else {
      toast.success(`Doctor ${doc.is_active ? 'deactivated' : 'activated'}`);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, is_active: !d.is_active } : d))
      );
    }
    setActionLoadingId(null);
  };

  // Toggle specialization active status
  const toggleSpecializationActive = async (specId: string, isActive: boolean) => {
    const { error } = await supabase.from('specializations').update({ is_active: !isActive }).eq('id', specId);
    if (error) {
      toast.error('Failed to update specialization');
    } else {
      toast.success(isActive ? 'Specialization hidden' : 'Specialization shown');
      setSpecializations((prev) => prev.map((s) => s.id === specId ? { ...s, is_active: !isActive } : s));
    }
  };

  const statusBadge = (status: string) => {
    const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger', 'no-show': 'default',
    };
    return <Badge variant={variantMap[status] || 'default'} size="sm">{APPOINTMENT_STATUS_CONFIG[status as AppointmentStatus]?.label || status}</Badge>;
  };

  // Filter doctors
  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.department && d.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.specializations?.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    {
      key: 'doctors',
      label: `Doctors (${doctors.length})`,
      icon: <Stethoscope size={16} />,
      badge: stats?.pendingDoctors && stats.pendingDoctors > 0 ? stats.pendingDoctors : undefined,
    },
    { key: 'patients', label: `Patients (${patients.length})`, icon: <Users size={16} /> },
    { key: 'appointments', label: `Appointments`, icon: <Calendar size={16} /> },
    { key: 'specializations', label: 'Specializations', icon: <Activity size={16} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900">Admin Dashboard</h1>
          <p className="text-surface-500 mt-1">Manage doctors, patients, appointments, and hospital operations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-primary-700 border-primary-600 font-semibold'
                : 'text-surface-500 border-transparent hover:text-surface-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {tab.badge} pending
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Patients', value: stats.totalPatients, icon: <Users size={20} />, color: 'text-blue-600 bg-blue-50' },
              { label: 'Total Doctors', value: stats.totalDoctors, icon: <Stethoscope size={20} />, color: 'text-emerald-600 bg-emerald-50' },
              { label: "Today's Appts", value: stats.todayAppointments, icon: <Calendar size={20} />, color: 'text-primary-600 bg-primary-50' },
              { label: 'Total Appts', value: stats.totalAppointments, icon: <TrendingUp size={20} />, color: 'text-violet-600 bg-violet-50' },
            ].map((s) => (
              <Card key={s.label} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{s.value}</p>
                  <p className="text-xs text-surface-500">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <Clock size={24} className="text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-surface-900">{stats.pendingAppointments}</p>
              <p className="text-sm text-surface-500">Pending Appointments</p>
            </Card>
            <Card className="text-center">
              <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-surface-900">{stats.completedAppointments}</p>
              <p className="text-sm text-surface-500">Completed Appointments</p>
            </Card>
            <Card className="text-center">
              <XCircle size={24} className="text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-surface-900">{stats.cancelledAppointments}</p>
              <p className="text-sm text-surface-500">Cancelled Appointments</p>
            </Card>
          </div>

          {/* Quick Doctor Review Alert */}
          {stats.pendingDoctors > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="text-amber-600" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {stats.pendingDoctors} Doctor Application{stats.pendingDoctors > 1 ? 's' : ''} Pending Review
                  </h4>
                  <p className="text-xs text-amber-700">
                    Review and approve doctors to grant them access to the Doctor Portal.
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setActiveTab('doctors')}>
                Review Doctors
              </Button>
            </div>
          )}

          {/* Recent appointments */}
          <Card>
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Recent Appointments</h3>
            <div className="space-y-3">
              {appointments.slice(0, 5).map((apt: any) => (
                <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-surface-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{apt.patient_name}</p>
                    <p className="text-xs text-surface-500">{apt.doctor?.full_name} • {formatDate(apt.appointment_date)}</p>
                  </div>
                  {statusBadge(apt.status)}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* DOCTORS MANAGEMENT TAB                                        */}
      {/* ============================================================ */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-surface-900">Doctor Directory & Practice Management</h2>
              <p className="text-xs text-surface-500 mt-0.5">
                Add doctors, approve applications, edit clinical practice details, and control portal access.
              </p>
            </div>
            <Button
              onClick={() => {
                setDoctorToEdit(null);
                setIsDoctorModalOpen(true);
              }}
              className="shrink-0"
            >
              <Plus size={18} />
              <span>Add Doctor</span>
            </Button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name, email, department, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex gap-1.5 bg-surface-100 p-1 rounded-xl shrink-0 overflow-x-auto">
              {(['all', 'approved', 'pending', 'rejected'] as DoctorStatusFilter[]).map((filterKey) => {
                const count =
                  filterKey === 'all'
                    ? doctors.length
                    : doctors.filter((d) => d.status === filterKey).length;
                return (
                  <button
                    key={filterKey}
                    onClick={() => setStatusFilter(filterKey)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === filterKey
                        ? 'bg-white text-surface-900 shadow-sm'
                        : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    {filterKey} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctor Cards List */}
          <div className="space-y-4">
            {filteredDoctors.map((doc) => {
              const specName = doc.specializations?.[0]?.name || 'General';
              const activeSlotsCount = doc.availability?.filter((a) => a.is_active).length || 0;

              return (
                <Card key={doc.id} className="hover:border-surface-300 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    {/* Doctor Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                        {getInitials(doc.full_name)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-surface-900 truncate">
                            {doc.full_name}
                          </h3>
                          {doc.is_verified && (
                            <span title="Verified Doctor">
                              <Shield size={16} className="text-primary-600" />
                            </span>
                          )}
                          {/* Status Badge */}
                          <Badge
                            variant={
                              doc.status === 'approved'
                                ? 'success'
                                : doc.status === 'pending'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {doc.status.toUpperCase()}
                          </Badge>
                          {/* Active / Inactive Badge */}
                          <Badge variant={doc.is_active ? 'info' : 'default'} size="sm">
                            {doc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Metadata Row 1: Email, Phone, Dept */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-600">
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="text-surface-400" />
                            <span className="font-mono">{doc.email}</span>
                          </span>
                          {doc.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={13} className="text-surface-400" />
                              <span>{doc.phone}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                            <Building2 size={13} />
                            <span>{doc.department || 'General Medicine'}</span>
                          </span>
                        </div>

                        {/* Metadata Row 2: Specialty, Experience, Fee, Availability */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Stethoscope size={13} className="text-surface-400" />
                            <span>Specialty: <strong className="text-surface-700">{specName}</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Award size={13} className="text-surface-400" />
                            <span>Experience: <strong className="text-surface-700">{doc.experience_years || 0} yrs</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={13} className="text-surface-400" />
                            <span>Fee: <strong className="text-surface-700">${Number(doc.consultation_fee || 0).toFixed(2)}</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-surface-400" />
                            <span>
                              Availability:{' '}
                              <strong className={activeSlotsCount > 0 ? 'text-emerald-700' : 'text-surface-400'}>
                                {activeSlotsCount > 0 ? `${activeSlotsCount} time slots` : 'No slots set'}
                              </strong>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-0 border-surface-100">
                      {/* Pending Approvals */}
                      {doc.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleApprove(doc)}
                            isLoading={actionLoadingId === doc.id}
                          >
                            <CheckCircle2 size={15} />
                            <span>Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => handleReject(doc)}
                            disabled={actionLoadingId === doc.id}
                          >
                            <XCircle size={15} />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}

                      {/* Edit Doctor */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDoctorToEdit(doc);
                          setIsDoctorModalOpen(true);
                        }}
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </Button>

                      {/* Activate / Deactivate Toggle */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className={doc.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
                        onClick={() => handleToggleActive(doc)}
                        isLoading={actionLoadingId === doc.id}
                      >
                        {doc.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredDoctors.length === 0 && (
              <EmptyState
                icon={<Stethoscope size={36} />}
                title={searchQuery || statusFilter !== 'all' ? 'No doctors match filters' : 'No doctors registered yet'}
                description={
                  searchQuery || statusFilter !== 'all'
                    ? 'Try clearing your search query or selecting a different status filter.'
                    : 'Click the "Add Doctor" button above to register your first clinical doctor.'
                }
                action={
                  <Button
                    onClick={() => {
                      setDoctorToEdit(null);
                      setIsDoctorModalOpen(true);
                    }}
                  >
                    <Plus size={16} /> Add Doctor
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          {patients.filter((p) => p.full_name.toLowerCase().includes(searchQuery.toLowerCase())).map((patient) => (
            <Card key={patient.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-600 text-sm font-bold shrink-0">
                {getInitials(patient.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-surface-900">{patient.full_name}</h3>
                <p className="text-xs text-surface-500">{patient.email} • Joined {formatDate(patient.created_at)}</p>
              </div>
              <Badge variant="default" size="sm">Patient</Badge>
            </Card>
          ))}
          {patients.length === 0 && <EmptyState icon={<Users size={32} />} title="No patients registered" />}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {appointments.map((apt: any) => (
            <Card key={apt.id}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800">{apt.patient_name}</p>
                  <p className="text-xs text-surface-500">
                    Dr. {apt.doctor?.full_name} • {formatDate(apt.appointment_date)} at {formatTime(apt.start_time)} • ID: {apt.appointment_id}
                  </p>
                </div>
                {statusBadge(apt.status)}
              </div>
            </Card>
          ))}
          {appointments.length === 0 && <EmptyState icon={<Calendar size={32} />} title="No appointments" />}
        </div>
      )}

      {/* Specializations Tab */}
      {activeTab === 'specializations' && (
        <div className="space-y-3">
          {specializations.map((spec: any) => (
            <Card key={spec.id} className="flex items-center gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-surface-900">{spec.name}</h3>
                <p className="text-xs text-surface-500">{spec.description}</p>
              </div>
              <Badge variant={spec.is_active ? 'success' : 'default'} size="sm">{spec.is_active ? 'Active' : 'Hidden'}</Badge>
              <Button size="sm" variant="ghost" onClick={() => toggleSpecializationActive(spec.id, spec.is_active)}>
                {spec.is_active ? 'Hide' : 'Show'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Doctor Add / Edit Modal */}
      <DoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => {
          setIsDoctorModalOpen(false);
          setDoctorToEdit(null);
        }}
        doctorToEdit={doctorToEdit}
        specializations={specializations}
        onSuccess={(doc, pass) => {
          if (doctorToEdit) {
            // Updated
            setDoctors((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
          } else {
            // Newly created
            setCreatedDoctor(doc);
            setTemporaryPassword(pass);
            setIsCredentialsOpen(true);
            loadData(); // reload list
          }
        }}
      />

      {/* Doctor Credentials Display Dialog */}
      <DoctorCredentialsDialog
        isOpen={isCredentialsOpen}
        onClose={() => {
          setIsCredentialsOpen(false);
          setCreatedDoctor(null);
          setTemporaryPassword(undefined);
        }}
        doctor={createdDoctor}
        temporaryPassword={temporaryPassword}
      />
    </div>
  );
}
