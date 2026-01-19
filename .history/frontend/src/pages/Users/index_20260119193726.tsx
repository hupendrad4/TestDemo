import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Chip, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Checkbox, 
  Switch,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Stack,
} from '@mui/material';
import { toast } from 'react-toastify';
import LockResetIcon from '@mui/icons-material/LockReset';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import userService from '../../services/user.service';
import projectService from '../../services/project.service';
import { RootState } from '../../store';

const UsersPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create User Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('TESTER');
  
  // Assign Projects Dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [userCurrentProjects, setUserCurrentProjects] = useState<any[]>([]);
  
  // Reset Password Dialog
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        userService.getUsers(),
        projectService.getProjects(),
      ]);
      const usersArray = Array.isArray(usersRes) ? usersRes : (usersRes?.data || []);
      const projectsArray = Array.isArray(projectsRes) ? projectsRes : (projectsRes?.data || []);
      setUsers(usersArray);
      setProjects(projectsArray);
    } catch (error: any) {
      console.error('Failed to load data', error);
      toast.error(error?.message || 'Failed to load users and projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    
    try {
      const res = await userService.createUser({ 
        email: email.trim(), 
        password, 
        firstName: firstName.trim() || undefined, 
        lastName: lastName.trim() || undefined, 
        role 
      });
      const newUser = res?.data || res;
      setUsers((prev) => [newUser, ...prev]);
      toast.success(`User created successfully with role: ${role}`);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error: any) {
      console.error('Failed to create user', error);
      toast.error(error?.message || 'Failed to create user');
    }
  };

  const resetCreateForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRole('TESTER');
  };

  const handleOpenAssignProjects = async (u: any) => {
    setSelectedUser(u);
    try {
      const res = await userService.getUserProjects(u.id);
      const currentProjects = Array.isArray(res) ? res : (res?.data || []);
      setUserCurrentProjects(currentProjects);
      setSelectedProjects(currentProjects.map((p: any) => p.id));
      setAssignOpen(true);
    } catch (error: any) {
      console.error('Failed to load user projects', error);
      toast.error('Failed to load user projects');
      setUserCurrentProjects([]);
      setSelectedProjects([]);
      setAssignOpen(true);
    }
  };

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map((p) => p.id));
    }
  };

  const handleAssignProjects = async () => {
    if (!selectedUser) return;
    
    try {
      const assignments = selectedProjects.map((projectId) => ({
        projectId,
        role: 'TESTER', // Default project role
      }));
      
      await userService.updateUserProjects(selectedUser.id, { assignments });
      toast.success(`Projects assigned successfully to ${selectedUser.email}`);
      setAssignOpen(false);
      setSelectedUser(null);
      setSelectedProjects([]);
      loadData(); // Reload to get updated data
    } catch (error: any) {
      console.error('Failed to assign projects', error);
      toast.error(error?.message || 'Failed to assign projects');
    }
  };

  const handleToggleActive = async (u: any, isActive: boolean) => {
    try {
      await userService.setUserActive(u.id, isActive);
      setUsers((prev) =>
        prev.map((user) => (user.id === u.id ? { ...user, isActive } : user))
      );
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Failed to update user status', error);
      toast.error(error?.message || 'Failed to update user status');
    }
  };

  const handleOpenResetPassword = (u: any) => {
    setResetPwdUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setResetPwdOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPwdUser) return;
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      await userService.resetUserPassword(resetPwdUser.id, newPassword);
      toast.success(`Password reset successfully for ${resetPwdUser.email}`);
      setResetPwdOpen(false);
      setResetPwdUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to reset password', error);
      toast.error(error?.message || 'Failed to reset password');
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const canManageUsers = isAdmin || user?.role === 'TEST_MANAGER';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Users Management</Typography>
        <Button 
          variant="contained" 
          onClick={() => setCreateOpen(true)} 
          disabled={!canManageUsers}
        >
          Create User
        </Button>
      </Box>

      {!canManageUsers && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You don't have permission to manage users. Contact your administrator.
        </Alert>
      )}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Active</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary" sx={{ py: 3 }}>
                    {loading ? 'Loading users...' : 'No users found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  {u.firstName || u.lastName ? (
                    `${u.firstName || ''} ${u.lastName || ''}`.trim()
                  ) : (
                    <Typography color="textSecondary" fontStyle="italic">
                      Not set
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={u.role} 
                    size="small" 
                    color={u.role === 'ADMIN' ? 'error' : u.role === 'TEST_MANAGER' ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Switch
                      checked={!!u.isActive}
                      onChange={(e) => handleToggleActive(u, e.target.checked)}
                      size="small"
                    />
                  ) : (
                    <Chip 
                      label={u.isActive ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={u.isActive ? 'success' : 'default'}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Assign Projects">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAssignProjects(u)}
                        disabled={!canManageUsers}
                        color="primary"
                      >
                        <AssignmentIndIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {isAdmin && (
                      <Tooltip title="Reset Password">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenResetPassword(u)}
                          color="secondary"
                        >
                          <LockResetIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField 
            label="Email" 
            type="email"
            fullWidth 
            margin="normal"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <TextField 
            label="Password" 
            type="password" 
            fullWidth 
            margin="normal"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            helperText="Minimum 6 characters"
          />
          <TextField 
            label="First Name" 
            fullWidth 
            margin="normal"
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
          />
          <TextField 
            label="Last Name" 
            fullWidth 
            margin="normal"
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Role</InputLabel>
            <Select 
              label="Role" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="ADMIN">ADMIN - Full system access</MenuItem>
              <MenuItem value="TEST_MANAGER">TEST_MANAGER - Manage tests and users</MenuItem>
              <MenuItem value="TESTER">TESTER - Execute and create tests</MenuItem>
              <MenuItem value="DEVELOPER">DEVELOPER - View and comment</MenuItem>
              <MenuItem value="VIEWER">VIEWER - Read-only access</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 2 }}>
            User role is set at creation time and cannot be changed from this page. 
            Contact system administrator if role change is needed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); resetCreateForm(); }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateUser}
            disabled={!email.trim() || !password.trim()}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Projects Dialog */}
      <Dialog 
        open={assignOpen} 
        onClose={() => setAssignOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Assign Projects to {selectedUser?.email}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Select projects to assign ({selectedProjects.length} selected)
            </Typography>
            {projects.length > 0 && (
              <Button
                size="small"
                onClick={handleSelectAllProjects}
              >
                {selectedProjects.length === projects.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </Box>
          
          {projects.length === 0 ? (
            <Alert severity="info">
              No projects available. Create projects first to assign them to users.
            </Alert>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {projects.map((project) => (
                <ListItem 
                  key={project.id} 
                  button 
                  onClick={() => handleToggleProject(project.id)}
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1, 
                    mb: 1,
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    edge="start"
                  />
                  <ListItemText
                    primary={`${project.prefix} - ${project.name}`}
                    secondary={project.description || 'No description'}
                  />
                  {userCurrentProjects.some((p) => p.id === project.id) && (
                    <Chip label="Currently Assigned" size="small" color="success" />
                  )}
                </ListItem>
              ))}
            </List>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Selected projects will be visible in the project dropdown when this user logs in.
            Unselected projects will be removed from their access.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssignProjects}
            disabled={projects.length === 0}
          >
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog 
        open={resetPwdOpen} 
        onClose={() => setResetPwdOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Reset Password for {resetPwdUser?.email}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are about to reset the password for this user. They will need to use this new password to log in.
          </Alert>
          
          <TextField 
            label="New Password" 
            type="password" 
            fullWidth 
            margin="normal"
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            required
            helperText="Minimum 6 characters"
          />
          <TextField 
            label="Confirm Password" 
            type="password" 
            fullWidth 
            margin="normal"
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required
            error={confirmPassword !== '' && newPassword !== confirmPassword}
            helperText={
              confirmPassword !== '' && newPassword !== confirmPassword 
                ? 'Passwords do not match' 
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPwdOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleResetPassword}
            disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 6}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
