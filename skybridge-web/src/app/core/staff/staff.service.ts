import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PublicStaffMember, StaffCandidate, StaffMember, StaffMemberInput } from './staff.models';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);

  publicList(): Observable<PublicStaffMember[]> {
    return this.http.get<PublicStaffMember[]>('/api/public/staff');
  }

  list(): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>('/api/admin/staff');
  }

  candidates(search: string): Observable<StaffCandidate[]> {
    return this.http.get<StaffCandidate[]>('/api/admin/staff/candidates', { params: { search } });
  }

  save(userId: string, member: StaffMemberInput): Observable<StaffMember> {
    return this.http.put<StaffMember>(`/api/admin/staff/${userId}`, member);
  }

  remove(userId: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/staff/${userId}`);
  }
}