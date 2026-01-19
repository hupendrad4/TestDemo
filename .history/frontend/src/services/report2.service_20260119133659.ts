import api from './api.service';

export interface ReportWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'trend';
  title: string;
  dataSource: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  projectId: string;
  widgets: ReportWidget[];
  isTemplate: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ScheduledReport {
  id: string;
  reportId: string;
  name: string;
  schedule: string; // cron expression
  recipients: string[];
  format: 'PDF' | 'EXCEL' | 'HTML';
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface ReportData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

export interface ExecutionTrend {
  date: string;
  passed: number;
  failed: number;
  blocked: number;
  total: number;
}

export interface DefectTrend {
  date: string;
  new: number;
  resolved: number;
  open: number;
}

export interface CoverageReport {
  requirements: {
    total: number;
    covered: number;
    coveragePercentage: number;
  };
  testCases: {
    total: number;
    automated: number;
    manual: number;
  };
  execution: {
    total: number;
    executed: number;
    passed: number;
    failed: number;
  };
}

class ReportService {
  // Custom Reports
  async getCustomReports(projectId: string): Promise<CustomReport[]> {
    const response = await api.get('/reports/custom', { params: { projectId } });
    return response.data;
  }

  async createCustomReport(report: Omit<CustomReport, 'id' | 'createdAt' | 'createdBy'>): Promise<CustomReport> {
    const response = await api.post('/reports/custom', report);
    return response.data;
  }

  async updateCustomReport(reportId: string, updates: Partial<CustomReport>): Promise<CustomReport> {
    const response = await api.patch(`/reports/custom/${reportId}`, updates);
    return response.data;
  }

  async deleteCustomReport(reportId: string): Promise<void> {
    await api.delete(`/reports/custom/${reportId}`);
  }

  // Report Templates
  async getReportTemplates(): Promise<CustomReport[]> {
    const response = await api.get('/reports/templates');
    return response.data;
  }

  // Scheduled Reports
  async getScheduledReports(projectId: string): Promise<ScheduledReport[]> {
    const response = await api.get('/reports/scheduled', { params: { projectId } });
    return response.data;
  }

  async createScheduledReport(schedule: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> {
    const response = await api.post('/reports/scheduled', schedule);
    return response.data;
  }

  async updateScheduledReport(scheduleId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    const response = await api.patch(`/reports/scheduled/${scheduleId}`, updates);
    return response.data;
  }

  async deleteScheduledReport(scheduleId: string): Promise<void> {
    await api.delete(`/reports/scheduled/${scheduleId}`);
  }

  // Report Data
  async getExecutionTrend(projectId: string, days: number = 30): Promise<ExecutionTrend[]> {
    const response = await api.get('/reports/execution-trend', {
      params: { projectId, days },
    });
    return response.data;
  }

  async getDefectTrend(projectId: string, days: number = 30): Promise<DefectTrend[]> {
    const response = await api.get('/reports/defect-trend', {
      params: { projectId, days },
    });
    return response.data;
  }

  async getCoverageReport(projectId: string): Promise<CoverageReport> {
    const response = await api.get('/reports/coverage', {
      params: { projectId },
    });
    return response.data;
  }

  async getTestCaseDistribution(projectId: string): Promise<ReportData> {
    const response = await api.get('/reports/test-case-distribution', {
      params: { projectId },
    });
    return response.data;
  }

  async getDefectSeverityDistribution(projectId: string): Promise<ReportData> {
    const response = await api.get('/reports/defect-severity', {
      params: { projectId },
    });
    return response.data;
  }

  // Export
  async exportToPDF(reportId: string): Promise<Blob> {
    const response = await api.get(`/reports/${reportId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportToExcel(reportId: string): Promise<Blob> {
    const response = await api.get(`/reports/${reportId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new ReportService();
