import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  Assessment,
  PlaylistAddCheck,
  BugReport,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Warning,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { RootState } from '../../store';
import reportService from '../../services/report.service';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  totalTestCases: number;
  totalExecutions: number;
  openDefects: number;
  passedTests: number;
  failedTests: number;
  blockedTests: number;
  passRate: number;
  testCoverage: number;
  automationRate: number;
}

const Dashboard: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTestCases: 0,
    totalExecutions: 0,
    openDefects: 0,
    passedTests: 0,
    failedTests: 0,
    blockedTests: 0,
    passRate: 0,
    testCoverage: 0,
    automationRate: 0,
  });
  const [recentExecutions, setRecentExecutions] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportService.getDashboard(currentProject!.id);
      const data = response.data || response;
      
      // Extract stats from backend response structure
      const testCases = data.testCasesSummary || {};
      const executions = data.executionSummary || {};
      const coverage = data.requirementCoverage || {};
      const recentRuns = data.recentTestRuns || [];
      
      setStats({
        totalTestCases: testCases.total || 0,
        totalExecutions: executions.total || 0,
        openDefects: 0, // Will be populated when defect stats are available
        passedTests: executions.passed || 0,
        failedTests: executions.failed || 0,
        blockedTests: executions.blocked || 0,
        passRate: executions.passRate || 0,
        testCoverage: coverage.coveragePercentage || 0,
        automationRate: parseFloat(testCases.automationPercentage || '0'),
      });
      
      // Map recent test runs to table format
      setRecentExecutions(recentRuns.map((run: any) => ({
        id: run.id,
        name: run.testPlan?.name || 'N/A',
        status: run.status || 'NOT_RUN',
        executor: run.assignedTo ? `${run.assignedTo.firstName} ${run.assignedTo.lastName}` : 'Unassigned',
        time: new Date(run.createdAt).toLocaleString(),
      })));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentProject?.id) {
      loadDashboardData();
    }
  }, [currentProject?.id, loadDashboardData]);

  const statCards = [
    { 
      title: 'Total Test Cases', 
      value: stats.totalTestCases.toString(), 
      icon: <Assessment />, 
      color: '#1976d2',
      trend: '+12%',
      trendUp: true,
    },
    { 
      title: 'Test Executions', 
      value: stats.totalExecutions.toString(), 
      icon: <PlaylistAddCheck />, 
      color: '#2e7d32',
      trend: '+8%',
      trendUp: true,
    },
    { 
      title: 'Open Defects', 
      value: stats.openDefects.toString(), 
      icon: <BugReport />, 
      color: '#d32f2f',
      trend: '-5%',
      trendUp: false,
    },
    { 
      title: 'Pass Rate', 
      value: `${stats.passRate}%`, 
      icon: <CheckCircle />, 
      color: '#ed6c02',
      trend: '+3%',
      trendUp: true,
    },
  ];

  // Execution Trend Chart Data (Line Chart)
  const executionTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Passed',
        data: [45, 52, 48, 61, 55, 58, 65],
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Failed',
        data: [12, 15, 10, 18, 14, 11, 16],
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Blocked',
        data: [3, 4, 2, 5, 3, 2, 4],
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Test Status Distribution (Pie Chart)
  const statusDistributionData = {
    labels: ['Passed', 'Failed', 'Blocked', 'Not Run'],
    datasets: [
      {
        data: [stats.passedTests, stats.failedTests, stats.blockedTests, stats.totalTestCases - stats.passedTests - stats.failedTests - stats.blockedTests],
        backgroundColor: ['#2e7d32', '#d32f2f', '#ff9800', '#9e9e9e'],
        borderColor: ['#fff', '#fff', '#fff', '#fff'],
        borderWidth: 2,
      },
    ],
  };

  // Defect Status Chart (Doughnut)
  const defectStatusData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [5, 8, 6, 4],
        backgroundColor: ['#d32f2f', '#f57c00', '#fbc02d', '#388e3c'],
        borderColor: ['#fff', '#fff', '#fff', '#fff'],
        borderWidth: 2,
      },
    ],
  };

  // Test Coverage by Module (Bar Chart)
  const moduleCoverageData = {
    labels: ['Authentication', 'Dashboard', 'Reports', 'Settings', 'API'],
    datasets: [
      {
        label: 'Coverage %',
        data: [92, 85, 78, 88, 81],
        backgroundColor: '#1976d2',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PASSED': return 'success';
      case 'FAILED': return 'error';
      case 'BLOCKED': return 'warning';
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      default: return 'default';
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please select a project to view dashboard</Alert>
      </Box>
    );
  }

  const hasData = stats.totalTestCases > 0 || stats.totalExecutions > 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Dashboard
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {!loading && !hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No test data available yet. Start by creating test cases and running executions to see analytics.
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ color: stat.color, fontSize: 40 }}>{stat.icon}</Box>
                  <Chip 
                    icon={stat.trendUp ? <TrendingUp /> : <TrendingDown />}
                    label={stat.trend}
                    size="small"
                    color={stat.trendUp ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Execution Trends (Last 7 Days)
            </Typography>
            <Box sx={{ height: 320 }}>
              <Line data={executionTrendData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Test Status Distribution
            </Typography>
            <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pie data={statusDistributionData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Defect Severity
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={defectStatusData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Test Coverage by Module
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={moduleCoverageData} 
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quality Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Test Coverage
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.testCoverage}%
                </Typography>
                <Warning sx={{ color: stats.testCoverage >= 80 ? '#2e7d32' : '#f57c00', fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.testCoverage} 
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
                color={stats.testCoverage >= 80 ? 'success' : 'warning'}
              />
              <Typography variant="caption" color="textSecondary">
                Target: 85%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Automation Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.automationRate}%
                </Typography>
                <Assessment sx={{ color: '#1976d2', fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.automationRate} 
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                {stats.totalTestCases - Math.floor(stats.totalTestCases * stats.automationRate / 100)} tests remaining
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Defect Density
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {(stats.openDefects / stats.totalTestCases * 100).toFixed(1)}%
                </Typography>
                <BugReport sx={{ color: '#d32f2f', fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((stats.openDefects / stats.totalTestCases * 100), 100)} 
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
                color="error"
              />
              <Typography variant="caption" color="textSecondary">
                {stats.openDefects} defects across {stats.totalTestCases} tests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Test Executions */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Recent Test Executions
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Test ID</strong></TableCell>
                <TableCell><strong>Test Name</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Executor</strong></TableCell>
                <TableCell><strong>Time</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentExecutions.length > 0 ? (
                recentExecutions.map((execution) => (
                  <TableRow key={execution.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {execution.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{execution.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={execution.status} 
                        size="small" 
                        color={getStatusColor(execution.status) as any}
                      />
                    </TableCell>
                    <TableCell>{execution.executor}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {execution.time}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                      No recent test executions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Dashboard;
