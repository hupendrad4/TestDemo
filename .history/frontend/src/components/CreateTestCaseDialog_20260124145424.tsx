import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Description,
  Code,
} from '@mui/icons-material';

interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  testData?: string;
}

interface GherkinScenario {
  given: string[];
  when: string[];
  then: string[];
}

interface CreateTestCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (testCase: any) => void;
  suiteId?: string;
  projectId: string;
}

const CreateTestCaseDialog: React.FC<CreateTestCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  suiteId,
  projectId,
}) => {
  const [format, setFormat] = useState<'TRADITIONAL' | 'BDD'>('TRADITIONAL');
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [executionType, setExecutionType] = useState('MANUAL');
  const [estimatedTime, setEstimatedTime] = useState('');
  
  // Traditional format - test steps
  const [steps, setSteps] = useState<TestStep[]>([
    { stepNumber: 1, action: '', expectedResult: '', testData: '' },
  ]);

  // BDD format - Given/When/Then
  const [gherkin, setGherkin] = useState<GherkinScenario>({
    given: [''],
    when: [''],
    then: [''],
  });

  const handleFormatChange = (newFormat: 'TRADITIONAL' | 'BDD') => {
    setFormat(newFormat);
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { stepNumber: steps.length + 1, action: '', expectedResult: '', testData: '' },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Renumber steps
      newSteps.forEach((step, i) => {
        step.stepNumber = i + 1;
      });
      setSteps(newSteps);
    }
  };

  const handleStepChange = (index: number, field: keyof TestStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleAddGherkinLine = (section: keyof GherkinScenario) => {
    setGherkin({
      ...gherkin,
      [section]: [...gherkin[section], ''],
    });
  };

  const handleRemoveGherkinLine = (section: keyof GherkinScenario, index: number) => {
    if (gherkin[section].length > 1) {
      setGherkin({
        ...gherkin,
        [section]: gherkin[section].filter((_, i) => i !== index),
      });
    }
  };

  const handleGherkinChange = (
    section: keyof GherkinScenario,
    index: number,
    value: string
  ) => {
    const newSection = [...gherkin[section]];
    newSection[index] = value;
    setGherkin({
      ...gherkin,
      [section]: newSection,
    });
  };

  const handleSubmit = () => {
    const testCase: any = {
      name,
      summary,
      preconditions,
      priority,
      executionType,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
      format,
      testSuiteId: suiteId,
    };

    if (format === 'TRADITIONAL') {
      testCase.steps = steps.filter(s => s.action || s.expectedResult);
    } else {
      // BDD format - convert to Gherkin text
      const gherkinText = `
Feature: ${name}

Scenario: ${summary || name}
  ${gherkin.given.filter(Boolean).map(line => `Given ${line}`).join('\n  ')}
  ${gherkin.when.filter(Boolean).map(line => `When ${line}`).join('\n  ')}
  ${gherkin.then.filter(Boolean).map(line => `Then ${line}`).join('\n  ')}
      `.trim();
      testCase.gherkinScenario = gherkinText;
    }

    onSubmit(testCase);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setFormat('TRADITIONAL');
    setName('');
    setSummary('');
    setPreconditions('');
    setPriority('MEDIUM');
    setExecutionType('MANUAL');
    setEstimatedTime('');
    setSteps([{ stepNumber: 1, action: '', expectedResult: '', testData: '' }]);
    setGherkin({ given: [''], when: [''], then: [''] });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Create New Test Case</Typography>
          <Box>
            <Chip
              label="Traditional"
              icon={<Description />}
              color={format === 'TRADITIONAL' ? 'primary' : 'default'}
              onClick={() => handleFormatChange('TRADITIONAL')}
              sx={{ mr: 1, cursor: 'pointer' }}
            />
            <Chip
              label="BDD/Gherkin"
              icon={<Code />}
              color={format === 'BDD' ? 'primary' : 'default'}
              onClick={() => handleFormatChange('BDD')}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Basic Information - Common for both formats */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Test Case Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={
                format === 'BDD'
                  ? 'e.g., User login with valid credentials'
                  : 'e.g., Verify login functionality'
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={format === 'BDD' ? 'Scenario Description' : 'Summary'}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              multiline
              rows={2}
              placeholder={
                format === 'BDD'
                  ? 'Brief scenario description'
                  : 'High-level description of the test case'
              }
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Execution Type"
              value={executionType}
              onChange={(e) => setExecutionType(e.target.value)}
            >
              <MenuItem value="MANUAL">Manual</MenuItem>
              <MenuItem value="AUTOMATED">Automated</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Estimated Time (min)"
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="e.g., 15"
            />
          </Grid>

          {format === 'TRADITIONAL' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preconditions"
                value={preconditions}
                onChange={(e) => setPreconditions(e.target.value)}
                multiline
                rows={2}
                placeholder="Prerequisites before executing this test"
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Traditional Format - Test Steps */}
          {format === 'TRADITIONAL' && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Test Steps</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddStep}
                  variant="outlined"
                >
                  Add Step
                </Button>
              </Box>

              {steps.map((step, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="primary">
                      Step {step.stepNumber}
                    </Typography>
                    {steps.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveStep(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Action"
                        value={step.action}
                        onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                        placeholder="What action to perform"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Expected Result"
                        value={step.expectedResult}
                        onChange={(e) =>
                          handleStepChange(index, 'expectedResult', e.target.value)
                        }
                        placeholder="What should happen"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Test Data (Optional)"
                        value={step.testData}
                        onChange={(e) => handleStepChange(index, 'testData', e.target.value)}
                        placeholder="Any test data needed"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
          )}

          {/* BDD Format - Gherkin Given/When/Then */}
          {format === 'BDD' && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Define your test scenario using Given-When-Then format
              </Typography>

              {/* Given Section */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#e8f5e9' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight="bold" color="success.dark">
                    Given (Preconditions)
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => handleAddGherkinLine('given')}
                    startIcon={<AddIcon />}
                  >
                    Add Line
                  </Button>
                </Box>
                {gherkin.given.map((line, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <Typography sx={{ mr: 1, minWidth: 60 }} variant="body2">
                      Given
                    </Typography>
                    <TextField
                      fullWidth
                      value={line}
                      onChange={(e) => handleGherkinChange('given', index, e.target.value)}
                      placeholder="the user is on the login page"
                      size="small"
                      sx={{ bgcolor: 'white' }}
                    />
                    {gherkin.given.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveGherkinLine('given', index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Paper>

              {/* When Section */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff3e0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight="bold" color="warning.dark">
                    When (Actions)
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => handleAddGherkinLine('when')}
                    startIcon={<AddIcon />}
                  >
                    Add Line
                  </Button>
                </Box>
                {gherkin.when.map((line, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <Typography sx={{ mr: 1, minWidth: 60 }} variant="body2">
                      When
                    </Typography>
                    <TextField
                      fullWidth
                      value={line}
                      onChange={(e) => handleGherkinChange('when', index, e.target.value)}
                      placeholder="the user enters valid credentials and clicks login"
                      size="small"
                      sx={{ bgcolor: 'white' }}
                    />
                    {gherkin.when.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveGherkinLine('when', index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Paper>

              {/* Then Section */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight="bold" color="info.dark">
                    Then (Expected Results)
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => handleAddGherkinLine('then')}
                    startIcon={<AddIcon />}
                  >
                    Add Line
                  </Button>
                </Box>
                {gherkin.then.map((line, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <Typography sx={{ mr: 1, minWidth: 60 }} variant="body2">
                      Then
                    </Typography>
                    <TextField
                      fullWidth
                      value={line}
                      onChange={(e) => handleGherkinChange('then', index, e.target.value)}
                      placeholder="the user should be redirected to the dashboard"
                      size="small"
                      sx={{ bgcolor: 'white' }}
                    />
                    {gherkin.then.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveGherkinLine('then', index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Paper>

              {/* Gherkin Preview */}
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Gherkin Preview:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    m: 0,
                  }}
                >
                  {`Feature: ${name || '[Feature Name]'}\n\nScenario: ${summary || name || '[Scenario]'}\n${gherkin.given.filter(Boolean).map(line => `  Given ${line}`).join('\n')}\n${gherkin.when.filter(Boolean).map(line => `  When ${line}`).join('\n')}\n${gherkin.then.filter(Boolean).map(line => `  Then ${line}`).join('\n')}`}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name || (format === 'TRADITIONAL' && !steps.some(s => s.action))}
        >
          Create Test Case
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTestCaseDialog;
