
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth
import { AdminLogin, ProtectedRoute } from './modules/auth';

// Modül Entry
import ModulePage from './modules/launch/pages/LaunchListPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin redirectPath="/launch" />} />
        <Route path="/launch" element={<ProtectedRoute element={<ModulePage />} />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
};
export default App;
