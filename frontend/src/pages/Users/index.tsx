import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Select, MenuItem, InputLabel, FormControl, Checkbox, Switch } from '@mui/material';
import userService from '../../services/user.service';
import projectService from '../../services/project.service';
import { RootState } from '../../store';

const UsersPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('TESTER');
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<{ projectId: string; selected: boolean; role: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const u = await userService.getUsers();
      setUsers(u.data || []);
      const p = await projectService.getProjects();
      setProjects(p.data || []);
    };
    load();
  }, []);

  const handleCreate = async () => {
    const res = await userService.createUser({ email, password, firstName, lastName, role });
    setUsers((prev) => [res.data, ...prev]);
    setOpen(false);
    setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setRole('TESTER');
  };

  const handleAssignProjects = async () => {
    if (!selectedUser) return;
    const payload = assignments
      .filter((a) => a.selected)
      .map((a) => ({ projectId: a.projectId, role: a.role }));
    await userService.updateUserProjects(selectedUser.id, { assignments: payload });
    setAssignOpen(false);
  };

  const handleChangeUserRole = async (uid: string, newRole: string) => {
    const res = await userService.updateUserRole(uid, newRole);
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role: res.data.role } : u)));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disabled={user?.role !== 'ADMIN' && user?.role !== 'TEST_MANAGER'}>
          Create User
        </Button>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.firstName} {u.lastName}</TableCell>
                <TableCell>
                  {user?.role === 'ADMIN' ? (
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel id={`role-${u.id}`}>Role</InputLabel>
                      <Select
                        labelId={`role-${u.id}`}
                        label="Role"
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u.id, e.target.value as string)}
                      >
                        <MenuItem value="ADMIN">ADMIN</MenuItem>
                        <MenuItem value="TEST_MANAGER">TEST_MANAGER</MenuItem>
                        <MenuItem value="TESTER">TESTER</MenuItem>
                        <MenuItem value="DEVELOPER">DEVELOPER</MenuItem>
                        <MenuItem value="VIEWER">VIEWER</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip label={u.role} />
                  )}
                </TableCell>
                <TableCell>
                  {user?.role === 'ADMIN' ? (
                    <Switch
                      checked={!!u.isActive}
                      onChange={async (e) => {
                        const res = await userService.setUserActive(u.id, e.target.checked);
                        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: res.data.isActive } : x)));
                      }}
                    />
                  ) : (
                    <Chip label={u.isActive ? 'Active' : 'Inactive'} size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => {
                    setSelectedUser(u);
                    setAssignments(projects.map((p) => ({ projectId: p.id, selected: false, role: 'TESTER' })));
                    setAssignOpen(true);
                  }}>Assign Projects</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <TextField label="Email" fullWidth sx={{ mt: 2 }} value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth sx={{ mt: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextField label="First Name" fullWidth sx={{ mt: 2 }} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextField label="Last Name" fullWidth sx={{ mt: 2 }} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select labelId="role-label" label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="TEST_MANAGER">TEST_MANAGER</MenuItem>
              <MenuItem value="TESTER">TESTER</MenuItem>
              <MenuItem value="DEVELOPER">DEVELOPER</MenuItem>
              <MenuItem value="VIEWER">VIEWER</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Projects & Roles</DialogTitle>
        <DialogContent>
          {projects.length === 0 ? (
            <Typography color="textSecondary" sx={{ mt: 2 }}>No projects available.</Typography>
          ) : (
            projects.map((p) => {
              const idx = assignments.findIndex((a) => a.projectId === p.id);
              const a = idx >= 0 ? assignments[idx] : { projectId: p.id, selected: false, role: 'TESTER' };
              return (
                <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                  <Checkbox
                    checked={a.selected}
                    onChange={(e) => setAssignments((prev) => {
                      const copy = [...prev];
                      const i = copy.findIndex((x) => x.projectId === p.id);
                      if (i >= 0) copy[i] = { ...copy[i], selected: e.target.checked };
                      else copy.push({ projectId: p.id, selected: e.target.checked, role: 'TESTER' });
                      return copy;
                    })}
                  />
                  <Typography sx={{ flex: 1 }}>{p.prefix} - {p.name}</Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id={`role-${p.id}`}>Project Role</InputLabel>
                    <Select
                      labelId={`role-${p.id}`}
                      label="Project Role"
                      value={a.role}
                      onChange={(e) => setAssignments((prev) => {
                        const copy = [...prev];
                        const i = copy.findIndex((x) => x.projectId === p.id);
                        if (i >= 0) copy[i] = { ...copy[i], role: e.target.value as string };
                        else copy.push({ projectId: p.id, selected: true, role: e.target.value as string });
                        return copy;
                      })}
                    >
                      <MenuItem value="PROJECT_ADMIN">PROJECT_ADMIN</MenuItem>
                      <MenuItem value="QA_MANAGER">QA_MANAGER</MenuItem>
                      <MenuItem value="TESTER">TESTER</MenuItem>
                      <MenuItem value="REVIEWER">REVIEWER</MenuItem>
                      <MenuItem value="VIEWER">VIEWER</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              );
            })
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignProjects}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
