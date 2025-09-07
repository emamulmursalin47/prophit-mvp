/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios';
import { Market, Movement, PriceHistory } from '../types/market';
//@ts-ignore
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://prophitserver.vercel.app/api' 
  : 'http://localhost:5000/api';

class ApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased to 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async getMarkets(params?: { limit?: number; category?: string }): Promise<Market[]> {
    try {
      const response = await this.axiosInstance.get('/markets', { params });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      return [];
    }
  }

  async getAllMarkets(params?: { limit?: number; category?: string }): Promise<Market[]> {
    return this.getMarkets(params);
  }

  async getMarketById(id: string): Promise<Market | null> {
    try {
      const response = await this.axiosInstance.get(`/markets/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error(`Failed to fetch market ${id}:`, error);
      return null;
    }
  }

  async getSignificantMovements(params?: { limit?: number; hours?: number }): Promise<Movement[]> {
    try {
      const response = await this.axiosInstance.get('/markets/movements', { params });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to fetch movements:', error);
      return [];
    }
  }

  async getMarketHistory(
    marketId: string, 
    params?: { hours?: number; outcome?: string }
  ): Promise<PriceHistory[]> {
    try {
      const response = await this.axiosInstance.get(`/markets/${marketId}/history`, { params });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error(`Failed to fetch history for market ${marketId}:`, error);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/markets/categories');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  async getApiStats(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/markets/stats');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch API stats:', error);
      return null;
    }
  }

  async getHealthStatus(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      return null;
    }
  }
}

export const apiService = new ApiService();
