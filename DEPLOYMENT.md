# Deployment

Vercel builds this Create React App with `npm run build` and serves `build/`.
The `api/` directory contains the serverless functions used by the frontend:

- `/api/space-history?date=MM-DD`
- `/api/launches?year=YYYY`
- `/api/launches/upcoming`

Deploy the `fix/audit-and-backend` branch as a Vercel preview to verify the
functions and frontend together. No frontend environment variables are needed;
the browser uses relative `/api/...` URLs.

Before deploying, run:

```bash
npm test -- --watchAll=false
npm run build
```
