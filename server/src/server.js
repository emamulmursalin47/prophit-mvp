import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './services/databaseService.js';
import { startPolling } from './services/pollingService.js';
import marketRoutes from './routes/marketRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(cors({
  origin: true,
  credentials: false
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting for production
if (process.env.NODE_ENV === 'production') {
  const requests = new Map();
  
  app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip);
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests'
      });
    }
    
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    next();
  });
}

// Initialize database and polling
let pollingService;
(async () => {
  try {
    await connectToDatabase();
    pollingService = await startPolling();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Initialization error:', error);
    }
  }
})();

// Health check
app.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/markets', marketRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', error);
  }
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Prophit MVP API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      markets: '/api/markets',
      movements: '/api/markets/movements',
      categories: '/api/markets/categories'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  if (pollingService) pollingService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  if (pollingService) pollingService.stop();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  }
});
