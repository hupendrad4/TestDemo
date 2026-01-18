import apiService from './api.service';

class ReportService {
  async getDashboard(projectId: string): Promise<any> {
    return apiService.get(`/reports/projects/${projectId}/dashboard`);
  }

  async getCoverage(projectId: string): Promise<any> {
    return apiService.get(`/reports/projects/${projectId}/coverage`);
  }

  async getExecutionReport(cycleId: string): Promise<any> {
    return apiService.get(`/reports/cycles/${cycleId}/execution`);
  }

  async getUserActivity(projectId: string): Promise<any> {
    return apiService.get(`/reports/projects/${projectId}/user-activity`);
  }
}

export default new ReportService();
