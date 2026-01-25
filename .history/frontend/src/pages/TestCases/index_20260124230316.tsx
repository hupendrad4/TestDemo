import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Checkbox,
  Toolbar,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Description,
  Code,
  PlayArrow,
  Edit,
  Delete,
} from '@mui/icons-material';
import CreateTestCaseDialog from '../../components/CreateTestCaseDialog';
import BulkEditDialog from '../../components/BulkEditDialog';
import JiraLinkComponent from '../../components/JiraLinkComponent';
import { testCaseService } from '../../services/testCase.service';

interface TestCase {
  id: string;
  name: string;
  externalId: string;
  format: 'TRADITIONAL' | 'BDD';
  priority: string;
  status: string;
  executionType: string;
  testProjectId: string;
  estimatedTime?: number;
  _count?: {
    steps: number;
    executions: number;
  };
}

const TestCases: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState<'ALL' | 'TRADITIONAL' | 'BDD'>('ALL');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);
  
  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openBulkEdit, setOpenBulkEdit] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    traditional: 0,
    bdd: 0,
    automated: 0,
  });

  useEffect(() => {
    loadTestCases();
  }, []);

  useEffect(() => {
    filterTestCases();
  }, [searchTerm, filterFormat, testCases]);

  const loadTestCases = async () => {
    try {
      setLoading(true);
      // Get current project from localStorage or context
      const currentProject = localStorage.getItem('currentProject');
      if (!currentProject) {
        console.log('No project selected');
        setLoading(false);
        return;
      }

      const response = await testCaseService.getTestCases(currentProject);
      const cases = Array.isArray(response) ? response : ((response as any)?.data || []);
      setTestCases(cases);
      
      // Calculate stats
      setStats({
        total: cases.length,
        traditional: cases.filter((tc: TestCase) => tc.format === 'TRADITIONAL').length,
        bdd: cases.filter((tc: TestCase) => tc.format === 'BDD').length,
        automated: cases.filter((tc: TestCase) => tc.executionType === 'AUTOMATED').length,
      });
    } catch (error) {
      console.error('Error loading test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTestCases = () => {
    let filtered = [...testCases];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tc) =>
          tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tc.externalId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Format filter
    if (filterFormat !== 'ALL') {
      filtered = filtered.filter((tc) => tc.format === filterFormat);
    }

    setFilteredTestCases(filtered);
  };

  const handleCreateTestCase = async (testCase: any) => {
    try {
      const currentProject = localStorage.getItem('currentProject');
      if (!currentProject) return;

      await testCaseService.createTestCase(currentProject, testCase);
      loadTestCases();
    } catch (error) {
      console.error('Error creating test case:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, testCaseId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTestCase(testCaseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTestCase(null);
  };

  const handleEdit = () => {
    console.log('Edit test case:', selectedTestCase);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedTestCase) {
      try {
        await testCaseService.deleteTestCase(selectedTestCase);
        loadTestCases();
        setSnackbar({ open: true, message: 'Test case deleted successfully', severity: 'success' });
      } catch (error) {
        console.error('Error deleting test case:', error);
        setSnackbar({ open: true, message: 'Failed to delete test case', severity: 'error' });
      }
    }
    handleMenuClose();
  };

  const handleExecute = () => {
    console.log('Execute test case:', selectedTestCase);
    handleMenuClose();
  };

  // Bulk operations handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(filteredTestCases.map(tc => tc.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkUpdate = async (updates: any) => {
    try {
      await testCaseService.bulkUpdateTestCases({
        testCaseIds: selectedIds,
        ...updates
      });
      setSnackbar({ open: true, message: `${selectedIds.length} test cases updated successfully`, severity: 'success' });
      setSelectedIds([]);
      loadTestCases();
    } catch (error: any) {
      console.error('Error bulk updating:', error);
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    try {
      await testCaseService.bulkDeleteTestCases(selectedIds);
      setSnackbar({ open: true, message: `${selectedIds.length} test cases deleted successfully`, severity: 'success' });
      setSelectedIds([]);
      setOpenDeleteConfirm(false);
      loadTestCases();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      setSnackbar({ open: true, message: 'Failed to delete test cases', severity: 'error' });
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, any> = {
      LOW: 'default',
      MEDIUM: 'info',
      HIGH: 'warning',
      CRITICAL: 'error',
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      DRAFT: 'default',
      READY_FOR_REVIEW: 'info',
      APPROVED: 'success',
      DEPRECATED: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Test Cases</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Test Case
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Test Cases
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Description color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Traditional
                  </Typography>
                  <Typography variant="h4">{stats.traditional}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Code color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    BDD/Gherkin
                  </Typography>
                  <Typography variant="h4">{stats.bdd}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Automated
              </Typography>
              <Typography variant="h4">{stats.automated}</Typography>
              <Typography variant="caption" color="textSecondary">
                {stats.total > 0
                  ? `${Math.round((stats.automated / stats.total) * 100)}% coverage`
                  : '0% coverage'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search test cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1}>
              <Chip
                label="All"
                color={filterFormat === 'ALL' ? 'primary' : 'default'}
                onClick={() => setFilterFormat('ALL')}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                icon={<Description />}
                label="Traditional"
                color={filterFormat === 'TRADITIONAL' ? 'primary' : 'default'}
                onClick={() => setFilterFormat('TRADITIONAL')}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                icon={<Code />}
                label="BDD"
                color={filterFormat === 'BDD' ? 'primary' : 'default'}
                onClick={() => setFilterFormat('BDD')}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Test Cases Table */}
      <TableContainer component={Paper}>
        {selectedIds.length > 0 && (
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
              {selectedIds.length} selected
            </Typography>
            <Tooltip title="Bulk Edit">
              <IconButton onClick={() => setOpenBulkEdit(true)} sx={{ color: 'inherit' }}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bulk Delete">
              <IconButton onClick={() => setOpenDeleteConfirm(true)} sx={{ color: 'inherit' }}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Toolbar>
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredTestCases.length}
                  checked={filteredTestCases.length > 0 && selectedIds.length === filteredTestCases.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Jira Links</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Steps/Scenarios</TableCell>
              <TableCell>Executions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredTestCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="textSecondary">
                    {testCases.length === 0
                      ? 'No test cases found. Create your first test case!'
                      : 'No test cases match your filters.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTestCases.map((testCase) => (
                <TableRow key={testCase.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(testCase.id)}
                      onChange={() => handleSelectOne(testCase.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {testCase.externalId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{testCase.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={testCase.format === 'BDD' ? <Code /> : <Description />}
                      label={testCase.format === 'BDD' ? 'BDD' : 'Traditional'}
                      color={testCase.format === 'BDD' ? 'success' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={testCase.priority}
                      color={getPriorityColor(testCase.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={testCase.status}
                      color={getStatusColor(testCase.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <JiraLinkComponent
                      entityType="TEST_CASE"
                      entityId={testCase.id}
                      projectId={testCase.testProjectId}
                      compact
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{testCase.executionType}</Typography>
                  </TableCell>
                  <TableCell>{testCase._count?.steps || 0}</TableCell>
                  <TableCell>{testCase._count?.executions || 0}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Execute">
                      <IconButton size="small" color="success">
                        <PlayArrow />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, testCase.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleExecute}>
          <PlayArrow fontSize="small" sx={{ mr: 1 }} />
          Execute
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <CreateTestCaseDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleCreateTestCase}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={openBulkEdit}
        selectedCount={selectedIds.length}
        onClose={() => setOpenBulkEdit(false)}
        onConfirm={handleBulkUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
      >
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length} test case{selectedIds.length !== 1 ? 's' : ''}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TestCases;

