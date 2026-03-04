import { Component, OnInit, OnDestroy, signal, inject, computed, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { SignalRService } from '../../core/services/signalr.service';
import { DeliveryModel } from '../../core/models/delivery.model';
import { MapComponent } from '../../shared/components/map/map.component';

export const STATUS_COLORS: Record<string, string> = {
  InTransit: '#58a6ff',
  Nearby:    '#00ff88',
  Pickup:    '#ff8c00',
  Delayed:   '#f87171',
  Delivered: '#64748b',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, MapComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) protected mapComponent?: MapComponent;

  protected auth        = inject(AuthService);
  private deliverySvc   = inject(DeliveryService);
  private signalRSvc    = inject(SignalRService);

  deliveries  = signal<DeliveryModel[]>([]);
  loading     = signal(true);
  error       = signal('');
  selected    = signal<DeliveryModel | null>(null);
  hubConnected = signal(false);

  private sub?: Subscription;

  // Stat bar counts
  activeCount    = computed(() => this.deliveries().filter(d => d.status === 'InTransit').length);
  nearbyCount    = computed(() => this.deliveries().filter(d => d.status === 'Nearby').length);
  delayedCount   = computed(() => this.deliveries().filter(d => d.status === 'Delayed').length);
  deliveredCount = computed(() => this.deliveries().filter(d => d.status === 'Delivered').length);

  async ngOnInit(): Promise<void> {
    this.loadDeliveries();
    await this.signalRSvc.start();
    this.hubConnected.set(true);

    this.sub = this.signalRSvc.locationUpdates$.subscribe(update => {
      this.deliveries.update(list =>
        list.map(d =>
          d.id === update.deliveryId
            ? { ...d, currentLatitude: update.latitude, currentLongitude: update.longitude, status: update.status }
            : d
        )
      );
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.signalRSvc.stop();
  }

  private loadDeliveries(): void {
    this.loading.set(true);
    this.deliverySvc.getDeliveries().subscribe({
      next: list => {
        this.deliveries.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load deliveries');
        this.loading.set(false);
      }
    });
  }

  onDeliverySelected(delivery: DeliveryModel): void {
    this.selected.set(delivery);
    this.mapComponent?.focusDelivery(delivery.id);
  }

  statusColor(status: string): string {
    return STATUS_COLORS[status] ?? '#64748b';
  }
}
