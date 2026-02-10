
import React, { useState, useMemo } from 'react';
import { Ticket, Status, Category, User } from '../types';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { formatTimeDiff } from '../utils';

interface AdminDashboardsProps {
  tickets: Ticket[];
  users: User[];
  onAddUser: (user: User) => void;
}

const roleLabels: Record<string, string> = {
  'ADMIN': 'Administrador',
  'SUPERVISOR': 'Supervisor',
  'WORKER': 'Colaborador de Campo',
  'REQUESTER': 'Solicitante / Morador'
};

type Period = '7d' | '30d' | '90d' | 'month' | 'year';

const periodLabels: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  'month': 'Este Mês',
  'year': 'Este Ano'
};

const AdminDashboards: React.FC<AdminDashboardsProps> = ({ tickets, users, onAddUser }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'team'>('stats');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', role: 'WORKER' as User['role'] });

  // Filtragem por período
  const filteredTickets = useMemo(() => {
    const now = new Date();
    return tickets.filter(t => {
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
  }, [tickets, selectedPeriod]);

  const stats = {
    total: filteredTickets.length,
    finalized: filteredTickets.filter(t => t.status === Status.FINALIZED).length,
    active: filteredTickets.filter(t => t.status !== Status.FINALIZED).length,
    overdue: filteredTickets.filter(t => t.status !== Status.FINALIZED && new Date() > t.slaLimit).length
  };

  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    value: filteredTickets.filter(t => t.category === cat).length
  })).filter(d => d.value > 0);

  const COLORS = ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

  const handleExport = () => {
    const headers = "ID,Titulo,Categoria,Status,CriadoEm,FinalizadoEm,SLA\n";
    const rows = filteredTickets.map(t => 
      `${t.id},"${t.title}",${t.category},${t.status},${t.createdAt.toISOString()},${t.finishedAt?.toISOString() || ''},${t.finishedAt && t.finishedAt <= t.slaLimit ? 'OK' : 'ATRASADO'}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_serviceflow_${selectedPeriod}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name) return;
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUserForm.name,
      role: newUserForm.role
    };
    
    onAddUser(newUser);
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
            <p className="text-slate-500 font-medium text-sm">Dados atualizados agora</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <button 
              onClick={() => setIsPeriodModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 shadow-sm hover:border-blue-400 transition-all active:scale-95"
           >
              <span>📅</span>
              <span>{periodLabels[selectedPeriod]}</span>
           </button>
           
           <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
           >
              <span>📥</span>
              <span>Exportar CSV</span>
           </button>

           <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl ml-2">
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              📊 Stats
            </button>
            <button 
              onClick={() => setActiveTab('team')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'team' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              👥 Equipe
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Switcher for Mobile Only */}
      <div className="flex md:hidden bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            Estatísticas
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            Gestão Equipe
          </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-10">
          {/* KPI Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Total', val: stats.total, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Finalizados', val: stats.finalized, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Em Aberto', val: stats.active, icon: '⚡', color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'SLA Crítico', val: stats.overdue, icon: '⚠️', color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((kpi, i) => (
              <div key={i} className="glass-card rounded-2xl md:rounded-[32px] p-5 md:p-8 hover:translate-y-[-4px] transition-all duration-300">
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
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                    />
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
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[3px]">Timeline Operacional</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">Últimas Atividades</span>
              </div>
              <div className="flex-1 overflow-auto max-h-[450px] divide-y divide-slate-50">
                {filteredTickets.slice(0, 15).map(t => (
                  <div key={t.id} className="p-6 flex justify-between items-center hover:bg-slate-50/80 transition-all cursor-pointer group">
                    <div className="flex gap-4 items-center min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {t.id.split('-')[1]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{t.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.category} • {t.status}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400">{new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${t.status === Status.FINALIZED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {t.status === Status.FINALIZED ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                        </span>
                    </div>
                  </div>
                ))}
                {filteredTickets.length === 0 && (
                  <div className="py-24 text-center">
                     <p className="text-4xl mb-4">🏜️</p>
                     <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Nenhum dado para este período</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gestão de Equipe - Invariado */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-[32px] p-8 sticky top-24">
              <h3 className="text-xl font-extrabold text-slate-900 mb-6">Cadastrar Membro</h3>
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required type="text" placeholder="Ex: Roberto Almeida" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none font-medium transition-all" value={newUserForm.name} onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                  <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none font-medium appearance-none" value={newUserForm.role} onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value as User['role'] }))} >
                    <option value="WORKER">Colaborador de Campo</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="REQUESTER">Solicitante / Portaria</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <button type="submit" className="w-full btn-primary text-white font-extrabold py-4 rounded-2xl shadow-xl active:scale-[0.98]"> Salvar Cadastro </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="glass-card rounded-[32px] overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-white/50">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[2px]">Equipe Ativa ({users.length})</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {users.map(user => (
                  <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-slate-400 overflow-hidden">
                        <img src={`https://ui-avatars.com/api/?name=${user.name}&background=f1f5f9&color=94a3b8`} alt="avatar" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{user.name}</h4>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{roleLabels[user.role]}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">✏️</button>
                      <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Período */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full md:max-w-md rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
             <header className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-xl font-black text-slate-900">Filtrar Período</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Selecione o intervalo de dados</p>
                </div>
                <button onClick={() => setIsPeriodModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border rounded-full text-slate-400 shadow-sm">✕</button>
             </header>
             <div className="p-8 space-y-3">
                {(['7d', '30d', '90d', 'month', 'year'] as Period[]).map(p => (
                   <button 
                    key={p}
                    onClick={() => {
                      setSelectedPeriod(p);
                      setIsPeriodModalOpen(false);
                    }}
                    className={`w-full p-5 rounded-[24px] border text-left flex justify-between items-center transition-all ${
                      selectedPeriod === p ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/5' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                   >
                     <span className={`font-bold ${selectedPeriod === p ? 'text-blue-600' : 'text-slate-700'}`}>{periodLabels[p]}</span>
                     {selectedPeriod === p && <span className="text-blue-500">✅</span>}
                   </button>
                ))}
                
                <div className="pt-6 border-t mt-4">
                   <button className="w-full py-5 rounded-[24px] bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest cursor-not-allowed">
                     📅 Seleção Personalizada (Pro)
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboards;
