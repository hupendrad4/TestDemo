import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminLogin from './pages/Auth/AdminLogin';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TestCases from './pages/TestCases';
import TestPlans from './pages/TestPlans';
import Executions from './pages/Executions';
import Requirements from './pages/Requirements';
import Defects from './pages/Defects';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UsersPage from './pages/Users';
import AdminMetrics from './pages/Admin/Metrics';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Private Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="test-cases" element={<TestCases />} />
          <Route path="test-plans" element={<TestPlans />} />
          <Route path="executions" element={<Executions />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="defects" element={<Defects />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="admin/metrics" element={<AdminMetrics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Box>
  );
};

export default App;
