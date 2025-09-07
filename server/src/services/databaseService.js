import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Market, PriceHistory, Movement } from '../models/Market.js';

// Ensure environment variables are loaded
dotenv.config();

class DatabaseService {
  constructor() {
    this.movementThreshold = parseFloat(process.env.MOVEMENT_THRESHOLD_PERCENT) || 10;
    this.isConnected = false;
    this.useMemoryStorage = false;
    
    // In-memory storage fallback
    this.memoryStorage = {
      markets: new Map(),
      priceHistory: [],
      movements: []
    };
    
    this.connect();
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/prophit';
      console.log(`Attempting to connect to MongoDB Atlas...`);
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 15000
      });
      
      this.isConnected = true;
      this.useMemoryStorage = false;
      console.log('✅ Connected to MongoDB Atlas successfully');
      
    } catch (error) {
      console.warn('⚠️  MongoDB unavailable, using in-memory storage:', error.message);
      this.isConnected = false;
      this.useMemoryStorage = true;
    }
  }

  async saveMarket(market) {
    try {
      if (this.useMemoryStorage) {
        const marketData = {
          marketId: market.id,
          question: market.question,
          slug: market.slug,
          category: market.category || 'Other',
          probabilities: market.probabilities || [],
          volume: market.volume || 0,
          isActive: market.isActive !== false,
          endDate: market.endDate,
          createdAt: market.createdAt || new Date(),
          updatedAt: new Date()
        };
        this.memoryStorage.markets.set(market.id, marketData);
        return marketData;
      }

      const existingMarket = await Market.findOne({ marketId: market.id });
      
      if (existingMarket) {
        existingMarket.question = market.question;
        existingMarket.category = market.category || 'Other';
        existingMarket.probabilities = market.probabilities || [];
        existingMarket.volume = market.volume || 0;
        existingMarket.isActive = market.isActive !== false;
        existingMarket.endDate = market.endDate;
        existingMarket.updatedAt = new Date();
        return await existingMarket.save();
      } else {
        const newMarket = new Market({
          marketId: market.id,
          question: market.question,
          slug: market.slug,
          category: market.category || 'Other',
          probabilities: market.probabilities || [],
          volume: market.volume || 0,
          isActive: market.isActive !== false,
          endDate: market.endDate,
          createdAt: new Date(market.createdAt || Date.now())
        });
        return await newMarket.save();
      }
    } catch (error) {
      console.error('Error saving market:', error.message);
      return null;
    }
  }

  async savePriceHistory(marketId, probabilities) {
    try {
      if (this.useMemoryStorage) {
        probabilities.forEach(prob => {
          this.memoryStorage.priceHistory.push({
            marketId,
            outcome: prob.outcome,
            price: prob.price,
            timestamp: new Date()
          });
        });
        
        // Keep only last 1000 entries per market
        this.memoryStorage.priceHistory = this.memoryStorage.priceHistory.slice(-1000);
        return probabilities;
      }

      const priceEntries = probabilities.map(prob => ({
        marketId,
        outcome: prob.outcome,
        price: prob.price,
        timestamp: new Date()
      }));
      
      return await PriceHistory.insertMany(priceEntries);
    } catch (error) {
      console.error('Error saving price history:', error.message);
      return [];
    }
  }

  async detectMovements(marketId) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      let priceHistory = [];

      if (this.useMemoryStorage) {
        priceHistory = this.memoryStorage.priceHistory.filter(
          entry => entry.marketId === marketId && entry.timestamp >= oneHourAgo
        );
      } else {
        priceHistory = await PriceHistory.find({
          marketId,
          timestamp: { $gte: oneHourAgo }
        }).sort({ timestamp: 1 });
      }

      const movements = [];
      const outcomeGroups = {};

      priceHistory.forEach(entry => {
        if (!outcomeGroups[entry.outcome]) {
          outcomeGroups[entry.outcome] = [];
        }
        outcomeGroups[entry.outcome].push(entry);
      });

      for (const outcome of Object.keys(outcomeGroups)) {
        const prices = outcomeGroups[outcome];
        if (prices.length >= 2) {
          const oldPrice = prices[0].price;
          const newPrice = prices[prices.length - 1].price;
          const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;

          if (Math.abs(changePercent) >= this.movementThreshold) {
            movements.push({
              marketId,
              outcome,
              changePercent,
              oldPrice,
              newPrice
            });
          }
        }
      }

      return movements;
    } catch (error) {
      console.error('Error detecting movements:', error.message);
      return [];
    }
  }

  async saveMovement(movement) {
    try {
      if (this.useMemoryStorage) {
        const movementData = {
          id: Date.now().toString(),
          marketId: movement.marketId,
          outcome: movement.outcome,
          changePercent: movement.changePercent,
          oldPrice: movement.oldPrice,
          newPrice: movement.newPrice,
          detectedAt: new Date()
        };
        this.memoryStorage.movements.push(movementData);
        
        // Keep only last 100 movements
        if (this.memoryStorage.movements.length > 100) {
          this.memoryStorage.movements = this.memoryStorage.movements.slice(-100);
        }
        
        return movementData;
      }

      const newMovement = new Movement({
        marketId: movement.marketId,
        outcome: movement.outcome,
        changePercent: movement.changePercent,
        oldPrice: movement.oldPrice,
        newPrice: movement.newPrice
      });
      
      return await newMovement.save();
    } catch (error) {
      console.error('Error saving movement:', error.message);
      return null;
    }
  }

  async getSignificantMovements(limit = 50, hours = 24) {
    try {
      const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

      if (this.useMemoryStorage) {
        const recentMovements = this.memoryStorage.movements
          .filter(movement => movement.detectedAt >= timeAgo)
          .map(movement => {
            const market = this.memoryStorage.markets.get(movement.marketId);
            return {
              ...movement,
              market: market || { question: 'Unknown Market', category: 'Other' }
            };
          })
          .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
          .slice(0, limit);

        return recentMovements;
      }
      
      const movements = await Movement.aggregate([
        { $match: { detectedAt: { $gte: timeAgo } } },
        {
          $lookup: {
            from: 'markets',
            localField: 'marketId',
            foreignField: 'marketId',
            as: 'market'
          }
        },
        { $unwind: { path: '$market', preserveNullAndEmptyArrays: true } },
        { $sort: { detectedAt: -1 } },
        { $limit: limit }
      ]);

      return movements;
    } catch (error) {
      console.error('Error getting movements:', error.message);
      return [];
    }
  }

  async getMarketHistory(marketId, hours = 24, outcome = null) {
    try {
      const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

      if (this.useMemoryStorage) {
        return this.memoryStorage.priceHistory
          .filter(entry => {
            const matchesMarket = entry.marketId === marketId;
            const matchesTime = entry.timestamp >= timeAgo;
            const matchesOutcome = !outcome || entry.outcome === outcome;
            return matchesMarket && matchesTime && matchesOutcome;
          })
          .sort((a, b) => a.timestamp - b.timestamp);
      }
      
      let query = { marketId, timestamp: { $gte: timeAgo } };
      if (outcome) {
        query.outcome = outcome;
      }
      
      return await PriceHistory.find(query).sort({ timestamp: 1 });
    } catch (error) {
      console.error('Error getting market history:', error.message);
      return [];
    }
  }

  async getAllMarkets() {
    try {
      if (this.useMemoryStorage) {
        return Array.from(this.memoryStorage.markets.values())
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }

      return await Market.find({ isActive: true }).sort({ updatedAt: -1 });
    } catch (error) {
      console.error('Error getting markets:', error.message);
      return [];
    }
  }

  async getMarketById(marketId) {
    try {
      if (this.useMemoryStorage) {
        return this.memoryStorage.markets.get(marketId) || null;
      }

      return await Market.findOne({ marketId });
    } catch (error) {
      console.error('Error getting market by ID:', error.message);
      return null;
    }
  }

  async getCategories() {
    try {
      if (this.useMemoryStorage) {
        const categories = new Set();
        this.memoryStorage.markets.forEach(market => {
          if (market.category) categories.add(market.category);
        });
        return Array.from(categories).sort();
      }

      const categories = await Market.distinct('category', { isActive: true });
      return categories.filter(Boolean).sort();
    } catch (error) {
      console.error('Error getting categories:', error.message);
      return [];
    }
  }

  async getStats() {
    try {
      if (this.useMemoryStorage) {
        const recentMovements = this.memoryStorage.movements.filter(
          movement => movement.detectedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        return {
          connected: false,
          storage: 'memory',
          markets: this.memoryStorage.markets.size,
          movements: this.memoryStorage.movements.length,
          priceHistory: this.memoryStorage.priceHistory.length,
          recentMovements: recentMovements.length,
          movementThreshold: this.movementThreshold
        };
      }
      
      const marketCount = await Market.countDocuments({ isActive: true });
      const movementCount = await Movement.countDocuments();
      const priceHistoryCount = await PriceHistory.countDocuments();
      
      const recentMovements = await Movement.countDocuments({
        detectedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      return {
        connected: this.isConnected,
        storage: 'mongodb',
        markets: marketCount,
        movements: movementCount,
        priceHistory: priceHistoryCount,
        recentMovements,
        movementThreshold: this.movementThreshold
      };
    } catch (error) {
      console.error('Error getting database stats:', error.message);
      return {
        connected: this.isConnected,
        storage: this.useMemoryStorage ? 'memory' : 'mongodb',
        error: error.message
      };
    }
  }
}

export const dbService = new DatabaseService();
export const connectToDatabase = () => dbService.connect();
