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
  Menu,
  MenuItem,
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
  Alert,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  MoreVert,
  FolderOpen,
  Folder,
  Description,
  Search,
  ExpandMore,
  ChevronRight,
  Edit,
  Delete,
  DriveFileMove,
  FilterList,
  GetApp,
  Refresh,
} from '@mui/icons-material';
import { RootState } from '../../store';
import testCaseService, { TestCase, TestSuite } from '../../services/testCase.service';

const TestSuiteExplorer: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  
  // Dialog states
  const [createSuiteOpen, setCreateSuiteOpen] = useState(false);
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<TestSuite | TestCase | null>(null);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; item: TestSuite | null } | null>(null);

  // New suite/case form
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDesc, setNewSuiteDesc] = useState('');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [newCasePriority, setNewCasePriority] = useState('MEDIUM');
  const [newCaseType, setNewCaseType] = useState('FUNCTIONAL');

  useEffect(() => {
    if (currentProject?.id) {
      loadData();
    }
  }, [currentProject?.id]);

  const loadData = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const [suitesData, casesData] = await Promise.all([
        testCaseService.getTestSuites(currentProject.id),
        testCaseService.getTestCases(currentProject.id, {
          status: filterStatus || undefined,
          priority: filterPriority || undefined,
          search: searchQuery || undefined,
          suiteId: selectedSuite?.id,
        }),
      ]);
      setSuites(suitesData);
      setTestCases(casesData);
    } catch (error) {
      console.error('Failed to load test data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuiteToggle = (suiteId: string) => {
    setExpandedSuites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(suiteId)) {
        newSet.delete(suiteId);
      } else {
        newSet.add(suiteId);
      }
      return newSet;
    });
  };

  const handleSuiteSelect = (suite: TestSuite | null) => {
    setSelectedSuite(suite);
    setSelectedCases([]);
    if (suite) {
      loadTestCases(suite.id);
    } else {
      loadData();
    }
  };

  const loadTestCases = async (suiteId?: string) => {
    if (!currentProject?.id) return;
    try {
      const casesData = await testCaseService.getTestCases(currentProject.id, {
        suiteId,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        search: searchQuery || undefined,
      });
      setTestCases(casesData);
    } catch (error) {
      console.error('Failed to load test cases', error);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, suite: TestSuite) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4, item: suite }
        : null
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleCreateSuite = async () => {
    if (!currentProject?.id || !newSuiteName.trim()) return;
    try {
      await testCaseService.createTestSuite({
        name: newSuiteName,
        description: newSuiteDesc,
        parentId: selectedSuite?.id,
        projectId: currentProject.id,
      });
      setCreateSuiteOpen(false);
      setNewSuiteName('');
      setNewSuiteDesc('');
      loadData();
    } catch (error) {
      console.error('Failed to create suite', error);
    }
  };

  const handleCreateTestCase = async () => {
    if (!newCaseTitle.trim()) return;
    try {
      await testCaseService.createTestCase({
        title: newCaseTitle,
        description: newCaseDesc,
        priority: newCasePriority,
        type: newCaseType,
        suiteId: selectedSuite?.id,
      });
      setCreateCaseOpen(false);
      setNewCaseTitle('');
      setNewCaseDesc('');
      setNewCasePriority('MEDIUM');
      setNewCaseType('FUNCTIONAL');
      loadData();
    } catch (error) {
      console.error('Failed to create test case', error);
    }
  };

  const handleDeleteSuite = async (suite: TestSuite) => {
    if (window.confirm(`Are you sure you want to delete suite "${suite.name}"?`)) {
      try {
        await testCaseService.deleteTestSuite(suite.id);
        loadData();
      } catch (error) {
        console.error('Failed to delete suite', error);
      }
    }
    handleContextMenuClose();
  };

  const handleDeleteTestCase = async (caseId: string) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      try {
        await testCaseService.deleteTestCase(caseId);
        loadData();
      } catch (error) {
        console.error('Failed to delete test case', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCases.length === 0) return;
    if (window.confirm(`Delete ${selectedCases.length} test case(s)?`)) {
      try {
        await Promise.all(selectedCases.map((id) => testCaseService.deleteTestCase(id)));
        setSelectedCases([]);
        loadData();
      } catch (error) {
        console.error('Failed to bulk delete', error);
      }
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedCases(testCases.map((tc) => tc.id));
    } else {
      setSelectedCases([]);
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (priority) {
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

  const getStatusColor = (status: string): 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderSuiteTree = (suites: TestSuite[], parentId: string | null = null) => {
    const childSuites = suites.filter((s) => s.parentId === parentId);
    if (childSuites.length === 0) return null;

    return childSuites.map((suite) => {
      const hasChildren = suites.some((s) => s.parentId === suite.id);
      const isExpanded = expandedSuites.has(suite.id);
      const isSelected = selectedSuite?.id === suite.id;

      return (
        <React.Fragment key={suite.id}>
          <ListItemButton
            selected={isSelected}
            onClick={() => handleSuiteSelect(suite)}
            onContextMenu={(e) => handleContextMenu(e, suite)}
            sx={{ pl: parentId ? 4 : 2 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuiteToggle(suite.id);
                  }}
                >
                  {isExpanded ? <ExpandMore /> : <ChevronRight />}
                </IconButton>
              ) : null}
              {isExpanded || !hasChildren ? <FolderOpen /> : <Folder />}
            </ListItemIcon>
            <ListItemText primary={suite.name} />
          </ListItemButton>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>{renderSuiteTree(suites, suite.id)}</List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view test cases.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Test Cases & Suites</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Folder />} onClick={() => setCreateSuiteOpen(true)}>
            New Suite
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateCaseOpen(true)}>
            New Test Case
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Suite Tree */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 220px)', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Suites</Typography>
              <IconButton size="small" onClick={loadData}>
                <Refresh />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <ListItemButton selected={!selectedSuite} onClick={() => handleSuiteSelect(null)}>
              <ListItemIcon>
                <FolderOpen />
              </ListItemIcon>
              <ListItemText primary="All Test Cases" />
            </ListItemButton>
            <List disablePadding>{renderSuiteTree(suites)}</List>
          </Paper>
        </Grid>

        {/* Right Panel - Test Cases Table */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            {/* Filters and Search */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search test cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="DEPRECATED">Deprecated</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filterPriority}
                  label="Priority"
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
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
            </Box>

            {/* Bulk Actions Toolbar */}
            {selectedCases.length > 0 && (
              <Toolbar sx={{ bgcolor: 'action.selected', borderRadius: 1, mb: 2 }}>
                <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1">
                  {selectedCases.length} selected
                </Typography>
                <Tooltip title="Delete">
                  <IconButton onClick={handleBulkDelete}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Toolbar>
            )}

            {/* Test Cases Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedCases.length > 0 && selectedCases.length < testCases.length}
                          checked={testCases.length > 0 && selectedCases.length === testCases.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testCases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="textSecondary" sx={{ py: 4 }}>
                            No test cases found. Create your first test case!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      testCases.map((testCase) => (
                        <TableRow key={testCase.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedCases.includes(testCase.id)}
                              onChange={() => handleSelectCase(testCase.id)}
                            />
                          </TableCell>
                          <TableCell>{testCase.testCaseId}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Description fontSize="small" />
                              {testCase.title}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={testCase.priority}
                              color={getPriorityColor(testCase.priority)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={testCase.status}
                              color={getStatusColor(testCase.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{testCase.type}</TableCell>
                          <TableCell>
                            {testCase.assignedTo
                              ? `${testCase.assignedTo.firstName} ${testCase.assignedTo.lastName}`
                              : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleDeleteTestCase(testCase.id)}>
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
        </Grid>
      </Grid>

      {/* Context Menu for Suites */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => { setCreateSuiteOpen(true); handleContextMenuClose(); }}>
          <Add sx={{ mr: 1 }} fontSize="small" />
          New Subsuite
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Rename
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.item && handleDeleteSuite(contextMenu.item)}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Suite Dialog */}
      <Dialog open={createSuiteOpen} onClose={() => setCreateSuiteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Suite</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Suite Name"
            fullWidth
            value={newSuiteName}
            onChange={(e) => setNewSuiteName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newSuiteDesc}
            onChange={(e) => setNewSuiteDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSuiteOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSuite} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Test Case Dialog */}
      <Dialog open={createCaseOpen} onClose={() => setCreateCaseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Test Case</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newCaseTitle}
            onChange={(e) => setNewCaseTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newCaseDesc}
            onChange={(e) => setNewCaseDesc(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newCasePriority}
              label="Priority"
              onChange={(e) => setNewCasePriority(e.target.value)}
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={newCaseType}
              label="Type"
              onChange={(e) => setNewCaseType(e.target.value)}
            >
              <MenuItem value="FUNCTIONAL">Functional</MenuItem>
              <MenuItem value="NON_FUNCTIONAL">Non-Functional</MenuItem>
              <MenuItem value="SECURITY">Security</MenuItem>
              <MenuItem value="PERFORMANCE">Performance</MenuItem>
              <MenuItem value="USABILITY">Usability</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCaseOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTestCase} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestSuiteExplorer;
