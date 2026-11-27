import { PublicStaffMember, StaffCandidate, StaffMember } from '../core/staff/staff.models';

export const publicStaff: PublicStaffMember[] = [
  { userId: 'u-1', name: 'Alexandre Fagundes', position: 'Chief Executive Officer', department: 'Executive', avatarUrl: null, flights: 128, flightMinutes: 9330, joinedAtUtc: '2026-11-01T12:00:00Z' },
  { userId: 'u-2', name: 'Marina Costa', position: 'Director of Operations', department: 'Operations', avatarUrl: '/api/users/u-2/avatar?v=1', flights: 64, flightMinutes: 4210, joinedAtUtc: '2026-11-10T12:00:00Z' },
  { userId: 'u-3', name: 'Rafael Lins', position: 'PIREP Reviewer', department: 'Safety', avatarUrl: null, flights: 0, flightMinutes: 0, joinedAtUtc: '2026-11-20T12:00:00Z' }
];

export const staffMembers: StaffMember[] = [
  { userId: 'u-1', name: 'Alexandre Fagundes', email: 'alexandre@skybridge.test', position: 'Chief Executive Officer', department: 'Executive', sortOrder: 1, panelAccess: true },
  { userId: 'u-3', name: 'Rafael Lins', email: 'rafael@skybridge.test', position: 'PIREP Reviewer', department: 'Safety', sortOrder: 1, panelAccess: true }
];

export const staffCandidates: StaffCandidate[] = [
  { userId: 'u-4', name: 'Ana Silva', email: 'ana@skybridge.test', isStaff: false },
  { userId: 'u-1', name: 'Alexandre Fagundes', email: 'alexandre@skybridge.test', isStaff: true }
];