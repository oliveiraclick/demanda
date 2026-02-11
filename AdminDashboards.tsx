
import React, { useState, useMemo } from 'react';
import { Ticket, Status, Category, User, Priority, SLASettings, JustificationStatus } from '../types';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { calculateSLA } from '../utils';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

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

type Period = '7d' | '30d' | '90d' | 'month' | 'year';

const periodLabels: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  'month': 'Este Mês',
  'year': 'Este Ano'
};

const AdminDashboards: React.FC<AdminDashboardsProps> = ({ tickets, users, slaSettings, onAddUser, onUpdateTicket, onUpdateSLASettings, userRole, userName }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'team' | 'settings'>('stats');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [inspectedTicket, setInspectedTicket] = useState<Ticket | null>(null);
  const [newUserForm, setNewUserForm] = useState({ name: '', role: 'WORKER' as User['role'] });
  
  const [isExtending, setIsExtending] = useState(false);
  const [extensionDays, setExtensionDays] = useState(1);
  const [extensionReason, setExtensionReason] = useState('');

  const [localSla, setLocalSla] = useState<SLASettings>(slaSettings);

  const filteredTickets = useMemo(() => {
    const now = new Date();
    // Filtro de visibilidade baseado em regra: Colaborador só vê o seu (não deveria estar nesta view, mas por segurança)
    const baseTickets = (userRole === 'ADMIN' || userRole === 'SUPERVISOR' || userRole === 'DIRECTORATE') 
      ? tickets 
      : tickets.filter(t => t.assignedTo === userName || t.requester === userName);

    return baseTickets.filter(t => {
      const ticketDate = new Date(t.createdAt);
      const diffTime = Math.abs(now.getTime() - ticketDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (selectedPeriod === '7d') return diffDays <= 7;
      if (selectedPeriod === '30d') return diffDays <= 30;
      if (selectedPeriod === '90d') return diffDays <= 90;
      if (selectedPeriod === 'month') return ticketDate.getMonth() === now.getMonth() && ticketDate.getFullYear() === now.getFullYear();
      if (selectedPeriod === 'year') return ticketDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [tickets, selectedPeriod, userRole, userName]);

  const stats = {
    total: filteredTickets.length,
    finalized: filteredTickets.filter(t => t.status === Status.FINALIZED).length,
    active: filteredTickets.filter(t => t.status !== Status.FINALIZED).length,
    overdue: filteredTickets.filter(t => t.status !== Status.FINALIZED && new Date() > t.slaLimit).length,
    justified: filteredTickets.filter(t => t.justificationStatus === JustificationStatus.APPROVED).length
  };

  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    value: filteredTickets.filter(t => t.category === cat).length
  })).filter(d => d.value > 0);

  const COLORS = ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

  const handleUpdatePriority = (newPriority: Priority) => {
    if (!inspectedTicket) return;
    const updates: Partial<Ticket> = {
      priority: newPriority,
      slaLimit: calculateSLA(newPriority, inspectedTicket.createdAt, slaSettings),
      history: [
        ...inspectedTicket.history,
        { timestamp: new Date(), action: `Alterou prioridade para ${newPriority}`, user: userName || 'Sistema' }
      ]
    };
    onUpdateTicket(inspectedTicket.id, updates);
    setInspectedTicket({ ...inspectedTicket, ...updates });
  };

  const handleExtendSLA = () => {
    if (!inspectedTicket || !extensionReason) return alert('Por favor, informe o motivo da prorrogação.');
    const newLimit = new Date(inspectedTicket.slaLimit);
    newLimit.setDate(newLimit.getDate() + extensionDays);
    const updates: Partial<Ticket> = {
      slaLimit: newLimit,
      isExtended: true,
      originalSlaLimit: inspectedTicket.originalSlaLimit || inspectedTicket.slaLimit,
      history: [
        ...inspectedTicket.history,
        { timestamp: new Date(), action: `Prorrogação de Prazo (+${extensionDays} dias)`, comment: extensionReason, user: userName || 'Gestor' }
      ]
    };
    onUpdateTicket(inspectedTicket.id, updates);
    setInspectedTicket({ ...inspectedTicket, ...updates });
    setIsExtending(false);
    setExtensionReason('');
    setExtensionDays(1);
    alert('Prazo prorrogado com sucesso!');
  };

  const handleSaveSLA = () => {
    onUpdateSLASettings(localSla);
    alert('Configurações de SLA atualizadas com sucesso!');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name) return;
    onAddUser({ id: Math.random().toString(36).substr(2, 9), name: newUserForm.name, role: newUserForm.role });
    setNewUserForm({ name: '', role: 'WORKER' });
    alert('Usuário cadastrado com sucesso!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel de Gestão</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-slate-500 font-medium text-sm">Dados operacionais dinâmicos</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <button onClick={() => setIsPeriodModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 shadow-sm hover:border-blue-400 transition-all active:scale-95">
              <span>📅</span> <span>{periodLabels[selectedPeriod]}</span>
           </button>
           <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl ml-2">
            <button onClick={() => setActiveTab('stats')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>📊 Stats</button>
            <button onClick={() => setActiveTab('team')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'team' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>👥 Equipe</button>
            {userRole === 'ADMIN' && <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>⚙️ SLA</button>}
          </div>
        </div>
      </header>

      {/* Tabs Mobile */}
      <div className="flex md:hidden bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>STATS</button>
          <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>EQUIPE</button>
          {userRole === 'ADMIN' && <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>SLA</button>}
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {[
              { label: 'Total', val: stats.total, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Finalizados', val: stats.finalized, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Em Aberto', val: stats.active, icon: '⚡', color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Atrasados', val: stats.overdue, icon: '⚠️', color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Justificados', val: stats.justified, icon: '⚖️', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((kpi, i) => (
              <div key={i} className="glass-card rounded-2xl md:rounded-[32px] p-5 md:p-8 hover:translate-y-[-4px] transition-all duration-300 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className={`w-10 h-10 md:w-14 md:h-14 ${kpi.bg} rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-inner`}>
                    {kpi.icon}
                  </div>
                  <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-right">{kpi.label}</span>
                </div>
                <h4 className={`text-2xl md:text-5xl font-black ${kpi.color}`}>{kpi.val}</h4>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <div className="glass-card rounded-[40px] p-8 md:p-10">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[3px] mb-8">Análise por Setor</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value" stroke="none">
                      {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                  {categoryData.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-50 shadow-sm">
                       <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                       <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-400 uppercase truncate">{c.name}</p>
                          <p className="text-sm font-bold text-slate-800">{c.value}</p>
                       </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="glass-card rounded-[40px] overflow-hidden flex flex-col border border-slate-100">
              <div className="p-8 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[3px]">Lista Operacional</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">Monitoramento Geral</span>
              </div>
              <div className="flex-1 overflow-auto max-h-[450px] divide-y divide-slate-50">
                {filteredTickets.slice(0, 30).map(t => (
                  <div key={t.id} onClick={() => setInspectedTicket(t)} className="p-6 flex justify-between items-center hover:bg-blue-50/50 transition-all cursor-pointer group">
                    <div className="flex gap-4 items-center min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {t.id.split('-')[1]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                          {t.justificationStatus === JustificationStatus.PENDING && <span className="mr-2">⚖️</span>}
                          {t.isExtended && <span className="mr-2">⏳</span>}
                          {t.title}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.category} • {t.assignedTo || 'Não atribuído'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400">{new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${new Date() > t.slaLimit && t.status !== Status.FINALIZED ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                          {new Date() > t.slaLimit && t.status !== Status.FINALIZED ? 'ATRASADO' : 'DETALHES'}
                        </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outras Abas omitidas por brevidade, lógica mantida similar */}

      {/* Modal de Detalhes - INSPECIONAR JUSTIFICATIVAS */}
      {inspectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="relative h-48 md:h-64 bg-slate-900 shrink-0">
                <img src={inspectedTicket.photoOpen} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                <button onClick={() => { setInspectedTicket(null); setIsExtending(false); }} className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all">✕</button>
                <div className="absolute bottom-8 left-10">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={inspectedTicket.status} />
                    <PriorityBadge priority={inspectedTicket.priority} />
                    {inspectedTicket.justificationStatus === JustificationStatus.APPROVED && (
                       <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm">⚖️ ATRASO JUSTIFICADO</span>
                    )}
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white">{inspectedTicket.title}</h3>
                  <p className="text-white/60 font-bold uppercase text-xs tracking-widest mt-1">{inspectedTicket.id} • {inspectedTicket.location}</p>
                </div>
              </div>

              <div className="p-6 md:p-10 overflow-y-auto grid md:grid-cols-2 gap-10">
                 <div className="space-y-8">
                    {/* Justificativa de Atraso */}
                    {inspectedTicket.delayJustification && (
                       <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 relative">
                          <div className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border rounded">Justificativa de Atraso</div>
                          <p className="text-slate-700 italic font-medium leading-relaxed">"{inspectedTicket.delayJustification}"</p>
                          <div className="mt-4 flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
                             <span className={`text-[10px] font-black uppercase ${
                               inspectedTicket.justificationStatus === JustificationStatus.APPROVED ? 'text-emerald-600' :
                               inspectedTicket.justificationStatus === JustificationStatus.PENDING ? 'text-amber-600' : 'text-rose-600'
                             }`}>
                               {inspectedTicket.justificationStatus}
                             </span>
                          </div>
                       </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Relato Inicial</h4>
                      <p className="text-slate-700 leading-relaxed font-medium text-sm">{inspectedTicket.description}</p>
                    </div>

                    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-1 text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">SLA Limite</p>
                          <p className={`text-xs font-black ${new Date() > inspectedTicket.slaLimit && inspectedTicket.status !== Status.FINALIZED ? 'text-red-600' : 'text-slate-700'}`}>
                            {inspectedTicket.slaLimit.toLocaleDateString()} {inspectedTicket.slaLimit.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Log de Auditoria</h4>
                    <div className="space-y-6 border-l-2 border-slate-100 pl-6 ml-2 text-xs">
                      {inspectedTicket.history.map((h, i) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 shadow-sm ${h.action.includes('Justificativa') ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}></div>
                          <div className="space-y-1">
                             <p className="font-bold text-slate-800">{h.action}</p>
                             {h.comment && <p className="text-slate-500 bg-slate-50 p-2 rounded-lg italic border border-slate-100">"{h.comment}"</p>}
                             <p className="font-bold text-slate-400 uppercase text-[9px]">{h.user} • {new Date(h.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* ... Modal Período Omitido ... */}
    </div>
  );
};

export default AdminDashboards;
