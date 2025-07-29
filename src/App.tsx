
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProfileProviderV3 } from "./hooks/profile/ProfileProviderV3";
import { DarkModeProvider } from "./components/providers/DarkModeProvider";
import Navigation from "./components/Navigation";
import AdminBackfill from "./pages/AdminBackfill";
import AdminDashboard from "./pages/AdminDashboard";
import ProcessInvestors from "./pages/ProcessInvestors";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Companies from "./pages/Companies";
import CompanyProfile from "./pages/CompanyProfile";
import Investors from "./pages/Investors";
import InvestorProfile from "./pages/InvestorProfile";
import Pricing from "./pages/Pricing";
import UpgradePlan from "./pages/UpgradePlan";
import UpgradeSuccess from "./pages/UpgradeSuccess";
import HowItWorks from "./pages/HowItWorks";
import Library from "./pages/Library";
import AboutUs from "./pages/AboutUs";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Login from "./pages/Login";
import AuthFree from "./pages/AuthFree";
import AuthStandard from "./pages/AuthStandard";
import AuthPremium from "./pages/AuthPremium";
import AuthPremiumPro from "./pages/AuthPremiumPro";
import AuthEnterprise from "./pages/AuthEnterprise";
import AuthSuccess from "./pages/AuthSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DarkModeProvider>
          <AuthProvider>
            <ProfileProviderV3>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/company/:id" element={<CompanyProfile />} />
                  <Route path="/investors" element={<Investors />} />
                  <Route path="/investor/:id" element={<InvestorProfile />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/upgrade-plan" element={<UpgradePlan />} />
                  <Route path="/upgrade/success" element={<UpgradeSuccess />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/help-center" element={<HelpCenter />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth-free" element={<AuthFree />} />
                  <Route path="/auth-standard" element={<AuthStandard />} />
                  <Route path="/auth-premium" element={<AuthPremium />} />
                  <Route path="/auth-premium-pro" element={<AuthPremiumPro />} />
                  <Route path="/auth-enterprise" element={<AuthEnterprise />} />
                  <Route path="/auth-success" element={<AuthSuccess />} />
                  <Route path="/process-investors" element={<ProcessInvestors />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/backfill" element={<AdminBackfill />} />
                </Routes>
              </main>
            </div>
          </ProfileProviderV3>
        </AuthProvider>
      </DarkModeProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;
