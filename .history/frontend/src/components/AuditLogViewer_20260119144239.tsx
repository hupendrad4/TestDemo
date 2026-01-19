import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  History,
  ExpandMore,
  ExpandLess,
  Person,
  FilterList,
} from '@mui/icons-material';
import auditLogService, { AuditLog } from '../services/auditLog.service';
import { formatDistanceToNow, format } from 'date-fns';

interface AuditLogViewerProps {
  entityType?: string;
  entityId?: string;
  projectId?: string;
  maxHeight?: number | string;
  showFilters?: boolean;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  entityType,
  entityId,
  projectId,
  maxHeight = 600,
  showFilters = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [entityType, entityId, projectId, filterAction, filterUser]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let data: AuditLog[];
      if (entityType && entityId) {
        data = await auditLogService.getEntityHistory(entityType, entityId);
      } else {
        data = await auditLogService.getAuditLogs({
          projectId,
          entityType,
          action: filterAction || undefined,
          userId: filterUser || undefined,
          limit: 100,
        });
      }
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getActionColor = (action: string): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'primary';
    if (action.includes('DELETE')) return 'error';
    return 'default';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return '✅';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    return '📝';
  };

  const renderValueDiff = (log: AuditLog) => {
    if (!log.oldValue && !log.newValue) return null;

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        {log.oldValue && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="error">
              Old Value:
            </Typography>
            <pre style={{ margin: 0, fontSize: '0.75rem' }}>
              {JSON.stringify(log.oldValue, null, 2)}
            </pre>
          </Box>
        )}
        {log.newValue && (
          <Box>
            <Typography variant="caption" color="success.main">
              New Value:
            </Typography>
            <pre style={{ margin: 0, fontSize: '0.75rem' }}>
              {JSON.stringify(log.newValue, null, 2)}
            </pre>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {showFilters && (
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<FilterList />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            size="small"
            variant="outlined"
          >
            Filters
          </Button>
          <Collapse in={showFilterPanel}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filterAction}
                  label="Action"
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="CREATE">Create</MenuItem>
                  <MenuItem value="UPDATE">Update</MenuItem>
                  <MenuItem value="DELETE">Delete</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="User Email"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <Button onClick={loadLogs} variant="contained" size="small">
                Apply
              </Button>
            </Box>
          </Collapse>
        </Box>
      )}

      <Paper sx={{ maxHeight, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <History sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No audit logs found
            </Typography>
          </Box>
        ) : (
          <List>
            {logs.map((log, index) => {
              const isExpanded = expandedLogs.has(log.id);
              const hasDetails = log.oldValue || log.newValue;

              return (
                <React.Fragment key={log.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      hasDetails && (
                        <IconButton
                          edge="end"
                          onClick={() => toggleExpand(log.id)}
                          size="small"
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {log.user ? log.user.firstName?.[0] : <Person />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {log.user
                              ? `${log.user.firstName} ${log.user.lastName}`
                              : 'System'}
                          </Typography>
                          <Chip
                            label={log.action}
                            size="small"
                            color={getActionColor(log.action)}
                            icon={<span>{getActionIcon(log.action)}</span>}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {log.entityType} - {log.entityId}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })} •{' '}
                            {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                          </Typography>
                          {log.ipAddress && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              IP: {log.ipAddress}
                            </Typography>
                          )}
                          {isExpanded && renderValueDiff(log)}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default AuditLogViewer;
