import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from './booking.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  current(): Observable<Booking | null> {
    return this.http.get<Booking | null>('/api/bookings/current');
  }

  acceptFreelance(jobId: number, aircraft: string): Observable<Booking> {
    return this.http.post<Booking>(`/api/freelance/${jobId}/accept`, { aircraft });
  }

  startLeg(): Observable<Booking> {
    return this.http.post<Booking>('/api/bookings/current/start', {});
  }

  cancel(): Observable<void> {
    return this.http.post<void>('/api/bookings/current/cancel', {});
  }
}