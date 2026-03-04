import { Component, ChangeDetectionStrategy, input, computed, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DeliveryModel } from '../../core/models/delivery.model';
import { LocationModel } from '../../core/models/location.model';
import { DeliveryService } from '../../core/services/delivery.service';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { MiniMapComponent } from '../../shared/components/mini-map/mini-map.component';
import { EtaPipe } from '../../shared/pipes/eta.pipe';

const PRIORITY_COLORS: Record<string, string> = {
  High:   'var(--accent-red)',
  Normal: 'var(--accent-amber)',
  Low:    'var(--text-muted)',
};

const TIMELINE_STEPS = [
  'Order Dispatched',
  'Package Picked Up',
  'En Route',
  'Checkpoint Passed',
  'Approaching Destination',
  'Delivered',
];

export type StepState = 'complete' | 'current' | 'delayed' | 'pending';

export interface TimelineStep {
  label: string;
  state: StepState;
}

@Component({
  selector: 'app-delivery-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe, DatePipe, SpinnerComponent, StatusBadgeComponent, MiniMapComponent, EtaPipe],
  templateUrl: './delivery-detail.component.html',
  styleUrl: './delivery-detail.component.scss'
})
export class DeliveryDetailComponent {
  private deliveryService = inject(DeliveryService);

  // Route param bound via withComponentInputBinding() — no ActivatedRoute needed
  id = input.required<string>();

  deliveryResource = httpResource<DeliveryModel>(
    () => this.id() ? `${environment.apiUrl}/api/deliveries/${this.id()}` : undefined
  );

  locationsResource = httpResource<LocationModel[]>(
    () => this.id() ? `${environment.apiUrl}/api/locations/${this.id()}` : undefined
  );

  isLoading = computed(() => this.deliveryResource.isLoading() || this.locationsResource.isLoading());
  hasError  = computed(() => !!this.deliveryResource.error());
  saving    = signal(false);

  routeProgress = computed(() => {
    const d = this.deliveryResource.value();
    if (!d || d.totalWaypoints === 0) return 0;
    return Math.round((d.currentWaypointIndex / d.totalWaypoints) * 100);
  });

  timelineSteps = computed((): TimelineStep[] => {
    const d = this.deliveryResource.value();
    if (!d) return TIMELINE_STEPS.map(label => ({ label, state: 'pending' }));

    if (d.status === 'Delayed') {
      return TIMELINE_STEPS.map((label, i) => ({
        label,
        state: i === 0 ? 'complete' : i === 1 ? 'delayed' : 'pending'
      }));
    }

    if (d.status === 'Delivered') {
      return TIMELINE_STEPS.map(label => ({ label, state: 'complete' }));
    }

    // Derive current step from waypoint fraction
    const fraction = d.totalWaypoints > 0 ? d.currentWaypointIndex / d.totalWaypoints : 0;
    let currentStep: number;
    if (fraction === 0)      currentStep = 0;
    else if (fraction <= 0.25) currentStep = 1;
    else if (fraction <= 0.5)  currentStep = 2;
    else if (fraction <= 0.75) currentStep = 3;
    else                       currentStep = 4;

    return TIMELINE_STEPS.map((label, i) => ({
      label,
      state: i < currentStep ? 'complete' : i === currentStep ? 'current' : 'pending'
    }));
  });

  priorityColor(priority: string): string {
    return PRIORITY_COLORS[priority] ?? 'var(--text-muted)';
  }

  markDelivered(): void {
    const id = Number(this.id());
    if (!id || this.saving()) return;
    this.saving.set(true);
    this.deliveryService.updateStatus(id, 'Delivered').subscribe({
      next: () => {
        this.deliveryResource.reload();
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }
}
