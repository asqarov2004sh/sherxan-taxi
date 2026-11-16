import { useCallback, useEffect, useState } from 'react';

type Role = 'client' | 'driver' | 'admin';
type RideStatus = 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
type Driver = { id: string; name: string; vehicle: string; plate: string; rating: number; online: boolean };
type Ride = { id: string; clientName: string; driverId?: string; driverName?: string; pickupAddress: string; destinationAddress: string; status: RideStatus; fare: number; createdAt: string };
type Dashboard = { totalRevenue: number; activeRides: number; onlineDrivers: number; completedToday: number };
type Booking = { clientName: string; pickupAddress: string; pickupLat: number; pickupLng: number; destinationAddress: string; destinationLat: number; destinationLng: number };

const statuses: Record<RideStatus, string> = {
  requested: 'Haydovchi kutilmoqda', accepted: 'Haydovchi yo‘lda', arrived: 'Haydovchi yetib keldi',
  in_progress: 'Safar davom etmoqda', completed: 'Yakunlandi', cancelled: 'Bekor qilindi',
};
const apiUrl = import.meta.env.VITE_API_URL ?? '/api';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? `So‘rov bajarilmadi (${response.status})`);
  return data as T;
}

const money = (value: number) => `${value.toLocaleString('uz-UZ')} so‘m`;

