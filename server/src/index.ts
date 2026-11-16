import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'client' | 'driver' | 'admin';
export type RideStatus = 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
  online: boolean;
  location: { lat: number; lng: number };
}

export interface Ride {
  id: string;
  clientName: string;
  driverId?: string;
  driverName?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  status: RideStatus;
  fare: number;
  createdAt: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  activeRides: number;
  onlineDrivers: number;
  completedToday: number;
}

export const drivers: Driver[] = [
  {
    id: 'drv-1',
    name: 'Bobur Toshmatov',
    vehicle: 'Toyota Camry',
    plate: 'A 001 AAA',
    rating: 4.9,
    online: true,
    location: { lat: 41.2956, lng: 69.2401 },
  },
  {
    id: 'drv-2',
    name: 'Dilshod Karimov',
    vehicle: 'Hyundai Sonata',
    plate: 'A 010 BBB',
    rating: 4.8,
    online: true,
    location: { lat: 41.3075, lng: 69.2808 },
  },
  {
    id: 'drv-3',
    name: 'Islom Yusupov',
    vehicle: 'Mercedes C-Class',
    plate: 'A 025 CCC',
    rating: 4.9,
    online: false,
    location: { lat: 41.3142, lng: 69.2587 },
  },
];

export const rides: Ride[] = [
  {
    id: 'ride-1',
    clientName: 'Nodira',
    driverId: 'drv-1',
    driverName: 'Bobur Toshmatov',
    pickupAddress: 'Toshkent, Yunusobod',
    pickupLat: 41.3581,
    pickupLng: 69.2984,
    destinationAddress: 'Toshkent, Chilonzor',
    destinationLat: 41.2897,
    destinationLng: 69.2031,
    status: 'in_progress',
    fare: 34000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ride-2',
    clientName: 'Javlon',
    driverId: 'drv-2',
    driverName: 'Dilshod Karimov',
    pickupAddress: 'Toshkent, Mirobod',
    pickupLat: 41.3164,
    pickupLng: 69.2557,
    destinationAddress: 'Toshkent, Olmazor',
    destinationLat: 41.3361,
    destinationLng: 69.2943,
    status: 'accepted',
    fare: 28000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ride-3',
    clientName: 'Shaxzoda',
    pickupAddress: 'Toshkent, Sabzavot',
    pickupLat: 41.3299,
    pickupLng: 69.2672,
    destinationAddress: 'Toshkent, Buyuk Ipak Yo’li',
    destinationLat: 41.3685,
    destinationLng: 69.3479,
    status: 'requested',
    fare: 26500,
    createdAt: new Date().toISOString(),
  },
];

export function getDashboardSummary(): DashboardSummary {
  const totalRevenue = rides
    .filter((ride) => ride.status === 'completed' || ride.status === 'in_progress')
    .reduce((sum, ride) => sum + ride.fare, 0);

  return {
    totalRevenue,
    activeRides: rides.filter((ride) => ride.status !== 'completed' && ride.status !== 'cancelled').length,
    onlineDrivers: drivers.filter((driver) => driver.online).length,
    completedToday: rides.filter((ride) => ride.status === 'completed').length,
  };
}

export function createRide({
  clientName,
  pickupAddress,
  pickupLat,
  pickupLng,
  destinationAddress,
  destinationLat,
  destinationLng,
}: {
  clientName: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
}) {
  const fare = Math.max(15000, Math.round(Math.abs(destinationLat - pickupLat) * 150000 + Math.abs(destinationLng - pickupLng) * 150000));

  const newRide: Ride = {
    id: `ride-${uuidv4().slice(0, 8)}`,
    clientName,
    pickupAddress,
    pickupLat,
    pickupLng,
    destinationAddress,
    destinationLat,
    destinationLng,
    status: 'requested',
    fare,
    createdAt: new Date().toISOString(),
  };

  rides.unshift(newRide);
  return newRide;
}

export function updateDriverStatus(driverId: string, online: boolean) {
  const driver = drivers.find((item) => item.id === driverId);
  if (!driver) return null;

  driver.online = online;
  return driver;
}

export function acceptRide(rideId: string, driverId: string) {
  const ride = rides.find((item) => item.id === rideId);
  const driver = drivers.find((item) => item.id === driverId);

  if (!ride || !driver) return null;

  ride.driverId = driverId;
  ride.driverName = driver.name;
  ride.status = 'accepted';

  return ride;
}

export function updateRideStatus(rideId: string, status: RideStatus) {
  const ride = rides.find((item) => item.id === rideId);
  if (!ride) return null;

  ride.status = status;
  return ride;
}
