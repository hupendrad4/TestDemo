import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Block,
  SkipNext,
  NavigateBefore,
  NavigateNext,
  Timer,
  AttachFile,
  BugReport,
  ArrowBack,
} from '@mui/icons-material';
import execution2Service, { TestExecution } from '../../services/execution2.service';

const ExecutionWorkbench: React.FC = () => {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [execution, setExecution] = useState<TestExecution | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Load execution data
  useEffect(() => {
    if (executionId) {
      loadExecution();
    }
  }, [executionId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const step = execution?.steps[currentStepIndex];
      if (!step) return;

      switch (e.key.toLowerCase()) {
        case 'p':
          handleStepStatus('PASS');
          break;
        case 'f':
          handleStepStatus('FAIL');
          break;
        case 'b':
          handleStepStatus('BLOCKED');
          break;
        case 's':
          handleStepStatus('SKIPPED');
          break;
        case 'arrowright':
          handleNextStep();
          break;
        case 'arrowleft':
          handlePrevStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [execution, currentStepIndex]);

  const loadExecution = async () => {
    if (!executionId) return;
    setLoading(true);
    try {
      const data = await execution2Service.getExecutionById(executionId);
      setExecution(data);
      if (data.status === 'NOT_STARTED') {
        await execution2Service.startExecution(executionId);
        setTimerRunning(true);
      } else if (data.status === 'IN_PROGRESS') {
        setTimerRunning(true);
        if (data.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000);
          setElapsedTime(elapsed);
        }
      }
    } catch (error) {
      console.error('Failed to load execution', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepStatus = async (status: string) => {
    if (!execution || !executionId) return;
    const step = execution.steps[currentStepIndex];
    if (!step) return;

    try {
      const actualResult = (document.getElementById(`actual-result-${step.id}`) as HTMLTextAreaElement)?.value || '';
      const notes = (document.getElementById(`notes-${step.id}`) as HTMLTextAreaElement)?.value || '';

      await execution2Service.updateStepResult(executionId, step.id, {
        status,
        actualResult,
        notes,
      });

      const updatedSteps = [...execution.steps];
      updatedSteps[currentStepIndex] = {
        ...step,
        status: status as 'NOT_EXECUTED' | 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED',
        actualResult,
        notes,
      };
      setExecution({ ...execution, steps: updatedSteps });

      // Auto-advance to next step
      if (currentStepIndex < execution.steps.length - 1) {
        setTimeout(() => setCurrentStepIndex(prev => prev + 1), 500);
      } else {
        // All steps completed, finalize execution
        await finalizeExecution();
      }
    } catch (error) {
      console.error('Failed to update step status', error);
    }
  };

  const finalizeExecution = async () => {
    if (!execution || !executionId) return;

    const allPassed = execution.steps.every(s => s.status === 'PASS');
    const anyFailed = execution.steps.some(s => s.status === 'FAIL');
    const anyBlocked = execution.steps.some(s => s.status === 'BLOCKED');

    let finalStatus = 'PASS';
    if (anyFailed) finalStatus = 'FAIL';
    else if (anyBlocked) finalStatus = 'BLOCKED';
    else if (!allPassed) finalStatus = 'SKIPPED';

    try {
      await execution2Service.updateExecutionStatus(executionId, finalStatus);
      setTimerRunning(false);
      setExecution(prev => prev ? { ...prev, status: finalStatus as any, endTime: new Date().toISOString() } : null);
    } catch (error) {
      console.error('Failed to finalize execution', error);
    }
  };

  const handleNextStep = () => {
    if (execution && currentStepIndex < execution.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'success';
      case 'FAIL':
        return 'error';
      case 'BLOCKED':
        return 'warning';
      case 'SKIPPED':
        return 'default';
      default:
        return 'default';
    }
  };

  const calculateProgress = (): number => {
    if (!execution) return 0;
    const completed = execution.steps.filter(s => s.status !== 'NOT_EXECUTED').length;
    return (completed / execution.steps.length) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!execution) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Execution not found.</Alert>
      </Box>
    );
  }

  const currentStep = execution.steps[currentStepIndex];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/executions')}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5">{execution.testCase.title}</Typography>
            <Typography variant="body2" color="textSecondary">
              {execution.executionId} • {execution.testCase.testCaseId}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<Timer />}
            label={formatTime(elapsedTime)}
            color={timerRunning ? 'primary' : 'default'}
          />
          <Chip
            label={execution.status}
            color={execution.status === 'PASS' ? 'success' : execution.status === 'FAIL' ? 'error' : 'default'}
          />
        </Box>
      </Box>

      {/* Progress */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">
            Step {currentStepIndex + 1} of {execution.steps.length}
          </Typography>
          <Typography variant="body2">{Math.round(calculateProgress())}% Complete</Typography>
        </Box>
        <LinearProgress variant="determinate" value={calculateProgress()} />
      </Paper>

      <Grid container spacing={3}>
        {/* Left: Current Step */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step {currentStep.stepNumber}: {currentStep.description}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Expected Result
              </Typography>
              <Typography variant="body1" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                {currentStep.expectedResult}
              </Typography>
            </Box>

            <TextField
              id={`actual-result-${currentStep.id}`}
              label="Actual Result"
              fullWidth
              multiline
              rows={3}
              defaultValue={currentStep.actualResult || ''}
              sx={{ mb: 2 }}
            />

            <TextField
              id={`notes-${currentStep.id}`}
              label="Notes"
              fullWidth
              multiline
              rows={2}
              defaultValue={currentStep.notes || ''}
              sx={{ mb: 3 }}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircle />}
                onClick={() => handleStepStatus('PASS')}
              >
                Pass (P)
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<Cancel />}
                onClick={() => handleStepStatus('FAIL')}
              >
                Fail (F)
              </Button>
              <Button
                variant="contained"
                color="warning"
                size="large"
                startIcon={<Block />}
                onClick={() => handleStepStatus('BLOCKED')}
              >
                Block (B)
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<SkipNext />}
                onClick={() => handleStepStatus('SKIPPED')}
              >
                Skip (S)
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button
                startIcon={<NavigateBefore />}
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
              >
                Previous
              </Button>
              <Button
                endIcon={<NavigateNext />}
                onClick={handleNextStep}
                disabled={currentStepIndex === execution.steps.length - 1}
              >
                Next
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button startIcon={<AttachFile />} variant="outlined">
                Attach File
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right: All Steps Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Steps
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
              {execution.steps.map((step, index) => (
                <Card
                  key={step.id}
                  variant={index === currentStepIndex ? 'elevation' : 'outlined'}
                  sx={{
                    mb: 1,
                    cursor: 'pointer',
                    bgcolor: index === currentStepIndex ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setCurrentStepIndex(index)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={index === currentStepIndex ? 600 : 400}>
                        Step {step.stepNumber}
                      </Typography>
                      <Chip
                        label={step.status}
                        size="small"
                        color={getStepStatusColor(step.status) as any}
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {step.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Keyboard Shortcuts Help */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Keyboard Shortcuts
        </Typography>
        <Typography variant="caption">
          P = Pass • F = Fail • B = Block • S = Skip • ← → = Navigate Steps
        </Typography>
      </Paper>
    </Box>
  );
};

export default ExecutionWorkbench;
