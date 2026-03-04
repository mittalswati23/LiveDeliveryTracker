import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeliveryModel } from '../models/delivery.model';
import { LocationModel } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getDeliveries(): Observable<DeliveryModel[]> {
    return this.http.get<DeliveryModel[]>(`${this.base}/deliveries`);
  }

  getDelivery(id: number): Observable<DeliveryModel> {
    return this.http.get<DeliveryModel>(`${this.base}/deliveries/${id}`);
  }

  getLocationHistory(deliveryId: number): Observable<LocationModel[]> {
    return this.http.get<LocationModel[]>(`${this.base}/locations/${deliveryId}`);
  }

  updateStatus(id: number, status: string): Observable<void> {
    return this.http.put<void>(`${this.base}/deliveries/${id}/status`, { status });
  }
}
