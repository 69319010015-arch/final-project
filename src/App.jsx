import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';

// Import Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { UserSettingsPage } from './pages/UserSettingsPage';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  
  // Navigation State: 'dashboard' | 'tickets' | 'ticket_detail' | 'create_ticket' | 'kb' | 'user_settings'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Handle Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100 font-sans">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            กำลังเริ่มระบบฐานข้อมูล IndexedDB...
          </p>
        </div>
      </div>
    );
  }

  // Handle Unauthenticated State
  if (!currentUser) {
    return <LoginPage />;
  }

  // Handler to navigate straight to a ticket (e.g. from notification clicks)
  const handleNavigateToTicket = (page, ticketId) => {
    setSelectedTicketId(ticketId);
    setCurrentPage(page);
  };

  // Render Page Content inside Layout shell
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'tickets':
        return <TicketsPage onNavigate={setCurrentPage} />;
      case 'ticket_detail':
        return (
          <TicketDetailPage
            ticketId={selectedTicketId}
            onNavigateBack={() => setCurrentPage('tickets')}
          />
        );
      case 'create_ticket':
        return (
          <CreateTicketPage
            onNavigateBack={() => setCurrentPage('dashboard')}
            onNavigateToTickets={() => setCurrentPage('tickets')}
          />
        );
      case 'kb':
        return <KnowledgeBasePage />;
      case 'user_settings':
        // Guard User Settings page for Admin only
        if (currentUser.role !== 'admin') {
          setCurrentPage('dashboard');
          return null;
        }
        return <UserSettingsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={(page) => {
        setSelectedTicketId(null);
        setCurrentPage(page);
      }}
      onNavigateToTicket={handleNavigateToTicket}
    >
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
