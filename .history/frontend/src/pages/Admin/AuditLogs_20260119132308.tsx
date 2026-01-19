import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { RootState } from '../../store';
import AuditLogViewer from '../../components/AuditLogViewer';

const AuditLogs: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTab, setSelectedTab] = useState(0);

  const entityTypes = [
    { value: '', label: 'All Entities' },
    { value: 'TEST_CASE', label: 'Test Cases' },
    { value: 'TEST_SUITE', label: 'Test Suites' },
    { value: 'REQUIREMENT', label: 'Requirements' },
    { value: 'DEFECT', label: 'Defects' },
    { value: 'TEST_PLAN', label: 'Test Plans' },
    { value: 'TEST_RUN', label: 'Test Runs' },
    { value: 'USER', label: 'Users' },
    { value: 'PROJECT', label: 'Projects' },
  ];

  if (user?.role !== 'ADMIN' && user?.role !== 'TEST_MANAGER') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to view audit logs.</Alert>
      </Box>
    );
  }

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view audit logs.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Audit Logs - {currentProject.name}
      </Typography>

      <Paper>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {entityTypes.map((type, index) => (
            <Tab key={type.value} label={type.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <AuditLogViewer
            projectId={currentProject.id}
            entityType={entityTypes[selectedTab].value || undefined}
            maxHeight={650}
            showFilters={true}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AuditLogs;
