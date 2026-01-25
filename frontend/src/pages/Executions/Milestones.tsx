import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toast } from 'react-toastify';
import apiService from '../../services/api.service';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const Milestones: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetDate: '',
    startDate: '',
    highPriority: false,
    mediumPriority: false,
    lowPriority: false,
  });

  const loadMilestones = useCallback(async () => {
    if (!currentProject?.id) return;

    setLoading(true);
    try {
      const response = await apiService.get(`/projects/${currentProject.id}/milestones`);
      const data = response.data || response || [];
      setMilestones(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load milestones');
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const handleCreateMilestone = async () => {
    if (!formData.name || !formData.targetDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!currentProject?.id) return;

    try {
      await apiService.post(`/projects/${currentProject.id}/milestones`, {
        name: formData.name,
        description: '',
        startDate: formData.startDate || null,
        endDate: formData.targetDate,
        status: 'PLANNED',
      });

      toast.success('Milestone created successfully');
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        targetDate: '',
        startDate: '',
        highPriority: false,
        mediumPriority: false,
        lowPriority: false,
      });
      loadMilestones();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      await apiService.delete(`/milestones/${milestoneId}`);
      toast.success('Milestone deleted successfully');
      loadMilestones();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete milestone');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusChip = (startDate: string | null, endDate: string) => {
    const now = new Date();
    const target = new Date(endDate);
    const start = startDate ? new Date(startDate) : null;

    if (start && now < start) {
      return <Chip label="Planned" size="small" color="default" />;
    } else if (now > target) {
      return <Chip label="Overdue" size="small" color="error" />;
    } else {
      return <Chip label="In Progress" size="small" color="success" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Milestones for Test Plan {currentProject?.name || ''}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Target Date</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell align="center">Completed tests with High Priority [0-100%]</TableCell>
              <TableCell align="center">Completed tests with Medium Priority [0-100%]</TableCell>
              <TableCell align="center">Completed tests with Low Priority [0-100%]</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : milestones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No milestones found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              milestones.map((milestone) => (
                <TableRow key={milestone.id} hover>
                  <TableCell>{milestone.name}</TableCell>
                  <TableCell>{formatDate(milestone.endDate)}</TableCell>
                  <TableCell>{formatDate(milestone.startDate)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 20,
                          bgcolor: '#f44336',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                        }}
                      >
                        70%
                      </Box>
                      <Typography variant="body2">70</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 20,
                          bgcolor: '#ff9800',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                        }}
                      >
                        20%
                      </Box>
                      <Typography variant="body2">20</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 20,
                          bgcolor: '#4caf50',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                        }}
                      >
                        10%
                      </Box>
                      <Typography variant="body2">10</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(milestone.startDate, milestone.endDate || '')}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status of Milestones Section */}
      {milestones.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Status of Milestones
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Milestone [date]</TableCell>
                  <TableCell align="center" colSpan={2}>High priority</TableCell>
                  <TableCell align="center" colSpan={2}>Medium priority</TableCell>
                  <TableCell align="center" colSpan={2}>Low priority</TableCell>
                  <TableCell align="center">Overall</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell align="center">%</TableCell>
                  <TableCell align="center">Expected</TableCell>
                  <TableCell align="center">%</TableCell>
                  <TableCell align="center">Expected</TableCell>
                  <TableCell align="center">%</TableCell>
                  <TableCell align="center">Expected</TableCell>
                  <TableCell align="center">%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell>
                      {milestone.name} [ from {formatDate(milestone.startDate)} until {formatDate(milestone.endDate)} ]
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          bgcolor: '#f44336',
                          color: 'white',
                          px: 1,
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        0 %
                      </Box>
                    </TableCell>
                    <TableCell align="center">70.0 %</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          bgcolor: '#f44336',
                          color: 'white',
                          px: 1,
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        0.0 %
                      </Box>
                    </TableCell>
                    <TableCell align="center">20.0 %</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          bgcolor: '#f44336',
                          color: 'white',
                          px: 1,
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        0 %
                      </Box>
                    </TableCell>
                    <TableCell align="center">10.0 %</TableCell>
                    <TableCell align="center">
                      0.0 %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Create Milestone Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Milestone</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Target Date"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              required
              helperText="Milestones must be created at today's date or greater."
            />

            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              helperText="Start date is optional."
            />

            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.highPriority}
                    onChange={(e) => setFormData({ ...formData, highPriority: e.target.checked })}
                  />
                }
                label="Completed tests with High Priority [0-100%]:"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.mediumPriority}
                    onChange={(e) => setFormData({ ...formData, mediumPriority: e.target.checked })}
                  />
                }
                label="Completed tests with Medium Priority [0-100%]:"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.lowPriority}
                    onChange={(e) => setFormData({ ...formData, lowPriority: e.target.checked })}
                  />
                }
                label="Completed tests with Low Priority [0-100%]:"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Milestones consider executions within a specified time period.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This period starts with the Start Date 00:00:00 - if the Start Date is not specified all executions are taken into account - and ends with the Target date 23:59:59.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                All executions after the target date are ignored.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Milestones are reached when all "Sub-Milestones" for the different priorities are reached. Status of Milestones can be found on General Test Plan Metrics.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMilestone}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Milestones;
