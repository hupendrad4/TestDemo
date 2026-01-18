import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { PlayArrow as ExecuteIcon } from '@mui/icons-material';

const Executions: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Test Executions</Typography>
        <Button variant="contained" startIcon={<ExecuteIcon />}>
          Execute Tests
        </Button>
      </Box>
      <Paper sx={{ p: 3, minHeight: 400 }}>
        <Typography color="textSecondary" align="center">
          No executions found. Start executing tests!
        </Typography>
      </Paper>
    </Box>
  );
};

export default Executions;
