import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
  Grid,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  Description as TestCaseIcon,
  CheckCircle as PassedIcon,
  Cancel as FailedIcon,
  Block as BlockedIcon,
  Pause as HoldIcon,
  Photo as ScreenshotIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import executionService from '../../services/execution.service';
import testPlanService from '../../services/testPlan.service';
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

interface TreeNode {
  id: string;
  name: string;
  type: 'suite' | 'case';
  children?: TreeNode[];
  stats: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    hold: number;
  };
  execution?: TestExecution;
}

const ExecuteTest: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [_executions, setExecutions] = useState<TestExecution[]>([]);
  const [_loading, setLoading] = useState(false);
  
  // Settings
  const [testPlans, setTestPlans] = useState<any[]>([]);
  const [selectedTestPlan, setSelectedTestPlan] = useState<string>('');
  const [selectedBuild, setSelectedBuild] = useState<string>('');
  const [builds, _setBuilds] = useState<any[]>([]);
  const [createNewAfterOp, setCreateNewAfterOp] = useState(false);
  const [treeCounter, setTreeCounter] = useState<string>('Test Plan');
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    testCaseId: '',
    testCaseTitle: '',
    testSuite: '',
    priority: '',
    executionType: '',
    assignedTo: '',
    includeUnassigned: false,
    bugsOnExec: '',
    result: '',
  });
  
  // Tree view
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null);
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false);
  const [_treeExpanded, setTreeExpanded] = useState(true);

  const loadTestPlans = useCallback(async () => {
    if (!currentProject?.id) return;
    try {
      const response = await testPlanService.getTestPlans(currentProject.id);
      const data = response.data || response || [];
      setTestPlans(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedTestPlan(data[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load test plans:', error);
      setTestPlans([]);
    }
  }, [currentProject?.id]);

  const loadProjectUsers = useCallback(async () => {
    if (!currentProject?.id) return;
    try {
      const response = await userService.getProjectUsers(currentProject.id);
      const rawData = response.data || response || [];
      // Extract user objects from ProjectMember structure
      const users = Array.isArray(rawData) 
        ? rawData.map((member: any) => member.user).filter((user: any) => user) 
        : [];
      setProjectUsers(users);
    } catch (error: any) {
      console.error('Failed to load project users:', error);
      setProjectUsers([]);
    }
  }, [currentProject?.id]);

  const loadExecutions = useCallback(async () => {
    if (!currentProject?.id || !selectedTestPlan) return;

    setLoading(true);
    try {
      const data = await executionService.getAllExecutions(currentProject.id, {
        status: filters.result,
        executedById: filters.assignedTo,
      });
      setExecutions(data);
      buildTreeData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, selectedTestPlan, selectedBuild, filters]);

  useEffect(() => {
    loadTestPlans();
    loadProjectUsers();
  }, [loadTestPlans, loadProjectUsers]);

  useEffect(() => {
    if (selectedTestPlan) {
      loadExecutions();
    }
  }, [loadExecutions, selectedTestPlan]);

  const buildTreeData = (executionsData: TestExecution[]) => {
    // Group executions by suite
    const suiteMap: Record<string, TestExecution[]> = {};
    
    executionsData.forEach(exec => {
      const suiteName = 'Test Suite'; // You can extract from testCase data
      if (!suiteMap[suiteName]) {
        suiteMap[suiteName] = [];
      }
      suiteMap[suiteName].push(exec);
    });

    const tree: TreeNode[] = Object.entries(suiteMap).map(([suiteName, execs]) => {
      const stats = calculateStats(execs);
      
      return {
        id: suiteName,
        name: suiteName,
        type: 'suite' as const,
        stats,
        children: execs.map(exec => ({
          id: exec.id,
          name: exec.testCase?.name || 'Unknown',
          type: 'case' as const,
          stats: {
            total: 1,
            passed: exec.status === 'PASSED' ? 1 : 0,
            failed: exec.status === 'FAILED' ? 1 : 0,
            blocked: exec.status === 'BLOCKED' ? 1 : 0,
            hold: exec.status === 'HOLD' ? 1 : 0,
          },
          execution: exec,
        })),
      };
    });

    setTreeData(tree);
  };

  const calculateStats = (execs: TestExecution[]) => {
    return {
      total: execs.length,
      passed: execs.filter(e => e.status === 'PASSED').length,
      failed: execs.filter(e => e.status === 'FAILED').length,
      blocked: execs.filter(e => e.status === 'BLOCKED').length,
      hold: execs.filter(e => e.status === 'HOLD').length,
    };
  };

  const handleNodeToggle = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadExecutions();
  };

  const handleResetFilters = () => {
    setFilters({
      testCaseId: '',
      testCaseTitle: '',
      testSuite: '',
      priority: '',
      executionType: '',
      assignedTo: '',
      includeUnassigned: false,
      bugsOnExec: '',
      result: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'BLOCKED':
        return 'warning';
      case 'HOLD':
        return 'default';
      case 'NOT_RUN':
        return 'default';
      case 'IN_PROGRESS':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <PassedIcon color="success" fontSize="small" />;
      case 'FAILED':
        return <FailedIcon color="error" fontSize="small" />;
      case 'BLOCKED':
        return <BlockedIcon color="warning" fontSize="small" />;
      case 'HOLD':
        return <HoldIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <React.Fragment key={node.id}>
        <ListItem
          button
          sx={{ pl: level * 2 }}
          onClick={() => {
            if (hasChildren) {
              handleNodeToggle(node.id);
            } else if (node.execution) {
              setSelectedExecution(node.execution);
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            {hasChildren ? (
              isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />
            ) : (
              <TestCaseIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 30 }}>
            {node.type === 'suite' ? <FolderIcon color="primary" /> : getStatusIcon(node.execution?.status || '')}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{node.name}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Chip label={`Total: ${node.stats.total}`} size="small" sx={{ height: 18, fontSize: '0.7rem', bgcolor: '#2196f3', color: 'white' }} />
                  <Chip label={`P: ${node.stats.passed}`} size="small" sx={{ height: 18, fontSize: '0.7rem', bgcolor: '#4caf50', color: 'white' }} />
                  <Chip label={`F: ${node.stats.failed}`} size="small" sx={{ height: 18, fontSize: '0.7rem', bgcolor: '#f44336', color: 'white' }} />
                  <Chip label={`NR: ${node.stats.total - node.stats.passed - node.stats.failed - node.stats.blocked - node.stats.hold}`} size="small" sx={{ height: 18, fontSize: '0.7rem', bgcolor: '#9e9e9e', color: 'white' }} />
                </Box>
              </Box>
            }
          />
        </ListItem>
        {hasChildren && isExpanded && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            {node.children?.map(child => renderTreeNode(child, level + 1))}
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      {/* Left Panel - Settings & Filters */}
      <Paper sx={{ width: 280, overflow: 'auto', borderRight: 1, borderColor: 'divider' }}>
        {/* Settings Section */}
        <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="subtitle1">Execute Tests</Typography>
        </Box>
        
        <Box sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
            Settings
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 1 }} size="small">
            <InputLabel>Test Plan</InputLabel>
            <Select
              value={selectedTestPlan}
              label="Test Plan"
              onChange={(e) => setSelectedTestPlan(e.target.value)}
            >
              {Array.isArray(testPlans) && testPlans.map(plan => (
                <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 1 }} size="small">
            <InputLabel>Build to execute</InputLabel>
            <Select
              value={selectedBuild}
              label="Build to execute"
              onChange={(e) => setSelectedBuild(e.target.value)}
            >
              <MenuItem value="">Select Build</MenuItem>
              {Array.isArray(builds) && builds.map(build => (
                <MenuItem key={build.id} value={build.id}>{build.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={createNewAfterOp}
                onChange={(e) => setCreateNewAfterOp(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">Create new after every operation</Typography>}
          />

          <FormControl fullWidth sx={{ mt: 2 }} size="small">
            <InputLabel>Tree counters Latest Exec on</InputLabel>
            <Select
              value={treeCounter}
              label="Tree counters Latest Exec on"
              onChange={(e) => setTreeCounter(e.target.value)}
            >
              <MenuItem value="Test Plan">Test Plan</MenuItem>
              <MenuItem value="Build">Build</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Filters Section */}
        <Box sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
            Filters
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Test Case ID"
            value={filters.testCaseId}
            onChange={(e) => handleFilterChange('testCaseId', e.target.value)}
            sx={{ mb: 1 }}
          />

          <TextField
            fullWidth
            size="small"
            label="Test Case Title"
            value={filters.testCaseTitle}
            onChange={(e) => handleFilterChange('testCaseTitle', e.target.value)}
            sx={{ mb: 1 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Test Suite</InputLabel>
            <Select
              value={filters.testSuite}
              label="Test Suite"
              onChange={(e) => handleFilterChange('testSuite', e.target.value)}
            >
              <MenuItem value="">Select an Option</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              label="Priority"
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <MenuItem value="">[Any]</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Execution type</InputLabel>
            <Select
              value={filters.executionType}
              label="Execution type"
              onChange={(e) => handleFilterChange('executionType', e.target.value)}
            >
              <MenuItem value="">[Any]</MenuItem>
              <MenuItem value="MANUAL">Manual</MenuItem>
              <MenuItem value="AUTOMATED">Automated</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Assigned to</InputLabel>
            <Select
              value={filters.assignedTo}
              label="Assigned to"
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
            >
              <MenuItem value="">[Any]</MenuItem>
              {Array.isArray(projectUsers) && projectUsers.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName} (${user.email})`
                    : user.username || user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={filters.includeUnassigned}
                onChange={(e) => handleFilterChange('includeUnassigned', e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption">Include unassigned Test Cases</Typography>}
            sx={{ mb: 0.5 }}
          />

          <TextField
            fullWidth
            size="small"
            label="Bugs on Exec. Context"
            value={filters.bugsOnExec}
            onChange={(e) => handleFilterChange('bugsOnExec', e.target.value)}
            sx={{ mb: 1, mt: 0.5 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Result</InputLabel>
            <Select
              value={filters.result}
              label="Result"
              onChange={(e) => handleFilterChange('result', e.target.value)}
            >
              <MenuItem value="">[Any]</MenuItem>
              <MenuItem value="PASSED">Passed</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
              <MenuItem value="BLOCKED">Blocked</MenuItem>
              <MenuItem value="HOLD">Hold</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={handleApplyFilters}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Apply
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={handleResetFilters}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Reset
            </Button>
          </Box>

          <Button variant="text" size="small" fullWidth>
            Advanced Filters
          </Button>
        </Box>

        <Divider />

        {/* Tree View Controls */}
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => setTreeExpanded(true)}
              sx={{ fontSize: '0.7rem', py: 0.4 }}
            >
              Expand
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => setTreeExpanded(false)}
              sx={{ fontSize: '0.7rem', py: 0.4 }}
            >
              Collapse
            </Button>
          </Box>
        </Box>

        <Divider />

        {/* Tree View */}
        <List dense sx={{ p: 0 }}>
          {treeData.map(node => renderTreeNode(node))}
        </List>
      </Paper>

      {/* Right Panel - Execution Details */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Exec. Context: Test Plan {testPlans.find(p => p.id === selectedTestPlan)?.name} - Build {selectedBuild || 'Not Selected'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Test plan {testPlans.find(p => p.id === selectedTestPlan)?.name}
          </Typography>
          {selectedBuild && (
            <Chip label={`Build ${selectedBuild}`} size="small" sx={{ mt: 1 }} />
          )}
        </Paper>

        {/* Execution Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {selectedExecution ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedExecution.testCase?.externalId} - {selectedExecution.testCase?.name}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Status:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {getStatusIcon(selectedExecution.status)}
                      <Chip
                        label={selectedExecution.status}
                        size="small"
                        color={getStatusColor(selectedExecution.status) as any}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Executed By:</Typography>
                    <Typography variant="body1">
                      {selectedExecution.executedBy
                        ? `${selectedExecution.executedBy.firstName} ${selectedExecution.executedBy.lastName}`
                        : 'Not assigned'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Executed At:</Typography>
                    <Typography variant="body1">
                      {new Date(selectedExecution.executedAt).toLocaleString()}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Environment:</Typography>
                    <Typography variant="body1">
                      {selectedExecution.environment?.name || 'N/A'}
                    </Typography>
                  </Grid>

                  {selectedExecution.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Notes:</Typography>
                      <Typography variant="body1">{selectedExecution.notes}</Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<ScreenshotIcon />}
                      onClick={() => setScreenshotDialogOpen(true)}
                    >
                      View Screenshots
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
              <Typography variant="h6" color="textSecondary">
                Select a test case from the tree to view execution details
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Screenshot Dialog */}
      <Dialog
        open={screenshotDialogOpen}
        onClose={() => setScreenshotDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Execution Screenshots</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            No screenshots available for this execution
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScreenshotDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExecuteTest;
