import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DeliveryModel } from '../../../core/models/delivery.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { EtaPipe } from '../../pipes/eta.pipe';

@Component({
  selector: 'app-delivery-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, StatusBadgeComponent, EtaPipe],
  templateUrl: './delivery-card.component.html',
  styleUrl: './delivery-card.component.scss'
})
export class DeliveryCardComponent {
  delivery = input.required<DeliveryModel>();
  selected = input(false);

  cardClicked = output<DeliveryModel>();

  onClick(): void {
    this.cardClicked.emit(this.delivery());
  }
}
