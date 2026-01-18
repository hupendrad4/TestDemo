import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import projectService from '../../services/project.service';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const Projects: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [projects, setProjects] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await projectService.getProjects();
      setProjects(res?.data || []);
    };
    load();
  }, []);

  const handleCreate = async () => {
    const res = await projectService.createProject({ name, prefix, description, isPublic });
    setProjects((prev) => [res.data, ...prev]);
    setOpen(false);
    setName(''); setPrefix(''); setDescription(''); setIsPublic(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Projects</Typography>
        {(user?.role === 'ADMIN' || user?.role === 'TEST_MANAGER') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            New Project
          </Button>
        )}
      </Box>
      <Paper sx={{ p: 3 }}>
        {projects.length === 0 ? (
          <Typography color="textSecondary" align="center">
            No projects found. Create your first project!
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Prefix</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Public</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.prefix}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.isPublic ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{new Date(p.createdAt || Date.now()).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth sx={{ mt: 2 }} value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Prefix" fullWidth sx={{ mt: 2 }} value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} />
          <TextField label="Description" fullWidth multiline rows={3} sx={{ mt: 2 }} value={description} onChange={(e) => setDescription(e.target.value)} />
          <FormControlLabel control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />} label="Public" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name || !prefix}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;
