import { randomUUID } from 'node:crypto';

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
  updatedAt: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  activeRides: number;
  onlineDrivers: number;
  completedToday: number;
}

const drivers: Driver[] = [
  { id: 'drv-1', name: 'Bobur Toshmatov', vehicle: 'Toyota Camry', plate: '01 A 001 AA', rating: 4.9, online: true, location: { lat: 41.2956, lng: 69.2401 } },
  { id: 'drv-2', name: 'Dilshod Karimov', vehicle: 'Hyundai Sonata', plate: '01 A 010 BB', rating: 4.8, online: true, location: { lat: 41.3075, lng: 69.2808 } },
  { id: 'drv-3', name: 'Islom Yusupov', vehicle: 'Chevrolet Cobalt', plate: '01 A 025 CC', rating: 4.9, online: false, location: { lat: 41.3142, lng: 69.2587 } },
];

const rides: Ride[] = [];

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = radians(lat2 - lat1);
  const deltaLng = radians(lng2 - lng1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateFare(pickupLat: number, pickupLng: number, destinationLat: number, destinationLng: number): number {
  // Rough preview estimate only: actual route distance and traffic require a routing provider.
  const estimatedRoadKm = distanceKm(pickupLat, pickupLng, destinationLat, destinationLng) * 1.3;
  return Math.ceil((8000 + estimatedRoadKm * 2500) / 1000) * 1000;
}

export function listDrivers(): Driver[] {
  return drivers;
}

export function listRides(): Ride[] {
  return rides;
}

export function getRide(rideId: string): Ride | undefined {
  return rides.find((ride) => ride.id === rideId);
}

export function getDashboardSummary(): DashboardSummary {
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalRevenue: rides.filter((ride) => ride.status === 'completed').reduce((sum, ride) => sum + ride.fare, 0),
    activeRides: rides.filter((ride) => !['completed', 'cancelled'].includes(ride.status)).length,
    onlineDrivers: drivers.filter((driver) => driver.online).length,
    completedToday: rides.filter((ride) => ride.status === 'completed' && ride.updatedAt.slice(0, 10) === today).length,
  };
}

export function createRide(input: {
  clientName: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
}): Ride {
  const now = new Date().toISOString();
  const ride: Ride = {
    id: randomUUID(),
    ...input,
    status: 'requested',
    fare: estimateFare(input.pickupLat, input.pickupLng, input.destinationLat, input.destinationLng),
    createdAt: now,
    updatedAt: now,
  };
  rides.unshift(ride);
  return ride;
}

export function setDriverOnline(driverId: string, online: boolean): Driver | null {
  const driver = drivers.find((item) => item.id === driverId);
  if (!driver) return null;
  if (!online && rides.some((ride) => ride.driverId === driverId && ['accepted', 'arrived', 'in_progress'].includes(ride.status))) {
    return null;
  }
  driver.online = online;
  return driver;
}

export function acceptRide(rideId: string, driverId: string): { ride?: Ride; error?: string } {
  const ride = getRide(rideId);
  const driver = drivers.find((item) => item.id === driverId);
  if (!ride) return { error: 'Safar topilmadi.' };
  if (!driver) return { error: 'Haydovchi topilmadi.' };
  if (!driver.online) return { error: 'Haydovchi onlayn bo‘lishi kerak.' };
  if (ride.status !== 'requested' || ride.driverId) return { error: 'Bu safar boshqa haydovchiga biriktirilgan yoki endi mavjud emas.' };
  if (rides.some((item) => item.driverId === driverId && ['accepted', 'arrived', 'in_progress'].includes(item.status))) {
    return { error: 'Haydovchida faol safar mavjud.' };
  }

  ride.driverId = driverId;
  ride.driverName = driver.name;
  ride.status = 'accepted';
  ride.updatedAt = new Date().toISOString();
  return { ride };
}

const allowedTransitions: Record<RideStatus, RideStatus[]> = {
  requested: ['cancelled'],
  accepted: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

export function changeRideStatus(rideId: string, status: RideStatus): { ride?: Ride; error?: string } {
  const ride = getRide(rideId);
  if (!ride) return { error: 'Safar topilmadi.' };
  if (!allowedTransitions[ride.status].includes(status)) {
    return { error: `Holatni “${ride.status}”dan “${status}”ga o‘zgartirib bo‘lmaydi.` };
  }
  ride.status = status;
  ride.updatedAt = new Date().toISOString();
  return { ride };
}
