
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

const AdminDashboards: React.FC<AdminDashboardsProps> = ({ tickets, users, slaSettings, onAddUser, onUpdateTicket, onUpdateSLASettings, userRole, userName }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'team' | 'settings'>('stats');
  const [justificationView, setJustificationView] = useState<JustificationStatus>(JustificationStatus.PENDING);
  const [inspectedTicket, setInspectedTicket] = useState<Ticket | null>(null);
  const [newUserForm, setNewUserForm] = useState({ name: '', role: 'WORKER' as User['role'] });
  const [localSla, setLocalSla] = useState<SLASettings>(slaSettings);
  
  const [rejectionModeId, setRejectionModeId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Lógica de SLA Crítico: 1.5x o tempo total decorrido
  const stats = useMemo(() => {
    const now = new Date();
    const criticalTickets = tickets.filter(t => {
      if (t.status === Status.FINALIZED) return false;
      const totalAllowedMs = t.slaLimit.getTime() - t.createdAt.getTime();
      const actualElapsedMs = now.getTime() - t.createdAt.getTime();
      return actualElapsedMs > (totalAllowedMs * 1.5);
    });

    return {
      total: tickets.length,
      open: tickets.filter(t => t.status !== Status.FINALIZED).length,
      overdue: tickets.filter(t => t.status !== Status.FINALIZED && now > t.slaLimit).length,
      critical: criticalTickets.length,
      justifiedPending: tickets.filter(t => t.justificationStatus === JustificationStatus.PENDING).length,
      justifiedApproved: tickets.filter(t => t.justificationStatus === JustificationStatus.APPROVED).length,
      justifiedRejected: tickets.filter(t => t.justificationStatus === JustificationStatus.REJECTED).length
    };
  }, [tickets]);

  const filteredJustifications = useMemo(() => 
    tickets.filter(t => t.justificationStatus === justificationView),
  [tickets, justificationView]);

  const categoryData = useMemo(() => Object.values(Category).map(cat => ({
    name: cat,
    value: tickets.filter(t => t.category === cat).length
  })).filter(d => d.value > 0), [tickets]);

  // Cores inspiradas na imagem de referência
  const COLORS = ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

  const handleApproveJustification = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || !ticket.proposedNewLimit) return;

    onUpdateTicket(ticketId, {
      slaLimit: ticket.proposedNewLimit,
      originalSlaLimit: ticket.originalSlaLimit || ticket.slaLimit,
      justificationStatus: JustificationStatus.APPROVED,
      isExtended: true,
      history: [
        ...ticket.history,
        { 
          timestamp: new Date(), 
          action: 'Prorrogação de SLA Aprovada', 
          comment: `Novo limite: ${ticket.proposedNewLimit.toLocaleString()}`, 
          user: userName || 'Admin' 
        }
      ]
    });
    alert('Novo prazo aprovado com sucesso.');
  };

  const handleRejectJustification = () => {
    if (!rejectionReason) return alert('É necessário informar o motivo da rejeição.');
    if (!rejectionModeId) return;

    const ticket = tickets.find(t => t.id === rejectionModeId);
    if (!ticket) return;

    onUpdateTicket(rejectionModeId, {
      justificationStatus: JustificationStatus.REJECTED,
      rejectionReason: rejectionReason,
      history: [
        ...ticket.history,
        { 
          timestamp: new Date(), 
          action: 'Prorrogação de SLA Rejeitada', 
          comment: `Motivo: ${rejectionReason}`, 
          user: userName || 'Admin' 
        }
      ]
    });

    setRejectionModeId(null);
    setRejectionReason('');
    alert('Solicitação de prazo rejeitada.');
  };

  // Fix: Adding missing handleCreateUser function to manage new user form submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name) return;
    onAddUser({ 
      id: Math.random().toString(36).substr(2, 9), 
      name: newUserForm.name, 
      role: newUserForm.role 
    });
    setNewUserForm({ name: '', role: 'WORKER' });
    alert('Usuário cadastrado com sucesso!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Gestão Estratégica</h2>
          <p className="text-slate-500 font-medium text-sm mt-2">Indicadores de performance e controle operacional.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
          <button onClick={() => setActiveTab('stats')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>📊 Painel</button>
          <button onClick={() => setActiveTab('team')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'team' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>👥 Equipe</button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>⚙️ Prazos</button>
        </div>
      </header>

      {activeTab === 'stats' && (
        <div className="space-y-10">
          {/* DASHBOARD PRINCIPAL - KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="glass-card rounded-[32px] p-6 border-b-4 border-b-blue-500 shadow-lg">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Total</p>
               <h4 className="text-4xl font-black text-slate-900">{stats.total}</h4>
               <p className="text-[9px] text-slate-400 font-bold mt-2">Histórico completo</p>
            </div>
            <div className="glass-card rounded-[32px] p-6 border-b-4 border-b-amber-500 shadow-lg">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Em Aberto</p>
               <h4 className="text-4xl font-black text-amber-600">{stats.open}</h4>
               <p className="text-[9px] text-amber-500/60 font-bold mt-2">Em andamento</p>
            </div>
            <div className="glass-card rounded-[32px] p-6 border-b-4 border-b-rose-400 shadow-lg">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Atrasado</p>
               <h4 className="text-4xl font-black text-rose-500">{stats.overdue}</h4>
               <p className="text-[9px] text-rose-400 font-bold mt-2">Vencidos (Fase 1)</p>
            </div>
            <div className="glass-card rounded-[32px] p-6 border-b-4 border-b-rose-900 bg-rose-900/5 shadow-lg">
               <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1">SLA Crítico (1.5x)</p>
               <h4 className="text-4xl font-black text-rose-900">{stats.critical}</h4>
               <p className="text-[9px] text-rose-800 font-bold mt-2">Atraso severo (>50%)</p>
            </div>
          </div>

          {/* CONTROLE DE JUSTIFICATIVAS */}
          <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-visible">
             <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-3xl shadow-inner">⚖️</div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest leading-none">Justificativas</h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">Auditoria de prazos e prorrogações solicitadas.</p>
                   </div>
                </div>

                {/* TABS PILLS - ESTILO IMAGEM */}
                <div className="flex bg-slate-100 p-1.5 rounded-[24px] border border-slate-200 items-center">
                   <button 
                    onClick={() => setJustificationView(JustificationStatus.PENDING)}
                    className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase transition-all flex items-center gap-3 ${justificationView === JustificationStatus.PENDING ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     Pendentes <span className={`px-2 py-0.5 rounded-md ${justificationView === JustificationStatus.PENDING ? 'bg-white/20' : 'bg-slate-200'}`}>{stats.justifiedPending}</span>
                   </button>
                   <button 
                    onClick={() => setJustificationView(JustificationStatus.APPROVED)}
                    className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase transition-all flex items-center gap-3 ${justificationView === JustificationStatus.APPROVED ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     Aprovados <span className={`px-2 py-0.5 rounded-md ${justificationView === JustificationStatus.APPROVED ? 'bg-white/20' : 'bg-slate-200'}`}>{stats.justifiedApproved}</span>
                   </button>
                   <button 
                    onClick={() => setJustificationView(JustificationStatus.REJECTED)}
                    className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase transition-all flex items-center gap-3 ${justificationView === JustificationStatus.REJECTED ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     Rejeitados <span className={`px-2 py-0.5 rounded-md ${justificationView === JustificationStatus.REJECTED ? 'bg-white/20' : 'bg-slate-200'}`}>{stats.justifiedRejected}</span>
                   </button>
                </div>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredJustifications.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => justificationView !== JustificationStatus.PENDING && setInspectedTicket(t)}
                    className={`p-7 bg-slate-50 rounded-[32px] border-2 transition-all group relative overflow-hidden ${
                      justificationView === JustificationStatus.PENDING ? 'border-amber-100' : 
                      justificationView === JustificationStatus.APPROVED ? 'border-emerald-50 hover:border-emerald-400 cursor-pointer shadow-sm hover:shadow-2xl' : 
                      'border-rose-50 hover:border-rose-400 cursor-pointer shadow-sm hover:shadow-2xl'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t.id}</span>
                        <h4 className="text-sm font-black text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">{t.title}</h4>
                      </div>
                      <PriorityBadge priority={t.priority} />
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 mb-5 shadow-inner">
                       <div className="flex justify-between items-center text-[10px] font-black border-b border-slate-50 pb-2">
                          <span className="text-slate-400 uppercase">Responsável</span>
                          <span className="text-blue-600">{t.assignedTo}</span>
                       </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-2xl border border-slate-100 italic mb-6">
                       <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Justificativa:</p>
                       <p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-relaxed">"{t.delayJustification}"</p>
                    </div>

                    {justificationView === JustificationStatus.PENDING ? (
                      rejectionModeId === t.id ? (
                        <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                          <textarea 
                            required
                            placeholder="Descreva o motivo da rejeição..."
                            className="w-full p-4 text-xs border-2 border-rose-100 rounded-2xl outline-none focus:border-rose-500 bg-white shadow-sm"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                          />
                          <div className="flex gap-3">
                             <button onClick={handleRejectJustification} className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 active:scale-95 transition-all">Confirmar</button>
                             <button onClick={() => setRejectionModeId(null)} className="px-5 py-3 bg-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600">Voltar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <button onClick={() => handleApproveJustification(t.id)} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-emerald-500/10 active:scale-95 transition-all">✅ Aprovar</button>
                          <button onClick={() => setRejectionModeId(t.id)} className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-rose-500/10 active:scale-95 transition-all">❌ Rejeitar</button>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-2 border-t border-slate-100">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest group-hover:underline">Auditando: Clique para ver detalhes</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredJustifications.length === 0 && (
                   <div className="lg:col-span-3 py-20 text-center opacity-30 border-2 border-dashed border-slate-100 rounded-[40px]">
                      <div className="text-5xl mb-4">📂</div>
                      <p className="text-slate-400 font-bold text-sm">Nenhum registro para exibir nesta categoria.</p>
                   </div>
                )}
             </div>
          </div>

          {/* DEMANDA POR SETOR COM LEGENDA NOMINADA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="glass-card rounded-[40px] p-8 md:p-10 shadow-xl border border-white">
              <header className="flex justify-between items-center mb-8">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[3px]">Demanda por Setor</h3>
                <span className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl">📊</span>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                          {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', fontWeight: 'bold', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-3">
                    {categoryData.map((d, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                             <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{d.name}</span>
                          </div>
                          <span className="text-sm font-black text-blue-600">{d.value}</span>
                       </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="glass-card rounded-[40px] overflow-hidden flex flex-col border border-slate-100 shadow-xl">
              <div className="p-8 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[3px]">Timeline Geral</h3>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">Tempo Real</span>
              </div>
              <div className="divide-y divide-slate-50 overflow-y-auto max-h-[400px]">
                {tickets.slice(0, 8).map(t => (
                  <div key={t.id} onClick={() => setInspectedTicket(t)} className="p-6 flex justify-between items-center hover:bg-slate-50/80 transition-all cursor-pointer group">
                    <div className="flex gap-4 items-center min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">{t.id.split('-')[1]}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{t.title}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5 tracking-wider">{t.category} • {t.assignedTo || 'Não atribuído'}</p>
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA DE DETALHES */}
      {inspectedTicket && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
              <div className="relative h-44 bg-slate-900 shrink-0">
                 <img src={inspectedTicket.photoOpen} className="w-full h-full object-cover opacity-40" />
                 <button onClick={() => setInspectedTicket(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all">✕</button>
                 <div className="absolute bottom-6 left-8">
                    <h3 className="text-2xl font-black text-white">{inspectedTicket.title}</h3>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{inspectedTicket.id}</p>
                 </div>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auditoria</p>
                       <p className={`text-sm font-black ${inspectedTicket.justificationStatus === JustificationStatus.APPROVED ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {inspectedTicket.justificationStatus === JustificationStatus.APPROVED ? '✅ APROVADO' : '❌ REJEITADO'}
                       </p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Executor</p>
                       <p className="text-sm font-black text-slate-700">{inspectedTicket.assignedTo || '--'}</p>
                    </div>
                 </div>

                 {inspectedTicket.rejectionReason && (
                    <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl shadow-sm">
                       <p className="text-[10px] font-black text-rose-600 uppercase mb-2">Motivo da Rejeição do SLA:</p>
                       <p className="text-sm italic font-bold text-rose-900 leading-relaxed">"{inspectedTicket.rejectionReason}"</p>
                    </div>
                 )}

                 {inspectedTicket.delayJustification && (
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl">
                       <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Justificativa do Colaborador:</p>
                       <p className="text-sm italic font-medium text-slate-700 leading-relaxed">"{inspectedTicket.delayJustification}"</p>
                    </div>
                 )}

                 <div className="space-y-4 pb-4">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Histórico de Auditoria</h4>
                    <div className="space-y-5">
                       {inspectedTicket.history.map((h, i) => (
                         <div key={i} className="flex gap-5 items-start">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm ${h.action.includes('Rejeitada') ? 'bg-rose-500' : h.action.includes('Aprovada') ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <div>
                               <p className="text-xs font-bold text-slate-800 leading-none">{h.action}</p>
                               {h.comment && <p className="text-[11px] text-slate-500 mt-1.5 italic bg-slate-50 p-3 rounded-xl border border-slate-100">"{h.comment}"</p>}
                               <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-wider">{h.user} • {new Date(h.timestamp).toLocaleString()}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ABAS EQUIPE E SLA */}
      {activeTab === 'team' && (
        <div className="grid md:grid-cols-3 gap-8 animate-in slide-in-from-right duration-500">
          <div className="md:col-span-1">
            <div className="glass-card rounded-[32px] p-8 shadow-xl border border-white">
              <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">Novo Colaborador</h3>
              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nome Completo</label>
                   <input required value={newUserForm.name} onChange={e => setNewUserForm(f => ({...f, name: e.target.value}))} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Lucas Mendes" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nível de Acesso</label>
                   <select value={newUserForm.role} onChange={e => setNewUserForm(f => ({...f, role: e.target.value as any}))} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none font-bold text-slate-700 bg-white">
                      <option value="WORKER">Colaborador de Campo</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="ADMIN">Administrador</option>
                   </select>
                </div>
                <button type="submit" className="w-full btn-primary text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-[0.98]">Cadastrar Usuário</button>
              </form>
            </div>
          </div>
          <div className="md:col-span-2 glass-card rounded-[32px] overflow-hidden divide-y shadow-xl border border-white">
            <div className="p-6 bg-slate-50 flex justify-between items-center border-b border-slate-100">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Integrantes do Time</span>
               <span className="text-xs font-bold text-blue-600">{users.length} ATIVOS</span>
            </div>
            {users.map(u => (
               <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-black shadow-inner">{u.name.charAt(0)}</div>
                     <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{roleLabels[u.role]}</p>
                     </div>
                  </div>
                  <button className="text-[10px] font-black text-slate-300 uppercase hover:text-rose-600 transition-colors">Remover Membro</button>
               </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto glass-card rounded-[40px] p-12 shadow-2xl border border-white">
           <header className="mb-12 text-center">
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Regras de SLA</h3>
              <p className="text-slate-500 text-sm font-medium">Defina o tempo limite padrão em horas para cada nível de urgência.</p>
           </header>
           <div className="grid gap-6">
              {Object.values(Priority).map(p => (
                <div key={p} className="flex items-center justify-between p-7 bg-slate-50 rounded-[32px] border border-slate-100">
                   <div className="flex items-center gap-6">
                      <PriorityBadge priority={p} />
                      <span className="text-sm font-bold text-slate-600 tracking-tight">Meta (Horas)</span>
                   </div>
                   <input type="number" value={localSla[p]} onChange={e => setLocalSla(prev => ({ ...prev, [p]: parseInt(e.target.value) || 0 }))} className="w-28 px-5 py-4 rounded-2xl border border-slate-200 text-center font-black text-blue-600 outline-none shadow-sm focus:border-blue-500" />
                </div>
              ))}
              <button onClick={() => { onUpdateSLASettings(localSla); alert('SLA salvo!'); }} className="w-full btn-primary text-white py-6 rounded-[32px] font-black text-sm uppercase shadow-2xl mt-8">Salvar Parâmetros</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboards;
