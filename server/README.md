# Prophit Backend Server

A Node.js/Express backend server for the Prophit MVP that tracks Polymarket prediction markets and detects significant price movements.

## Features

- **Market Data Polling**: Automatically fetches market data from Polymarket API
- **Movement Detection**: Identifies significant price movements (10%+ by default)
- **MongoDB Integration**: Stores markets, price history, and movements with Mongoose
- **Memory Fallback**: Works without MongoDB using in-memory storage
- **RESTful API**: Provides endpoints for frontend consumption
- **Real-time Updates**: Configurable polling intervals for live data

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (optional - will use memory storage if unavailable)
- Polymarket API credentials (optional - will use mock data)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start development server
npm run dev
```

### Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB (optional)
MONGODB_URI=mongodb://localhost:27017/prophit

# Polymarket API (optional)
POLYMARKET_API_KEY=your_api_key
POLYMARKET_SECRET=your_secret
POLYMARKET_PASSPHRASE=your_passphrase

# Polling Configuration
POLLING_INTERVAL_MINUTES=5
MOVEMENT_THRESHOLD_PERCENT=10
RATE_LIMIT_DELAY_MS=2000
MIN_VOLUME_USD=1000

# CORS
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Health & Status
- `GET /health` - Basic health check
- `GET /api/status` - Detailed system status

### Markets
- `GET /api/markets` - Get active markets
  - Query params: `limit`, `category`
- `GET /api/markets/:id` - Get specific market
- `GET /api/markets/:id/history` - Get market price history
  - Query params: `hours`, `outcome`

### Movements
- `GET /api/markets/movements` - Get significant movements
  - Query params: `limit`, `hours`

### Categories & Stats
- `GET /api/markets/categories` - Get available categories
- `GET /api/markets/stats` - Get API statistics

## Database Schema

### Market
```javascript
{
  marketId: String (unique),
  question: String,
  slug: String,
  category: String,
  probabilities: [{ outcome: String, price: Number }],
  volume: Number,
  isActive: Boolean,
  endDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### PriceHistory
```javascript
{
  marketId: String,
  outcome: String,
  price: Number,
  timestamp: Date
}
```

### Movement
```javascript
{
  marketId: String,
  outcome: String,
  changePercent: Number,
  oldPrice: Number,
  newPrice: Number,
  detectedAt: Date
}
```

## Architecture

```
src/
├── controllers/     # Request handlers
├── models/         # Mongoose schemas
├── routes/         # Express routes
├── services/       # Business logic
│   ├── databaseService.js    # MongoDB operations
│   ├── polymarketService.js  # API integration
│   └── pollingService.js     # Scheduled tasks
└── server.js       # Express app setup
```

## Development

### Testing API Endpoints

```bash
# Run test script
node test-api.js
```

### Manual Testing

```bash
# Health check
curl http://localhost:5000/health

# Get markets
curl http://localhost:5000/api/markets

# Get movements
curl http://localhost:5000/api/markets/movements
```

### MongoDB Setup (Optional)

```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Or run manually
mongod --dbpath /tmp/mongodb --fork --logpath /tmp/mongod.log
```

## Production Deployment

### Environment Setup
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prophit
FRONTEND_URL=https://your-frontend-domain.com
```

### Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start src/server.js --name prophit-backend
pm2 startup
pm2 save
```

## Monitoring

The server provides comprehensive status information:

- Database connection status
- Polling service status  
- API request statistics
- Recent error logs
- Memory usage (when using fallback storage)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Server falls back to memory storage automatically
   - Check MongoDB service is running
   - Verify connection string in `.env`

2. **Polymarket API Errors**
   - Server uses mock data as fallback
   - Check API credentials in `.env`
   - Verify rate limiting settings

3. **CORS Issues**
   - Update `FRONTEND_URL` in `.env`
   - Check frontend is running on expected port

### Logs

The server provides detailed logging:
- Request logging for all API calls
- Polling cycle results
- Database operation status
- Error tracking with timestamps

## License

MIT License - see LICENSE file for details
