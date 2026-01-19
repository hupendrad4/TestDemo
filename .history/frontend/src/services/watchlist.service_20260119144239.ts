import apiService from './api.service';

export interface WatchlistEntry {
  id: string;
  userId: string;
  entityType: 'TEST_CASE' | 'TEST_SUITE' | 'REQUIREMENT' | 'DEFECT' | 'TEST_PLAN' | 'TEST_RUN';
  entityId: string;
  createdAt: string;
  entity?: any; // Populated entity data
}

class WatchlistService {
  async getWatchlist(entityType?: string): Promise<WatchlistEntry[]> {
    const params = entityType ? `?entityType=${entityType}` : '';
    const response = await apiService.get(`/watchlist${params}`);
    return response.data;
  }

  async addToWatchlist(entityType: string, entityId: string): Promise<WatchlistEntry> {
    const response = await apiService.post('/watchlist', { entityType, entityId });
    return response.data;
  }

  async removeFromWatchlist(id: string): Promise<void> {
    await apiService.delete(`/watchlist/${id}`);
  }

  async isWatching(entityType: string, entityId: string): Promise<boolean> {
    const response = await apiService.get(`/watchlist/check?entityType=${entityType}&entityId=${entityId}`);
    return response.data.isWatching;
  }
}

export default new WatchlistService();
