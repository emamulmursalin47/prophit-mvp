export interface Market {
  id: string;
  question: string;
  slug: string;
  probabilities: Probability[];
  volume: number;
  createdAt: string;
  updatedAt: string;
  category: string;
  isActive: boolean;
  endDate?: string;
}

export interface Probability {
  outcome: string;
  price: number;
}

export interface PriceHistory {
  marketId: string;
  outcome: string;
  price: number;
  timestamp: string;
}

export interface Movement {
  id: string;
  marketId: string;
  marketQuestion: string;
  category: string;
  changePercent: number;
  oldPrice: number;
  newPrice: number;
  detectedAt: string;
  outcome?: string;
}

export interface MovementAlert {
  id: string;
  marketId: string;
  market: Market;
  changePercentage: number;
  detectedAt: string;
  previousProbability: number;
  currentProbability: number;
  timeframe: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  total?: number;
  source?: string;
  timeframe?: string;
}

export interface ApiStats {
  polymarket: {
    requestCount: number;
    lastRequestTime: number;
    rateLimitDelay: number;
    minVolume: number;
    apiConfigured: boolean;
  };
  database: {
    connected: boolean;
    storage: string;
    markets: number;
    movements: number;
    priceHistory: number;
    recentMovements: number;
    movementThreshold: number;
  };
  timestamp: string;
}
