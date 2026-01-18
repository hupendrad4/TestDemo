import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Collapse,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  FolderOpen as ProjectsIcon,
  Description as TestCasesIcon,
  PlaylistAddCheck as TestPlansIcon,
  PlayCircleOutline as ExecutionsIcon,
  Assignment as RequirementsIcon,
  BugReport as DefectsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  People as UsersIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import projectService from '../services/project.service';
import { setProjects, setCurrentProject } from '../store/slices/projectSlice';

const drawerWidth = 260;

type MenuItemConfig = {
  text: string;
  icon: React.ReactNode;
  path: string;
};

type MenuSectionConfig = {
  id: string;
  label: string;
  items: MenuItemConfig[];
};

const baseMenuSections: MenuSectionConfig[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
    ],
  },
  {
    id: 'design',
    label: 'Test Design',
    items: [
      { text: 'Requirements', icon: <RequirementsIcon />, path: '/requirements' },
      { text: 'Test Cases', icon: <TestCasesIcon />, path: '/test-cases' },
      { text: 'Test Plans', icon: <TestPlansIcon />, path: '/test-plans' },
    ],
  },
  {
    id: 'execution',
    label: 'Test Execution',
    items: [
      { text: 'Executions', icon: <ExecutionsIcon />, path: '/executions' },
      { text: 'Defects', icon: <DefectsIcon />, path: '/defects' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ],
  },
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { projects, currentProject } = useSelector((state: RootState) => state.projects);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const init = async () => {
      try {
        const storedProjectId = localStorage.getItem('currentProjectId');
        const res: any = user?.role === 'ADMIN' ? await projectService.getProjects() : await projectService.getMyProjects();
        const list = Array.isArray(res?.data) ? res.data : [];
        dispatch(setProjects(list));
        if (storedProjectId) {
          const found = list.find((p: any) => p.id === storedProjectId);
          if (found) {
            dispatch(setCurrentProject(found));
          }
        } else if (list.length > 0 && !currentProject) {
          dispatch(setCurrentProject(list[0]));
          localStorage.setItem('currentProjectId', list[0].id);
        }
      } catch (e) {
        // handled by interceptor
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user?.role]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleProjectChange = (event: SelectChangeEvent) => {
    const id = event.target.value as string;
    const selected = projects.find((p) => p.id === id) || null;
    dispatch(setCurrentProject(selected));
    if (selected) {
      localStorage.setItem('currentProjectId', selected.id);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  };

  const isPathActive = React.useCallback(
    (path: string) => {
      if (location.pathname === path) {
        return true;
      }
      return location.pathname.startsWith(`${path}/`);
    },
    [location.pathname]
  );

  const menuSections = React.useMemo(() => {
    const sections = baseMenuSections.map((section) => ({
      ...section,
      items: [...section.items],
    }));

    const adminSection = sections.find((section) => section.id === 'administration');

    if (adminSection) {
      const adminItems: MenuItemConfig[] = [];
      if (user?.role === 'ADMIN') {
        adminItems.push({ text: 'Admin Metrics', icon: <ReportsIcon />, path: '/admin/metrics' });
      }
      if (user?.role === 'ADMIN' || user?.role === 'TEST_MANAGER') {
        adminItems.push({ text: 'Users', icon: <UsersIcon />, path: '/users' });
      }
      adminSection.items = [...adminItems, ...adminSection.items];
    }

    return sections.filter((section) => section.items.length > 0);
  }, [user?.role]);

  useEffect(() => {
    const activeSection = menuSections.find((section) =>
      section.items.some((item) => isPathActive(item.path))
    );
    if (activeSection) {
      setExpandedSections((prev) => ({ ...prev, [activeSection.id]: true }));
    }
  }, [location.pathname, menuSections, isPathActive]);

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          TestDemo
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ py: 1 }}>
        {menuSections.map((section, index) => (
          <React.Fragment key={section.id}>
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleSectionToggle(section.id)}
                  sx={{
                    borderRadius: 1,
                    mx: 1.5,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={section.label}
                    primaryTypographyProps={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}
                  />
                  {expandedSections[section.id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </ListItemButton>
              </ListItem>
              <Collapse in={Boolean(expandedSections[section.id])} timeout="auto" unmountOnExit>
                <List disablePadding>
              {section.items.map((item) => {
                const active = isPathActive(item.path);
                return (
                  <ListItem key={item.text} disablePadding sx={{ py: 0.25 }}>
                  <ListItemButton
                    selected={active}
                    onClick={() => {
                      navigate(item.path);
                      if (mobileOpen) {
                        setMobileOpen(false);
                      }
                    }}
                    sx={{
                      borderRadius: 1,
                      mx: 1.5,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.main',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
                    />
                  </ListItemButton>
                  </ListItem>
                );
              })}
                </List>
              </Collapse>
            </List>
            {index < menuSections.length - 1 && <Divider sx={{ my: 1.5 }} />}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="project-select-label">Project</InputLabel>
              <Select
                labelId="project-select-label"
                value={currentProject?.id || ''}
                label="Project"
                onChange={handleProjectChange}
              >
                {(Array.isArray(projects) ? projects : []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.prefix} - {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2">
              {user?.firstName} {user?.lastName}
            </Typography>
            <IconButton onClick={handleMenu} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.firstName?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                <SettingsIcon sx={{ mr: 2 }} fontSize="small" />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2 }} fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
