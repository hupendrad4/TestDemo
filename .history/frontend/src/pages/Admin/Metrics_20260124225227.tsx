import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Grid, Chip, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { RootState } from '../../store';
import projectService from '../../services/project.service';
import reportService from '../../services/report.service';

const AdminMetrics: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await projectService.getProjects(); // admin sees all
      const list = Array.isArray(res?.data) ? res.data : [];
      setProjects(list);
      if (list.length > 0) setProjectId(list[0].id);
    };
    load();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const res = await reportService.getDashboard(projectId); // reuse existing endpoint
        setData(res?.data || null);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [projectId]);

  if (user?.role !== 'ADMIN') {
    return <Typography color="error">Access denied</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Admin Metrics</Typography>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="admin-project">Project</InputLabel>
          <Select labelId="admin-project" label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value as string)}>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.prefix} - {p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 3 }}>
        {loading || !data ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Test Cases</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={`Total: ${data.testCasesSummary?.total || 0}`} />
                  <Chip label={`Approved: ${data.testCasesSummary?.byStatus?.APPROVED || 0}`} />
                  <Chip label={`Draft: ${data.testCasesSummary?.byStatus?.DRAFT || 0}`} />
                  <Chip label={`Deprecated: ${data.testCasesSummary?.byStatus?.DEPRECATED || 0}`} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Executions</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={`Total: ${data.recentExecutions?.length || 0}`} />
                  <Chip label={`Passed: ${data.recentExecutions?.filter((e: any) => e.status === 'PASSED').length || 0}`} />
                  <Chip label={`Failed: ${data.recentExecutions?.filter((e: any) => e.status === 'FAILED').length || 0}`} />
                  <Chip label={`Blocked: ${data.recentExecutions?.filter((e: any) => e.status === 'BLOCKED').length || 0}`} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Defects</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={`Open: ${data.defectsByStatus?.find((d: any) => d.status === 'OPEN')?._count || 0}`} />
                  <Chip label={`In Progress: ${data.defectsByStatus?.find((d: any) => d.status === 'IN_PROGRESS')?._count || 0}`} />
                  <Chip label={`Resolved: ${data.defectsByStatus?.find((d: any) => d.status === 'RESOLVED')?._count || 0}`} />
                  <Chip label={`Closed: ${data.defectsByStatus?.find((d: any) => d.status === 'CLOSED')?._count || 0}`} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default AdminMetrics;
