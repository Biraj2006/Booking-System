import {
  Calendar, Clock, Phone, Mail, FileText,
  Video, Building2, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { APPOINTMENT_STATUS_CONFIG } from '@/lib/constants';
import { formatTime, formatDate, getInitials } from '@/lib/utils';
import type { Appointment } from '@/types/appointment';
import type { AppointmentStatus } from '@/types';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
}

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onAccept,
  onReject,
  onComplete,
  onNoShow,
}: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  const statusCfg = APPOINTMENT_STATUS_CONFIG[appointment.status as AppointmentStatus];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Details"
      description={`Reference ID: ${appointment.appointment_id}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Status Header Bar */}
        <div className="flex items-center justify-between p-3.5 bg-surface-50 border border-surface-200 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500 font-medium">Status:</span>
            <Badge
              variant={
                appointment.status === 'completed'
                  ? 'success'
                  : appointment.status === 'confirmed'
                  ? 'info'
                  : appointment.status === 'pending'
                  ? 'warning'
                  : 'danger'
              }
            >
              {statusCfg?.label || appointment.status}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-700">
            {appointment.consultation_type === 'online' ? (
              <>
                <Video size={15} className="text-emerald-600" />
                <span>Online Video</span>
              </>
            ) : (
              <>
                <Building2 size={15} className="text-blue-600" />
                <span>In-Clinic Visit</span>
              </>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-white border border-surface-200 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[11px] text-surface-400 font-medium">Date</p>
              <p className="text-xs font-bold text-surface-800">
                {formatDate(appointment.appointment_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[11px] text-surface-400 font-medium">Time Slot</p>
              <p className="text-xs font-bold text-surface-800">
                {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="p-4 bg-white border border-surface-200 rounded-xl space-y-2.5">
          <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider">
            Patient Profile
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
              {getInitials(appointment.patient_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-surface-900">{appointment.patient_name}</p>
              <p className="text-xs text-surface-500">
                {appointment.patient_gender ? `${appointment.patient_gender}, ` : ''}
                {appointment.patient_age ? `${appointment.patient_age} yrs old` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-surface-100 text-xs text-surface-600">
            <div className="flex items-center gap-1.5">
              <Mail size={13} className="text-surface-400" />
              <span className="truncate">{appointment.patient_email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-surface-400" />
              <span>{appointment.patient_phone || 'No phone provided'}</span>
            </div>
          </div>
        </div>

        {/* Symptoms & Notes */}
        {(appointment.symptoms || appointment.notes) && (
          <div className="p-3.5 bg-surface-50 border border-surface-200 rounded-xl space-y-2 text-xs">
            {appointment.symptoms && (
              <div>
                <p className="font-semibold text-surface-700 flex items-center gap-1.5">
                  <FileText size={13} className="text-primary-600" /> Symptoms Reported:
                </p>
                <p className="text-surface-600 mt-0.5 pl-4">{appointment.symptoms}</p>
              </div>
            )}
            {appointment.notes && (
              <div>
                <p className="font-semibold text-surface-700">Patient Notes:</p>
                <p className="text-surface-600 mt-0.5 pl-4">{appointment.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Reason if Cancelled */}
        {appointment.status === 'cancelled' && appointment.cancellation_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <strong>Cancellation Reason:</strong> {appointment.cancellation_reason}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-surface-200">
          {/* Pending requests: Accept or Reject */}
          {appointment.status === 'pending' && (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  onClose();
                  onReject?.(appointment.id);
                }}
              >
                <XCircle size={15} /> Reject Request
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  onClose();
                  onAccept?.(appointment.id);
                }}
              >
                <CheckCircle2 size={15} /> Accept & Confirm
              </Button>
            </>
          )}

          {/* Confirmed: Complete or No-Show */}
          {appointment.status === 'confirmed' && (
            <>
              <Button
                variant="outline"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => {
                  onClose();
                  onNoShow?.(appointment.id);
                }}
              >
                <AlertTriangle size={15} /> Mark No-Show
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  onClose();
                  onComplete?.(appointment.id);
                }}
              >
                <CheckCircle2 size={15} /> Mark as Completed
              </Button>
            </>
          )}

          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
