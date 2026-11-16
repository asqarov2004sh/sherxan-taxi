import cors from 'cors';
import express from 'express';
import {
  acceptRide,
  changeRideStatus,
  createRide,
  getDashboardSummary,
  listDrivers,
  listRides,
  setDriverOnline,
  type RideStatus,
} from './data.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedStatuses: RideStatus[] = ['requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'];
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Sherxan Taxi API', time: new Date().toISOString() });
});

app.get('/api/dashboard', (_req, res) => res.json(getDashboardSummary()));
app.get('/api/drivers', (_req, res) => res.json(listDrivers()));
app.get('/api/rides', (_req, res) => res.json(listRides()));
app.get('/api/rides/:id', (req, res) => {
  const ride = listRides().find((item) => item.id === req.params.id);
  if (!ride) return res.status(404).json({ message: 'Safar topilmadi.' });
  return res.json(ride);
});

app.post('/api/rides/request', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
  const pickupAddress = typeof body.pickupAddress === 'string' ? body.pickupAddress.trim() : '';
  const destinationAddress = typeof body.destinationAddress === 'string' ? body.destinationAddress.trim() : '';
  const coords = ['pickupLat', 'pickupLng', 'destinationLat', 'destinationLng'].map((key) => body[key]);

  if (!clientName || !pickupAddress || !destinationAddress || clientName.length > 100 || pickupAddress.length > 200 || destinationAddress.length > 200) {
    return res.status(400).json({ message: 'Ism va manzillarni to‘g‘ri kiriting.' });
  }
  if (!coords.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    return res.status(400).json({ message: 'Manzil koordinatalari raqam bo‘lishi kerak.' });
  }
  const [pickupLat, pickupLng, destinationLat, destinationLng] = coords as number[];
  if (Math.abs(pickupLat) > 90 || Math.abs(destinationLat) > 90 || Math.abs(pickupLng) > 180 || Math.abs(destinationLng) > 180) {
    return res.status(400).json({ message: 'Koordinatalar ruxsat etilgan diapazondan tashqarida.' });
  }

  const ride = createRide({ clientName, pickupAddress, pickupLat, pickupLng, destinationAddress, destinationLat, destinationLng });
  return res.status(201).json(ride);
});

app.post('/api/drivers/:id/status', (req, res) => {
  if (typeof req.body?.online !== 'boolean') return res.status(400).json({ message: 'online boolean bo‘lishi kerak.' });
  const driver = setDriverOnline(req.params.id, req.body.online);
  if (!driver) return res.status(409).json({ message: 'Haydovchi topilmadi yoki faol safari bor.' });
  return res.json(driver);
});

app.post('/api/rides/:id/accept', (req, res) => {
  const driverId = typeof req.body?.driverId === 'string' ? req.body.driverId : '';
  if (!driverId) return res.status(400).json({ message: 'driverId talab qilinadi.' });
  const result = acceptRide(req.params.id, driverId);
  if (result.error) return res.status(result.error.includes('topilmadi') ? 404 : 409).json({ message: result.error });
  return res.json(result.ride);
});

app.post('/api/rides/:id/status', (req, res) => {
  const status = req.body?.status as RideStatus;
  if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Safar holati noto‘g‘ri.' });
  const result = changeRideStatus(req.params.id, status);
  if (result.error) return res.status(result.error === 'Safar topilmadi.' ? 404 : 409).json({ message: result.error });
  return res.json(result.ride);
});

app.use((_req, res) => res.status(404).json({ message: 'API yo‘li topilmadi.' }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError) return res.status(400).json({ message: 'JSON so‘rov formati noto‘g‘ri.' });
  console.error(error);
  return res.status(500).json({ message: 'Serverda kutilmagan xatolik yuz berdi.' });
});

app.listen(port, () => console.log(`Sherxan Taxi API http://localhost:${port} manzilida ishga tushdi.`));
