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
  LinearProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Search,
  Delete,
  Link as LinkIcon,
  LinkOff,
  FilterList,
  Assessment,
  Star,
  StarBorder,
  Refresh,
} from '@mui/icons-material';
import { RootState } from '../../store';
import requirementService, { Requirement } from '../../services/requirement2.service';
import watchlistService from '../../services/watchlist.service';
import SavedViewsManager from '../../components/SavedViewsManager';

const RequirementsPage: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedReqs, setSelectedReqs] = useState<string[]>([]);
  const [watchedReqs, setWatchedReqs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Coverage stats
  const [coverageStats, setCoverageStats] = useState({ total: 0, covered: 0, coveragePercentage: 0 });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqType, setNewReqType] = useState('FUNCTIONAL');
  const [newReqPriority, setNewReqPriority] = useState('MEDIUM');

  useEffect(() => {
    if (currentProject?.id) {
      loadData();
      loadWatchlist();
      loadCoverageStats();
    }
  }, [currentProject?.id]);

  const loadData = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const data = await requirementService.getRequirements(currentProject.id, {
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        type: filterType || undefined,
        search: searchQuery || undefined,
      });
      setRequirements(data);
    } catch (error) {
      console.error('Failed to load requirements', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWatchlist = async () => {
    try {
      const watchlist = await watchlistService.getWatchlist('REQUIREMENT');
      const watchedIds = new Set(watchlist.map(w => w.entityId));
      setWatchedReqs(watchedIds);
    } catch (error) {
      console.error('Failed to load watchlist', error);
    }
  };

  const loadCoverageStats = async () => {
    if (!currentProject?.id) return;
    try {
      const stats = await requirementService.getCoverageStats(currentProject.id);
      setCoverageStats(stats);
    } catch (error) {
      console.error('Failed to load coverage stats', error);
    }
  };

  const toggleWatchlist = async (reqId: string) => {
    try {
      if (watchedReqs.has(reqId)) {
        const watchlist = await watchlistService.getWatchlist('REQUIREMENT');
        const entry = watchlist.find(w => w.entityId === reqId);
        if (entry) {
          await watchlistService.removeFromWatchlist(entry.id);
        }
      } else {
        await watchlistService.addToWatchlist('REQUIREMENT', reqId);
      }
      loadWatchlist();
    } catch (error) {
      console.error('Failed to toggle watchlist', error);
    }
  };

  const handleCreateRequirement = async () => {
    if (!currentProject?.id || !newReqTitle.trim()) return;
    try {
      await requirementService.createRequirement({
        title: newReqTitle,
        description: newReqDesc,
        type: newReqType,
        priority: newReqPriority,
        projectId: currentProject.id,
      });
      setCreateDialogOpen(false);
      setNewReqTitle('');
      setNewReqDesc('');
      setNewReqType('FUNCTIONAL');
      setNewReqPriority('MEDIUM');
      loadData();
      loadCoverageStats();
    } catch (error) {
      console.error('Failed to create requirement', error);
    }
  };

  const handleDeleteRequirement = async (reqId: string) => {
    if (window.confirm('Are you sure you want to delete this requirement?')) {
      try {
        await requirementService.deleteRequirement(reqId);
        loadData();
        loadCoverageStats();
      } catch (error) {
        console.error('Failed to delete requirement', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReqs.length === 0) return;
    if (window.confirm(`Delete ${selectedReqs.length} requirement(s)?`)) {
      try {
        await Promise.all(selectedReqs.map(id => requirementService.deleteRequirement(id)));
        setSelectedReqs([]);
        loadData();
        loadCoverageStats();
      } catch (error) {
        console.error('Failed to bulk delete', error);
      }
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedReqs(requirements.map(r => r.id));
    } else {
      setSelectedReqs([]);
    }
  };

  const handleSelectReq = (reqId: string) => {
    setSelectedReqs(prev =>
      prev.includes(reqId) ? prev.filter(id => id !== reqId) : [...prev, reqId]
    );
  };

  const handleLoadView = (filterConfig: any) => {
    if (filterConfig.status) setFilterStatus(filterConfig.status);
    if (filterConfig.priority) setFilterPriority(filterConfig.priority);
    if (filterConfig.type) setFilterType(filterConfig.type);
    if (filterConfig.search) setSearchQuery(filterConfig.search);
    loadData();
  };

  const getCurrentFilters = () => ({
    status: filterStatus,
    priority: filterPriority,
    type: filterType,
    search: searchQuery,
  });

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (priority) {
      case 'CRITICAL':
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

  const getStatusColor = (status: string): 'success' | 'primary' | 'warning' | 'default' => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return 'success';
      case 'IMPLEMENTED':
        return 'primary';
      case 'DRAFT':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view requirements.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Requirements</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <SavedViewsManager
            viewType="REQUIREMENTS"
            currentFilters={getCurrentFilters()}
            onLoadView={handleLoadView}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
            New Requirement
          </Button>
        </Box>
      </Box>

      {/* Coverage Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="h6">Test Coverage</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {coverageStats.coveragePercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={coverageStats.coveragePercentage}
            sx={{ height: 12, borderRadius: 6, mb: 1 }}
          />
          <Typography variant="body2" color="textSecondary">
            {coverageStats.covered} of {coverageStats.total} requirements covered by test cases
          </Typography>
        </CardContent>
      </Card>

      <Paper>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Requirements List" />
          <Tab label="Traceability Matrix" />
        </Tabs>

        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
            {/* Filters and Search */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search requirements..."
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
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="IMPLEMENTED">Implemented</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="DEPRECATED">Deprecated</MenuItem>
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
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Type</InputLabel>
                <Select value={filterType} label="Type" onChange={e => setFilterType(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="FUNCTIONAL">Functional</MenuItem>
                  <MenuItem value="NON_FUNCTIONAL">Non-Functional</MenuItem>
                  <MenuItem value="BUSINESS">Business</MenuItem>
                  <MenuItem value="TECHNICAL">Technical</MenuItem>
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
            {selectedReqs.length > 0 && (
              <Toolbar sx={{ bgcolor: 'action.selected', borderRadius: 1, mb: 2 }}>
                <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1">
                  {selectedReqs.length} selected
                </Typography>
                <Tooltip title="Delete">
                  <IconButton onClick={handleBulkDelete}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Toolbar>
            )}

            {/* Requirements Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 'calc(100vh - 480px)' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedReqs.length > 0 && selectedReqs.length < requirements.length}
                          checked={requirements.length > 0 && selectedReqs.length === requirements.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Watch</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Coverage</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requirements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography color="textSecondary" sx={{ py: 4 }}>
                            No requirements found. Create your first requirement!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      requirements.map(req => (
                        <TableRow key={req.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedReqs.includes(req.id)}
                              onChange={() => handleSelectReq(req.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleWatchlist(req.id)}
                              color={watchedReqs.has(req.id) ? 'primary' : 'default'}
                            >
                              {watchedReqs.has(req.id) ? <Star /> : <StarBorder />}
                            </IconButton>
                          </TableCell>
                          <TableCell>{req.requirementId}</TableCell>
                          <TableCell>{req.title}</TableCell>
                          <TableCell>{req.type}</TableCell>
                          <TableCell>
                            <Chip label={req.priority} color={getPriorityColor(req.priority)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip label={req.status} color={getStatusColor(req.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${req.testCases?.length || 0} tests`}
                              size="small"
                              icon={req.testCases && req.testCases.length > 0 ? <LinkIcon /> : <LinkOff />}
                              color={req.testCases && req.testCases.length > 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleDeleteRequirement(req.id)}>
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
          </Box>
        )}

        {selectedTab === 1 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Traceability Matrix Coming Soon
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              View requirement-to-test case relationships in a matrix format
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Create Requirement Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Requirement</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newReqTitle}
            onChange={e => setNewReqTitle(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newReqDesc}
            onChange={e => setNewReqDesc(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select value={newReqType} label="Type" onChange={e => setNewReqType(e.target.value)}>
              <MenuItem value="FUNCTIONAL">Functional</MenuItem>
              <MenuItem value="NON_FUNCTIONAL">Non-Functional</MenuItem>
              <MenuItem value="BUSINESS">Business</MenuItem>
              <MenuItem value="TECHNICAL">Technical</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select value={newReqPriority} label="Priority" onChange={e => setNewReqPriority(e.target.value)}>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRequirement} variant="contained" disabled={!newReqTitle.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequirementsPage;
