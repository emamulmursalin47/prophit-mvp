import cron from 'node-cron';
import { polymarketService } from './polymarketService.js';

class PollingService {
  constructor() {
    this.isRunning = false;
    this.intervalMinutes = parseInt(process.env.POLLING_INTERVAL_MINUTES) || 2;
    this.cronExpression = `*/${this.intervalMinutes} * * * *`;
    this.task = null;
    this.lastRun = null;
    this.runCount = 0;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Polling service already running');
      return;
    }

    console.log(`🔄 Starting polling service (every ${this.intervalMinutes} minutes)`);
    
    this.task = cron.schedule(this.cronExpression, async () => {
      await this.runPollingCycle();
    }, {
      scheduled: false
    });

    this.task.start();
    this.isRunning = true;

    // Run immediately on start
    setTimeout(() => this.runPollingCycle(), 1000);
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.isRunning = false;
    console.log('⏹️  Polling service stopped');
  }

  async runPollingCycle() {
    try {
      console.log(`🔄 Running polling cycle #${this.runCount + 1}`);
      this.lastRun = new Date();
      
      const result = await polymarketService.processMarkets();
      this.runCount++;
      
      console.log(`✅ Polling cycle completed: ${result.markets} markets, ${result.movements} movements`);
      
    } catch (error) {
      console.error('❌ Polling cycle failed:', error.message);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      cronExpression: this.cronExpression,
      lastRun: this.lastRun,
      runCount: this.runCount,
      nextRun: this.task ? this.getNextRunTime() : null
    };
  }

  getNextRunTime() {
    if (!this.lastRun) return 'Soon';
    
    const nextRun = new Date(this.lastRun.getTime() + (this.intervalMinutes * 60 * 1000));
    return nextRun.toISOString();
  }
}

export const pollingService = new PollingService();
export const startPolling = () => {
  pollingService.start();
  return pollingService;
};
