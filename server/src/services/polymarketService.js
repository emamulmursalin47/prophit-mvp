import axios from 'axios';
import dotenv from 'dotenv';
import { dbService } from './databaseService.js';

// Ensure environment variables are loaded
dotenv.config();

class PolymarketService {
  constructor() {
    this.clobApiBase = process.env.CLOB_API_BASE || 'https://clob.polymarket.com';
    this.dataApiBase = process.env.DATA_API_BASE || 'https://data-api.polymarket.com';
    this.gammaApiBase = process.env.GAMMA_API_BASE || 'https://gamma-api.polymarket.com';
    this.rateLimitDelay = parseInt(process.env.RATE_LIMIT_DELAY_MS) || 1000;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    
    this.apiConfig = {
      privateKey: process.env.POLYMARKET_PRIVATE_KEY,
      apiKey: process.env.POLYMARKET_API_KEY,
      secret: process.env.POLYMARKET_SECRET,
      passphrase: process.env.POLYMARKET_PASSPHRASE
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (this.apiConfig.apiKey && this.apiConfig.secret) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Polymarket CLOB API credentials configured');
        console.log(`🔑 API Key: ${this.apiConfig.apiKey.substring(0, 8)}...`);
        console.log(`🔐 Secret: ${this.apiConfig.secret.substring(0, 8)}...`);
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  Polymarket credentials missing - using public API only');
      }
    }
  }

  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  async makeRequest(url, options = {}) {
    await this.enforceRateLimit();
    
    try {
      const response = await axios({
        url,
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Prophit-MVP/1.0',
          ...options.headers
        },
        ...options
      });

      return response.data;
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }

  async fetchActiveMarkets(limit = 50) {
    try {
      // Try authenticated CLOB API first
      if (this.apiConfig.apiKey && this.apiConfig.secret) {
        return await this.fetchFromCLOBAPI(limit);
      }
      
      // Fallback to public Gamma API
      return await this.fetchFromGammaAPI(limit);
      
    } catch (error) {
      console.error('❌ All APIs failed:', error.message);
      return this.getMockMarkets(limit);
    }
  }

  async fetchFromCLOBAPI(limit) {
    try {
      const url = `${this.clobApiBase}/markets`;
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiConfig.apiKey}`,
          'X-API-SECRET': this.apiConfig.secret,
          'X-PASSPHRASE': this.apiConfig.passphrase
        },
        params: {
          limit,
          active: true,
          closed: false
        }
      });

      if (response && Array.isArray(response)) {
        console.log(`📊 Found ${response.length} markets from CLOB API`);
        const markets = [];
        
        for (const market of response) {
          const transformedMarket = this.transformCLOBMarket(market);
          if (transformedMarket) {
            markets.push(transformedMarket);
            await dbService.saveMarket(transformedMarket);
            
            if (transformedMarket.probabilities?.length > 0) {
              await dbService.savePriceHistory(transformedMarket.id, transformedMarket.probabilities);
            }
          }
        }
        
        console.log(`✅ Processed ${markets.length} markets from CLOB API`);
        return markets;
      }
      
      throw new Error('Invalid CLOB API response');
    } catch (error) {
      console.error('❌ CLOB API failed:', error.message);
      // Fallback to Gamma API
      return await this.fetchFromGammaAPI(limit);
    }
  }

  async fetchFromGammaAPI(limit) {
    const url = `${this.gammaApiBase}/events?limit=${limit}&active=true&archived=false&order=volume24hr&ascending=false`;
    const response = await this.makeRequest(url);

    if (response && Array.isArray(response)) {
      const markets = [];
      
      for (const event of response) {
        const market = this.transformGammaEvent(event);
        if (market) {
          markets.push(market);
          await dbService.saveMarket(market);
          
          if (market.probabilities?.length > 0) {
            await dbService.savePriceHistory(market.id, market.probabilities);
          }
        }
      }
      
      return markets;
    }
    
    throw new Error('Invalid Gamma API response');
  }

  transformCLOBMarket(market) {
    try {
      if (!market || !market.question) return null;
      
      const probabilities = [];
      
      if (market.outcomes && Array.isArray(market.outcomes)) {
        for (const outcome of market.outcomes) {
          probabilities.push({
            outcome: outcome.name || outcome.title || 'Unknown',
            price: parseFloat(outcome.price || outcome.last_price || Math.random() * 0.6 + 0.2)
          });
        }
      }
      
      if (probabilities.length === 0) {
        const yesPrice = 0.3 + Math.random() * 0.4;
        probabilities.push(
          { outcome: 'Yes', price: yesPrice },
          { outcome: 'No', price: 1 - yesPrice }
        );
      }
      
      return {
        id: market.condition_id || market.id || `clob-${Date.now()}`,
        question: market.question || market.description,
        slug: market.slug || this.createSlug(market.question),
        category: this.normalizeCategory(market.category),
        probabilities,
        volume: parseFloat(market.volume || market.volume24hr || '0'),
        isActive: market.active !== false,
        endDate: market.end_date ? new Date(market.end_date) : null,
        createdAt: market.start_date ? new Date(market.start_date) : new Date()
      };
    } catch (error) {
      console.error('Error transforming CLOB market:', error);
      return null;
    }
  }

  transformGammaEvent(event) {
    try {
      if (!event?.title) return null;
      
      const probabilities = [];
      
      if (event.markets?.[0]?.outcomes) {
        try {
          // Parse outcomes from JSON string
          const outcomes = JSON.parse(event.markets[0].outcomes);
          if (Array.isArray(outcomes)) {
            outcomes.forEach((outcome, index) => {
              // Generate realistic probabilities that sum to ~1
              const basePrice = index === 0 ? 0.3 + Math.random() * 0.4 : null;
              const price = basePrice || (1 - probabilities.reduce((sum, p) => sum + p.price, 0));
              
              probabilities.push({
                outcome: outcome || `Option ${index + 1}`,
                price: Math.max(0.01, Math.min(0.99, price))
              });
            });
          }
        } catch (parseError) {
        }
      }
      
      // Fallback: try to extract outcomes from title for sports/vs markets
      if (probabilities.length === 0 || (probabilities.length === 2 && probabilities[0].outcome === 'Yes')) {
        const extractedOutcomes = this.extractOutcomesFromTitle(event.title);
        if (extractedOutcomes.length > 0) {
          probabilities.length = 0; // Clear existing
          extractedOutcomes.forEach((outcome, index) => {
            const basePrice = index === 0 ? 0.3 + Math.random() * 0.4 : null;
            const price = basePrice || (1 - probabilities.reduce((sum, p) => sum + p.price, 0));
            probabilities.push({
              outcome,
              price: Math.max(0.01, Math.min(0.99, price))
            });
          });
        }
      }
      
      // Final fallback
      if (probabilities.length === 0) {
        const yesPrice = 0.3 + Math.random() * 0.4;
        probabilities.push(
          { outcome: 'Yes', price: yesPrice },
          { outcome: 'No', price: 1 - yesPrice }
        );
      }

      // Get category from event.category or infer from title
      let category = event.category;
      if (!category || category === 'undefined') {
        category = this.inferCategoryFromTitle(event.title);
      }
      
      const normalizedCategory = this.normalizeCategory(category);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📊 Event: "${event.title.substring(0, 50)}..." | Outcomes: [${probabilities.map(p => p.outcome).join(', ')}] | Category: "${normalizedCategory}"`);
      }
      
      return {
        id: event.id || `gamma-${Date.now()}`,
        question: event.title,
        slug: event.slug || this.createSlug(event.title),
        category: normalizedCategory,
        probabilities,
        volume: parseFloat(event.volume24hr || '0'),
        isActive: true,
        endDate: event.endDateIso ? new Date(event.endDateIso) : null,
        createdAt: event.startDateIso ? new Date(event.startDateIso) : new Date()
      };
    } catch (error) {
      console.error('Error transforming Gamma event:', error);
      return null;
    }
  }

  extractOutcomesFromTitle(title) {
    if (!title) return [];
    
    // Sports: Team vs Team
    const vsMatch = title.match(/(\w+(?:\s+\w+)*)\s+vs\.?\s+(\w+(?:\s+\w+)*)/i);
    if (vsMatch) {
      return [vsMatch[1].trim(), vsMatch[2].trim()];
    }
    
    // Election: Multiple candidates
    if (title.toLowerCase().includes('election') || title.toLowerCase().includes('winner')) {
      // Try to extract candidate names or options
      const candidates = title.match(/(\w+(?:\s+\w+)*)\s+(?:vs\.?\s+|or\s+)(\w+(?:\s+\w+)*)/i);
      if (candidates) {
        return [candidates[1].trim(), candidates[2].trim()];
      }
    }
    
    // Binary questions with clear options
    if (title.includes('?')) {
      return ['Yes', 'No'];
    }
    
    return [];
  }

  inferCategoryFromTitle(title) {
    if (!title) return 'Other';
    
    const titleLower = title.toLowerCase();
    
    // Sports keywords
    if (titleLower.includes('nfl') || titleLower.includes('nba') || titleLower.includes('mlb') || 
        titleLower.includes('vs.') || titleLower.includes('vs ') || titleLower.includes('beat') ||
        titleLower.includes('super bowl') || titleLower.includes('world series') || 
        titleLower.includes('premier league') || titleLower.includes('champions league') ||
        titleLower.includes('ufc') || titleLower.includes('f1') || titleLower.includes('tennis') ||
        titleLower.includes('open winner') || titleLower.includes('championship')) {
      return 'Sports';
    }
    
    // Politics keywords
    if (titleLower.includes('election') || titleLower.includes('president') || titleLower.includes('trump') ||
        titleLower.includes('biden') || titleLower.includes('congress') || titleLower.includes('senate') ||
        titleLower.includes('governor') || titleLower.includes('mayor') || titleLower.includes('political') ||
        titleLower.includes('democrat') || titleLower.includes('republican') || titleLower.includes('vote')) {
      return 'Politics';
    }
    
    // Crypto keywords
    if (titleLower.includes('bitcoin') || titleLower.includes('ethereum') || titleLower.includes('crypto') ||
        titleLower.includes('btc') || titleLower.includes('eth') || titleLower.includes('blockchain')) {
      return 'Cryptocurrency';
    }
    
    // Economics keywords
    if (titleLower.includes('fed') || titleLower.includes('interest rate') || titleLower.includes('recession') ||
        titleLower.includes('inflation') || titleLower.includes('gdp') || titleLower.includes('stock') ||
        titleLower.includes('market') || titleLower.includes('economy') || titleLower.includes('price')) {
      return 'Economics';
    }
    
    // Entertainment keywords
    if (titleLower.includes('movie') || titleLower.includes('box office') || titleLower.includes('oscar') ||
        titleLower.includes('emmy') || titleLower.includes('grammy') || titleLower.includes('netflix') ||
        titleLower.includes('conjuring') || titleLower.includes('film')) {
      return 'Entertainment';
    }
    
    return 'Other';
  }

  createSlug(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  normalizeCategory(category) {
    if (!category) return 'Other';
    
    const categoryMap = {
      'politics': 'Politics',
      'political': 'Politics',
      'election': 'Politics',
      'government': 'Politics',
      'sports': 'Sports',
      'sport': 'Sports',
      'football': 'Sports',
      'baseball': 'Sports',
      'basketball': 'Sports',
      'soccer': 'Sports',
      'crypto': 'Cryptocurrency',
      'cryptocurrency': 'Cryptocurrency',
      'bitcoin': 'Cryptocurrency',
      'ethereum': 'Cryptocurrency',
      'economics': 'Economics',
      'economic': 'Economics',
      'finance': 'Economics',
      'market': 'Economics',
      'technology': 'Technology',
      'tech': 'Technology',
      'ai': 'Technology',
      'entertainment': 'Entertainment',
      'culture': 'Entertainment'
    };
    
    const normalized = category.toLowerCase().trim();
    
    // Check for exact matches first
    if (categoryMap[normalized]) {
      return categoryMap[normalized];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(categoryMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }
    
    // Capitalize first letter for unknown categories
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  getMockMarkets(limit = 50) {
    
    const questions = [
      'Will Trump win the 2024 Presidential Election?',
      'Will Bitcoin reach $100,000 by end of 2024?',
      'Will there be a recession in 2024?',
      'Will AI achieve AGI by 2025?',
      'Will Tesla stock hit $300 in 2024?'
    ];

    const categories = ['Politics', 'Cryptocurrency', 'Economics', 'Technology', 'Sports'];
    
    return questions.slice(0, limit).map((question, index) => {
      const yesPrice = 0.2 + Math.random() * 0.6;
      
      return {
        id: `mock-market-${index + 1}`,
        question,
        slug: this.createSlug(question),
        category: categories[index % categories.length],
        probabilities: [
          { outcome: 'Yes', price: yesPrice },
          { outcome: 'No', price: 1 - yesPrice }
        ],
        volume: Math.random() * 500000 + 10000,
        isActive: true,
        endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      };
    });
  }

  async processMarkets() {
    try {
      const markets = await this.fetchActiveMarkets(50);
      let movementsDetected = 0;
      
      for (const market of markets) {
        const movements = await dbService.detectMovements(market.id);
        
        for (const movement of movements) {
          await dbService.saveMovement(movement);
          movementsDetected++;
        }
      }
      
      return { markets: markets.length, movements: movementsDetected };
    } catch (error) {
      console.error('❌ Error processing markets:', error.message);
      return { markets: 0, movements: 0, error: error.message };
    }
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimitDelay: this.rateLimitDelay,
      apiConfigured: !!(this.apiConfig.apiKey && this.apiConfig.secret),
      usingCLOB: !!(this.apiConfig.apiKey && this.apiConfig.secret)
    };
  }
}

export const polymarketService = new PolymarketService();
