import { useEffect, useState } from 'react';

type RideStatus = 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

type Driver = {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
  online: boolean;
};

type Ride = {
  id: string;
  clientName: string;
  driverId?: string;
  driverName?: string;
  pickupAddress: string;
  destinationAddress: string;
  status: RideStatus;
  fare: number;
};

type DashboardSummary = {
  totalRevenue: number;
  activeRides: number;
  onlineDrivers: number;
  completedToday: number;
};

const API_URL = 'http://localhost:3001/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function App() {
  const [tab, setTab] = useState<'client' | 'driver' | 'admin'>('client');
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [clientForm, setClientForm] = useState({
    clientName: 'Nodira',
    pickupAddress: 'Toshkent, Yunusobod',
    pickupLat: '41.3581',
    pickupLng: '69.2984',
    destinationAddress: 'Toshkent, Chilonzor',
    destinationLat: '41.2897',
    destinationLng: '69.2031',
  });

  const loadData = async () => {
    try {
      const [dashboardData, driverData, ridesData] = await Promise.all([
        fetchJson<DashboardSummary>('/dashboard'),
        fetchJson<Driver[]>('/drivers'),
        fetchJson<Ride[]>('/rides'),
      ]);

      setDashboard(dashboardData);
      setDrivers(driverData);
      setRides(ridesData);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createRide = async () => {
    await fetchJson<Ride>('/rides/request', {
      method: 'POST',
      body: JSON.stringify({
        clientName: clientForm.clientName,
        pickupAddress: clientForm.pickupAddress,
        pickupLat: Number(clientForm.pickupLat),
        pickupLng: Number(clientForm.pickupLng),
        destinationAddress: clientForm.destinationAddress,
        destinationLat: Number(clientForm.destinationLat),
        destinationLng: Number(clientForm.destinationLng),
      }),
    });

    await loadData();
  };

  const toggleDriverOnline = async (driverId: string, online: boolean) => {
    await fetchJson<Driver>(`/drivers/${driverId}/status`, {
      method: 'POST',
      body: JSON.stringify({ online }),
    });

    await loadData();
  };

  const acceptRide = async (rideId: string, driverId: string) => {
    await fetchJson<Ride>(`/rides/${rideId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ driverId }),
    });

    await loadData();
  };

  const updateRideStatus = async (rideId: string, status: RideStatus) => {
    await fetchJson<Ride>(`/rides/${rideId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });

    await loadData();
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Transport platform</p>
          <h1>Sherxan Taxi</h1>
        </div>
        <nav className="tabs">
          <button className={tab === 'client' ? 'active' : ''} onClick={() => setTab('client')}>
            Client
          </button>
          <button className={tab === 'driver' ? 'active' : ''} onClick={() => setTab('driver')}>
            Driver
          </button>
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>
            Admin
          </button>
        </nav>
      </header>

      {tab === 'client' && (
        <main className="grid two-col">
          <section className="panel">
            <h2>Request a trip</h2>
            <div className="field-group">
              <label>
                Client name
                <input
                  value={clientForm.clientName}
                  onChange={(event) => setClientForm({ ...clientForm, clientName: event.target.value })}
                />
              </label>
              <label>
                Pickup address
                <input
                  value={clientForm.pickupAddress}
                  onChange={(event) => setClientForm({ ...clientForm, pickupAddress: event.target.value })}
                />
              </label>
              <div className="two-inline">
                <label>
                  Pickup lat
                  <input value={clientForm.pickupLat} onChange={(e) => setClientForm({ ...clientForm, pickupLat: e.target.value })} />
                </label>
                <label>
                  Pickup lng
                  <input value={clientForm.pickupLng} onChange={(e) => setClientForm({ ...clientForm, pickupLng: e.target.value })} />
                </label>
              </div>
              <label>
                Destination address
                <input
                  value={clientForm.destinationAddress}
                  onChange={(event) => setClientForm({ ...clientForm, destinationAddress: event.target.value })}
                />
              </label>
              <div className="two-inline">
                <label>
                  Destination lat
                  <input value={clientForm.destinationLat} onChange={(e) => setClientForm({ ...clientForm, destinationLat: e.target.value })} />
                </label>
                <label>
                  Destination lng
                  <input value={clientForm.destinationLng} onChange={(e) => setClientForm({ ...clientForm, destinationLng: e.target.value })} />
                </label>
              </div>
              <button className="primary" onClick={createRide}>Book ride</button>
            </div>
          </section>

          <section className="panel">
            <h2>Active rides</h2>
            <div className="card-stack">
              {rides.map((ride) => (
                <div key={ride.id} className="info-card">
                  <div className="row"><strong>{ride.clientName}</strong><span>{ride.status}</span></div>
                  <p>{ride.pickupAddress}</p>
                  <p>→ {ride.destinationAddress}</p>
                  <div className="row"><span>{ride.driverName ?? 'Waiting for driver'}</span><span>{ride.fare.toLocaleString()} UZS</span></div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {tab === 'driver' && (
        <main className="grid two-col">
          <section className="panel">
            <h2>Driver status</h2>
            <div className="card-stack">
              {drivers.map((driver) => (
                <div key={driver.id} className="info-card">
                  <div className="row"><strong>{driver.name}</strong><span>{driver.online ? 'Online' : 'Offline'}</span></div>
                  <p>{driver.vehicle}</p>
                  <p>{driver.plate}</p>
                  <button
                    className="primary"
                    onClick={() => toggleDriverOnline(driver.id, !driver.online)}
                  >
                    {driver.online ? 'Go offline' : 'Go online'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Available rides</h2>
            <div className="card-stack">
              {rides.filter((ride) => ride.status === 'requested').map((ride) => (
                <div key={ride.id} className="info-card">
                  <div className="row"><strong>{ride.clientName}</strong><span>{ride.fare.toLocaleString()} UZS</span></div>
                  <p>{ride.pickupAddress}</p>
                  <p>→ {ride.destinationAddress}</p>
                  <button className="primary" onClick={() => acceptRide(ride.id, drivers[0]?.id ?? 'drv-1')}>
                    Accept ride
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {tab === 'admin' && (
        <main className="grid two-col">
          <section className="panel">
            <h2>Overview</h2>
            <div className="stats-grid">
              <div className="stat-box">
                <span>Total revenue</span>
                <strong>{dashboard?.totalRevenue?.toLocaleString() ?? 0} UZS</strong>
              </div>
              <div className="stat-box">
                <span>Active rides</span>
                <strong>{dashboard?.activeRides ?? 0}</strong>
              </div>
              <div className="stat-box">
                <span>Online drivers</span>
                <strong>{dashboard?.onlineDrivers ?? 0}</strong>
              </div>
              <div className="stat-box">
                <span>Completed today</span>
                <strong>{dashboard?.completedToday ?? 0}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Ride list</h2>
            <div className="card-stack">
              {rides.map((ride) => (
                <div key={ride.id} className="info-card">
                  <div className="row"><strong>{ride.clientName}</strong><span>{ride.status}</span></div>
                  <p>{ride.pickupAddress}</p>
                  <p>→ {ride.destinationAddress}</p>
                  <div className="row">
                    <button onClick={() => updateRideStatus(ride.id, 'accepted')}>Accepted</button>
                    <button onClick={() => updateRideStatus(ride.id, 'in_progress')}>In progress</button>
                    <button onClick={() => updateRideStatus(ride.id, 'completed')}>Completed</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