export default function App() {
  const [role, setRole] = useState<Role>('client');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('drv-1');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking>({
    clientName: '', pickupAddress: '', pickupLat: 41.2995, pickupLng: 69.2401,
    destinationAddress: '', destinationLat: 41.3111, destinationLng: 69.2797,
  });

  const refresh = useCallback(async () => {
    const [driverList, rideList, stats] = await Promise.all([
      api<Driver[]>('/drivers'), api<Ride[]>('/rides'), api<Dashboard>('/dashboard'),
    ]);
    setDrivers(driverList);
    setRides(rideList);
    setDashboard(stats);
    if (!driverList.some((driver) => driver.id === selectedDriver) && driverList[0]) setSelectedDriver(driverList[0].id);
  }, [selectedDriver]);

  useEffect(() => {
    refresh().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Serverga ulanib bo‘lmadi.'));
    const timer = window.setInterval(() => refresh().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function perform(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await refresh(); setNotice(success); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Xatolik yuz berdi.'); }
    finally { setBusy(false); }
  }

  const setField = (field: keyof Booking, value: string) => setBooking((current) => ({
    ...current,
    [field]: ['pickupLat', 'pickupLng', 'destinationLat', 'destinationLng'].includes(field) ? Number(value) : value,
  }));

  const submitBooking = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      await api<Ride>('/rides/request', { method: 'POST', body: JSON.stringify(booking) });
      setBooking((current) => ({ ...current, clientName: '', pickupAddress: '', destinationAddress: '' }));
    }, 'Buyurtma qabul qilindi. Haydovchi topilishi kutilmoqda.');
  };

  const activeRides = rides.filter((ride) => !['completed', 'cancelled'].includes(ride.status));
  const myRides = rides.filter((ride) => ride.driverId === selectedDriver);
  const driver = drivers.find((item) => item.id === selectedDriver);

  return (
    <div className="app-shell">
      <header className="header">
        <a className="brand" href="#home" aria-label="Sherxan Taxi bosh sahifa"><span className="brand-mark">S</span><span>Sherxan<span className="brand-light">Taxi</span><small>Har manzilga ishonch bilan</small></span></a>
        <nav className="role-switch" aria-label="Bo‘lim tanlash">
          {([['client', 'Mijoz'], ['driver', 'Haydovchi'], ['admin', 'Boshqaruv']] as const).map(([value, label]) =>
            <button key={value} className={role === value ? 'selected' : ''} onClick={() => { setRole(value); setError(''); setNotice(''); }}>{label}</button>)}
        </nav>
        <span className="service-indicator"><i /> Xizmat faol</span>
      </header>

      <main className="main-content" id="home">
        <section className="welcome-row"><div><p className="eyebrow">SHERXAN TAXI · TOSHKENT</p><h1>{role === 'client' ? 'Safaringizni rejalashtiring' : role === 'driver' ? 'Haydovchi markazi' : 'Boshqaruv paneli'}</h1><p className="subheading">{role === 'client' ? 'Manzilingizni kiriting — qolganini biz hal qilamiz.' : role === 'driver' ? 'Buyurtmalar va ish holatingizni shu yerdan boshqaring.' : 'Safarlar va haydovchilar holatini kuzating.'}</p></div><div className="today-pill">● <span>{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}</span></div></section>

        {notice && <div className="alert success" role="status">✓ {notice}</div>}
        {error && <div className="alert failure" role="alert">{error}</div>}

        {role === 'client' && <div className="content-grid client-layout">
          <section className="panel booking-panel"><div className="panel-heading"><div><span className="section-index">01 / YANGI SAFAR</span><h2>Qayerga boramiz?</h2></div><span className="heading-icon">↗</span></div>
            <form className="booking-form" onSubmit={submitBooking}>
              <label>Ismingiz<input required maxLength={100} placeholder="Ism familiya" value={booking.clientName} onChange={(e) => setField('clientName', e.target.value)} /></label>
              <div className="route-fields"><span className="route-line" aria-hidden="true"><i /><b /><i /></span><label>Qayerdan olib ketaylik?<input required maxLength={200} placeholder="Boshlang‘ich manzil" value={booking.pickupAddress} onChange={(e) => setField('pickupAddress', e.target.value)} /></label><label>Qayerga borasiz?<input required maxLength={200} placeholder="Boradigan manzil" value={booking.destinationAddress} onChange={(e) => setField('destinationAddress', e.target.value)} /></label></div>
              <details className="coordinates"><summary>Koordinatalarni sozlash (demo)</summary><div className="coordinate-grid">{([['pickupLat','Olish kengligi'],['pickupLng','Olish uzunligi'],['destinationLat','Manzil kengligi'],['destinationLng','Manzil uzunligi']] as const).map(([key,label]) => <label key={key}>{label}<input type="number" step="any" value={booking[key]} onChange={(e) => setField(key, e.target.value)} /></label>)}</div></details>
              <div className="estimate"><span>Taxminiy narx</span><strong>Yo‘nalish kiritilgach hisoblanadi</strong></div>
              <button className="primary-button" disabled={busy}>{busy ? 'Yuborilmoqda…' : '🚕  Taksi chaqirish'}</button>
              <p className="fine-print">Narx hozircha taxminiy, yo‘l masofasi va tirbandlik hisobga olinmaydi.</p>
            </form>
          </section>
          <section className="panel map-panel"><div className="map-top"><span className="map-tag">TOSHKENT, O‘ZBEKISTON</span><span className="map-live"><i /> Jonli holat</span></div><div className="map-art" role="img" aria-label="Toshkent xaritasi ko‘rinishidagi dekorativ sxema"><div className="map-grid-lines"/><div className="road road-one"/><div className="road road-two"/><div className="road road-three"/><div className="route-path"/><span className="map-pin pin-a">●</span><span className="map-pin pin-b">◆</span><span className="map-label label-a">Yunusobod</span><span className="map-label label-b">Shahar markazi</span><span className="map-label label-c">Chilonzor</span><div className="map-caption"><strong>Shahringiz bo‘ylab</strong><span>qulay va xavfsiz safar</span></div></div><div className="map-footer"><span><i className="legend-dot pickup"/> Olish manzili</span><span><i className="legend-dot dropoff"/> Borish manzili</span><span className="map-note">Xarita ulanishi keyingi bosqichda</span></div></section>
          <section className="panel rides-panel"><div className="panel-heading"><div><span className="section-index">02 / SAFARLAR</span><h2>Buyurtmalar holati</h2></div><span className="count-badge">{activeRides.length} faol</span></div><RideList rides={rides.slice(0, 6)} empty="Hozircha buyurtmalar yo‘q. Birinchi safaringizni chaqiring." /></section>
        </div>}

        {role === 'driver' && <div className="content-grid two-column">
          <section className="panel"><div className="panel-heading"><div><span className="section-index">HAYDOVCHI HISOBI</span><h2>Ish holati</h2></div></div>
            <label className="driver-select">Haydovchini tanlang<select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>{drivers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.plate}</option>)}</select></label>
            {driver && <div className="driver-card"><div className="driver-avatar">{driver.name.split(' ').map((part) => part[0]).join('').slice(0,2)}</div><div className="driver-details"><strong>{driver.name}</strong><span>{driver.vehicle} · {driver.plate}</span><span>★ {driver.rating.toFixed(1)} reyting</span></div><span className={`status-chip ${driver.online ? 'online' : 'offline'}`}>{driver.online ? 'Onlayn' : 'Oflayn'}</span></div>}
            {driver && <button className={`primary-button ${driver.online ? 'secondary-button' : ''}`} disabled={busy} onClick={() => void perform(() => api(`/drivers/${driver.id}/status`, { method: 'POST', body: JSON.stringify({ online: !driver.online }) }), driver.online ? 'Oflayn holatga o‘tdingiz.' : 'Siz endi onlaynsiz.')}>{driver.online ? 'Oflayn bo‘lish' : 'Ishni boshlash'}</button>}
            <div className="notice-box">Demo versiya: haydovchi tanlash va tasdiqlash hozircha akkaunt orqali himoyalanmagan. Haqiqiy ishga tushirishdan oldin autentifikatsiya kerak.</div>
          </section>
          <section className="panel"><div className="panel-heading"><div><span className="section-index">SIZGA TAKLIFLAR</span><h2>Yangi buyurtmalar</h2></div><span className="count-badge">{rides.filter((ride) => ride.status === 'requested').length}</span></div>
            {driver?.online ? <div className="card-list">{rides.filter((ride) => ride.status === 'requested').map((ride) => <article className="ride-card" key={ride.id}><div className="ride-card-top"><strong>{money(ride.fare)}</strong><span>{new Date(ride.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span></div><p>● {ride.pickupAddress}</p><p>◆ {ride.destinationAddress}</p><button className="small-action" disabled={busy} onClick={() => void perform(() => api(`/rides/${ride.id}/accept`, { method: 'POST', body: JSON.stringify({ driverId: selectedDriver }) }), 'Buyurtma sizga biriktirildi.')}>Buyurtmani qabul qilish</button></article>)}{rides.every((ride) => ride.status !== 'requested') && <Empty text="Hozircha yangi buyurtmalar yo‘q." />}</div> : <Empty text="Buyurtmalarni ko‘rish uchun onlayn holatga o‘ting."/>}
            <div className="panel-heading compact-heading"><div><span className="section-index">FAOL SAFARLAR</span><h2>Mening buyurtmalarim</h2></div></div><div className="card-list">{myRides.filter((ride) => !['completed','cancelled'].includes(ride.status)).map((ride) => <article className="ride-card" key={ride.id}><RideSummary ride={ride}/><div className="action-row">{ride.status === 'accepted' && <button className="small-action" onClick={() => void perform(() => api(`/rides/${ride.id}/status`, { method:'POST', body:JSON.stringify({status:'arrived'}) }), 'Mijozga yetib kelganingiz bildirildi.')}>Yetib keldim</button>}{ride.status === 'arrived' && <button className="small-action" onClick={() => void perform(() => api(`/rides/${ride.id}/status`, { method:'POST', body:JSON.stringify({status:'in_progress'}) }), 'Safar boshlandi.')}>Safarni boshlash</button>}{ride.status === 'in_progress' && <button className="small-action" onClick={() => void perform(() => api(`/rides/${ride.id}/status`, { method:'POST', body:JSON.stringify({status:'completed'}) }), 'Safar yakunlandi.')}>Safarni yakunlash</button>}</div></article>)}{myRides.every((ride) => ['completed','cancelled'].includes(ride.status)) && <Empty text="Sizda hozir faol safar yo‘q."/>}</div>
          </section>
        </div>}

        {role === 'admin' && <div className="admin-layout"><div className="stats-grid">{[["Jami tushum",money(dashboard?.totalRevenue ?? 0),"✓"],["Faol safarlar",String(dashboard?.activeRides ?? 0),"↗"],["Onlayn haydovchilar",String(dashboard?.onlineDrivers ?? 0),"●"],["Bugun yakunlangan",String(dashboard?.completedToday ?? 0),"◷"]].map(([label,value,icon]) => <section className="panel stat-card" key={label}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong></section>)}</div><div className="content-grid two-column"><section className="panel"><div className="panel-heading"><div><span className="section-index">OPERATSION NAZORAT</span><h2>Barcha safarlar</h2></div></div><RideList rides={rides} empty="Safarlar ro‘yxati bo‘sh." admin/></section><section className="panel"><div className="panel-heading"><div><span className="section-index">HAMKORLAR</span><h2>Haydovchilar</h2></div><span className="count-badge">{drivers.length} jami</span></div><div className="card-list">{drivers.map((item) => <div className="driver-card compact-driver" key={item.id}><div className="driver-avatar">{item.name.split(' ').map((part) => part[0]).join('').slice(0,2)}</div><div className="driver-details"><strong>{item.name}</strong><span>{item.vehicle} · {item.plate}</span><span>★ {item.rating.toFixed(1)}</span></div><span className={`status-chip ${item.online ? 'online' : 'offline'}`}>{item.online ? 'Onlayn' : 'Oflayn'}</span></div>)}</div><div className="notice-box">Admin huquqlari hozircha namoyish uchun. Haqiqiy admin panel login, server tomonidagi role tekshiruvi va audit jurnalini talab qiladi.</div></section></div></div>}
      </main>
      <footer className="footer"><span>© {new Date().getFullYear()} Sherxan Taxi</span><span>Demo MVP · Haqiqiy safar xizmati emas</span></footer>
    </div>
  );
}

function RideList({ rides, empty, admin = false }: { rides: Ride[]; empty: string; admin?: boolean }) {
  if (!rides.length) return <Empty text={empty}/>;
  return <div className="card-list">{rides.map((ride) => <article className="ride-card" key={ride.id}><RideSummary ride={ride}/>{admin && <div className="ride-meta"><span>{ride.clientName}</span><span>{ride.driverName ?? 'Haydovchi biriktirilmagan'}</span></div>}</article>)}</div>;
}
function RideSummary({ ride }: { ride: Ride }) { return <><div className="ride-card-top"><strong>{money(ride.fare)}</strong><span className={`ride-status status-${ride.status}`}>{statuses[ride.status]}</span></div><p>● {ride.pickupAddress}</p><p>◆ {ride.destinationAddress}</p>{ride.driverName && <div className="ride-meta"><span>Haydovchi: {ride.driverName}</span></div>}</>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><span>⌁</span><p>{text}</p></div>; }
