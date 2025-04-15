
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Index from '@/pages/Index';
import Flights from '@/pages/Flights';
import FlightSummary from '@/pages/FlightSummary';
import Maintenance from '@/pages/Maintenance';
import RouteAnalytics from '@/pages/RouteAnalytics';
import FuelAnalysis from '@/pages/FuelAnalysis';
import PassengerSummary from '@/pages/PassengerSummary';
import Settings from '@/pages/Settings';
import Safety from '@/pages/Safety';
import Profile from '@/pages/Profile';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Toaster as ToastUIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import Unauthorized from '@/pages/Unauthorized';
import { SafetyForm } from '@/components/safety/SafetyForm';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminAccessTroubleshooting from '@/pages/AdminAccessTroubleshooting';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/flights" element={
          <ProtectedRoute>
            <Flights />
          </ProtectedRoute>
        } />
        <Route path="/flights/:id" element={
          <ProtectedRoute>
            <Flights />
          </ProtectedRoute>
        } />
        <Route path="/flight-summary" element={
          <ProtectedRoute>
            <FlightSummary />
          </ProtectedRoute>
        } />
        <Route path="/flight-summary/:aircraftId" element={
          <ProtectedRoute>
            <FlightSummary />
          </ProtectedRoute>
        } />
        <Route path="/maintenance" element={
          <ProtectedRoute>
            <Maintenance />
          </ProtectedRoute>
        } />
        <Route path="/route-analytics" element={
          <ProtectedRoute>
            <RouteAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/fuel-analysis" element={
          <ProtectedRoute>
            <FuelAnalysis />
          </ProtectedRoute>
        } />
        <Route path="/passenger-summary" element={
          <ProtectedRoute>
            <PassengerSummary />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        } />
        <Route path="/safety" element={
          <ProtectedRoute>
            <Safety />
          </ProtectedRoute>
        } />
        <Route path="/safety/:id" element={
          <ProtectedRoute>
            <SafetyForm />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="admin/dashboard" element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="admin/access-fix" element={
          <ProtectedRoute>
            <AdminAccessTroubleshooting />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastUIToaster />
      <SonnerToaster />
    </>
  );
}

export default App;
