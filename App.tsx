
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import NewDemand from './views/NewDemand';
import SupervisorDashboard from './views/SupervisorDashboard';
import WorkerDemands from './views/WorkerDemands';
import AdminDashboards from './views/AdminDashboards';

import { Ticket, User } from './types';
import { INITIAL_TICKETS, MOCK_USERS } from './constants';

/* =======================
   Types
======================= */
type Role = 'REQUESTER' | 'SUPERVISOR' | 'WORKER' | 'ADMIN';
type View = 'new-demand' | 'supervisor' | 'worker' | 'admin';

/* =======================
   Role → View Map
======================= */
const roleToViewMap: Record<Role, View> = {
  REQUESTER: 'new-demand',
  SUPERVISOR: 'supervisor',
  WORKER: 'worker',
  ADMIN: 'admin',
};

const App: React.FC = () => {
  /* =======================
     State
  ======================= */
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[3]); // Admin (demo)
  const [currentView, setCurrentView] = useState<View>('admin');
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);

  /* =======================
     Effects
  ======================= */
  // Sync view whenever role changes
  useEffect(() => {
    setCurrentView(roleToViewMap[currentUser.role as Role]);
  }, [currentUser.role]);

  /* =======================
     Handlers
  ======================= */
  const handleRoleSwitch = (role: Role) => {
    const newUser = users.find(user => user.role === role) || users[0];
    setCurrentUser(newUser);
  };

  const handleAddTicket = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
    setCurrentView('supervisor');
  };

  const handleUpdateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === id ? { ...ticket, ...updates } : ticket
      )
    );
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  /* =======================
     Derived Data
  ======================= */
  const workers = useMemo(
    () => users.filter(user => user.role === 'WORKER'),
    [users]
  );

  /* =======================
     View Renderer
  ======================= */
  const renderView = () => {
    switch (currentView) {
      case 'new-demand':
        return (
          <NewDemand
            onSubmit={handleAddTicket}
            userName={currentUser.name}
          />
        );

      case 'supervisor':
        return (
          <SupervisorDashboard
            tickets={tickets}
            workers={workers}
            onUpdateTicket={handleUpdateTicket}
          />
        );

      case 'worker':
        return (
          <WorkerDemands
            tickets={tickets}
            workerName={currentUser.name}
            onUpdateTicket={handleUpdateTicket}
          />
        );

      case 'admin':
        return (
          <AdminDashboards 
            tickets={tickets} 
            users={users} 
            onAddUser={handleAddUser} 
          />
        );

      default:
        return null;
    }
  };

  /* =======================
     Render
  ======================= */
  return (
    <Layout
      userName={currentUser.name}
      userRole={currentUser.role}
      currentView={currentView}
      onNavigate={(view: string) => setCurrentView(view as View)}
      onRoleSwitch={(role: string) => handleRoleSwitch(role as Role)}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
