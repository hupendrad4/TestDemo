import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Description as TestCaseIcon,
  FolderOpen as SuiteIcon,
  Assignment as RequirementIcon,
  PlaylistAddCheck as PlanIcon,
  PlayArrow as RunIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CreateMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreate = (type: string) => {
    handleClose();
    
    switch (type) {
      case 'testCase':
        navigate('/test-cases', { state: { openCreateDialog: true } });
        break;
      case 'testSuite':
        navigate('/test-cases', { state: { openCreateDialog: true } });
        break;
      case 'testPlan':
        navigate('/test-plans', { state: { openCreateDialog: true } });
        break;
      case 'testRun':
        navigate('/executions', { state: { openCreateDialog: true } });
        break;
      case 'requirement':
        navigate('/requirements', { state: { openCreateDialog: true } });
        break;
      case 'defect':
        navigate('/defects', { state: { openCreateDialog: true } });
        break;
    }
  };

  return (
    <>
      <IconButton
        color="primary"
        onClick={handleClick}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': { bgcolor: 'primary.dark' }
        }}
      >
        <AddIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 220 }
        }}
      >
        <MenuItem onClick={() => handleCreate('testCase')}>
          <ListItemIcon>
            <TestCaseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Test Case</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleCreate('testSuite')}>
          <ListItemIcon>
            <SuiteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Test Suite</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleCreate('testPlan')}>
          <ListItemIcon>
            <PlanIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Test Plan</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleCreate('testRun')}>
          <ListItemIcon>
            <RunIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Test Run</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleCreate('requirement')}>
          <ListItemIcon>
            <RequirementIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Requirement</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default CreateMenu;
