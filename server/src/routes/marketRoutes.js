import express from 'express';
import { 
  getActiveMarkets, 
  getMarketById, 
  getSignificantMovements, 
  getMarketHistory,
  getApiStats,
  getCategories
} from '../controllers/marketController.js';

const router = express.Router();

// Market routes
router.get('/', getActiveMarkets);
router.get('/movements', getSignificantMovements);
router.get('/categories', getCategories);
router.get('/stats', getApiStats);
router.get('/:id', getMarketById);
router.get('/:id/history', getMarketHistory);

export default router;
