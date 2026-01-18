import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  Assessment,
  PlaylistAddCheck,
  BugReport,
  CheckCircle,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const stats = [
    { title: 'Total Test Cases', value: '0', icon: <Assessment />, color: '#1976d2' },
    { title: 'Test Executions', value: '0', icon: <PlaylistAddCheck />, color: '#2e7d32' },
    { title: 'Open Defects', value: '0', icon: <BugReport />, color: '#d32f2f' },
    { title: 'Passed Tests', value: '0', icon: <CheckCircle />, color: '#ed6c02' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>{stat.icon}</Box>
                  <Typography variant="h6" color="textSecondary">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h3">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Execution Trends
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <Typography color="textSecondary">Chart will be displayed here</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Test Status Distribution
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <Typography color="textSecondary">Pie chart will be displayed here</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
