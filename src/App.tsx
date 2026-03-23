/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Solve from './pages/Solve';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center text-xl font-bold text-indigo-600">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center sm:py-8 transition-colors duration-300">
        <div className="w-full h-screen sm:w-[400px] sm:h-[800px] bg-slate-50 dark:bg-slate-900 sm:rounded-[3rem] sm:border-[12px] border-slate-900 dark:border-slate-800 overflow-hidden relative shadow-2xl flex flex-col transition-colors duration-300">
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Chat />} />
                <Route path="profile" element={<Profile />} />
                <Route path="solve" element={<Solve />} />
              </Route>
            </Routes>
          </Router>
        </div>
      </div>
    </AuthProvider>
  );
}
