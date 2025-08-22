import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import BusinessDashboard from './pages/BusinessDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ProjectDetails from './pages/ProjectDetails';
import ProjectManagement from './pages/ProjectManagement';
import ClientManagement from './pages/ClientManagement';
import TaskManagement from './pages/TaskManagement';
import ContractManagement from './pages/ContractManagement';
import MessagingCenter from './pages/MessagingCenter';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SignUpPage from './pages/SignUpPage';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  function AppRoutes() {
    const { user, loading, isPasswordResetFlowActive } = useAuth();

    // If we're in a password reset flow, always show the reset page
    if (isPasswordResetFlowActive) {
      return (
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/reset-password" replace />} />
        </Routes>
      );
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <div className="ml-4">
            <p className="text-gray-600">Loading your account...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      );
    }

    // Debug log to verify user role
    console.log('🔍 User role detected:', `'${user.role}'`, 'Length:', user.role.length);
    const userRole = user.role.trim();
    console.log('🔍 Trimmed user role:', `'${userRole}'`, 'Length:', userRole.length);
    
    return (
      <Routes>
        {userRole === 'client' && (
          <>
            <Route path="/" element={<ClientDashboard />} />
            <Route path="/projects" element={<ProjectManagement />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/contracts" element={<ContractManagement />} />
            <Route path="/messages" element={<MessagingCenter />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
        {(userRole === 'business_owner' || userRole === 'team_member') && (
          <>
            <Route path="/" element={<BusinessDashboard />} />
            <Route path="/projects" element={<ProjectManagement />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/contracts" element={<ContractManagement />} />
            <Route path="/messages" element={<MessagingCenter />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
        {userRole !== 'client' && userRole !== 'business_owner' && userRole !== 'team_member' && (
          <Route path="*" element={
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Unknown User Role</h2>
                <p className="text-gray-600 mb-4">Role: '{user.role}' (trimmed: '{userRole}')</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          } />
        )}
      </Routes>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <div className="min-h-screen bg-stone-50">
            <AppRoutes />
          </div>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;