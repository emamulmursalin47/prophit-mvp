import { polymarketService } from '../services/polymarketService.js';
import { dbService } from '../services/databaseService.js';

export const getActiveMarkets = async (req, res) => {
  try {
    const { limit = 50, category } = req.query;
    let markets = await dbService.getAllMarkets();
    
    // Filter by category if specified
    if (category && category !== 'all') {
      markets = markets.filter(m => m.category === category);
    }
    
    if (markets.length === 0) {
      // If no markets in DB, fetch from API
      const apiMarkets = await polymarketService.fetchActiveMarkets(parseInt(limit));
      res.json({ success: true, data: apiMarkets, source: 'api' });
    } else {
      res.json({ 
        success: true, 
        data: markets.slice(0, parseInt(limit)),
        source: 'database',
        total: markets.length
      });
    }
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMarketById = async (req, res) => {
  try {
    const { id } = req.params;
    const market = await dbService.getMarketById(id);
    
    if (market) {
      res.json({ success: true, data: market });
    } else {
      res.status(404).json({ success: false, error: 'Market not found' });
    }
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSignificantMovements = async (req, res) => {
  try {
    const { limit = 50, hours = 24 } = req.query;
    const movements = await dbService.getSignificantMovements(parseInt(limit), parseInt(hours));
    
    const formattedMovements = movements
      .filter(movement => {
        // Filter out generic Yes/No outcomes for sports and specific markets
        const question = movement.market?.question || '';
        const outcome = movement.outcome || '';
        
        // Keep Yes/No for genuinely binary questions
        if (outcome === 'Yes' || outcome === 'No') {
          // Keep if it's a genuine binary question (contains ?, will, reach, etc.)
          const isBinaryQuestion = question.includes('?') || 
                                 question.toLowerCase().includes('will') ||
                                 question.toLowerCase().includes('reach') ||
                                 question.toLowerCase().includes('hit') ||
                                 question.toLowerCase().includes('election') ||
                                 question.toLowerCase().includes('winner');
          
          // Skip if it's a vs/sports match that should have team names
          const isSportsMatch = question.includes(' vs ') || question.includes(' vs. ');
          
          return isBinaryQuestion && !isSportsMatch;
        }
        
        // Keep all non-Yes/No outcomes (team names, candidates, etc.)
        return true;
      })
      .map(movement => ({
        id: movement._id || movement.id,
        marketId: movement.marketId,
        marketQuestion: movement.market?.question || 'Unknown Market',
        category: movement.market?.category || 'Other',
        changePercent: movement.changePercent,
        oldPrice: movement.oldPrice,
        newPrice: movement.newPrice,
        detectedAt: movement.detectedAt,
        outcome: movement.outcome
      }))
      .slice(0, parseInt(limit));
    
    res.json({ 
      success: true, 
      data: formattedMovements,
      total: formattedMovements.length,
      timeframe: `${hours}h`
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMarketHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24, outcome } = req.query;
    
    const history = await dbService.getMarketHistory(id, parseInt(hours), outcome);
    
    const formattedHistory = history.map(entry => ({
      marketId: entry.marketId,
      outcome: entry.outcome,
      price: entry.price,
      timestamp: entry.timestamp
    }));
    
    res.json({ 
      success: true, 
      data: formattedHistory,
      marketId: id,
      timeframe: `${hours}h`
    });
  } catch (error) {
    console.error('Error fetching market history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getApiStats = async (req, res) => {
  try {
    const stats = polymarketService.getStats();
    const dbStats = await dbService.getStats();
    
    res.json({
      success: true,
      data: {
        polymarket: stats,
        database: dbStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching API stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await dbService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
