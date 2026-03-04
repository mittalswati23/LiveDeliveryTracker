import {
  Component,
  input,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';
import * as L from 'leaflet';
import { DeliveryModel } from '../../../core/models/delivery.model';
import { LocationModel } from '../../../core/models/location.model';
import { STATUS_COLORS } from '../../constants/status-colors';

@Component({
  selector: 'app-mini-map',
  standalone: true,
  template: `<div #mapEl class="mini-map-container"></div>`,
  styles: [`
    .mini-map-container {
      width: 100%;
      height: 300px;
      border-radius: 0 0 4px 4px;
      overflow: hidden;
    }
  `]
})
export class MiniMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  delivery  = input<DeliveryModel | null>(null);
  locations = input<LocationModel[]>([]);

  private map?: L.Map;
  private polyline?: L.Polyline;
  private marker?: L.Marker;
  private zone = inject(NgZone);

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.map = L.map(this.mapEl.nativeElement, {
        zoom: 13,
        zoomControl: false,
        attributionControl: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);

      // Render with whatever data arrived before view init
      this.updateMap();
    });
  }

  ngOnChanges(): void {
    if (this.map) {
      this.zone.runOutsideAngular(() => this.updateMap());
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private updateMap(): void {
    if (!this.map) return;

    // Route polyline through historical location points
    this.polyline?.remove();
    this.polyline = undefined;

    const sorted = [...this.locations()].sort((a, b) => a.waypointIndex - b.waypointIndex);
    if (sorted.length >= 2) {
      const latlngs = sorted.map(loc => [loc.latitude, loc.longitude] as L.LatLngTuple);
      this.polyline = L.polyline(latlngs, {
        color: '#58a6ff',   // --accent-blue; CSS vars don't work in Leaflet SVG stroke
        weight: 3,
        opacity: 0.75,
        dashArray: undefined
      }).addTo(this.map);
    }

    // Current position glowing dot marker
    this.marker?.remove();
    this.marker = undefined;

    const d = this.delivery();
    if (d?.currentLatitude && d?.currentLongitude) {
      const color = STATUS_COLORS[d.status] ?? 'var(--text-muted)';
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${color};
          box-shadow: 0 0 0 3px rgba(255,255,255,0.25), 0 0 12px ${color};
          border: 2px solid rgba(255,255,255,0.7);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      this.marker = L.marker(
        [d.currentLatitude, d.currentLongitude],
        { icon }
      ).addTo(this.map);
    }

    // Fit view — prefer polyline bounds, fall back to marker center
    if (this.polyline) {
      this.map.fitBounds(this.polyline.getBounds(), { padding: [20, 20] });
    } else if (this.marker) {
      this.map.setView(this.marker.getLatLng(), 13);
    }
  }
}
