import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import EnvironmentSettings from '../../components/EnvironmentSettings';
import JiraSettings from './JiraSettings';
import projectService from '../../services/project.service';

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
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { currentProject } = useSelector((state: RootState) => state.projects);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectService.getProjects();
        const projectList = Array.isArray(response?.data) ? response.data : [];
        setProjects(projectList);
        
        // Set default project
        if (currentProject) {
          setSelectedProjectId(currentProject.id);
        } else if (projectList.length > 0) {
          setSelectedProjectId(projectList[0].id);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    loadProjects();
  }, [currentProject]);

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
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Jira Integration
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Connect your Jira account to sync test cases, test plans, and defects with Jira issues.
            </Typography>
            
            {projects.length > 0 ? (
              <>
                <FormControl fullWidth sx={{ mt: 2, mb: 3, maxWidth: 400 }}>
                  <InputLabel>Select Project</InputLabel>
                  <Select
                    value={selectedProjectId}
                    label="Select Project"
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.prefix} - {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedProjectId && <JiraSettings projectId={selectedProjectId} />}
              </>
            ) : (
              <Typography color="textSecondary" sx={{ mt: 2 }}>
                No projects available. Please create a project first.
              </Typography>
            )}
          </Box>
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

