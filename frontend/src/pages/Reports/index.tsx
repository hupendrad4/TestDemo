import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Grid, Paper, Chip, CircularProgress } from '@mui/material';
import reportService from '../../services/report.service';
import apiService from '../../services/api.service';
import { RootState } from '../../store';
import { setCurrentProject } from '../../store/slices/projectSlice';

const Reports: React.FC = () => {
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let projectId = currentProject?.id;
        if (!projectId) {
          const projectsRes: any = await apiService.get('/projects');
          const first = projectsRes?.data?.[0];
          if (first) {
            dispatch(setCurrentProject(first));
            projectId = first.id;
          }
        }
        if (projectId) {
          const res: any = await reportService.getDashboard(projectId);
          setDashboard(res?.data ?? null);
        }
      } catch (e) {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentProject, dispatch]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : !dashboard ? (
          <Typography color="textSecondary">No data available.</Typography>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Test Cases</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={`Total: ${dashboard.testCases.total}`} />
                  <Chip label={`Approved: ${dashboard.testCases.byStatus.approved}`} />
                  <Chip label={`Draft: ${dashboard.testCases.byStatus.draft}`} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Executions</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={`Total: ${dashboard.executions.total}`} />
                  <Chip label={`Passed: ${dashboard.executions.passed}`} />
                  <Chip label={`Failed: ${dashboard.executions.failed}`} />
                  <Chip label={`Pass Rate: ${dashboard.executions.passRate}%`} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Requirements</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={`Total: ${dashboard.requirements.total}`} />
                  <Chip label={`Covered: ${dashboard.requirements.covered}`} />
                  <Chip label={`Coverage: ${dashboard.requirements.coveragePercentage}%`} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Recent Executions</Typography>
                {dashboard.recentExecutions.length === 0 ? (
                  <Typography color="textSecondary">No recent executions.</Typography>
                ) : (
                  dashboard.recentExecutions.map((e: any) => (
                    <Box key={e.id} sx={{ display: 'flex', gap: 2, py: 1, borderBottom: '1px solid #eee' }}>
                      <Typography variant="body2">{e.testCase.externalId} - {e.testCase.name}</Typography>
                      <Chip label={e.status} size="small" />
                      <Typography variant="body2" color="textSecondary">by {e.executedBy?.username || 'N/A'}</Typography>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;
