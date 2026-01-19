import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import {
  Bookmarks,
  Delete,
  Edit,
  Star,
  StarBorder,
  Public,
  Lock,
} from '@mui/icons-material';
import { RootState } from '../store';
import savedViewService, { SavedView } from '../services/savedView.service';

interface SavedViewsManagerProps {
  viewType: 'TEST_CASES' | 'REQUIREMENTS' | 'DEFECTS' | 'TEST_PLANS' | 'EXECUTIONS';
  currentFilters: any;
  onLoadView: (filterConfig: any) => void;
}

const SavedViewsManager: React.FC<SavedViewsManagerProps> = ({
  viewType,
  currentFilters,
  onLoadView,
}) => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [views, setViews] = useState<SavedView[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (currentProject?.id) {
      loadViews();
    }
  }, [currentProject?.id, viewType]);

  const loadViews = async () => {
    if (!currentProject?.id) return;
    try {
      const data = await savedViewService.getSavedViews(currentProject.id, viewType);
      setViews(data);
    } catch (error) {
      console.error('Failed to load saved views', error);
    }
  };

  const handleSaveView = async () => {
    if (!currentProject?.id || !viewName.trim()) return;
    try {
      await savedViewService.createSavedView({
        name: viewName,
        description: viewDescription,
        viewType,
        filterConfig: currentFilters,
        isShared,
        isDefault,
        projectId: currentProject.id,
      });
      setSaveDialogOpen(false);
      setViewName('');
      setViewDescription('');
      setIsShared(false);
      setIsDefault(false);
      loadViews();
    } catch (error) {
      console.error('Failed to save view', error);
    }
  };

  const handleLoadView = (view: SavedView) => {
    onLoadView(view.filterConfig);
    setAnchorEl(null);
  };

  const handleDeleteView = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved view?')) {
      try {
        await savedViewService.deleteSavedView(id);
        loadViews();
      } catch (error) {
        console.error('Failed to delete view', error);
      }
    }
  };

  const handleSetDefault = async (id: string, currentDefault: boolean) => {
    try {
      await savedViewService.updateSavedView(id, { isDefault: !currentDefault });
      loadViews();
    } catch (error) {
      console.error('Failed to update default view', error);
    }
  };

  return (
    <Box>
      <Button
        startIcon={<Bookmarks />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        variant="outlined"
        size="small"
      >
        Saved Views
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <MenuItem onClick={() => { setSaveDialogOpen(true); setAnchorEl(null); }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            💾 Save Current View
          </Typography>
        </MenuItem>
        <Divider />
        
        {views.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              No saved views yet
            </Typography>
          </MenuItem>
        ) : (
          <List dense disablePadding>
            {views.map((view) => (
              <ListItem
                key={view.id}
                button
                onClick={() => handleLoadView(view)}
                sx={{ py: 1 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {view.name}
                      {view.isDefault && <Chip label="Default" size="small" color="primary" />}
                    </Box>
                  }
                  secondary={view.description}
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(view.id, view.isDefault);
                      }}
                      title={view.isDefault ? 'Remove as default' : 'Set as default'}
                    >
                      {view.isDefault ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                    </IconButton>
                    {view.isShared ? <Public fontSize="small" /> : <Lock fontSize="small" />}
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteView(view.id);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Menu>

      {/* Save View Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Current View</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="View Name"
            fullWidth
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={viewDescription}
            onChange={(e) => setViewDescription(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
            }
            label="Share with team"
          />
          <FormControlLabel
            control={
              <Checkbox checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            }
            label="Set as default view"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveView} variant="contained" disabled={!viewName.trim()}>
            Save View
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedViewsManager;
