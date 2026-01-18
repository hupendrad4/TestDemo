import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const Defects: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Defects</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Defect
        </Button>
      </Box>
      <Paper sx={{ p: 3, minHeight: 400 }}>
        <Typography color="textSecondary" align="center">
          No defects found. Report your first defect!
        </Typography>
      </Paper>
    </Box>
  );
};

export default Defects;
