import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./i18n";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import caregivers from "./pages/Caregivers";
import Trips from "./pages/Trips";
import Payments from "./pages/Payments";
import Withdrawals from "./pages/Withdrawals";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import CreateAccount from "./pages/CreateAccount";
import NotFound from "./pages/NotFound";
import Admins from "./pages/Admins";
import Settings from "./pages/Settings";
import SettingsHistory from "./pages/SettingsHistory";
import Caregivers from "./pages/Caregivers";

const queryClient = new QueryClient();

function RequireAdmin({ children }: { children: JSX.Element }) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_role') : null;
  if (!token || role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
          <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
          <Route path="/caregivers" element={<RequireAdmin><Caregivers /></RequireAdmin>} />
          <Route path="/trips" element={<RequireAdmin><Trips /></RequireAdmin>} />
          <Route path="/payments" element={<RequireAdmin><Payments /></RequireAdmin>} />
          <Route path="/withdrawals" element={<RequireAdmin><Withdrawals /></RequireAdmin>} />
          <Route path="/reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
          <Route path="/profile" element={<RequireAdmin><Profile /></RequireAdmin>} />
          <Route path="/create-account" element={<RequireAdmin><CreateAccount /></RequireAdmin>} />
          <Route path="/admins" element={<RequireAdmin><Admins /></RequireAdmin>} />
          <Route path="/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
          <Route path="/settings/history" element={<RequireAdmin><SettingsHistory /></RequireAdmin>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
