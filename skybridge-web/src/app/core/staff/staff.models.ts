export type StaffDepartment = 'Executive' | 'Operations' | 'Safety' | 'Training' | 'Events' | 'Community';

export const STAFF_DEPARTMENTS: { value: StaffDepartment; code: string; label: string; description: string }[] = [
  { value: 'Executive', code: 'EXE', label: 'Executive', description: 'Leads the network and sets the course.' },
  { value: 'Operations', code: 'OPS', label: 'Operations', description: 'Airlines, schedules and freelance missions.' },
  { value: 'Safety', code: 'SAF', label: 'Safety', description: 'Reviews PIREPs and keeps the standards.' },
  { value: 'Training', code: 'TRN', label: 'Training', description: 'Helps new pilots get airborne.' },
  { value: 'Events', code: 'EVT', label: 'Events', description: 'Group flights, tours and fly-ins.' },
  { value: 'Community', code: 'COM', label: 'Community', description: 'Discord, social media and support.' }
];

export interface PublicStaffMember {
  userId: string;
  name: string;
  position: string;
  department: StaffDepartment;
  avatarUrl: string | null;
  flights: number;
  flightMinutes: number;
  joinedAtUtc: string;
}

export interface StaffMember {
  userId: string;
  name: string;
  email: string;
  position: string;
  department: StaffDepartment;
  sortOrder: number;
  panelAccess: boolean;
}

export interface StaffCandidate {
  userId: string;
  name: string;
  email: string;
  isStaff: boolean;
}

export interface StaffMemberInput {
  position: string;
  department: StaffDepartment;
  sortOrder: number;
  panelAccess: boolean;
}