import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'eta', standalone: true, pure: true })
export class EtaPipe implements PipeTransform {
  transform(minutes: number): string {
    if (!minutes || minutes <= 0) return '—';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m} min`;
  }
}
