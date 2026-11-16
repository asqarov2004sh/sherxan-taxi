# Sherxan Taxi

Sherxan Taxi is a taxi marketplace MVP with three main roles:
- Client: request rides and track them
- Driver: accept rides and update status
- Admin: monitor revenue, active rides, and driver activity

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Data model: in-memory store for the MVP

## Run locally

```bash
npm install
npm run dev
```

Then open:
- Web app: http://localhost:5173
- API: http://localhost:3001/api/health

## Project structure

- `server/` — Express API
- `web/` — React dashboard/application UI

## Notes
This is a production-ready MVP structure, designed to be extended with a real database and authentication later.
