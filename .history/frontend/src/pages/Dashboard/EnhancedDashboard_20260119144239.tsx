import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  CheckCircle,
  Cancel,
  Warning,
  Block,
  Assignment,
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import dashboardService from '../../services/dashboard.service';
import { RootState } from '../../store';
import { formatDistanceToNow } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardData {
  testCases: {
    total: number;
    approved: number;
    draft: number;
    deprecated: number;
    automationPercentage: number;
  };
  execution: {
    totalRuns: number;
    passed: number;
    failed: number;
    blocked: number;
    passRate: number;
    distribution: { status: string; count: number }[];
  };
  requirements: {
    total: number;
    covered: number;
    coveragePercentage: number;
  };
  recentRuns: Array<{
    id: string;
    name: string;
    status: string;
    passRate: number;
    executedAt: string;
  }>;
  trends: Array<{
    date: string;
    passed: number;
    failed: number;
    blocked: number;
  }>;
  risks: {
    highPriorityFailures: number;
    uncoveredRequirements: number;
    failingBuilds: number;
    blockedTests: number;
  };
}

const EnhancedDashboard: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentProject?.id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getWorkspaceDashboard(currentProject.id);
        setDashboardData(data as any);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentProject?.id]);

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view the dashboard.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No dashboard data available.</Alert>
      </Box>
    );
  }

  // Execution distribution chart data
  const executionChartData = {
    labels: ['Passed', 'Failed', 'Blocked'],
    datasets: [
      {
        data: [
          dashboardData.execution.passed,
          dashboardData.execution.failed,
          dashboardData.execution.blocked,
        ],
        backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
        borderColor: ['#4caf50', '#f44336', '#ff9800'],
        borderWidth: 1,
      },
    ],
  };

  const executionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Trends chart data
  const trendsChartData = {
    labels: dashboardData.trends.map((t) => t.date),
    datasets: [
      {
        label: 'Passed',
        data: dashboardData.trends.map((t) => t.passed),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Failed',
        data: dashboardData.trends.map((t) => t.failed),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Blocked',
        data: dashboardData.trends.map((t) => t.blocked),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const trendsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PASSED':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'FAILED':
        return <Cancel sx={{ color: '#f44336' }} />;
      case 'BLOCKED':
        return <Block sx={{ color: '#ff9800' }} />;
      default:
        return <Warning sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status.toUpperCase()) {
      case 'PASSED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'BLOCKED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Project Dashboard - {currentProject.name}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        {/* Test Cases Summary */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ color: '#1976d2', mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Test Cases
                </Typography>
              </Box>
              <Typography variant="h3">{dashboardData.testCases.total}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Approved: {dashboardData.testCases.approved}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Draft: {dashboardData.testCases.draft}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Automation: {dashboardData.testCases.automationPercentage.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Summary */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ color: '#4caf50', mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Executions
                </Typography>
              </Box>
              <Typography variant="h3">{dashboardData.execution.totalRuns}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Pass Rate: {dashboardData.execution.passRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: '#4caf50' }}>
                  Passed: {dashboardData.execution.passed}
                </Typography>
                <Typography variant="body2" sx={{ color: '#f44336' }}>
                  Failed: {dashboardData.execution.failed}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Requirements Coverage */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ color: '#9c27b0', mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Requirements
                </Typography>
              </Box>
              <Typography variant="h3">{dashboardData.requirements.total}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Coverage: {dashboardData.requirements.coveragePercentage.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.requirements.coveragePercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Covered: {dashboardData.requirements.covered} / {dashboardData.requirements.total}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: '#f44336', mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Risks
                </Typography>
              </Box>
              <Typography variant="h3">{dashboardData.risks.highPriorityFailures}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  High Priority Failures
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Uncovered Reqs: {dashboardData.risks.uncoveredRequirements}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Blocked Tests: {dashboardData.risks.blockedTests}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Execution Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Execution Distribution
            </Typography>
            <Box sx={{ height: 320 }}>
              <Doughnut data={executionChartData} options={executionChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Execution Trends */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Execution Trends (Last 30 Days)
            </Typography>
            <Box sx={{ height: 320 }}>
              <Line data={trendsChartData} options={trendsChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Test Runs */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Test Runs
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Run Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Pass Rate</TableCell>
                    <TableCell>Executed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.recentRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent test runs
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboardData.recentRuns.map((run) => (
                      <TableRow key={run.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(run.status)}
                            {run.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={run.status}
                            color={getStatusColor(run.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            {run.passRate >= 80 ? (
                              <TrendingUp sx={{ color: '#4caf50', fontSize: 20 }} />
                            ) : (
                              <TrendingDown sx={{ color: '#f44336', fontSize: 20 }} />
                            )}
                            {run.passRate.toFixed(1)}%
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(run.executedAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboard;
