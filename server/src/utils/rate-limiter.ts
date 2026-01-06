export class RateLimitManager {
  private lastCallTimes: Map<string, number> = new Map();
  private minDelayMs: Map<string, number> = new Map();

  setRateLimit(key: string, requestsPerSecond: number): void {
    this.minDelayMs.set(key, 1000 / requestsPerSecond);
  }

  async wait(key: string, requestsPerSecond?: number): Promise<void> {
    if (requestsPerSecond) {
      this.setRateLimit(key, requestsPerSecond);
    }

    const delayMs = this.minDelayMs.get(key) || 1000;
    const lastCall = this.lastCallTimes.get(key) || 0;
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < delayMs) {
      await new Promise(resolve => setTimeout(resolve, delayMs - timeSinceLastCall));
    }

    this.lastCallTimes.set(key, Date.now());
  }
}

