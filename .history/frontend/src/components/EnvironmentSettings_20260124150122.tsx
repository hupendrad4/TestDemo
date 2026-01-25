import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudQueue,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { environmentService, Environment, CreateEnvironmentData } from '../../services/environment.service';

const EnvironmentSettings: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [formData, setFormData] = useState<CreateEnvironmentData>({
    name: '',
    description: '',
    url: '',
    type: 'QA',
  });

  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      const currentProject = localStorage.getItem('currentProject');
      if (!currentProject) return;

      const data = await environmentService.getEnvironments(currentProject);
      setEnvironments(data);
    } catch (error) {
      console.error('Error loading environments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaults = async () => {
    try {
      const currentProject = localStorage.getItem('currentProject');
      if (!currentProject) return;

      await environmentService.createDefaultEnvironments(currentProject);
      loadEnvironments();
    } catch (error) {
      console.error('Error creating default environments:', error);
    }
  };

  const handleOpenDialog = (environment?: Environment) => {
    if (environment) {
      setEditingEnvironment(environment);
      setFormData({
        name: environment.name,
        description: environment.description || '',
        url: environment.url || '',
        type: environment.type,
      });
    } else {
      setEditingEnvironment(null);
      setFormData({
        name: '',
        description: '',
        url: '',
        type: 'QA',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEnvironment(null);
    setFormData({
      name: '',
      description: '',
      url: '',
      type: 'QA',
    });
  };

  const handleSubmit = async () => {
    try {
      const currentProject = localStorage.getItem('currentProject');
      if (!currentProject) return;

      if (editingEnvironment) {
        await environmentService.updateEnvironment(editingEnvironment.id, formData);
      } else {
        await environmentService.createEnvironment(currentProject, formData);
      }
      
      handleCloseDialog();
      loadEnvironments();
    } catch (error) {
      console.error('Error saving environment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this environment?')) return;

    try {
      await environmentService.deleteEnvironment(id);
      loadEnvironments();
    } catch (error) {
      console.error('Error deleting environment:', error);
      alert('Cannot delete environment that is being used in test runs');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      DEV: 'info',
      QA: 'success',
      STAGING: 'warning',
      UAT: 'secondary',
      PRODUCTION: 'error',
      CUSTOM: 'default',
    };
    return colors[type] || 'default';
  };

  const getTypeIcon = (type: string) => {
    return <CloudQueue />;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Test Environments</Typography>
        <Box>
          {environments.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleCreateDefaults}
              sx={{ mr: 1 }}
            >
              Create Default Environments
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Environment
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Environments
              </Typography>
              <Typography variant="h3">{environments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h3">
                {environments.filter((e) => e.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Executions
              </Typography>
              <Typography variant="h3">
                {environments.reduce((sum, e) => sum + (e._count?.executions || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Test Runs
              </Typography>
              <Typography variant="h3">
                {environments.reduce((sum, e) => sum + (e._count?.testRuns || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Environment List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Executions</TableCell>
              <TableCell>Test Runs</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : environments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">
                    No environments found. Create default environments or add custom ones.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              environments.map((env) => (
                <TableRow key={env.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getTypeIcon(env.type)}
                      <Box ml={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {env.name}
                        </Typography>
                        {env.description && (
                          <Typography variant="caption" color="textSecondary">
                            {env.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={env.type}
                      color={getTypeColor(env.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {env.url ? (
                      <Typography
                        variant="body2"
                        component="a"
                        href={env.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textDecoration: 'none' }}
                      >
                        {env.url}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {env.isActive ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Active"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<Cancel />}
                        label="Inactive"
                        color="default"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>{env._count?.executions || 0}</TableCell>
                  <TableCell>{env._count?.testRuns || 0}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(env)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(env.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEnvironment ? 'Edit Environment' : 'Create Environment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., QA Environment"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as CreateEnvironmentData['type'],
                  })
                }
              >
                <MenuItem value="DEV">Development</MenuItem>
                <MenuItem value="QA">QA/Testing</MenuItem>
                <MenuItem value="STAGING">Staging</MenuItem>
                <MenuItem value="UAT">UAT</MenuItem>
                <MenuItem value="PRODUCTION">Production</MenuItem>
                <MenuItem value="CUSTOM">Custom</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://qa.example.com"
                type="url"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                placeholder="Brief description of this environment"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name}
          >
            {editingEnvironment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnvironmentSettings;
