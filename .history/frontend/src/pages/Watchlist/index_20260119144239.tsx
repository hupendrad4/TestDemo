import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  StarBorder,
  Description,
  Folder,
  Assignment,
  BugReport,
  PlaylistAddCheck,
  DirectionsRun,
} from '@mui/icons-material';
import { RootState } from '../../store';
import watchlistService, { WatchlistEntry } from '../../services/watchlist.service';
import { formatDistanceToNow } from 'date-fns';

const Watchlist: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);

  const entityTypes = [
    { value: '', label: 'All' },
    { value: 'TEST_CASE', label: 'Test Cases' },
    { value: 'TEST_SUITE', label: 'Test Suites' },
    { value: 'REQUIREMENT', label: 'Requirements' },
    { value: 'DEFECT', label: 'Defects' },
    { value: 'TEST_PLAN', label: 'Test Plans' },
    { value: 'TEST_RUN', label: 'Test Runs' },
  ];

  useEffect(() => {
    loadWatchlist();
  }, [selectedTab]);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const entityType = entityTypes[selectedTab].value;
      const data = await watchlistService.getWatchlist(entityType || undefined);
      setWatchlist(data);
    } catch (error) {
      console.error('Failed to load watchlist', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await watchlistService.removeFromWatchlist(id);
      loadWatchlist();
    } catch (error) {
      console.error('Failed to remove from watchlist', error);
    }
  };

  const handleNavigate = (entry: WatchlistEntry) => {
    switch (entry.entityType) {
      case 'TEST_CASE':
        navigate(`/test-cases/${entry.entityId}`);
        break;
      case 'TEST_SUITE':
        navigate(`/test-cases?suiteId=${entry.entityId}`);
        break;
      case 'REQUIREMENT':
        navigate(`/requirements/${entry.entityId}`);
        break;
      case 'DEFECT':
        navigate(`/defects/${entry.entityId}`);
        break;
      case 'TEST_PLAN':
        navigate(`/test-plans/${entry.entityId}`);
        break;
      case 'TEST_RUN':
        navigate(`/executions/${entry.entityId}`);
        break;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'TEST_CASE':
        return <Description />;
      case 'TEST_SUITE':
        return <Folder />;
      case 'REQUIREMENT':
        return <Assignment />;
      case 'DEFECT':
        return <BugReport />;
      case 'TEST_PLAN':
        return <PlaylistAddCheck />;
      case 'TEST_RUN':
        return <DirectionsRun />;
      default:
        return <StarBorder />;
    }
  };

  const getEntityTitle = (entry: WatchlistEntry) => {
    if (entry.entity) {
      return entry.entity.title || entry.entity.name || entry.entity.id;
    }
    return `${entry.entityType} - ${entry.entityId}`;
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view your watchlist.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Watchlist</Typography>
        <Typography variant="body2" color="textSecondary">
          {watchlist.length} item{watchlist.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Paper>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {entityTypes.map((type) => (
            <Tab key={type.value} label={type.label} />
          ))}
        </Tabs>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : watchlist.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <StarBorder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No items in your watchlist
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Star items to keep track of them here
            </Typography>
          </Box>
        ) : (
          <List>
            {watchlist.map((entry, index) => (
              <React.Fragment key={entry.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemove(entry.id)}
                      title="Remove from watchlist"
                    >
                      <StarBorder />
                    </IconButton>
                  }
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleNavigate(entry)}
                >
                  <ListItemIcon>{getEntityIcon(entry.entityType)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getEntityTitle(entry)}
                        <Chip
                          label={entry.entityType.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={`Added ${formatDistanceToNow(new Date(entry.createdAt), {
                      addSuffix: true,
                    })}`}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default Watchlist;
