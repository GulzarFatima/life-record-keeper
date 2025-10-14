
import "./styles/app.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import NewRecordPage from "./pages/NewRecordPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import AdminLoginPage from "@/pages/AdminLoginPage.jsx";
import AdminDashboard from "@/pages/admin/AdminDashboard.jsx";
import VerifyPage from "@/pages/VerifyPage.jsx";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage.jsx";
import ChangePasswordPage from "@/pages/ChangePasswordPage.jsx";
import AccountSettingsPage from "@/pages/AccountSettingsPage.jsx";
import SubheaderTabs from "./components/SubheaderTabs.jsx";
import About from "@/pages/About.jsx";
import Support from "@/pages/Support.jsx";

import { useAuth } from "@/lib/use-auth.js";


export default function App() {
    const { user } = useAuth();
  return (
    <div className="app">
      <Navbar />
      {user && <SubheaderTabs />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/categories/Education" replace />} />

          {/* public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />

          <Route path="/verify" element={<VerifyPage />} />
            {/* public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            {/* public info pages */}
            <Route path="/pages/About" element={<About />} />
            <Route path="/pages/Support" element={<Support />} />


          {/* user protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/categories/:categoryName" element={<CategoryPage />} />
            <Route path="/categories/:categoryName/new" element={<NewRecordPage />} />
            <Route path="/account/security" element={<ChangePasswordPage />} />
            <Route path="/account/settings" element={<AccountSettingsPage />} />
          </Route>

           {/* admin protected */}
           <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

          <Route path="/admin/login" element={<AdminLoginPage />} />

        </Routes>
      </main>
    </div>
  );
}
