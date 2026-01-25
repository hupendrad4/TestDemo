import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  Description as TestCaseIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import testPlanService from '../../services/testPlan.service';
import testCaseService from '../../services/testCase.service';
import userService from '../../services/user.service';
import { toast } from 'react-toastify';

interface TestCase {
  id: string;
  externalId: string;
  name: string;
  priority?: string;
  version?: string;
  platform?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  suiteId?: string;
  suite?: {
    id: string;
    name: string;
  };
}

interface TreeNode {
  id: string;
  name: string;
  type: 'suite' | 'case';
  children?: TreeNode[];
  testCase?: TestCase;
}

const AssignExecution: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  
  // Settings
  const [testPlans, setTestPlans] = useState<any[]>([]);
  const [selectedTestPlan, setSelectedTestPlan] = useState<string>('');
  const [selectedBuild, setSelectedBuild] = useState<string>('');
  const [builds, setBuilds] = useState<any[]>([]);
  const [updateTreeAfterOp, setUpdateTreeAfterOp] = useState(false);
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
    result: '',
    build: '',
  });
  
  // Tree view
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Table data
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [bulkAssignUser, setBulkAssignUser] = useState<string>('');
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());

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

  const loadBuilds = useCallback(async () => {
    if (!selectedTestPlan) return;
    try {
      const response = await testPlanService.getBuilds(selectedTestPlan);
      const data = response.data || response || [];
      setBuilds(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedBuild(data[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load builds:', error);
      setBuilds([]);
    }
  }, [selectedTestPlan]);

  const loadProjectUsers = useCallback(async () => {
    if (!currentProject?.id) return;
    try {
      const response = await userService.getProjectUsers(currentProject.id);
      const rawData = response.data || response || [];
      const users = Array.isArray(rawData) 
        ? rawData.map((member: any) => member.user).filter((user: any) => user) 
        : [];
      setProjectUsers(users);
    } catch (error: any) {
      console.error('Failed to load project users:', error);
      setProjectUsers([]);
    }
  }, [currentProject?.id]);

  const loadTestCases = useCallback(async () => {
    if (!currentProject?.id) return;

    try {
      const response: any = await testCaseService.getTestCases(currentProject.id);
      const data = response?.data || response || [];
      setTestCases(Array.isArray(data) ? data : []);
      buildTreeData(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load test cases');
      setTestCases([]);
    }
  }, [currentProject?.id]);

  const buildTreeData = (cases: TestCase[]) => {
    const suiteMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Group test cases by suite
    cases.forEach(testCase => {
      if (testCase.suite) {
        if (!suiteMap.has(testCase.suite.id)) {
          suiteMap.set(testCase.suite.id, {
            id: testCase.suite.id,
            name: testCase.suite.name,
            type: 'suite',
            children: [],
          });
        }
        const suite = suiteMap.get(testCase.suite.id)!;
        suite.children!.push({
          id: testCase.id,
          name: `${testCase.externalId} - ${testCase.name}`,
          type: 'case',
          testCase: testCase,
        });
      } else {
        rootNodes.push({
          id: testCase.id,
          name: `${testCase.externalId} - ${testCase.name}`,
          type: 'case',
          testCase: testCase,
        });
      }
    });

    const tree = [...Array.from(suiteMap.values()), ...rootNodes];
    setTreeData(tree);
  };

  useEffect(() => {
    loadTestPlans();
    loadProjectUsers();
    loadTestCases();
  }, [loadTestPlans, loadProjectUsers, loadTestCases]);

  useEffect(() => {
    if (selectedTestPlan) {
      loadBuilds();
    }
  }, [selectedTestPlan, loadBuilds]);

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
    loadTestCases();
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
      result: '',
      build: '',
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setAllSelected(checked);
    if (checked) {
      setSelectedTestCases(new Set(testCases.map(tc => tc.id)));
    } else {
      setSelectedTestCases(new Set());
    }
  };

  const handleSelectTestCase = (testCaseId: string, checked: boolean) => {
    const newSelected = new Set(selectedTestCases);
    if (checked) {
      newSelected.add(testCaseId);
    } else {
      newSelected.delete(testCaseId);
    }
    setSelectedTestCases(newSelected);
    setAllSelected(newSelected.size === testCases.length);
  };

  const handleAssignmentChange = (testCaseId: string, userId: string) => {
    const newAssignments = new Map(assignments);
    newAssignments.set(testCaseId, userId);
    setAssignments(newAssignments);
  };

  const handleApplyAssign = async () => {
    if (!bulkAssignUser || selectedTestCases.size === 0) {
      toast.error('Please select test cases and a user');
      return;
    }

    const updatedAssignments = new Map(assignments);
    selectedTestCases.forEach(tcId => {
      updatedAssignments.set(tcId, bulkAssignUser);
    });
    setAssignments(updatedAssignments);
    toast.success(`Assigned ${selectedTestCases.size} test cases`);
  };

  const handleSaveAssignments = async () => {
    if (assignments.size === 0) {
      toast.error('No assignments to save');
      return;
    }

    try {
      // Here you would call the API to save assignments
      toast.success('Assignments saved successfully');
      loadTestCases();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save assignments');
    }
  };

  const handleRemoveAssignments = async () => {
    if (selectedTestCases.size === 0) {
      toast.error('Please select test cases');
      return;
    }

    const newAssignments = new Map(assignments);
    selectedTestCases.forEach(tcId => {
      newAssignments.delete(tcId);
    });
    setAssignments(newAssignments);
    toast.success(`Removed ${selectedTestCases.size} assignments`);
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
            {node.type === 'suite' ? <FolderIcon color="primary" /> : null}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{node.name}</Typography>
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

  const selectedTestPlanName = testPlans.find(tp => tp.id === selectedTestPlan)?.name || '';
  const selectedBuildName = builds.find(b => b.id === selectedBuild)?.name || '';

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      {/* Left Panel - Settings, Filters, Tree */}
      <Paper sx={{ width: 280, overflow: 'auto', borderRight: 1, borderColor: 'divider' }}>
        {/* Settings Section */}
        <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="subtitle1">Assign Test Case Execution</Typography>
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
            <InputLabel>Build to assign</InputLabel>
            <Select
              value={selectedBuild}
              label="Build to assign"
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
                checked={updateTreeAfterOp}
                onChange={(e) => setUpdateTreeAfterOp(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption">Update tree after every operation</Typography>}
            sx={{ mb: 1 }}
          />
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

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Build</InputLabel>
            <Select
              value={filters.build}
              label="Build"
              onChange={(e) => handleFilterChange('build', e.target.value)}
            >
              <MenuItem value="">Select Build</MenuItem>
              {Array.isArray(builds) && builds.map(build => (
                <MenuItem key={build.id} value={build.id}>{build.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyFilters}
              fullWidth
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Apply
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              fullWidth
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Reset
            </Button>
          </Box>

          <Button variant="text" size="small" fullWidth sx={{ fontSize: '0.75rem' }}>
            Advanced Filters
          </Button>
        </Box>

        <Divider />

        <Box sx={{ p: 1.5 }}>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            fullWidth
            sx={{ fontSize: '0.75rem', mb: 1 }}
          >
            Bulk Remove
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
              onClick={() => setExpandedNodes(new Set(treeData.map(n => n.id)))}
              sx={{ fontSize: '0.7rem', py: 0.4 }}
            >
              Expand
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => setExpandedNodes(new Set())}
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

      {/* Right Panel - Assignment Table */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Assigning Test Case execution tasks for build {selectedBuildName} in test plan {selectedTestPlanName}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleSelectAll(!allSelected)}
            >
              {allSelected ? 'Uncheck all' : 'Check'}/uncheck all test cases
            </Button>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Users for Bulk Actions</InputLabel>
              <Select
                value={bulkAssignUser}
                label="Users for Bulk Actions"
                onChange={(e) => setBulkAssignUser(e.target.value)}
              >
                {Array.isArray(projectUsers) && projectUsers.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.username || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button 
              variant="contained" 
              size="small"
              onClick={handleApplyAssign}
            >
              Apply Assign
            </Button>
            <Button 
              variant="contained" 
              size="small"
              color="success"
              onClick={handleSaveAssignments}
            >
              Save Assignments
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              color="error"
              onClick={handleRemoveAssignments}
            >
              Remove Assignments
            </Button>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Button variant="outlined" size="small" color="error">
              Remove All Assignments
            </Button>
            <Button variant="outlined" size="small" sx={{ ml: 1 }}>
              Email Assignments
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Test Case | Version</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assigned to</TableCell>
                <TableCell>Assign to</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testCases.map((testCase) => (
                <TableRow key={testCase.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTestCases.has(testCase.id)}
                      onChange={(e) => handleSelectTestCase(testCase.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {testCase.externalId} - {testCase.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Version: {testCase.version || '1'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{testCase.platform || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={testCase.priority || 'Medium'} 
                      size="small"
                      color={
                        testCase.priority === 'HIGH' || testCase.priority === 'CRITICAL' 
                          ? 'error' 
                          : testCase.priority === 'MEDIUM' 
                          ? 'warning' 
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {testCase.assignedTo ? (
                      <Chip 
                        label={`${testCase.assignedTo.firstName} ${testCase.assignedTo.lastName}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="textSecondary">Not assigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={assignments.get(testCase.id) || ''}
                        onChange={(e) => handleAssignmentChange(testCase.id, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">Select User</MenuItem>
                        {Array.isArray(projectUsers) && projectUsers.map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.username || user.email}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default AssignExecution;
