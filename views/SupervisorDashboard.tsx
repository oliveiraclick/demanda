
import React, { useState } from 'react';
import { Ticket, Status, User, Priority, SLASettings, JustificationStatus } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { formatTimeDiff, calculateSLA } from '../utils';

interface SupervisorDashboardProps {
  tickets: Ticket[];
  workers: User[];
  slaSettings: SLASettings;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ tickets, workers, slaSettings, onUpdateTicket }) => {
  const [activeTab, setActiveTab] = useState<'triagem' | 'justificativas'>('triagem');
  const [justificationSubTab, setJustificationSubTab] = useState<'pendentes' | 'historico'>('pendentes');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [assignee, setAssignee] = useState('');
  const [tempPriority, setTempPriority] = useState<Priority | null>(null);

  const openTickets = tickets.filter(t => t.status === Status.OPEN);
  const pendingJustifications = tickets.filter(t => t.justificationStatus === JustificationStatus.PENDING);
  const historyJustifications = tickets.filter(t => 
    t.justificationStatus === JustificationStatus.APPROVED || 
    t.justificationStatus === JustificationStatus.REJECTED
  );

  const handleAction = (ticketId: string, updates: Partial<Ticket>) => {
    onUpdateTicket(ticketId, updates);
    setSelectedTicket(null);
    setTempPriority(null);
  };

  const handleEvaluateJustification = (ticketId: string, approved: boolean) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    onUpdateTicket(ticketId, {
      justificationStatus: approved ? JustificationStatus.APPROVED : JustificationStatus.REJECTED,
      history: [
        ...ticket.history,
        { 
          timestamp: new Date(), 
          action: approved ? 'Justificativa de Atraso Aprovada' : 'Justificativa de Atraso Rejeitada', 
          user: 'Supervisor' 
        }
      ]
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Painel de Supervisão</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">Gestão operacional e análise de performance.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
           <button 
            onClick={() => setActiveTab('triagem')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'triagem' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
           >
             📋 Triagem ({openTickets.length})
           </button>
           <button 
            onClick={() => setActiveTab('justificativas')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'justificativas' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
           >
             ⚖️ Justificativas {pendingJustifications.length > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>}
           </button>
        </div>
      </header>

      {activeTab === 'triagem' && (
        <div className="grid gap-4">
          {openTickets.map(ticket => (
            <div 
              key={ticket.id} 
              className="glass-card rounded-[24px] md:rounded-3xl p-4 md:p-6 flex flex-row items-center gap-4 md:gap-6 group hover:shadow-xl transition-all cursor-pointer" 
              onClick={() => {
                setSelectedTicket(ticket);
                setTempPriority(ticket.priority);
              }}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden shrink-0 shadow-inner bg-slate-200">
                <img src={ticket.photoOpen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{ticket.id}</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <h4 className="text-sm md:text-lg font-bold text-slate-800 truncate">{ticket.title}</h4>
                <p className="text-[10px] md:text-sm text-slate-500 flex flex-wrap items-center gap-2 md:gap-4 italic">
                  <span>📍 {ticket.location}</span>
                  <span className="hidden sm:inline">👤 {ticket.requester}</span>
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-1 shrink-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Espera</p>
                <p className="text-sm md:text-lg font-black text-slate-700">{formatTimeDiff(ticket.createdAt)}</p>
              </div>
            </div>
          ))}

          {openTickets.length === 0 && (
            <div className="py-20 text-center glass-card rounded-[32px] border-dashed border-2 m-2">
              <div className="text-5xl mb-4">✨</div>
              <h4 className="text-lg font-bold text-slate-800">Fila limpa!</h4>
              <p className="text-sm text-slate-400">Nenhum chamado pendente de triagem.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'justificativas' && (
        <div className="space-y-6">
          <div className="flex gap-4 border-b border-slate-200">
            <button 
              onClick={() => setJustificationSubTab('pendentes')}
              className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-all ${justificationSubTab === 'pendentes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
              Pendentes ({pendingJustifications.length})
            </button>
            <button 
              onClick={() => setJustificationSubTab('historico')}
              className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-all ${justificationSubTab === 'historico' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
              Histórico ({historyJustifications.length})
            </button>
          </div>

          <div className="grid gap-6">
            {(justificationSubTab === 'pendentes' ? pendingJustifications : historyJustifications).map(ticket => (
              <div key={ticket.id} className={`glass-card rounded-[32px] p-8 border-l-8 shadow-xl space-y-6 ${ticket.justificationStatus === JustificationStatus.PENDING ? 'border-l-amber-500' : ticket.justificationStatus === JustificationStatus.APPROVED ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-widest">{ticket.id}</span>
                      <h4 className="text-xl font-black text-slate-900">{ticket.title}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase">Responsável: <span className="text-blue-600">{ticket.assignedTo}</span></p>
                  </div>
                  {ticket.justificationStatus === JustificationStatus.PENDING ? (
                    <div className="text-right">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Atraso Atual</p>
                        <p className="text-2xl font-black text-rose-600">{formatTimeDiff(ticket.slaLimit, new Date())}</p>
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ticket.justificationStatus === JustificationStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {ticket.justificationStatus === JustificationStatus.APPROVED ? 'APROVADA' : 'REJEITADA'}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic relative">
                  <div className="absolute -top-3 left-6 px-2 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest border rounded">Justificativa do Colaborador</div>
                  <p className="text-slate-700 font-medium leading-relaxed">"{ticket.delayJustification}"</p>
                </div>

                {ticket.justificationStatus === JustificationStatus.PENDING && (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleEvaluateJustification(ticket.id, true)}
                      className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      ✅ Aprovar Atraso
                    </button>
                    <button 
                      onClick={() => handleEvaluateJustification(ticket.id, false)}
                      className="flex-1 bg-rose-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                    >
                      ❌ Rejeitar Justificativa
                    </button>
                  </div>
                )}
              </div>
            ))}

            {(justificationSubTab === 'pendentes' ? pendingJustifications : historyJustifications).length === 0 && (
              <div className="py-20 text-center glass-card rounded-[32px] border-dashed border-2 m-2">
                  <div className="text-5xl mb-4 opacity-20">📂</div>
                  <h4 className="text-lg font-bold text-slate-800">Nenhum registro aqui</h4>
                  <p className="text-sm text-slate-400">Tudo em dia com os prazos e justificativas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Triagem - Mantido igual */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-[60] overflow-y-auto">
          <div className="bg-white rounded-t-[32px] md:rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="relative h-48 md:h-64 bg-slate-900 shrink-0">
               <img src={selectedTicket.photoOpen} className="w-full h-full object-cover opacity-60" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
               <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all z-20">✕</button>
               <div className="absolute bottom-6 left-6 md:bottom-8 md:left-10 pr-12">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={selectedTicket.status} />
                    <PriorityBadge priority={tempPriority || selectedTicket.priority} />
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white leading-tight">{selectedTicket.title}</h3>
               </div>
            </div>

            <div className="p-6 md:p-10 grid md:grid-cols-2 gap-8 md:gap-12 overflow-y-auto">
              <div className="space-y-6">
                <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Ajustar Urgência (SLA)</h5>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-white rounded-xl shadow-sm border border-slate-100">
                    {Object.values(Priority).map(p => (
                      <button
                        key={p}
                        onClick={() => setTempPriority(p)}
                        className={`py-2 rounded-lg text-[10px] font-black transition-all ${
                          (tempPriority || selectedTicket.priority) === p 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Resolução em aproximadamente {slaSettings[tempPriority || selectedTicket.priority]} horas.</p>
                </div>

                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Descrição da Ocorrência</h5>
                  <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium">{selectedTicket.description}</p>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8 pb-6 md:pb-0">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Atribuir Responsável</label>
                   <div className="grid grid-cols-1 gap-2">
                     {workers.map(w => (
                       <button 
                        key={w.id}
                        onClick={() => setAssignee(w.name)}
                        className={`p-3 md:p-4 rounded-xl md:rounded-2xl border text-left flex items-center justify-between transition-all ${
                          assignee === w.name ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/10' : 'border-slate-100'
                        }`}
                       >
                         <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-bold text-slate-800">{w.name}</span>
                            <span className={`text-[9px] font-black uppercase ${w.role === 'DIRECTORATE' ? 'text-blue-500' : 'text-slate-400'}`}>
                               {w.role === 'DIRECTORATE' ? 'Diretoria' : 'Colaborador de Campo'}
                            </span>
                         </div>
                         {assignee === w.name && <span className="text-blue-500 font-bold">✓</span>}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="flex gap-3">
                   <button 
                    disabled={!assignee}
                    onClick={() => handleAction(selectedTicket.id, {
                      status: Status.QUEUED,
                      assignedTo: assignee,
                      priority: tempPriority || selectedTicket.priority,
                      slaLimit: calculateSLA(tempPriority || selectedTicket.priority, selectedTicket.createdAt, slaSettings),
                      history: [...selectedTicket.history, { 
                        timestamp: new Date(), 
                        action: `Encaminhado para ${assignee}`, 
                        user: 'Supervisor' 
                      }]
                    })}
                    className="flex-1 btn-primary py-4 rounded-xl md:rounded-2xl text-white font-black text-xs md:text-sm shadow-lg disabled:opacity-30 active:scale-95 transition-all"
                   >
                     Confirmar Triagem
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;
