
import React, { useState, useMemo } from 'react';
import { Ticket, Status, Category, User, Priority, SLASettings, JustificationStatus } from './types';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { calculateSLA } from './utils';
import { StatusBadge, PriorityBadge } from './components/StatusBadge';

interface AdminDashboardsProps {
  tickets: Ticket[];
  users: User[];
  slaSettings: SLASettings;
  onAddUser: (user: User) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  onUpdateSLASettings: (settings: SLASettings) => void;
  userRole?: string;
  userName?: string;
}

const roleLabels: Record<string, string> = {
  'ADMIN': 'Administrador',
  'SUPERVISOR': 'Supervisor',
  'WORKER': 'Colaborador de Campo',
  'REQUESTER': 'Solicitante / Morador',
  'DIRECTORATE': 'Diretoria'
};

const AdminDashboards: React.FC<AdminDashboardsProps> = ({ tickets, users, slaSettings, onAddUser, onUpdateTicket, onUpdateSLASettings, userRole, userName }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'team' | 'settings'>('stats');
  const [justificationView, setJustificationView] = useState<JustificationStatus>(JustificationStatus.PENDING);
  const [localSla, setLocalSla] = useState<SLASettings>(slaSettings);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status !== Status.FINALIZED).length,
      critical: tickets.filter(t => t.status !== Status.FINALIZED && now.getTime() - t.createdAt.getTime() > (slaSettings[t.priority] * 3600000 * 1.5)).length
    };
  }, [tickets, slaSettings]);

  const COLORS = ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão Estratégica</h2>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-[32px] p-6 border-b-4 border-b-blue-500 shadow-lg">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
           <h4 className="text-4xl font-black text-slate-900">{stats.total}</h4>
        </div>
        <div className="glass-card rounded-[32px] p-6 border-b-4 border-b-rose-900 bg-rose-900/5 shadow-lg">
           <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1">SLA Crítico</p>
           <h4 className="text-4xl font-black text-rose-900">{stats.critical}</h4>
           {/* FIX: Utilizando &gt; para evitar erro de build */}
           <p className="text-[9px] text-rose-800 font-bold mt-2">Atraso severo (&gt;50%)</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboards;
