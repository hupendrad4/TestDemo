import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import authService from '../../services/auth.service';
import { loginSuccess } from '../../store/slices/authSlice';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res: any = await authService.adminLogin({ email, password });
      const { user, token } = res.data;
      dispatch(loginSuccess({ user, token }));
      navigate('/settings');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Admin login failed');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img 
            src="/qualix.png" 
            alt="Qualix" 
            style={{ height: '70px', width: 'auto', maxWidth: '220px', objectFit: 'contain' }}
          />
        </Box>
        <Typography variant="h5" gutterBottom align="center">Admin Login</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>Only users with ADMIN role can sign in here.</Alert>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth>Sign In</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminLogin;
