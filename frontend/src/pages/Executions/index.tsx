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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import executionService from '../../services/execution.service';
import testCaseService from '../../services/testCase.service';
import userService from '../../services/user.service';
import { toast } from 'react-toastify';

interface TestExecution {
  id: string;
  testCaseId: string;
  status: string;
  executionTime?: number;
  notes?: string;
  executedAt: string;
  testCase?: {
    id: string;
    externalId: string;
    name: string;
    priority?: string;
  };
  executedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  environment?: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const Executions: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [activeTab, setActiveTab] = useState(0);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [availableTestCases, setAvailableTestCases] = useState<any[]>([]);

  const loadExecutions = useCallback(async () => {
    if (!currentProject?.id) return;

    setLoading(true);
    try {
      let data;
      // Tab 0: Execute Test - All executions
      // Tab 1: Assign Test Case Execution - Not yet assigned
      // Tab 2: Test Cases Assigned to Me - My executions
      if (activeTab === 2) {
        data = await executionService.getMyExecutions(currentProject.id);
      } else {
        const filters: any = {};
        if (statusFilter) {
          filters.status = statusFilter;
        }
        data = await executionService.getAllExecutions(currentProject.id, filters);
      }
      setExecutions(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, statusFilter, activeTab]);

  const loadUsers = useCallback(async () => {
    if (!currentProject?.id) return;

    try {
      const data = await userService.getProjectUsers(currentProject.id);
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to load users:', error);
    }
  }, [currentProject?.id]);

  const loadTestCases = useCallback(async () => {
    if (!currentProject?.id) return;

    try {
      const data = await testCaseService.getTestCases(currentProject.id);
      setAvailableTestCases(data);
    } catch (error: any) {
      console.error('Failed to load test cases:', error);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  useEffect(() => {
    if (assignDialogOpen) {
      loadUsers();
      loadTestCases();
    }
  }, [assignDialogOpen, loadUsers, loadTestCases]);

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleAssignExecutions = async () => {
    if (!selectedUserId || selectedTestCases.length === 0) {
      toast.error('Please select test cases and assign to a user');
      return;
    }

    try {
      await executionService.bulkAssignExecutions(selectedTestCases, selectedUserId);
      toast.success('Test cases assigned successfully');
      setAssignDialogOpen(false);
      setSelectedTestCases([]);
      setSelectedUserId('');
      loadExecutions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign test cases');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'BLOCKED':
        return 'warning';
      case 'NOT_RUN':
        return 'default';
      case 'IN_PROGRESS':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatExecutionTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Test Execution</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={loadExecutions}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs for 3 Categories */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<PlayIcon />}
            label="Execute Test"
            iconPosition="start"
          />
          <Tab
            icon={<AssignmentIcon />}
            label="Assign Test Case Execution"
            iconPosition="start"
          />
          <Tab
            icon={<PersonIcon />}
            label="Test Cases Assigned to Me"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Panel 0: Execute Test */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FilterIcon />
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={handleStatusChange}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="NOT_RUN">Not Run</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="PASSED">Passed</MenuItem>
                      <MenuItem value="FAILED">Failed</MenuItem>
                      <MenuItem value="BLOCKED">Blocked</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  View and execute test cases
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Case ID</TableCell>
                  <TableCell>Test Case Name</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Execution Time</TableCell>
                  <TableCell>Executed At</TableCell>
                  <TableCell>Environment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : executions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No executions found
                    </TableCell>
                  </TableRow>
                ) : (
                  executions.map((execution) => (
                    <TableRow key={execution.id} hover>
                      <TableCell>{execution.testCase?.externalId}</TableCell>
                      <TableCell>{execution.testCase?.name}</TableCell>
                      <TableCell>
                        {execution.testCase?.priority && (
                          <Chip
                            label={execution.testCase.priority}
                            size="small"
                            color={
                              execution.testCase.priority === 'HIGH'
                                ? 'error'
                                : execution.testCase.priority === 'MEDIUM'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={execution.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(execution.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        {execution.executedBy
                          ? `${execution.executedBy.firstName} ${execution.executedBy.lastName}`
                          : 'Unassigned'}
                      </TableCell>
                      <TableCell>{formatExecutionTime(execution.executionTime)}</TableCell>
                      <TableCell>
                        {new Date(execution.executedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{execution.environment?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Tooltip title="Execute Test">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              window.location.href = `/execution-workbench/${execution.id}`;
                            }}
                          >
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab Panel 1: Assign Test Case Execution */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Assign Test Cases for Execution</Typography>
                <Button
                  variant="contained"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setAssignDialogOpen(true)}
                >
                  Bulk Assign Test Cases
                </Button>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Assign test cases to team members for execution
              </Typography>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Case ID</TableCell>
                  <TableCell>Test Case Name</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : executions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No test cases available for assignment
                    </TableCell>
                  </TableRow>
                ) : (
                  executions.map((execution) => (
                    <TableRow key={execution.id} hover>
                      <TableCell>{execution.testCase?.externalId}</TableCell>
                      <TableCell>{execution.testCase?.name}</TableCell>
                      <TableCell>
                        {execution.testCase?.priority && (
                          <Chip
                            label={execution.testCase.priority}
                            size="small"
                            color={
                              execution.testCase.priority === 'HIGH'
                                ? 'error'
                                : execution.testCase.priority === 'MEDIUM'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={execution.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(execution.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        {execution.executedBy
                          ? `${execution.executedBy.firstName} ${execution.executedBy.lastName}`
                          : <Chip label="Not Assigned" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedTestCases([execution.testCaseId]);
                            setAssignDialogOpen(true);
                          }}
                        >
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab Panel 2: Test Cases Assigned to Me */}
      {activeTab === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">My Assigned Test Cases</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Test cases assigned to you for execution
              </Typography>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Case ID</TableCell>
                  <TableCell>Test Case Name</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Execution Time</TableCell>
                  <TableCell>Last Executed</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : executions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No test cases assigned to you
                    </TableCell>
                  </TableRow>
                ) : (
                  executions.map((execution) => (
                    <TableRow key={execution.id} hover>
                      <TableCell>{execution.testCase?.externalId}</TableCell>
                      <TableCell>{execution.testCase?.name}</TableCell>
                      <TableCell>
                        {execution.testCase?.priority && (
                          <Chip
                            label={execution.testCase.priority}
                            size="small"
                            color={
                              execution.testCase.priority === 'HIGH'
                                ? 'error'
                                : execution.testCase.priority === 'MEDIUM'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={execution.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(execution.status) as any}
                        />
                      </TableCell>
                      <TableCell>{formatExecutionTime(execution.executionTime)}</TableCell>
                      <TableCell>
                        {new Date(execution.executedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Execute Test">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              window.location.href = `/execution-workbench/${execution.id}`;
                            }}
                          >
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Assign Test Cases Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Assign Test Cases for Execution</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={selectedUserId}
                  label="Assign To"
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Select Test Cases
              </Typography>
              <Paper
                sx={{
                  maxHeight: 300,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 2,
                }}
              >
                {availableTestCases.map((testCase) => (
                  <FormControlLabel
                    key={testCase.id}
                    control={
                      <Checkbox
                        checked={selectedTestCases.includes(testCase.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTestCases([...selectedTestCases, testCase.id]);
                          } else {
                            setSelectedTestCases(
                              selectedTestCases.filter((id) => id !== testCase.id)
                            );
                          }
                        }}
                      />
                    }
                    label={`${testCase.externalId} - ${testCase.name}`}
                  />
                ))}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignExecutions}
            disabled={!selectedUserId || selectedTestCases.length === 0}
          >
            Assign ({selectedTestCases.length} test cases)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Executions;
