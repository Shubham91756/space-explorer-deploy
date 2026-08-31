import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import spaceHistoryRoute from './routes/spaceHistory.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Space history route
app.use('/api/space-history', spaceHistoryRoute);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔴 Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`✅ Stellar.log Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🔗 CORS Origin: ${corsOptions.origin}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🚀 Space History API: http://localhost:${PORT}/api/space-history?date=MM-DD`);
});
