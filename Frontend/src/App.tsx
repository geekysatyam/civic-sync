import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import OfflineWatcher from "@/components/OfflineWatcher";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layouts/ProtectedRoute";
import RoleLayout from "@/components/layouts/RoleLayout";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import CompleteProfile from "./pages/CompleteProfile";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Offline from "./pages/Offline";
import Feed from "./pages/Feed";
import PostIssue from "./pages/PostIssue";
import IssueDetail from "./pages/IssueDetail";
import Profile from "./pages/Profile";
import Volunteer from "./pages/Volunteer";
import Polls from "./pages/Polls";
import Karma from "./pages/Karma";
import Notifications from "./pages/Notifications";
import VerifyCertificate from "./pages/VerifyCertificate";
import Leaderboard from "./pages/Leaderboard";

import GhostAudits from "./pages/GhostAudits";
import MayorTasks from "./pages/gov/MayorTasks";
import MayorHeatmap from "./pages/gov/MayorHeatmap";
import MayorScorecard from "./pages/gov/MayorScorecard";
import MayorPredictive from "./pages/gov/MayorPredictive";
import MayorSLA from "./pages/gov/MayorSLA";
import MayorCSR from "./pages/gov/MayorCSR";
import MayorCityLeaderboard from "./pages/gov/MayorCityLeaderboard";

import StateHeatmap from "./pages/gov/StateHeatmap";
import StateCityLeaderboard from "./pages/gov/StateCityLeaderboard";
import StateContractorStatus from "./pages/gov/StateContractorStatus";
import StateDepartments from "./pages/gov/StateDepartments";
import StateUsersLeaderboard from "./pages/gov/StateUsersLeaderboard";
import StateTrends from "./pages/gov/StateTrends";
import StateEmergency from "./pages/gov/StateEmergency";
import AdminModeration from "./pages/gov/AdminModeration";
import PlatformAdminDashboard from "./pages/gov/PlatformAdminDashboard";
import ArticleModeration from "./pages/gov/ArticleModeration";
import MayorContractors from "./pages/gov/MayorContractors";
import MayorDeptHeads from "./pages/gov/MayorDeptHeads";
import ArticleWrite from "./pages/articles/ArticleWrite";
import MyArticles from "./pages/articles/MyArticles";
import ContractorPanel from "./pages/contractor/ContractorPanel";
import DeptHeadDashboard from "./pages/dept-head/DeptHeadDashboard";
import PublicCityStats from "./pages/PublicCityStats";
import { ArticleAuthorRoute } from "./components/layouts/ArticleAuthorRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OfflineWatcher />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/verify" element={<Navigate to="/" replace />} />
            <Route path="/verify/:serial" element={<VerifyCertificate />} />
            <Route path="/city/:slug/stats" element={<PublicCityStats />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/auth/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            {/* Authenticated routes with layout */}
            <Route element={<ProtectedRoute><RoleLayout /></ProtectedRoute>}>
              {/* Citizen */}
              <Route path="/feed" element={<Feed />} />
              <Route path="/post" element={<PostIssue />} />
              <Route path="/issue/:id" element={<IssueDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/volunteer" element={<Volunteer />} />
              <Route path="/polls" element={<Polls />} />
              <Route path="/karma" element={<Karma />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/ghost-audits" element={<GhostAudits />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/articles/write"
                element={
                  <ArticleAuthorRoute>
                    <ArticleWrite />
                  </ArticleAuthorRoute>
                }
              />
              <Route
                path="/articles/mine"
                element={
                  <ArticleAuthorRoute>
                    <MyArticles />
                  </ArticleAuthorRoute>
                }
              />

              {/* Mayor */}
              <Route path="/gov/mayor" element={<ProtectedRoute allowedRoles={['mayor']}><MayorTasks /></ProtectedRoute>} />
              <Route path="/gov/mayor/heatmap" element={<ProtectedRoute allowedRoles={['mayor']}><MayorHeatmap /></ProtectedRoute>} />
              <Route path="/gov/mayor/scorecard" element={<ProtectedRoute allowedRoles={['mayor']}><MayorScorecard /></ProtectedRoute>} />
              <Route path="/gov/mayor/predictive" element={<ProtectedRoute allowedRoles={['mayor']}><MayorPredictive /></ProtectedRoute>} />
              <Route path="/gov/mayor/sla" element={<ProtectedRoute allowedRoles={['mayor']}><MayorSLA /></ProtectedRoute>} />
              <Route path="/gov/mayor/csr" element={<ProtectedRoute allowedRoles={['mayor']}><MayorCSR /></ProtectedRoute>} />
              <Route path="/gov/mayor/contractors" element={<ProtectedRoute allowedRoles={['mayor']}><MayorContractors /></ProtectedRoute>} />
              <Route path="/gov/mayor/dept-heads" element={<ProtectedRoute allowedRoles={['mayor']}><MayorDeptHeads /></ProtectedRoute>} />
              <Route path="/gov/mayor/leaderboard" element={<ProtectedRoute allowedRoles={['mayor']}><MayorCityLeaderboard /></ProtectedRoute>} />

              {/* State Admin */}
              <Route path="/gov/state" element={<ProtectedRoute allowedRoles={['state_admin']}><StateHeatmap /></ProtectedRoute>} />
              <Route path="/gov/state/leaderboard" element={<ProtectedRoute allowedRoles={['state_admin']}><StateCityLeaderboard /></ProtectedRoute>} />
              <Route path="/gov/state/citizens" element={<ProtectedRoute allowedRoles={['state_admin']}><StateUsersLeaderboard /></ProtectedRoute>} />
              <Route path="/gov/state/contractors" element={<ProtectedRoute allowedRoles={['state_admin']}><StateContractorStatus /></ProtectedRoute>} />
              <Route path="/gov/state/departments" element={<ProtectedRoute allowedRoles={['state_admin']}><StateDepartments /></ProtectedRoute>} />
              <Route path="/gov/state/moderation" element={<ProtectedRoute allowedRoles={['state_admin']}><ArticleModeration title="State — article moderation" /></ProtectedRoute>} />
              <Route path="/gov/state/trends" element={<ProtectedRoute allowedRoles={['state_admin']}><StateTrends /></ProtectedRoute>} />
              <Route path="/gov/state/emergency" element={<ProtectedRoute allowedRoles={['state_admin']}><StateEmergency /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/gov/admin" element={<ProtectedRoute allowedRoles={['admin']}><PlatformAdminDashboard /></ProtectedRoute>} />
              <Route path="/gov/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><PlatformAdminDashboard /></ProtectedRoute>} />
              <Route path="/gov/admin/moderation" element={<ProtectedRoute allowedRoles={['admin']}><AdminModeration /></ProtectedRoute>} />

              {/* Contractor */}
              <Route path="/contractor" element={<ProtectedRoute allowedRoles={['contractor']}><ContractorPanel /></ProtectedRoute>} />

              {/* Department Head */}
              <Route path="/dept-head" element={<ProtectedRoute allowedRoles={['department_head']}><DeptHeadDashboard /></ProtectedRoute>} />
              <Route path="/dept-head/stats" element={<ProtectedRoute allowedRoles={['department_head']}><DeptHeadDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
