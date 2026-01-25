import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Link as LinkIcon,
  LinkOff,
  Sync,
  OpenInNew,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../services/api.service';

// Inline interfaces to avoid module resolution issues
interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    project: {
      key: string;
      id: string;
      name: string;
    };
  };
}

interface JiraLink {
  id: string;
  jiraIssueKey: string;
  jiraIssueId: string;
  jiraIssueType: string;
  jiraIssueSummary: string;
  jiraIssueStatus: string;
  entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
  entityId: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED' | 'CONFLICT';
  lastSyncedAt: string;
  createdAt: string;
}

// Inline service methods
const jiraService = {
  async searchIssues(projectId: string, query: string) {
    const response = await api.get(`/jira/issues/${projectId}/search`, {
      params: { query },
    });
    return response.data.data as JiraIssue[];
  },

  async linkToJira(projectId: string, data: {
    entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
    entityId: string;
    jiraIssueKey: string;
  }) {
    const response = await api.post(`/jira/link/${projectId}`, data);
    return response.data.data as JiraLink;
  },

  async unlinkFromJira(projectId: string, linkId: string) {
    const response = await api.delete(`/jira/link/${projectId}/${linkId}`);
    return response.data;
  },

  async getEntityLinks(entityType: string, entityId: string) {
    const response = await api.get(`/jira/links/${entityType}/${entityId}`);
    return response.data.data as JiraLink[];
  },

  async syncToJira(entityType: string, entityId: string) {
    const response = await api.post('/jira/sync/to-jira', {
      entityType,
      entityId,
    });
    return response.data;
  },
};

interface JiraLinkComponentProps {
  entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
  entityId: string;
  projectId: string;
  compact?: boolean; // Compact view for table cells
}

const JiraLinkComponent: React.FC<JiraLinkComponentProps> = ({
  entityType,
  entityId,
  projectId,
  compact = false,
}) => {
  const [links, setLinks] = useState<JiraLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JiraIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);

  useEffect(() => {
    loadLinks();
  }, [entityType, entityId]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const data = await jiraService.getEntityLinks(entityType, entityId);
      setLinks(data || []);
    } catch (error: any) {
      // Silently fail if integration not setup
      console.error('Failed to load Jira links:', error);
      setLinks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearchIssues = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      // Build JQL query
      const jql = `text ~ "${query}" OR key = "${query}" ORDER BY updated DESC`;
      const results = await jiraService.searchIssues(projectId, jql);
      setSearchResults(results);
    } catch (error: any) {
      toast.error('Failed to search Jira issues');
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    if (!selectedIssue) {
      toast.error('Please select a Jira issue');
      return;
    }

    try {
      await jiraService.linkToJira(projectId, {
        entityType,
        entityId,
        jiraIssueKey: selectedIssue.key,
      });

      toast.success(`Linked to ${selectedIssue.key}`);
      setShowDialog(false);
      setSelectedIssue(null);
      setSearchResults([]);
      loadLinks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to link to Jira');
    }
  };

  const handleUnlink = async (link: JiraLink) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Unlink from ${link.jiraIssueKey}?`)) return;

    try {
      await jiraService.unlinkFromJira(projectId, link.id);
      toast.success('Unlinked from Jira');
      loadLinks();
    } catch (error: any) {
      toast.error('Failed to unlink');
    }
  };

  const handleSync = async () => {
    try {
      await jiraService.syncToJira(entityType, entityId);
      toast.success('Synced to Jira');
      loadLinks();
    } catch (error: any) {
      toast.error('Failed to sync');
    }
  };

  const openInJira = (link: JiraLink) => {
    // Extract base URL from any existing link or use a default
    const jiraUrl = 'https://jira.atlassian.net'; // TODO: Get from integration settings
    window.open(`${jiraUrl}/browse/${link.jiraIssueKey}`, '_blank');
  };

  if (loading) {
    return <CircularProgress size={20} />;
  }

  // Compact view for table cells
  if (compact) {
    if (links.length === 0) {
      return (
        <Tooltip title="Link to Jira">
          <IconButton size="small" onClick={() => setShowDialog(true)} color="primary">
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {links.map((link) => (
          <Chip
            key={link.id}
            label={link.jiraIssueKey}
            size="small"
            icon={<LinkIcon />}
            onClick={() => openInJira(link)}
            onDelete={() => handleUnlink(link)}
            color="primary"
            variant="outlined"
          />
        ))}
        <Tooltip title="Link another issue">
          <IconButton size="small" onClick={() => setShowDialog(true)}>
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // Full view
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="subtitle2">Jira Links</Typography>
        <Button
          size="small"
          startIcon={<LinkIcon />}
          onClick={() => setShowDialog(true)}
          variant="outlined"
        >
          Link to Jira
        </Button>
      </Box>

      {links.length > 0 ? (
        <List dense>
          {links.map((link) => (
            <ListItem key={link.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {link.jiraIssueKey}
                    </Typography>
                    <Chip
                      label={link.jiraIssueType}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={link.syncStatus}
                      size="small"
                      color={
                        link.syncStatus === 'SYNCED'
                          ? 'success'
                          : link.syncStatus === 'FAILED'
                          ? 'error'
                          : 'warning'
                      }
                    />
                  </Box>
                }
                secondary={
                  <>
                    {link.jiraIssueSummary}
                    <br />
                    Status: {link.jiraIssueStatus} | Last synced:{' '}
                    {new Date(link.lastSyncedAt).toLocaleString()}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Open in Jira">
                  <IconButton size="small" onClick={() => openInJira(link)}>
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sync to Jira">
                  <IconButton size="small" onClick={handleSync}>
                    <Sync fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Unlink">
                  <IconButton size="small" onClick={() => handleUnlink(link)}>
                    <LinkOff fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary">
          No Jira links
        </Typography>
      )}

      {/* Link Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Link to Jira Issue</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Autocomplete
              options={searchResults}
              getOptionLabel={(option) => `${option.key} - ${option.fields.summary}`}
              loading={searching}
              value={selectedIssue}
              onChange={(_, value) => setSelectedIssue(value)}
              onInputChange={(_, value) => handleSearchIssues(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Jira Issues"
                  placeholder="Type issue key or search term..."
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searching ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {option.key} - {option.fields.issuetype.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {option.fields.summary}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.fields.project.name} • {option.fields.status.name}
                    </Typography>
                  </Box>
                </li>
              )}
            />

            {selectedIssue && (
              <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="subtitle2">Selected Issue:</Typography>
                <Typography variant="body2">
                  <strong>{selectedIssue.key}</strong> - {selectedIssue.fields.summary}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {selectedIssue.fields.project.name} • {selectedIssue.fields.issuetype.name} •{' '}
                  {selectedIssue.fields.status.name}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button
            onClick={handleLink}
            variant="contained"
            disabled={!selectedIssue}
            startIcon={<LinkIcon />}
          >
            Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JiraLinkComponent;
