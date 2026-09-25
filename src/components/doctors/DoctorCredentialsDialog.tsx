import { useState } from 'react';
import { Check, Copy, CheckCircle2, User, Key, Mail, Stethoscope } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import type { Doctor } from '@/types/doctor';

interface DoctorCredentialsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  temporaryPassword?: string;
}

export default function DoctorCredentialsDialog({
  isOpen,
  onClose,
  doctor,
  temporaryPassword,
}: DoctorCredentialsDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!doctor) return null;

  const credentialsText = `MediCare 24/7 Doctor Account
Name: ${doctor.full_name}
Email: ${doctor.email}
Password: ${temporaryPassword || '(Provided during setup)'}
Login URL: ${window.location.origin}/login`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(credentialsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Account Created Successfully"
      description="The doctor account is ready. Save these login credentials to provide them to the doctor."
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>
            Doctor profile has been created in the database with role <strong>doctor</strong>.
          </span>
        </div>

        <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-200 pb-2">
            <span className="text-xs text-surface-500 flex items-center gap-1.5">
              <User size={14} /> Doctor Name
            </span>
            <span className="text-sm font-semibold text-surface-900">{doctor.full_name}</span>
          </div>

          <div className="flex items-center justify-between border-b border-surface-200 pb-2">
            <span className="text-xs text-surface-500 flex items-center gap-1.5">
              <Mail size={14} /> Email Address
            </span>
            <span className="text-sm font-medium text-surface-800 font-mono">{doctor.email}</span>
          </div>

          {temporaryPassword && (
            <div className="flex items-center justify-between border-b border-surface-200 pb-2">
              <span className="text-xs text-surface-500 flex items-center gap-1.5">
                <Key size={14} /> Initial Password
              </span>
              <span className="text-sm font-bold text-primary-700 font-mono bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                {temporaryPassword}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 flex items-center gap-1.5">
              <Stethoscope size={14} /> Department
            </span>
            <span className="text-xs font-medium text-surface-700">
              {doctor.department || 'General Medicine'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
          <strong>Next step:</strong> The doctor can sign in directly at <code>/login</code> with these credentials to access the <strong>Doctor Portal</strong> and start managing appointments.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={copyToClipboard}>
            {copied ? (
              <>
                <Check size={16} className="text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Credentials
              </>
            )}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
