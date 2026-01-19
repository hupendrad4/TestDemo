import apiService from './api.service';

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  viewType: 'TEST_CASES' | 'REQUIREMENTS' | 'DEFECTS' | 'TEST_PLANS' | 'EXECUTIONS';
  filterConfig: any;
  isDefault: boolean;
  isShared: boolean;
  userId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

class SavedViewService {
  async getSavedViews(projectId: string, viewType: string): Promise<SavedView[]> {
    const response = await apiService.get(`/saved-views?projectId=${projectId}&viewType=${viewType}`);
    return response.data;
  }

  async getSavedViewById(id: string): Promise<SavedView> {
    const response = await apiService.get(`/saved-views/${id}`);
    return response.data;
  }

  async createSavedView(data: {
    name: string;
    description?: string;
    viewType: string;
    filterConfig: any;
    isDefault?: boolean;
    isShared?: boolean;
    projectId: string;
  }): Promise<SavedView> {
    const response = await apiService.post('/saved-views', data);
    return response.data;
  }

  async updateSavedView(id: string, data: {
    name?: string;
    description?: string;
    filterConfig?: any;
    isDefault?: boolean;
    isShared?: boolean;
  }): Promise<SavedView> {
    const response = await apiService.put(`/saved-views/${id}`, data);
    return response.data;
  }

  async deleteSavedView(id: string): Promise<void> {
    await apiService.delete(`/saved-views/${id}`);
  }
}

export default new SavedViewService();
