import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import milestoneService from '../../services/milestone.service';
import { toast } from 'react-toastify';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  testProjectId: string;
  testPlans?: any[];
  createdAt?: string;
}

const MilestonesPage: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED',
  });

  const loadMilestones = useCallback(async () => {
    if (!currentProject?.id) return;

    setLoading(true);
    try {
      const data = await milestoneService.getMilestones(currentProject.id);
      setMilestones(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const handleOpenDialog = (milestone?: Milestone) => {
    if (milestone) {
      setSelectedMilestone(milestone);
      setFormData({
        name: milestone.name,
        description: milestone.description || '',
        startDate: milestone.startDate.split('T')[0],
        endDate: milestone.endDate.split('T')[0],
        status: milestone.status,
      });
    } else {
      setSelectedMilestone(null);
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'PLANNED',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMilestone(null);
  };

  const handleSubmit = async () => {
    if (!currentProject?.id) return;

    try {
      if (selectedMilestone) {
        await milestoneService.updateMilestone(selectedMilestone.id, formData);
        toast.success('Milestone updated successfully');
      } else {
        await milestoneService.createMilestone(currentProject.id, formData);
        toast.success('Milestone created successfully');
      }
      handleCloseDialog();
      loadMilestones();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save milestone');
    }
  };

  const handleDelete = async () => {
    if (!selectedMilestone) return;

    try {
      await milestoneService.deleteMilestone(selectedMilestone.id);
      toast.success('Milestone deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedMilestone(null);
      loadMilestones();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete milestone');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'PLANNED':
        return 'default';
      case 'DELAYED':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateProgress = (milestone: Milestone) => {
    const start = new Date(milestone.startDate).getTime();
    const end = new Date(milestone.endDate).getTime();
    const now = new Date().getTime();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    return `${days} days remaining`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Milestones</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={!currentProject}
        >
          New Milestone
        </Button>
      </Box>

      {!currentProject && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography color="textSecondary">
              Please select a project to view milestones.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography align="center">Loading...</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : milestones.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography align="center" color="textSecondary">
                  No milestones found. Create your first milestone!
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          milestones.map((milestone) => (
            <Grid item xs={12} md={6} lg={4} key={milestone.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {milestone.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(milestone)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {milestone.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {milestone.description}
                    </Typography>
                  )}

                  <Chip
                    label={milestone.status.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(milestone.status) as any}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="textSecondary">
                        {new Date(milestone.startDate).toLocaleDateString()} -{' '}
                        {new Date(milestone.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {getDaysRemaining(milestone.endDate)}
                    </Typography>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">Progress</Typography>
                      <Typography variant="caption">
                        {calculateProgress(milestone)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress(milestone)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {milestone.testPlans && milestone.testPlans.length > 0 && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      {milestone.testPlans.length} test plan(s) linked
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMilestone ? 'Edit Milestone' : 'Create Milestone'}
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
                <option value="CANCELLED">Cancelled</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.startDate || !formData.endDate}
          >
            {selectedMilestone ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Milestone</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete milestone "{selectedMilestone?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MilestonesPage;
