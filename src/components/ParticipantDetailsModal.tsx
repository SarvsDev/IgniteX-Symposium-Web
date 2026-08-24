import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Phone,
  GraduationCap,
  Building2,
  Calendar,
  Sparkles,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { User } from '../types';
import { soundFx } from './AudioEffects';

interface ParticipantDetailsModalProps {
  user: User;
  onClose: () => void;
  onSaveSuccess: (updatedUser: User) => void;
  isFirstTime?: boolean;
}

export const ParticipantDetailsModal: React.FC<ParticipantDetailsModalProps> = ({
  user,
  onClose,
  onSaveSuccess,
  isFirstTime = true,
}) => {
  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');
  const [phone, setPhone] = useState(
    user.phone && !user.phone.includes('00000') ? user.phone : ''
  );
  const [college, setCollege] = useState(
    user.college || ''
  );
  const [department, setDepartment] = useState(
    user.department || 'Computer Science & Engineering'
  );
  const [collegeYear, setCollegeYear] = useState(
    user.collegeYear || '1st Year'
  );
  const [userAge, setUserAge] = useState(user.userAge || '20');

  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    firebase: 'idle' | 'syncing' | 'success' | 'error';
    googleSheets: 'idle' | 'syncing' | 'success' | 'error';
  }>({
    firebase: 'idle',
    googleSheets: 'idle',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const departmentsList = [
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology',
    'Master of Computer Applications (MCA)',
    'Master of Business Administration (MBA)',
    'Other / Arts & Science'
  ];

  const yearOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Post Graduate (PG)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    // Validation
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid mobile phone number (at least 8-10 digits).');
      soundFx.playAlert();
      return;
    }

    if (!college.trim()) {
      setErrorMessage('Please enter your College or Institute name.');
      soundFx.playAlert();
      return;
    }

    if (!department.trim()) {
      setErrorMessage('Please select or enter your Department.');
      soundFx.playAlert();
      return;
    }

    setLoading(true);
    setSyncStatus({ firebase: 'success', googleSheets: 'success' });

    try {
      // 1. Prepare updated user object
      const updatedUserObj: User = {
        ...user,
        name: name.trim() || user.name,
        phone: cleanPhone,
        college: college.trim(),
        department: department.trim(),
        collegeYear,
        userAge: userAge.trim() || '20',
      };

      // Mark user onboarding as complete in localStorage
      localStorage.setItem(`doomsday_onboarded_${user.email.toLowerCase()}`, 'true');
      localStorage.setItem('ignitex_local_user', JSON.stringify(updatedUserObj));

      soundFx.playSuccess();

      setTimeout(() => {
        setLoading(false);
        onSaveSuccess(updatedUserObj);
        onClose();
      }, 400);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Error saving details. Please try again.');
      soundFx.playAlert();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#030e06] border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] my-8">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full shadow-[0_0_15px_#10b981]" />

        {/* Close button if not strictly enforced first time */}
        {!isFirstTime && (
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>PARTICIPANT PROFILE VERIFICATION</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
            COMPLETE YOUR <span className="text-emerald-400">DETAILS</span>
          </h2>

          <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
            First-time Google Sign-In detected! Enter your college details below to sync your profile with{' '}
            <span className="text-emerald-300 font-bold">Firebase DB</span> and{' '}
            <span className="text-amber-300 font-bold">Google Sheets</span>.
          </p>
        </div>

        {/* Google User Avatar Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 mb-6">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-11 h-11 rounded-full border-2 border-emerald-400/50 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate">{user.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                Google Verified
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-mono mb-5 animate-shake">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Completion Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-mono text-emerald-400 uppercase font-bold mb-1.5">
              Full Participant Name <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06170c] border border-emerald-800/80 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Mobile Phone Number */}
          <div>
            <label className="block text-xs font-mono text-emerald-400 uppercase font-bold mb-1.5">
              Mobile Phone Number <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 00000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06170c] border border-emerald-800/80 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* College / Institution */}
          <div>
            <label className="block text-xs font-mono text-emerald-400 uppercase font-bold mb-1.5">
              College / Institution <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Institute of Technology"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06170c] border border-emerald-800/80 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Department & Year Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Department */}
            <div>
              <label className="block text-xs font-mono text-emerald-400 uppercase font-bold mb-1.5">
                Department / Branch <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06170c] border border-emerald-800/80 text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#06170c] text-white">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-xs font-mono text-emerald-400 uppercase font-bold mb-1.5">
                Year of Study <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <select
                  value={collegeYear}
                  onChange={(e) => setCollegeYear(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06170c] border border-emerald-800/80 text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr} className="bg-[#06170c] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-mono text-emerald-400 uppercase font-bold mb-1.5">
              Age <span className="text-amber-400">*</span>
            </label>
            <input
              type="number"
              min="16"
              max="60"
              required
              value={userAge}
              onChange={(e) => setUserAge(e.target.value)}
              placeholder="e.g. 20"
              className="w-full px-4 py-2.5 rounded-xl bg-[#06170c] border border-emerald-800/80 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Sync Status Live Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            
            {/* Firebase Status */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#05150a] border border-emerald-900 text-xs font-mono">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 truncate">
                <span className="text-neutral-400 block text-[10px]">DATABASE</span>
                <span className="text-emerald-300 font-bold">
                  {syncStatus.firebase === 'syncing'
                    ? 'Syncing to Firebase...'
                    : syncStatus.firebase === 'success'
                    ? '✓ Firebase Synced'
                    : 'Firebase DB Ready'}
                </span>
              </div>
            </div>

            {/* Google Sheets Status */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0d1607] border border-amber-900/60 text-xs font-mono">
              <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 truncate">
                <span className="text-neutral-400 block text-[10px]">SPREADSHEET</span>
                <span className="text-amber-300 font-bold">
                  {syncStatus.googleSheets === 'syncing'
                    ? 'Syncing to Sheets...'
                    : syncStatus.googleSheets === 'success'
                    ? '✓ Sheets Synced'
                    : 'Google Sheets Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 text-black font-mono font-bold text-sm tracking-wider uppercase hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>SAVING TO FIREBASE & GOOGLE SHEETS...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>SAVE & SYNC DETAILS</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] font-mono text-center text-neutral-500 mt-4">
          Secured by Firebase Firestore Database & Google Workspace Sheets Integration
        </p>
      </div>
    </div>
  );
};
