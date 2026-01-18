import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const TestCases: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Test Cases</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Test Case
        </Button>
      </Box>
      <Paper sx={{ p: 3, minHeight: 400 }}>
        <Typography color="textSecondary" align="center">
          No test cases found. Create your first test case!
        </Typography>
      </Paper>
    </Box>
  );
};

export default TestCases;
