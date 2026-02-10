
import React, { useState } from 'react';
import { Ticket, Status, User, Priority } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { formatTimeDiff, getSLAAura } from '../utils';

interface SupervisorDashboardProps {
  tickets: Ticket[];
  workers: User[];
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ tickets, workers, onUpdateTicket }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [assignee, setAssignee] = useState('');

  const openTickets = tickets.filter(t => t.status === Status.OPEN);

  const handleAction = (ticketId: string, updates: Partial<Ticket>) => {
    onUpdateTicket(ticketId, updates);
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Fila de Triagem</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">Distribuição técnica de chamados.</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-xl border shadow-sm flex items-center gap-3 self-start md:self-auto">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-700">{openTickets.length} pendentes</span>
        </div>
      </div>

      <div className="grid gap-4">
        {openTickets.map(ticket => (
          <div 
            key={ticket.id} 
            className="glass-card rounded-[24px] md:rounded-3xl p-4 md:p-6 flex flex-row items-center gap-4 md:gap-6 group hover:shadow-xl transition-all cursor-pointer" 
            onClick={() => setSelectedTicket(ticket)}
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
                <span className="truncate max-w-[120px]">📍 {ticket.location}</span>
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
          <div className="py-16 md:py-20 text-center glass-card rounded-[32px] border-dashed border-2 m-2">
            <div className="text-4xl mb-4">✨</div>
            <h4 className="text-lg font-bold text-slate-800">Tudo limpo!</h4>
            <p className="text-sm text-slate-400 px-4">Sem novos chamados para triagem agora.</p>
          </div>
        )}
      </div>

      {/* Modal - Ajustado para ser full screen no mobile */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-[60] overflow-y-auto">
          <div className="bg-white rounded-t-[32px] md:rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="relative h-48 md:h-64 bg-slate-900 shrink-0">
               <img src={selectedTicket.photoOpen} className="w-full h-full object-cover opacity-60" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
               <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all z-20">✕</button>
               <div className="absolute bottom-6 left-6 md:bottom-8 md:left-10 pr-12">
                  <h3 className="text-xl md:text-3xl font-black text-white leading-tight">{selectedTicket.title}</h3>
                  <p className="text-white/70 font-bold mt-1 uppercase text-[10px] tracking-widest">{selectedTicket.id} • {selectedTicket.category}</p>
               </div>
            </div>

            <div className="p-6 md:p-10 grid md:grid-cols-2 gap-8 md:gap-12 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Relato</h5>
                  <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium">{selectedTicket.description}</p>
                </div>
                <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Auditoria</h5>
                   <div className="space-y-3">
                      {selectedTicket.history.map((h, i) => (
                        <div key={i} className="flex gap-3 items-start">
                           <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5"></div>
                           <p className="text-[10px] font-bold text-slate-600">{h.action} <span className="text-slate-300 ml-1">({new Date(h.timestamp).toLocaleTimeString()})</span></p>
                        </div>
                      ))}
                   </div>
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
                         <span className="text-xs md:text-sm font-bold text-slate-800">{w.name}</span>
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
                      history: [...selectedTicket.history, { timestamp: new Date(), action: `Encaminhado para ${assignee}`, user: 'Supervisor' }]
                    })}
                    className="flex-1 btn-primary py-4 rounded-xl md:rounded-2xl text-white font-black text-xs md:text-sm shadow-lg disabled:opacity-30 active:scale-95 transition-all"
                   >
                     Confirmar Envio
                   </button>
                   <button 
                    onClick={() => {
                      const m = prompt('Motivo:');
                      if(m) handleAction(selectedTicket.id, { status: Status.BLOCKED, history: [...selectedTicket.history, { timestamp: new Date(), action: `Rejeitado: ${m}`, user: 'Supervisor' }] });
                    }}
                    className="px-4 py-4 rounded-xl md:rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 font-bold text-xs md:text-sm"
                   >
                     Rejeitar
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
