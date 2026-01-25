import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Link as LinkIcon,
  Add,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import jiraService, { JiraIntegration, JiraProject } from '../../services/jiraService';

interface JiraSettingsProps {
  projectId: string;
}

const JiraSettings: React.FC<JiraSettingsProps> = ({ projectId }) => {
  const [integration, setIntegration] = useState<JiraIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<JiraProject[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Form state
  const [jiraUrl, setJiraUrl] = useState('');
  const [authType, setAuthType] = useState<'OAUTH' | 'API_TOKEN'>('API_TOKEN');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    loadIntegration();
  }, [projectId]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const data = await jiraService.getIntegration(projectId);
      setIntegration(data);
      
      if (data) {
        setJiraUrl(data.jiraUrl);
        setAuthType(data.authType as any);
        setEmail(data.email || '');
        setShowSetup(false);
      } else {
        setShowSetup(true);
      }
    } catch (error: any) {
      toast.error('Failed to load Jira integration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!jiraUrl) {
      toast.error('Please enter Jira URL');
      return;
    }

    if (authType === 'API_TOKEN' && (!email || !apiToken)) {
      toast.error('Please enter email and API token');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await jiraService.testConnection({
        jiraUrl,
        email,
        apiToken,
        accessToken: authType === 'OAUTH' ? accessToken : undefined,
      });

      setTestResult(result);
      
      if (result.success) {
        toast.success(`Connection successful! Found ${result.data.accessibleProjects} accessible projects`);
      } else {
        toast.error(result.error.message);
      }
    } catch (error: any) {
      toast.error('Connection test failed');
      setTestResult({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to reach server',
          details: error.message,
          solution: 'Check your network connection and try again.',
        },
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSetup = async () => {
    try {
      setSaving(true);

      const setupData: any = {
        jiraUrl,
        authType,
      };

      if (authType === 'API_TOKEN') {
        if (!email || !apiToken) {
          toast.error('Email and API Token are required');
          return;
        }
        setupData.email = email;
        setupData.apiToken = apiToken;
      } else if (authType === 'OAUTH') {
        if (!accessToken) {
          toast.error('Access Token is required');
          return;
        }
        setupData.accessToken = accessToken;
      }

      await jiraService.setupIntegration(projectId, setupData);
      toast.success('Jira integration configured successfully!');
      loadIntegration();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to setup Jira integration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!integration) return;

    try {
      await jiraService.toggleIntegration(projectId, !integration.isActive);
      toast.success(`Jira integration ${!integration.isActive ? 'enabled' : 'disabled'}`);
      loadIntegration();
    } catch (error: any) {
      toast.error('Failed to toggle integration');
    }
  };

  const loadAvailableProjects = async () => {
    try {
      const projects = await jiraService.getJiraProjects(projectId);
      setAvailableProjects(projects);
      setShowProjectDialog(true);
    } catch (error: any) {
      toast.error('Failed to load Jira projects');
    }
  };

  const handleMapProject = async (project: JiraProject) => {
    try {
      await jiraService.mapJiraProject(projectId, project.key, true);
      toast.success(`Mapped Jira project: ${project.name}`);
      setShowProjectDialog(false);
      loadIntegration();
    } catch (error: any) {
      toast.error('Failed to map Jira project');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading Jira settings...</Typography>
      </Box>
    );
  }

  if (showSetup || !integration) {
    return (
      <Box p={3}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Setup Jira Integration
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Connect your Jira account to sync test cases, test plans, and defects with Jira
              issues.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>How to get API Token:</strong>
              <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Go to https://id.atlassian.com/manage-profile/security/api-tokens</li>
                <li>Click "Create API token"</li>
                <li>Give it a name (e.g., "Qualix Integration")</li>
                <li>Copy the generated token</li>
              </ol>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Jira URL"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  placeholder="https://your-domain.atlassian.net"
                  helperText="Your Jira Cloud instance URL"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Authentication Type</InputLabel>
                  <Select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value as any)}
                    label="Authentication Type"
                  >
                    <MenuItem value="API_TOKEN">API Token (Recommended)</MenuItem>
                    <MenuItem value="OAUTH">OAuth 2.0</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {authType === 'API_TOKEN' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@company.com"
                      helperText="Your Jira account email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Token"
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="Your Jira API token"
                      helperText="Generate from Jira Account Settings"
                    />
                  </Grid>
                </>
              )}

              {authType === 'OAUTH' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Access Token"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="OAuth access token"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleTestConnection}
                    disabled={testing || !jiraUrl || (authType === 'API_TOKEN' && (!email || !apiToken))}
                    sx={{ flex: 1 }}
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSetup}
                    disabled={saving}
                    sx={{ flex: 1 }}
                    size="large"
                  >
                    {saving ? 'Connecting...' : 'Connect to Jira'}
                  </Button>
                </Box>
              </Grid>

              {testResult && (
                <Grid item xs={12}>
                  {testResult.success ? (
                    <Alert severity="success">
                      <Typography variant="subtitle2" gutterBottom>
                        <strong>Connection Successful!</strong>
                      </Typography>
                      <Typography variant="body2">
                        • Jira Type: {testResult.data.jiraType}
                      </Typography>
                      <Typography variant="body2">
                        • User: {testResult.data.currentUser?.displayName} ({testResult.data.currentUser?.emailAddress})
                      </Typography>
                      <Typography variant="body2">
                        • Accessible Projects: {testResult.data.accessibleProjects}
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="error">
                      <Typography variant="subtitle2" gutterBottom>
                        <strong>{testResult.error.message}</strong>
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {testResult.error.details}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                        Solution:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {testResult.error.solution}
                      </Typography>
                      {testResult.jiraType && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                          Detected Jira Type: {testResult.jiraType} (API v{testResult.apiVersion})
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Jira Integration
            </Typography>
            <FormControlLabel
              control={<Switch checked={integration.isActive} onChange={handleToggle} />}
              label={integration.isActive ? 'Enabled' : 'Disabled'}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Jira URL
              </Typography>
              <Typography variant="body1" gutterBottom>
                {integration.jiraUrl}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Authentication
              </Typography>
              <Typography variant="body1" gutterBottom>
                {integration.authType}
                {integration.email && ` (${integration.email})`}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Sync Status
              </Typography>
              <Chip
                label={integration.syncEnabled ? 'Enabled' : 'Disabled'}
                color={integration.syncEnabled ? 'success' : 'default'}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Last Sync
              </Typography>
              <Typography variant="body1">
                {integration.lastSyncAt
                  ? new Date(integration.lastSyncAt).toLocaleString()
                  : 'Never'}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Mapped Jira Projects</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={loadAvailableProjects}
              disabled={!integration.isActive}
            >
              Map Project
            </Button>
          </Box>

          {integration.jiraProjects && integration.jiraProjects.length > 0 ? (
            <List>
              {integration.jiraProjects.map((project) => (
                <ListItem key={project.id} divider>
                  <ListItemText
                    primary={project.name}
                    secondary={`Key: ${project.key}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={project.syncEnabled ? 'Syncing' : 'Paused'}
                      color={project.syncEnabled ? 'success' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No Jira projects mapped yet. Click "Map Project" to get started.
            </Alert>
          )}

          <Box mt={3}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowSetup(true)}
              startIcon={<SettingsIcon />}
            >
              Reconfigure Integration
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Map Project Dialog */}
      <Dialog open={showProjectDialog} onClose={() => setShowProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Jira Project to Map</DialogTitle>
        <DialogContent>
          <List>
            {availableProjects.map((project) => (
              <ListItem
                key={project.id}
                button
                onClick={() => handleMapProject(project)}
              >
                <ListItemText
                  primary={project.name}
                  secondary={`Key: ${project.key}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProjectDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JiraSettings;
