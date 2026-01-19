import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Download,
  Schedule,
  PictureAsPdf,
  TableChart,
  Assessment,
  TrendingUp,
  BugReport,
  CheckCircle,
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { RootState } from '../../store';
import reportService, { ExecutionTrend, DefectTrend, CoverageReport, ScheduledReport } from '../../services/report2.service';
import { formatDistanceToNow } from 'date-fns';

const ReportsPage: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);

  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Data
  const [executionTrend, setExecutionTrend] = useState<ExecutionTrend[]>([]);
  const [defectTrend, setDefectTrend] = useState<DefectTrend[]>([]);
  const [coverageReport, setCoverageReport] = useState<CoverageReport | null>(null);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);

  // Dialogs
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [schedule, setSchedule] = useState('0 0 * * 1'); // Weekly Monday
  const [recipients, setRecipients] = useState('');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'EXCEL'>('PDF');

  useEffect(() => {
    if (currentProject?.id) {
      loadReportData();
    }
  }, [currentProject?.id]);

  const loadReportData = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const [execTrend, defTrend, coverage, schedules] = await Promise.all([
        reportService.getExecutionTrend(currentProject.id, 30),
        reportService.getDefectTrend(currentProject.id, 30),
        reportService.getCoverageReport(currentProject.id),
        reportService.getScheduledReports(currentProject.id),
      ]);
      setExecutionTrend(execTrend);
      setDefectTrend(defTrend);
      setCoverageReport(coverage);
      setScheduledReports(schedules);
    } catch (error) {
      console.error('Failed to load report data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!currentProject?.id || !reportName.trim()) return;
    try {
      await reportService.createScheduledReport({
        reportId: 'default',
        name: reportName,
        schedule,
        recipients: recipients.split(',').map(r => r.trim()),
        format: reportFormat,
        enabled: true,
      });
      setScheduleDialogOpen(false);
      setReportName('');
      setRecipients('');
      loadReportData();
    } catch (error) {
      console.error('Failed to create scheduled report', error);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      await reportService.updateScheduledReport(scheduleId, { enabled });
      loadReportData();
    } catch (error) {
      console.error('Failed to toggle schedule', error);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      try {
        await reportService.deleteScheduledReport(scheduleId);
        loadReportData();
      } catch (error) {
        console.error('Failed to delete schedule', error);
      }
    }
  };

  // Chart data
  const executionTrendChartData = {
    labels: executionTrend.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Passed',
        data: executionTrend.map(d => d.passed),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Failed',
        data: executionTrend.map(d => d.failed),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
      {
        label: 'Blocked',
        data: executionTrend.map(d => d.blocked),
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
      },
    ],
  };

  const defectTrendChartData = {
    labels: defectTrend.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'New Defects',
        data: defectTrend.map(d => d.new),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
      {
        label: 'Resolved',
        data: defectTrend.map(d => d.resolved),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Open',
        data: defectTrend.map(d => d.open),
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
      },
    ],
  };

  const coverageChartData = coverageReport
    ? {
        labels: ['Covered', 'Not Covered'],
        datasets: [
          {
            data: [
              coverageReport.requirements.covered,
              coverageReport.requirements.total - coverageReport.requirements.covered,
            ],
            backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(201, 203, 207, 0.8)'],
          },
        ],
      }
    : null;

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view reports.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Schedule />} onClick={() => setScheduleDialogOpen(true)}>
            Schedule Report
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdf />}>
            Export PDF
          </Button>
          <Button variant="outlined" startIcon={<TableChart />}>
            Export Excel
          </Button>
        </Box>
      </Box>

      <Paper>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Overview" icon={<Assessment />} iconPosition="start" />
          <Tab label="Test Execution" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Defects" icon={<BugReport />} iconPosition="start" />
          <Tab label="Coverage" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Scheduled Reports" icon={<Schedule />} iconPosition="start" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {selectedTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Summary Cards */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Test Cases
                        </Typography>
                        <Typography variant="h4">
                          {coverageReport?.testCases.total || 0}
                        </Typography>
                        <Typography variant="body2">
                          {coverageReport?.testCases.automated || 0} automated
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Requirements
                        </Typography>
                        <Typography variant="h4">
                          {coverageReport?.requirements.total || 0}
                        </Typography>
                        <Typography variant="body2">
                          {coverageReport?.requirements.coveragePercentage || 0}% covered
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Executions
                        </Typography>
                        <Typography variant="h4">
                          {coverageReport?.execution.total || 0}
                        </Typography>
                        <Typography variant="body2">
                          {coverageReport?.execution.passed || 0} passed
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Pass Rate
                        </Typography>
                        <Typography variant="h4">
                          {coverageReport?.execution.total
                            ? Math.round(
                                (coverageReport.execution.passed / coverageReport.execution.total) * 100
                              )
                            : 0}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Charts */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Execution Trend (30 days)
                      </Typography>
                      <Line
                        data={executionTrendChartData}
                        options={{ responsive: true, maintainAspectRatio: true }}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Defect Trend (30 days)
                      </Typography>
                      <Line
                        data={defectTrendChartData}
                        options={{ responsive: true, maintainAspectRatio: true }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {selectedTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Test Execution Analytics
                </Typography>
                <Paper sx={{ p: 3, mt: 2 }}>
                  <Line
                    data={executionTrendChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Execution Trend - Last 30 Days' },
                      },
                    }}
                  />
                </Paper>
              </Box>
            )}

            {selectedTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Defect Analytics
                </Typography>
                <Paper sx={{ p: 3, mt: 2 }}>
                  <Line
                    data={defectTrendChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Defect Trend - Last 30 Days' },
                      },
                    }}
                  />
                </Paper>
              </Box>
            )}

            {selectedTab === 3 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Requirements Coverage
                      </Typography>
                      {coverageChartData && (
                        <Doughnut
                          data={coverageChartData}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { position: 'bottom' },
                            },
                          }}
                        />
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Coverage Statistics
                      </Typography>
                      {coverageReport && (
                        <Box>
                          <Typography variant="body1" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> {coverageReport.requirements.covered} /{' '}
                            {coverageReport.requirements.total} (
                            {coverageReport.requirements.coveragePercentage}%)
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            <strong>Test Cases:</strong> {coverageReport.testCases.total}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Automated: {coverageReport.testCases.automated}, Manual:{' '}
                            {coverageReport.testCases.manual}
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            <strong>Executions:</strong> {coverageReport.execution.executed} /{' '}
                            {coverageReport.execution.total}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Passed: {coverageReport.execution.passed}, Failed:{' '}
                            {coverageReport.execution.failed}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {selectedTab === 4 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Scheduled Reports</Typography>
                  <Button variant="contained" startIcon={<Add />} onClick={() => setScheduleDialogOpen(true)}>
                    Add Schedule
                  </Button>
                </Box>
                <List>
                  {scheduledReports.length === 0 ? (
                    <Alert severity="info">
                      No scheduled reports configured. Create a schedule to receive automated reports.
                    </Alert>
                  ) : (
                    scheduledReports.map(schedule => (
                      <React.Fragment key={schedule.id}>
                        <ListItem>
                          <ListItemText
                            primary={schedule.name}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  Schedule: {schedule.schedule} • Recipients:{' '}
                                  {schedule.recipients.join(', ')}
                                </Typography>
                                <br />
                                <Chip label={schedule.format} size="small" sx={{ mr: 1, mt: 0.5 }} />
                                {schedule.lastRun && (
                                  <Typography variant="caption" color="textSecondary">
                                    Last run: {formatDistanceToNow(new Date(schedule.lastRun), { addSuffix: true })}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={schedule.enabled}
                              onChange={e => handleToggleSchedule(schedule.id, e.target.checked)}
                            />
                            <IconButton onClick={() => handleDeleteSchedule(schedule.id)}>
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Schedule Report Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Report Name"
            fullWidth
            value={reportName}
            onChange={e => setReportName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Schedule (Cron Expression)"
            fullWidth
            value={schedule}
            onChange={e => setSchedule(e.target.value)}
            helperText="e.g., '0 0 * * 1' for every Monday at midnight"
          />
          <TextField
            margin="dense"
            label="Recipients (comma-separated emails)"
            fullWidth
            value={recipients}
            onChange={e => setRecipients(e.target.value)}
            placeholder="user1@example.com, user2@example.com"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Format</InputLabel>
            <Select value={reportFormat} label="Format" onChange={e => setReportFormat(e.target.value as any)}>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="EXCEL">Excel</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSchedule} variant="contained" disabled={!reportName.trim()}>
            Create Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportsPage;
