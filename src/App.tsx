import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import QuestionnairePage from "./pages/QuestionnairePage";
import SummaryPage from "./pages/SummaryPage";
import RequireAuth from "./routes/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="questionnaire" replace />} />
        <Route path="questionnaire" element={<QuestionnairePage />} />
        <Route path="summary" element={<SummaryPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
