import { useState, useEffect } from "react";
import { MantineProvider } from "@mantine/core";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { CompactProvider } from "./contexts/CompactContext";
import { Navigation } from "./components/Navigation";
import { FloatingSidebar } from "./components/FloatingSidebar";
import { AccountModal } from "./components/AccountModal";
import { ScrollToTop } from "./components/ScrollToTop";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { TenantManagementPage } from "./pages/TenantManagementPage";
import { OperatorManagementPage } from "./pages/OperatorManagementPage";
import { DocumentManagementPage } from "./pages/DocumentManagementPage";
import { TransactionHistoryPage } from "./pages/TransactionHistoryPage";
import { DocumentVerifyPage } from "./pages/DocumentVerifyPage";
import { DocumentationPage } from "./pages/DocumentationPage";
import { EndUserPage } from "./pages/EndUserPage";
import { OperatorDocsPage } from "./pages/OperatorDocsPage";
import { CoSignPolicyPage } from "./pages/CoSignPolicyPage";
import { ViolationPenaltyPage } from "./pages/ViolationPenaltyPage";
import { QuickSearchDialog } from "./components/QuickSearchDialog";

function AppContent() {
  const { session, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<string>("");

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setQuickSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPage === "home") {
    return (
      <>
        <HomePage onNavigate={setCurrentPage} />
        <ScrollToTop />
      </>
    );
  }

  if (currentPage === "login") {
    return (
      <>
        <LoginPage onSuccess={() => setCurrentPage("dashboard")} />
        <ScrollToTop />
      </>
    );
  }

  const canViewMySignatures = session?.role === "tenant_operator";

  const navItems = getNavItems();

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "tenants":
        return <TenantManagementPage />;
      case "operators":
        return <OperatorManagementPage />;
      case "documents":
        return <DocumentManagementPage />;
      case "transactions":
        return (
          <TransactionHistoryPage initialActorFilter={transactionFilter} />
        );
      case "verify":
        return <DocumentVerifyPage />;
      case "documentation":
        return <DocumentationPage />;
      case "my-documents":
        return <EndUserPage />;
      case "my-signed-docs":
        return canViewMySignatures ? <OperatorDocsPage /> : <DashboardPage />;
      case "cosign-policies":
        return <CoSignPolicyPage />;
      case "violation-penalties":
        return <ViolationPenaltyPage />;
      default:
        return <DashboardPage />;
    }
  };

  const handleNavigate = (page: string, options?: { actorFilter?: string }) => {
    setTransactionFilter(options?.actorFilter || "");
    setCurrentPage(page);
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          navItems={navItems}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenAccount={() => setAccountModalOpen(true)}
          onOpenSearch={() => setQuickSearchOpen(true)}
        />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {renderPage()}
        </main>
        <Footer />
        <QuickSearchDialog
          open={quickSearchOpen}
          onClose={() => setQuickSearchOpen(false)}
          onNavigate={handleNavigate}
        />
        <>
          <FloatingSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNavigate={handleNavigate}
          />
          <AccountModal
            open={accountModalOpen}
            onClose={() => setAccountModalOpen(false)}
            onNavigate={handleNavigate}
          />
        </>
      </div>
      <ScrollToTop />
    </>
  );
}

function getNavItems() {
  return [
    { label: "Dashboard", href: "dashboard" },
    { label: "Tenants", href: "tenants" },
    { label: "Operators", href: "operators" },
    { label: "Documents", href: "documents" },
    { label: "Transactions", href: "transactions" },
    { label: "Verify", href: "verify" },
  ];
}

function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-black text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded flex items-center justify-center text-slate-900 font-bold text-[10px]">
            VP
          </div>
          <span>Verzik — Demo v2.0</span>
        </div>
        <p className="text-slate-500">
          Powered by Supabase. Data persists across sessions.
        </p>
      </div>
    </footer>
  );
}

function MantineThemeBridge({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <MantineProvider
      forceColorScheme={isDark ? "dark" : "light"}
      theme={{
        primaryColor: "blue",
        defaultRadius: "md",
        fontFamily: "inherit",
      }}
    >
      {children}
    </MantineProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <MantineThemeBridge>
        <CompactProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </LanguageProvider>
        </CompactProvider>
      </MantineThemeBridge>
    </ThemeProvider>
  );
}

export default App;
