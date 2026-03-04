import { Component, OnInit, OnDestroy, signal, inject, computed, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { SignalRService } from '../../core/services/signalr.service';
import { DeliveryModel } from '../../core/models/delivery.model';
import { MapComponent } from '../../shared/components/map/map.component';
import { DeliveryCardComponent } from '../../shared/components/delivery-card/delivery-card.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

const FILTER_STATUS_MAP: Record<string, string> = {
  Transit: 'InTransit',
  Nearby:  'Nearby',
  Delayed: 'Delayed',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [MapComponent, DeliveryCardComponent, SpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) protected mapComponent?: MapComponent;

  protected auth      = inject(AuthService);
  private router      = inject(Router);
  private deliverySvc = inject(DeliveryService);
  private signalRSvc  = inject(SignalRService);

  deliveries   = signal<DeliveryModel[]>([]);
  loading      = signal(true);
  error        = signal('');
  selected     = signal<DeliveryModel | null>(null);
  hubConnected = signal(false);
  activeFilter = signal<string>('All');

  private sub?: Subscription;

  // Stat bar counts — always based on full unfiltered list
  activeCount    = computed(() => this.deliveries().filter(d => d.status === 'InTransit').length);
  nearbyCount    = computed(() => this.deliveries().filter(d => d.status === 'Nearby').length);
  delayedCount   = computed(() => this.deliveries().filter(d => d.status === 'Delayed').length);
  deliveredCount = computed(() => this.deliveries().filter(d => d.status === 'Delivered').length);

  // Filtered list for sidebar — driven by activeFilter signal
  filteredDeliveries = computed(() => {
    const f = this.activeFilter();
    if (f === 'All') return this.deliveries();
    return this.deliveries().filter(d => d.status === (FILTER_STATUS_MAP[f] ?? f));
  });

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

  // Card click → navigate to detail page (does NOT focus map)
  onCardClicked(delivery: DeliveryModel): void {
    this.router.navigate(['/deliveries', delivery.id]);
  }

  // Map marker click → highlight sidebar card + focus map marker (does NOT navigate)
  onDeliverySelected(delivery: DeliveryModel): void {
    this.selected.set(delivery);
    this.mapComponent?.focusDelivery(delivery.id);
  }
}
