// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import QuestionnairePage from "./pages/QuestionnairePage";
import SummaryPage from "./pages/SummaryPage";
import RequireAuth from "./routes/RequireAuth";

import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected app */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        {/* Home of dashboard */}
        <Route index element={<Navigate to="summary" replace />} />
        <Route path="questionnaire" element={<QuestionnairePage />} />
        <Route path="summary" element={<SummaryPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
