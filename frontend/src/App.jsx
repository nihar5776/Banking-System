import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Register from "@/pages/Register";
import VerifyOtp from "@/pages/VerifyOtp";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Transfer from "@/pages/Transfer";
import AdminDashboard from "@/pages/AdminDashboard";
import Transactions from "@/pages/Transactions";
import Statements from "@/pages/Statements";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        {/* Sidebar nav routes */}
        <Route path="/accounts" element={<Dashboard />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
