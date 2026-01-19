import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Computer,
  Flag,
  Build as BuildIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';
import testPlanService, { TestPlan, Platform, Milestone, Build } from '../../services/testPlan2.service';
import testCaseService from '../../services/testCase.service';
import requirementService from '../../services/requirement.service';
import { formatDistanceToNow } from 'date-fns';

const TestPlansPage: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  
  const [loading, setLoading] = useState(false);
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  
  // Available data
  const [availableRequirements, setAvailableRequirements] = useState<any[]>([]);
  const [availableTestCases, setAvailableTestCases] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  
  // Management dialogs
  // const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  // const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  // const [buildDialogOpen, setBuildDialogOpen] = useState(false);
  
  const wizardSteps = ['Basic Info', 'Select Requirements', 'Select Test Cases', 'Assign Platforms', 'Set Milestone', 'Review'];

  useEffect(() => {
    if (currentProject?.id) {
      loadData();
    }
  }, [currentProject?.id]);

  const loadData = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const [plans, reqs, cases, platformsData, milestonesData, buildsData] = await Promise.all([
        testPlanService.getTestPlans(currentProject.id),
        requirementService.getRequirements(currentProject.id),
        testCaseService.getTestCases(currentProject.id),
        testPlanService.getPlatforms(currentProject.id),
        testPlanService.getMilestones(currentProject.id),
        testPlanService.getBuilds(currentProject.id),
      ]);
      setTestPlans(plans);
      setAvailableRequirements(reqs.data || []);
      setAvailableTestCases(cases);
      setPlatforms(platformsData);
      setMilestones(milestonesData);
      setBuilds(buildsData);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!currentProject?.id || !planName.trim()) return;
    try {
      await testPlanService.createTestPlan({
        name: planName,
        description: planDescription,
        projectId: currentProject.id,
        testCaseIds: selectedTestCases,
        milestoneIds: selectedMilestone ? [selectedMilestone] : [],
      });
      
      resetWizard();
      setWizardOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to create test plan', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this test plan?')) {
      try {
        await testPlanService.deleteTestPlan(planId);
        loadData();
      } catch (error) {
        console.error('Failed to delete test plan', error);
      }
    }
  };

  const handleNextStep = () => {
    if (activeStep === wizardSteps.length - 1) {
      handleCreatePlan();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBackStep = () => {
    setActiveStep(prev => prev - 1);
  };

  const resetWizard = () => {
    setActiveStep(0);
    setPlanName('');
    setPlanDescription('');
    setSelectedTestCases([]);
    setSelectedPlatforms([]);
    setSelectedMilestone('');
  };

  const toggleTestCase = (caseId: string) => {
    setSelectedTestCases(prev =>
      prev.includes(caseId) ? prev.filter(id => id !== caseId) : [...prev, caseId]
    );
  };

  const getStatusColor = (status: string): 'success' | 'primary' | 'warning' | 'default' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'COMPLETED':
        return 'primary';
      default:
        return 'default';
    }
  };

  const renderWizardStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <TextField
              autoFocus
              margin="dense"
              label="Plan Name"
              fullWidth
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={planDescription}
              onChange={e => setPlanDescription(e.target.value)}
            />
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Select requirements to link to this test plan ({selectedRequirements.length} selected)
            </Typography>
            <List>
              {availableRequirements.map(requirement => (
                <ListItem 
                  key={requirement.id} 
                  button 
                  onClick={() => setSelectedRequirements(prev =>
                    prev.includes(requirement.id) ? prev.filter(id => id !== requirement.id) : [...prev, requirement.id]
                  )}
                >
                  <Checkbox
                    checked={selectedRequirements.includes(requirement.id)}
                    edge="start"
                  />
                  <ListItemText
                    primary={requirement.title}
                    secondary={`${requirement.externalId} • ${requirement.priority || 'MEDIUM'}`}
                  />
                </ListItem>
              ))}
            </List>
            {availableRequirements.length === 0 && (
              <Alert severity="info">No requirements available. Create requirements first.</Alert>
            )}
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Select test cases to include in this plan ({selectedTestCases.length} selected)
            </Typography>
            <List>
              {availableTestCases.map(testCase => (
                <ListItem key={testCase.id} button onClick={() => toggleTestCase(testCase.id)}>
                  <Checkbox
                    checked={selectedTestCases.includes(testCase.id)}
                    edge="start"
                  />
                  <ListItemText
                    primary={testCase.title}
                    secondary={`${testCase.testCaseId} • ${testCase.priority}`}
                  />
                </ListItem>
              ))}
            </List>
            {availableTestCases.length === 0 && (
              <Alert severity="info">No test cases available. Create test cases first.</Alert>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Select platforms for test execution ({selectedPlatforms.length} selected)
            </Typography>
            <List>
              {platforms.map(platform => (
                <ListItem
                  key={platform.id}
                  button
                  onClick={() => setSelectedPlatforms(prev =>
                    prev.includes(platform.id) ? prev.filter(id => id !== platform.id) : [...prev, platform.id]
                  )}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.id)}
                    edge="start"
                  />
                  <ListItemText
                    primary={platform.name}
                    secondary={`${platform.type} ${platform.version || ''}`}
                  />
                </ListItem>
              ))}
            </List>
            {platforms.length === 0 && (
              <Alert severity="info">No platforms configured. Add platforms in the Platforms tab.</Alert>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <FormControl fullWidth margin="dense">
              <InputLabel>Milestone (Optional)</InputLabel>
              <Select
                value={selectedMilestone}
                label="Milestone (Optional)"
                onChange={e => setSelectedMilestone(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {milestones.map(milestone => (
                  <MenuItem key={milestone.id} value={milestone.id}>
                    {milestone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {milestones.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No milestones configured. Add milestones in the Milestones tab.
              </Alert>
            )}
          </Box>
        );
      
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Test Plan</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2"><strong>Name:</strong> {planName}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Description:</strong> {planDescription || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Test Cases:</strong> {selectedTestCases.length} selected
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Platforms:</strong> {selectedPlatforms.length} selected
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Milestone:</strong> {selectedMilestone || 'None'}
            </Typography>
          </Box>
        );
      
      default:
        return null;
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to manage test plans.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Test Plans</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setWizardOpen(true)}>
          Create Test Plan
        </Button>
      </Box>

      <Paper>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Test Plans" />
          <Tab label="Platforms" icon={<Computer />} iconPosition="start" />
          <Tab label="Milestones" icon={<Flag />} iconPosition="start" />
          <Tab label="Builds" icon={<BuildIcon />} iconPosition="start" />
        </Tabs>

        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Test Cases</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary" sx={{ py: 4 }}>
                            No test plans found. Create your first test plan!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      testPlans.map(plan => (
                        <TableRow key={plan.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{plan.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {plan.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={plan.status} color={getStatusColor(plan.status)} size="small" />
                          </TableCell>
                          <TableCell>{plan.testCases?.length || 0}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small">
                              <PlayArrow fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeletePlan(plan.id)}>
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
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Platforms</Typography>
              <Button variant="outlined" size="small" startIcon={<Add />}>
                Add Platform
              </Button>
            </Box>
            <Grid container spacing={2}>
              {platforms.map(platform => (
                <Grid item xs={12} sm={6} md={4} key={platform.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{platform.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {platform.type} {platform.version}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {platforms.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">No platforms configured. Add platforms to define test execution environments.</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {selectedTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Milestones</Typography>
              <Button variant="outlined" size="small" startIcon={<Add />}>
                Add Milestone
              </Button>
            </Box>
            <Grid container spacing={2}>
              {milestones.map(milestone => (
                <Grid item xs={12} sm={6} key={milestone.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{milestone.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {milestone.description}
                      </Typography>
                      <Chip label={milestone.status} size="small" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {milestones.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">No milestones configured. Add milestones to track release goals.</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {selectedTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Builds</Typography>
              <Button variant="outlined" size="small" startIcon={<Add />}>
                Add Build
              </Button>
            </Box>
            <Grid container spacing={2}>
              {builds.map(build => (
                <Grid item xs={12} sm={6} md={4} key={build.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{build.name}</Typography>
                      <Typography variant="body2">Version: {build.version}</Typography>
                      <Chip label={build.status} size="small" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {builds.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">No builds configured. Add builds to track software versions.</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Create Test Plan Wizard */}
      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Test Plan - Step {activeStep + 1} of {wizardSteps.length}</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {wizardSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {renderWizardStep()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setWizardOpen(false); resetWizard(); }}>
            Cancel
          </Button>
          <Button onClick={handleBackStep} disabled={activeStep === 0}>
            Back
          </Button>
          <Button
            onClick={handleNextStep}
            variant="contained"
            disabled={activeStep === 0 && !planName.trim()}
          >
            {activeStep === wizardSteps.length - 1 ? 'Create' : 'Next'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestPlansPage;
