import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Toolbar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Search,
  Delete,
  Edit,
  FilterList,
  Star,
  StarBorder,
  Refresh,
  BugReport,
} from '@mui/icons-material';
import { RootState } from '../../store';
import defectService, { Defect } from '../../services/defect.service';
import watchlistService from '../../services/watchlist.service';
import SavedViewsManager from '../../components/SavedViewsManager';
import { formatDistanceToNow } from 'date-fns';

const DefectsPage: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  
  const [loading, setLoading] = useState(false);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [watchedDefects, setWatchedDefects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, new: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, bySeverity: {} });
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    type: 'BUG',
    environment: '',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
  });

  useEffect(() => {
    if (currentProject?.id) {
      loadData();
      loadWatchlist();
      loadStats();
    }
  }, [currentProject?.id]);

  const loadData = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const data = await defectService.getDefects(currentProject.id, {
        status: filterStatus || undefined,
        severity: filterSeverity || undefined,
        priority: filterPriority || undefined,
        search: searchQuery || undefined,
      });
      setDefects(data);
    } catch (error) {
      console.error('Failed to load defects', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWatchlist = async () => {
    try {
      const watchlist = await watchlistService.getWatchlist('DEFECT');
      const watchedIds = new Set(watchlist.map(w => w.entityId));
      setWatchedDefects(watchedIds);
    } catch (error) {
      console.error('Failed to load watchlist', error);
    }
  };

  const loadStats = async () => {
    if (!currentProject?.id) return;
    try {
      const data = await defectService.getDefectStats(currentProject.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const toggleWatchlist = async (defectId: string) => {
    try {
      if (watchedDefects.has(defectId)) {
        const watchlist = await watchlistService.getWatchlist('DEFECT');
        const entry = watchlist.find(w => w.entityId === defectId);
        if (entry) {
          await watchlistService.removeFromWatchlist(entry.id);
        }
      } else {
        await watchlistService.addToWatchlist('DEFECT', defectId);
      }
      loadWatchlist();
    } catch (error) {
      console.error('Failed to toggle watchlist', error);
    }
  };

  const handleCreateDefect = async () => {
    if (!currentProject?.id || !formData.title.trim()) return;
    try {
      await defectService.createDefect({
        ...formData,
        projectId: currentProject.id,
      });
      setCreateDialogOpen(false);
      resetForm();
      loadData();
      loadStats();
    } catch (error) {
      console.error('Failed to create defect', error);
    }
  };

  const handleEditDefect = async () => {
    if (!selectedDefect) return;
    try {
      await defectService.updateDefect(selectedDefect.id, formData);
      setEditDialogOpen(false);
      setSelectedDefect(null);
      resetForm();
      loadData();
      loadStats();
    } catch (error) {
      console.error('Failed to update defect', error);
    }
  };

  const handleDeleteDefect = async (defectId: string) => {
    if (window.confirm('Are you sure you want to delete this defect?')) {
      try {
        await defectService.deleteDefect(defectId);
        loadData();
        loadStats();
      } catch (error) {
        console.error('Failed to delete defect', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDefects.length === 0) return;
    if (window.confirm(`Delete ${selectedDefects.length} defect(s)?`)) {
      try {
        await Promise.all(selectedDefects.map(id => defectService.deleteDefect(id)));
        setSelectedDefects([]);
        loadData();
        loadStats();
      } catch (error) {
        console.error('Failed to bulk delete', error);
      }
    }
  };

  const handleStatusChange = async (defectId: string, newStatus: string) => {
    try {
      await defectService.updateDefect(defectId, { status: newStatus });
      loadData();
      loadStats();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const openEditDialog = (defect: Defect) => {
    setSelectedDefect(defect);
    setFormData({
      title: defect.title,
      description: defect.description || '',
      severity: defect.severity,
      priority: defect.priority,
      type: defect.type,
      environment: defect.environment || '',
      stepsToReproduce: defect.stepsToReproduce || '',
      expectedResult: defect.expectedResult || '',
      actualResult: defect.actualResult || '',
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      type: 'BUG',
      environment: '',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
    });
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedDefects(defects.map(d => d.id));
    } else {
      setSelectedDefects([]);
    }
  };

  const handleSelectDefect = (defectId: string) => {
    setSelectedDefects(prev =>
      prev.includes(defectId) ? prev.filter(id => id !== defectId) : [...prev, defectId]
    );
  };

  const handleLoadView = (filterConfig: any) => {
    if (filterConfig.status) setFilterStatus(filterConfig.status);
    if (filterConfig.severity) setFilterSeverity(filterConfig.severity);
    if (filterConfig.priority) setFilterPriority(filterConfig.priority);
    if (filterConfig.search) setSearchQuery(filterConfig.search);
    loadData();
  };

  const getCurrentFilters = () => ({
    status: filterStatus,
    severity: filterSeverity,
    priority: filterPriority,
    search: searchQuery,
  });

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string): 'success' | 'primary' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'NEW':
        return 'error';
      case 'OPEN':
        return 'warning';
      case 'IN_PROGRESS':
        return 'primary';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view defects.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Defects</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <SavedViewsManager
            viewType="DEFECTS"
            currentFilters={getCurrentFilters()}
            onLoadView={handleLoadView}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
            Report Defect
          </Button>
        </Box>
      </Box>

      {/* Stats Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">{stats.total}</Typography>
              <Typography variant="body2" color="textSecondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error">{stats.new}</Typography>
              <Typography variant="body2" color="textSecondary">New</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">{stats.open}</Typography>
              <Typography variant="body2" color="textSecondary">Open</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">{stats.inProgress}</Typography>
              <Typography variant="body2" color="textSecondary">In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">{stats.resolved}</Typography>
              <Typography variant="body2" color="textSecondary">Resolved</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4">{stats.closed}</Typography>
              <Typography variant="body2" color="textSecondary">Closed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        {/* Filters and Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search defects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="NEW">New</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
              <MenuItem value="REOPENED">Reopened</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={filterSeverity} label="Severity" onChange={e => setFilterSeverity(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={filterPriority} label="Priority" onChange={e => setFilterPriority(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<FilterList />} onClick={loadData}>
            Apply
          </Button>
          <IconButton onClick={loadData}>
            <Refresh />
          </IconButton>
        </Box>

        {/* Bulk Actions Toolbar */}
        {selectedDefects.length > 0 && (
          <Toolbar sx={{ bgcolor: 'action.selected', borderRadius: 1, mb: 2 }}>
            <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1">
              {selectedDefects.length} selected
            </Typography>
            <Tooltip title="Delete">
              <IconButton onClick={handleBulkDelete}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Toolbar>
        )}

        {/* Defects Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 520px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedDefects.length > 0 && selectedDefects.length < defects.length}
                      checked={defects.length > 0 && selectedDefects.length === defects.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Watch</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {defects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="textSecondary" sx={{ py: 4 }}>
                        No defects found. Report your first defect!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  defects.map(defect => (
                    <TableRow key={defect.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDefects.includes(defect.id)}
                          onChange={() => handleSelectDefect(defect.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleWatchlist(defect.id)}
                          color={watchedDefects.has(defect.id) ? 'primary' : 'default'}
                        >
                          {watchedDefects.has(defect.id) ? <Star /> : <StarBorder />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BugReport fontSize="small" />
                          {defect.defectId}
                        </Box>
                      </TableCell>
                      <TableCell>{defect.title}</TableCell>
                      <TableCell>
                        <Chip label={defect.severity} color={getSeverityColor(defect.severity)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={defect.priority} color={getSeverityColor(defect.priority)} size="small" />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={defect.status}
                            onChange={e => handleStatusChange(defect.id, e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="NEW">New</MenuItem>
                            <MenuItem value="OPEN">Open</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                            <MenuItem value="RESOLVED">Resolved</MenuItem>
                            <MenuItem value="CLOSED">Closed</MenuItem>
                            <MenuItem value="REOPENED">Reopened</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {defect.assignedTo
                          ? `${defect.assignedTo.firstName} ${defect.assignedTo.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(defect.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEditDialog(defect)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteDefect(defect.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create/Edit Defect Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editDialogOpen ? 'Edit Defect' : 'Report New Defect'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  onChange={e => setFormData({ ...formData, severity: e.target.value })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Environment"
            fullWidth
            value={formData.environment}
            onChange={e => setFormData({ ...formData, environment: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Steps to Reproduce"
            fullWidth
            multiline
            rows={3}
            value={formData.stepsToReproduce}
            onChange={e => setFormData({ ...formData, stepsToReproduce: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Expected Result"
            fullWidth
            multiline
            rows={2}
            value={formData.expectedResult}
            onChange={e => setFormData({ ...formData, expectedResult: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Actual Result"
            fullWidth
            multiline
            rows={2}
            value={formData.actualResult}
            onChange={e => setFormData({ ...formData, actualResult: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={editDialogOpen ? handleEditDefect : handleCreateDefect}
            variant="contained"
            disabled={!formData.title.trim()}
          >
            {editDialogOpen ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DefectsPage;
