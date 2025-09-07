# Prophit MVP - Prediction Market Tracker

A web application that tracks significant movements in prediction markets connected to news events, powered by Polymarket API.

## Features

- **Movement Detection**: Automatically detects 10%+ market movements in 24 hours
- **Real-time Polling**: Collects market data every 2 minutes
- **Historical Charts**: Line charts showing probability changes over time
- **MongoDB Storage**: Persistent storage of markets, price history, and movements
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Auto-scrolling Navbar**: Horizontal scrolling market ticker
- **4-Column Grid**: Movement cards with mini charts and analytics

## Tech Stack

### Frontend
- React 18.3.1 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Recharts for data visualization
- Vite for development and building

### Backend
- Express.js with ES modules
- MongoDB with Mongoose
- Node-cron for scheduled polling
- Polymarket CLOB & Gamma APIs
- Environment-based configuration

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **MongoDB** - Choose one option:
  - Local MongoDB - [Download here](https://www.mongodb.com/try/download/community)
  - MongoDB Atlas (cloud) - [Sign up here](https://www.mongodb.com/atlas)
- **Git** - [Download here](https://git-scm.com/)
- **Polymarket API Access** (optional for enhanced features)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd prophit-mvp
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB service
mongod

# MongoDB will run on mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string from "Connect" → "Connect your application"
4. Whitelist your IP address
5. Create database user with read/write permissions

### 4. Environment Configuration

Create environment file for backend:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration (choose one)
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/prophit

# MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/prophit?retryWrites=true&w=majority

# Polymarket API Credentials (Optional - will use public API if not provided)
POLYMARKET_PRIVATE_KEY=your_private_key_here
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_SECRET=your_secret_here
POLYMARKET_PASSPHRASE=your_passphrase_here

# Polling Configuration
POLLING_INTERVAL_MINUTES=2
MOVEMENT_THRESHOLD_PERCENT=10
RATE_LIMIT_DELAY_MS=2000
```

### 5. API Credentials Configuration (Optional)

**Without API Credentials:**
- The app will use Polymarket's public Gamma API
- Limited to public market data
- No authentication required

**With API Credentials:**
1. Sign up at [Polymarket](https://polymarket.com/)
2. Apply for API access
3. Get your credentials from the developer portal
4. Add them to your `.env` file

**Note:** The app works perfectly with public APIs - private credentials are only needed for enhanced features.

## Running Locally

### Development Mode

**Option 1: Run both servers simultaneously**
```bash
npm run dev:full
```

**Option 2: Run servers separately**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### Production Mode

```bash
# Build frontend
npm run build

# Start backend in production
cd server
npm start
```

## Access the Application

- **Frontend**: http://localhost:5173 (or http://localhost:5174)
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Basic Usage Guide

### 1. Home Dashboard
- View market movements in a 4-column grid
- Each card shows:
  - Market question with auto-scrolling text
  - Category (Sports, Politics, Crypto, etc.)
  - Price movement percentage
  - Mini chart with 24h history
  - Mock news reason for movement
  - Current odds and volume

### 2. Navigation Features
- **Auto-scrolling Markets Navbar**: Shows all markets horizontally
- **Category Filtering**: Filter by Politics, Sports, Cryptocurrency, etc.
- **Movement Threshold**: Adjust from 5% to 20% movements
- **Sort Options**: Most recent or largest movements
- **View Modes**: Toggle between movements and all markets

### 3. Analytics Dashboard
- Today's movement count
- Average movement percentage
- Top category by activity
- Largest movement detected

### 4. Real-time Updates
- Markets refresh every 60 seconds
- Movement feed updates every 30 seconds
- Backend polls Polymarket APIs every 2 minutes
- Auto-refresh indicators show last update time

## API Endpoints

- `GET /api/markets` - Get all markets
- `GET /api/markets/movements` - Get significant movements (10%+ changes)
- `GET /api/markets/categories` - Get available categories
- `GET /api/markets/:id` - Get specific market
- `GET /api/markets/:id/history` - Get market price history
- `GET /health` - Health check with polling status
- `GET /api/status` - Detailed service status

## Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string

### Optional
- `PORT` - Server port (default: 5000)
- `POLLING_INTERVAL_MINUTES` - How often to poll APIs (default: 2)
- `MOVEMENT_THRESHOLD_PERCENT` - Movement detection threshold (default: 10)
- `RATE_LIMIT_DELAY_MS` - Delay between API calls (default: 2000)
- `POLYMARKET_API_KEY` - Polymarket API key (optional)
- `POLYMARKET_SECRET` - Polymarket API secret (optional)
- `POLYMARKET_PASSPHRASE` - Polymarket API passphrase (optional)

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongod --version

# For Atlas: verify connection string and IP whitelist
```

**2. Port Already in Use**
```bash
# Kill existing processes
pkill -f "node"
pkill -f "vite"
```

**3. API Rate Limiting**
- Increase `RATE_LIMIT_DELAY_MS` in `.env`
- Default is 2000ms (2 seconds) between requests

**4. No Markets Showing**
- Check backend logs: `tail -f server/server.log`
- Verify API endpoints: `curl http://localhost:5000/health`
- Check MongoDB connection

### Verification Commands

```bash
# Check backend health
curl http://localhost:5000/health

# Check API data
curl http://localhost:5000/api/markets | jq '.data | length'

# Check movements
curl http://localhost:5000/api/markets/movements | jq '.data | length'
```

## Architecture

```
project/
├── src/                    # Frontend React application
│   ├── components/         # UI components
│   │   ├── MovementFeed.tsx       # 4-column movement cards
│   │   ├── MarketsNavbar.tsx      # Auto-scrolling navbar
│   │   ├── ScrollingText.tsx      # Text animation component
│   │   └── MovementAnalytics.tsx  # Analytics dashboard
│   ├── pages/             # Page components  
│   ├── routes/            # Routing configuration
│   ├── services/          # API service layer
│   └── types/             # TypeScript definitions
├── server/                # Backend Express application
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   ├── .env               # Environment variables (not in git)
│   └── .env.example       # Environment template
└── README.md
```

## Security Notes

- All sensitive credentials are stored in `.env` files
- `.env` files are excluded from git via `.gitignore`
- Use `.env.example` as a template for required variables
- In production, use proper secret management (AWS Secrets Manager, etc.)

## Development Notes

- Backend polls Polymarket APIs every 2 minutes (configurable)
- Frontend auto-refreshes movement feed every 30 seconds
- Movement detection threshold is 10% change in 24 hours (configurable)
- Rate limiting prevents API abuse (2-second delays between requests)
- Graceful fallbacks to public APIs when private credentials unavailable

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use production MongoDB instance (Atlas recommended)
3. Configure proper CORS origins
4. Use process manager (PM2) for backend
5. Serve frontend through CDN/static hosting
6. Use environment-specific secrets management
7. Set up monitoring and logging
8. Configure SSL certificates

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure environment variables are configured correctly
4. Check server logs for detailed error messages
