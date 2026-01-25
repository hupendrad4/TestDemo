import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';

interface BulkEditDialogProps {
  open: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (updates: BulkUpdateData) => Promise<void>;
}

export interface BulkUpdateData {
  status?: string;
  priority?: string;
  executionType?: string;
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  open,
  selectedCount,
  onClose,
  onConfirm
}) => {
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [executionType, setExecutionType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const updates: BulkUpdateData = {};
    
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (executionType) updates.executionType = executionType;

    if (Object.keys(updates).length === 0) {
      setError('Please select at least one field to update');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(updates);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatus('');
    setPriority('');
    setExecutionType('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Bulk Edit {selectedCount} Test Case{selectedCount !== 1 ? 's' : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Alert severity="info">
            Leave fields empty to keep their current values. Only filled fields will be updated.
          </Alert>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">
                <em>Keep current</em>
              </MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="DEPRECATED">Deprecated</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              label="Priority"
            >
              <MenuItem value="">
                <em>Keep current</em>
              </MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Execution Type</InputLabel>
            <Select
              value={executionType}
              onChange={(e) => setExecutionType(e.target.value)}
              label="Execution Type"
            >
              <MenuItem value="">
                <em>Keep current</em>
              </MenuItem>
              <MenuItem value="MANUAL">Manual</MenuItem>
              <MenuItem value="AUTOMATED">Automated</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Update {selectedCount} Test Case{selectedCount !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkEditDialog;
