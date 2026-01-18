import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import testPlanService from '../../services/testPlan.service';
import apiService from '../../services/api.service';
import { RootState } from '../../store';
import { setCurrentProject } from '../../store/slices/projectSlice';

const TestPlans: React.FC = () => {
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

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
          const res: any = await testPlanService.getTestPlans(projectId);
          setPlans(Array.isArray(res?.data) ? res.data : []);
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
        <Typography variant="h4">Test Plans</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Test Plan
        </Button>
      </Box>
      <Paper sx={{ p: 3, minHeight: 400 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : plans.length === 0 ? (
          <Typography color="textSecondary" align="center">
            No test plans found.
          </Typography>
        ) : (
          plans.map((tp) => (
            <Box key={tp.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
              <Typography variant="h6">{tp.name}</Typography>
              <Typography variant="body2" color="textSecondary">{tp.description || 'No description'}</Typography>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default TestPlans;
