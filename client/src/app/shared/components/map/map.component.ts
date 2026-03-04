import {
  Component,
  input,
  output,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  NgZone,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';
import * as L from 'leaflet';
import { DeliveryModel } from '../../../core/models/delivery.model';
import { STATUS_COLORS } from '../../constants/status-colors';


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

  deliveries       = input<DeliveryModel[]>([]);
  deliverySelected = output<DeliveryModel>();

  private map!: L.Map;
  private markers  = new Map<number, L.Marker>();
  private zone     = inject(NgZone);

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.map = L.map(this.mapEl.nativeElement, {
        center: [47.6062, -122.3321],
        zoom: 11,
        zoomControl: true
      });

      // CartoDB Positron — muted greyscale, won't fight the coloured status markers
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);

      this.renderMarkers();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deliveries'] && this.map) {
      this.renderMarkers();
    }
  }

  ngOnDestroy(): void {
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
      const list = this.deliveries();

      // Remove markers for deliveries no longer in the list
      const currentIds = new Set(list.map(d => d.id));
      for (const [id, marker] of this.markers) {
        if (!currentIds.has(id)) {
          marker.remove();
          this.markers.delete(id);
        }
      }

      for (const delivery of list) {
        const color = this.colorFor(delivery.status);
        const icon  = this.makeIcon(color, delivery.deliveryNumber);

        if (this.markers.has(delivery.id)) {
          // Update existing marker — position, icon, and popup all in sync
          const m = this.markers.get(delivery.id)!;
          m.setLatLng([delivery.currentLatitude, delivery.currentLongitude]);
          m.setIcon(icon);
          m.setPopupContent(this.makePopup(delivery));
        } else {
          const marker = L.marker(
            [delivery.currentLatitude, delivery.currentLongitude],
            { icon }
          )
            .bindPopup(this.makePopup(delivery))
            .on('click', () => {
              // Look up the live delivery from the signal — the closure snapshot is stale
              // after SignalR updates spread new objects into the deliveries array
              const live = this.deliveries().find(d => d.id === delivery.id);
              if (live) this.zone.run(() => this.deliverySelected.emit(live));
            });

          marker.addTo(this.map);
          this.markers.set(delivery.id, marker);
        }
      }
    });
  }

  private makeIcon(color: string, label: string): L.DivIcon {
    const num = label.replace('DLV-', '');
    return L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
          <!-- Outer glow ring -->
          <div style="
            position:absolute;inset:0;
            border-radius:50%;
            background:${color};
            opacity:0.25;
          "></div>
          <!-- Solid dot -->
          <div style="
            width:22px;height:22px;
            border-radius:50%;
            background:${color};
            border:2.5px solid white;
            box-shadow:0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
            font-family:monospace;font-size:7px;font-weight:700;
            color:#0f1117;
          ">${num}</div>
        </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }

  private colorFor(status: string): string {
    return STATUS_COLORS[status] ?? 'var(--text-muted)';
  }

  private makePopup(d: DeliveryModel): string {
    const color = this.colorFor(d.status);
    return `
      <div style="font-family:monospace;font-size:12px;min-width:180px">
        <div style="font-weight:bold;color:${color};margin-bottom:4px">${d.deliveryNumber}</div>
        <div style="color:#333;margin-bottom:2px">${d.recipientName}</div>
        <div style="color:#666;font-size:11px;margin-bottom:4px">${d.destinationAddress}</div>
        <div style="color:${color};font-size:10px;letter-spacing:1px">${d.status.toUpperCase()} · ${d.estimatedMinutes} min</div>
      </div>`;
  }
}
