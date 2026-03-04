import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  NgZone,
  ElementRef,
  ViewChild
} from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { DeliveryModel } from '../../../core/models/delivery.model';
import { LocationModel } from '../../../core/models/location.model';
import { SignalRService } from '../../../core/services/signalr.service';
import { STATUS_COLORS } from '../../../features/dashboard/dashboard.component';

// Fix Leaflet's default icon paths broken by webpack bundler
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div #mapEl class="map-container"></div>`,
  styles: [`
    .map-container {
      width: 100%;
      height: 100%;
      min-height: 400px;
      border-radius: 4px;
      overflow: hidden;
    }
  `]
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  @Input() deliveries: DeliveryModel[] = [];
  @Output() deliverySelected = new EventEmitter<DeliveryModel>();

  private map!: L.Map;
  private markers = new Map<number, L.Marker>();
  private sub?: Subscription;

  constructor(private zone: NgZone, private signalR: SignalRService) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.map = L.map(this.mapEl.nativeElement, {
        center: [47.6062, -122.3321],
        zoom: 11,
        zoomControl: true
      });

      // CartoDB Voyager — Google Maps-like style: clean roads, labels, full colour
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);
    });

    this.renderMarkers();
    this.subscribeToUpdates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deliveries'] && this.map) {
      this.renderMarkers();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.map?.remove();
  }

  /** Fits all current markers into view */
  recenter(): void {
    if (!this.map || this.markers.size === 0) return;
    this.zone.runOutsideAngular(() => {
      const bounds = L.latLngBounds([...this.markers.values()].map(m => m.getLatLng()));
      this.map.flyToBounds(bounds.pad(0.2), { duration: 0.7, maxZoom: 13 });
    });
  }

  /** Called by the dashboard when a sidebar card is clicked */
  focusDelivery(id: number): void {
    const marker = this.markers.get(id);
    if (!marker || !this.map) return;
    this.zone.runOutsideAngular(() => {
      this.map.flyTo(marker.getLatLng(), 14, { duration: 0.6 });
      marker.openPopup();
    });
  }

  private renderMarkers(): void {
    if (!this.map) return;

    this.zone.runOutsideAngular(() => {
      // Remove markers for deliveries no longer in the list
      const currentIds = new Set(this.deliveries.map(d => d.id));
      for (const [id, marker] of this.markers) {
        if (!currentIds.has(id)) {
          marker.remove();
          this.markers.delete(id);
        }
      }

      for (const delivery of this.deliveries) {
        const color = STATUS_COLORS[delivery.status] ?? '#64748b';
        const icon = this.makeIcon(color, delivery.deliveryNumber);

        if (this.markers.has(delivery.id)) {
          const m = this.markers.get(delivery.id)!;
          m.setLatLng([delivery.currentLatitude, delivery.currentLongitude]);
          m.setIcon(icon);
        } else {
          const marker = L.marker(
            [delivery.currentLatitude, delivery.currentLongitude],
            { icon }
          )
            .bindPopup(this.makePopup(delivery))
            .on('click', () => {
              this.zone.run(() => this.deliverySelected.emit(delivery));
            });

          marker.addTo(this.map);
          this.markers.set(delivery.id, marker);
        }
      }
    });
  }

  private subscribeToUpdates(): void {
    this.sub = this.signalR.locationUpdates$.subscribe((update: LocationModel) => {
      // Leaflet operates outside Angular zone — wrap state changes in NgZone.run
      this.zone.runOutsideAngular(() => {
        const marker = this.markers.get(update.deliveryId);
        if (!marker) return;

        marker.setLatLng([update.latitude, update.longitude]);

        const color = STATUS_COLORS[update.status] ?? '#64748b';
        const delivery = this.deliveries.find(d => d.id === update.deliveryId);
        if (delivery) {
          delivery.currentLatitude  = update.latitude;
          delivery.currentLongitude = update.longitude;
          delivery.status           = update.status;
          marker.setIcon(this.makeIcon(color, delivery.deliveryNumber));
          marker.setPopupContent(this.makePopup(delivery));
        }
      });
    });
  }

  private makeIcon(color: string, label: string): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="
          background:${color};
          color:#0f1117;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          width:30px;height:30px;
          display:flex;align-items:center;justify-content:center;
          font-family:monospace;font-size:7px;font-weight:bold;
          border:2px solid #0f1117;
          box-shadow:0 2px 6px rgba(0,0,0,0.5);
        ">
          <span style="transform:rotate(45deg)">${label.replace('DLV-', '')}</span>
        </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
  }

  private makePopup(d: DeliveryModel): string {
    const color = STATUS_COLORS[d.status] ?? '#64748b';
    return `
      <div style="font-family:monospace;font-size:12px;min-width:180px">
        <div style="font-weight:bold;color:${color};margin-bottom:4px">${d.deliveryNumber}</div>
        <div style="color:#333;margin-bottom:2px">${d.recipientName}</div>
        <div style="color:#666;font-size:11px;margin-bottom:4px">${d.destinationAddress}</div>
        <div style="color:${color};font-size:10px;letter-spacing:1px">${d.status.toUpperCase()} · ${d.estimatedMinutes} min</div>
      </div>`;
  }
}
