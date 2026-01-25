import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import executionService from '../../services/execution.service';
import { toast } from 'react-toastify';

interface TestExecution {
  id: string;
  testCaseId: string;
  status: string;
  executionTime?: number;
  executedAt: string;
  testCase?: {
    id: string;
    externalId: string;
    name: string;
    priority?: string;
  };
}

const MyAssignedTests: React.FC = () => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExecutions = useCallback(async () => {
    if (!currentProject?.id) return;

    setLoading(true);
    try {
      const data = await executionService.getMyExecutions(currentProject.id);
      setExecutions(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

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
        <Typography variant="h4">Test Cases Assigned to Me</Typography>
        <IconButton onClick={loadExecutions}>
          <RefreshIcon />
        </IconButton>
      </Box>

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
  );
};

export default MyAssignedTests;
