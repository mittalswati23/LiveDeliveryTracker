import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { LocationModel } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  readonly locationUpdates$ = new Subject<LocationModel>();

  private connection: signalR.HubConnection | null = null;
  private auth = inject(AuthService);

  async start(): Promise<void> {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        // JWT via query string — required for WebSocket upgrade (can't set headers on WS)
        accessTokenFactory: () => this.auth.getToken() ?? ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('LocationUpdate', (dto: LocationModel) => {
      this.locationUpdates$.next(dto);
    });

    try {
      await this.connection.start();
    } catch (err) {
      console.error('SignalR connection failed:', err);
    }
  }

  async stop(): Promise<void> {
    if (!this.connection) return;
    await this.connection.stop();
    this.connection = null;
  }

}
