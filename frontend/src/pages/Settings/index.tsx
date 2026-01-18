import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';

const Settings: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    void event;
    setValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Profile" />
          <Tab label="Integrations" />
          <Tab label="Notifications" />
          <Tab label="Security" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          <Typography color="textSecondary">
            Settings content will be displayed here
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
