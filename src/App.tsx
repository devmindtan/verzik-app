import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { FloatingSidebar } from './components/FloatingSidebar';
import { AccountModal } from './components/AccountModal';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantManagementPage } from './pages/TenantManagementPage';
import { OperatorManagementPage } from './pages/OperatorManagementPage';
import { DocumentManagementPage } from './pages/DocumentManagementPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { DocumentVerifyPage } from './pages/DocumentVerifyPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { EndUserPage } from './pages/EndUserPage';
import { OperatorDocsPage } from './pages/OperatorDocsPage';

function AppContent() {
  const { session, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

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

  if (currentPage === 'home') {
    return <HomePage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onSuccess={() => setCurrentPage('dashboard')} />;
  }

  const navItems = getNavItems(session);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'tenants': return <TenantManagementPage />;
      case 'operators': return <OperatorManagementPage />;
      case 'documents': return <DocumentManagementPage />;
      case 'transactions': return <TransactionHistoryPage />;
      case 'verify': return <DocumentVerifyPage />;
      case 'documentation': return <DocumentationPage />;
      case 'my-documents': return <EndUserPage />;
      case 'my-signed-docs': return <OperatorDocsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        navItems={navItems}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenAccount={() => setAccountModalOpen(true)}
      />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
      <Footer />
      {session?.isConnected && (
        <>
          <FloatingSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} onNavigate={setCurrentPage} />
        </>
      )}
    </div>
  );
}

function getNavItems(session: any) {
  const items: { label: string; href: string; badge?: string }[] = [];

  items.push({ label: 'Dashboard', href: 'dashboard' });
  items.push({ label: 'Tenants', href: 'tenants' });
  items.push({ label: 'Operators', href: 'operators' });
  items.push({ label: 'Documents', href: 'documents' });
  items.push({ label: 'Transactions', href: 'transactions' });
  items.push({ label: 'Verify', href: 'verify' });
  items.push({ label: 'Docs', href: 'documentation' });

  // Personal pages based on role
  if (session?.isConnected) {
    if (session.role === 'end_user' || session.role === 'none') {
      items.push({ label: 'My Documents', href: 'my-documents' });
    }
    if (session.role === 'tenant_operator' || session.role === 'none') {
      items.push({ label: 'My Signatures', href: 'my-signed-docs' });
    }
  }

  return items;
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded flex items-center justify-center text-slate-900 font-bold text-[10px]">VP</div>
          <span>VoucherProtocol — Demo v2.0</span>
        </div>
        <p className="text-slate-500">All data is in-memory. Resets on refresh. No real blockchain connection.</p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
