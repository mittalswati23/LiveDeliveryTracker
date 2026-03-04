import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants/status-colors';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [style.color]="color()" [style.border-color]="color()">
      {{ label() }}
    </span>
  `,
  styles: [`
    .badge {
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 1.5px;
      border: 1px solid;
      border-radius: 2px;
      padding: 2px 6px;
      font-family: var(--font-mono);
      white-space: nowrap;
    }
  `]
})
export class StatusBadgeComponent {
  status = input.required<string>();

  color = computed(() => STATUS_COLORS[this.status()] ?? 'var(--text-muted)');
  label = computed(() => STATUS_LABELS[this.status()] ?? this.status().toUpperCase());
}
