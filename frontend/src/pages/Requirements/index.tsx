import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Button, Paper, Grid, Chip, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import requirementService from '../../services/requirement.service';
import apiService from '../../services/api.service';
import { RootState } from '../../store';
import { setCurrentProject } from '../../store/slices/projectSlice';

const Requirements: React.FC = () => {
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<any[]>([]);

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
          const res: any = await requirementService.getRequirements(projectId);
          setRequirements(Array.isArray(res?.data) ? res.data : []);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Requirements</Typography>
        <Button variant="contained" startIcon={<AddIcon />}> 
          New Requirement
        </Button>
      </Box>
      <Paper sx={{ p: 3, minHeight: 400 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : requirements.length === 0 ? (
          <Typography color="textSecondary" align="center">
            No requirements found.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {requirements.map((req) => (
              <Grid item xs={12} md={6} key={req.id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{req.externalId} - {req.title}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {req.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`Status: ${req.status}`} size="small" />
                    <Chip label={`Priority: ${req.priority}`} size="small" />
                    <Chip label={`Coverage: ${req._count?.testCases || 0} test case(s)`} size="small" />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default Requirements;
