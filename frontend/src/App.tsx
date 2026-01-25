import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminLogin from './pages/Auth/AdminLogin';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TestCases from './pages/TestCases';
import TestPlansPage from './pages/TestPlans/TestPlansPage';
import Executions from './pages/Executions';
import ExecuteTest from './pages/Executions/ExecuteTest';
import AssignExecution from './pages/Executions/AssignExecution';
import MyAssignedTests from './pages/Executions/MyAssignedTests';
import ExecutionWorkbench from './pages/Executions/ExecutionWorkbench';
import Requirements from './pages/Requirements/RequirementsPage';
import Defects from './pages/Defects/DefectsPage';
import Reports from './pages/Reports/ReportsPage';
import Settings from './pages/Settings';
import UsersPage from './pages/Users';
import AdminMetrics from './pages/Admin/Metrics';
import AuditLogs from './pages/Admin/AuditLogs';
import Watchlist from './pages/Watchlist';
import Milestones from './pages/Executions/Milestones';

const App: React.FC = () => {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
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
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="test-cases" element={<TestCases />} />
            <Route path="test-plans" element={<TestPlansPage />} />
            <Route path="executions" element={<Executions />} />
            <Route path="executions/execute" element={<ExecuteTest />} />
            <Route path="executions/assign" element={<AssignExecution />} />
            <Route path="executions/my-tests" element={<MyAssignedTests />} />
            <Route path="executions/milestones" element={<Milestones />} />
            <Route path="executions/:executionId" element={<ExecutionWorkbench />} />
            <Route path="requirements" element={<Requirements />} />
            <Route path="defects" element={<Defects />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="admin/metrics" element={<AdminMetrics />} />
            <Route path="admin/audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </>
  );
};

export default App;
