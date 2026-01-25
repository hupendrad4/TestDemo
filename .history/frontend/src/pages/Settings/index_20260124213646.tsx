import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useParams } from 'react-router-dom';
import EnvironmentSettings from '../../components/EnvironmentSettings';
import JiraSettings from './JiraSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [value, setValue] = React.useState(0);
  const { projectId } = useParams<{ projectId: string }>();

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
          <Tab label="Environments" />
          <Tab label="Integrations" />
          <Tab label="Notifications" />
          <Tab label="Security" />
        </Tabs>
        
        <TabPanel value={value} index={0}>
          <Typography color="textSecondary">
            Profile settings will be displayed here
          </Typography>
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <EnvironmentSettings />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <Typography color="textSecondary">
            Integration settings will be displayed here
          </Typography>
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <Typography color="textSecondary">
            Notification settings will be displayed here
          </Typography>
        </TabPanel>
        
        <TabPanel value={value} index={4}>
          <Typography color="textSecondary">
            Security settings will be displayed here
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;

