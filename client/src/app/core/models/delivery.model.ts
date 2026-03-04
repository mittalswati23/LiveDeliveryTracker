export interface DeliveryModel {
  id: number;
  deliveryNumber: string;
  destinationAddress: string;
  recipientName: string;
  packageWeight: number;
  priority: string;
  status: string;
  driverId: string;
  driverName: string;
  estimatedMinutes: number;
  totalRouteDistanceMiles: number;
  currentLatitude: number;
  currentLongitude: number;
  currentWaypointIndex: number;
  totalWaypoints: number;
  dispatchedAt: string;
}
