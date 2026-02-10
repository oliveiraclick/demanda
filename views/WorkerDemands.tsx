
import React, { useState } from 'react';
import { Ticket, Status } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { formatTimeDiff, getSLAAura } from '../utils';

interface WorkerDemandsProps {
  tickets: Ticket[];
  workerName: string;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const WorkerDemands: React.FC<WorkerDemandsProps> = ({ tickets, workerName, onUpdateTicket }) => {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [technicalNote, setTechnicalNote] = useState('');
  const [closingPhoto, setClosingPhoto] = useState<string | null>(null);

  const myTickets = tickets
    .filter(t => t.assignedTo === workerName && t.status !== Status.FINALIZED)
    .sort((a, b) => (a.priority === 'ALTA' && b.priority !== 'ALTA' ? -1 : 1));

  const handleAction = (ticketId: string, updates: Partial<Ticket>) => {
    onUpdateTicket(ticketId, updates);
    setActiveTicket(null);
    setClosingPhoto(null);
    setTechnicalNote('');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Minha Escala</h2>
        <p className="text-sm md:text-base text-slate-500 font-medium">Chamados atribuídos por urgência.</p>
      </header>

      <div className="grid gap-4">
        {myTickets.map(ticket => (
          <div key={ticket.id} className="glass-card rounded-[24px] p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{ticket.id}</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <h4 className="text-base font-bold text-slate-800 truncate">{ticket.title}</h4>
                <p className="text-[11px] text-slate-500 italic">📍 {ticket.location}</p>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <div className="flex items-center justify-between py-2 border-y border-slate-100">
              <div className="text-center flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Aguardando</p>
                <p className="text-xs font-black text-slate-700">{formatTimeDiff(ticket.createdAt)}</p>
              </div>
              <div className="w-[1px] h-6 bg-slate-100"></div>
              <div className="text-center flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase">SLA</p>
                <p className={`text-xs font-black ${getSLAAura(ticket.slaLimit, ticket.status)}`}>
                  {new Date() > ticket.slaLimit ? '🚨 EXPIRADO' : formatTimeDiff(new Date(), ticket.slaLimit)}
                </p>
              </div>
            </div>

            {ticket.status === Status.QUEUED ? (
              <button
                onClick={() => handleAction(ticket.id, { 
                  status: Status.IN_PROGRESS, 
                  startedAt: new Date(), 
                  history: [...ticket.history, { timestamp: new Date(), action: 'Iniciou atendimento', user: workerName }] 
                })}
                className="w-full btn-primary py-4 rounded-xl text-white font-black text-sm shadow-lg active:scale-95 transition-all"
              >
                ▶️ Iniciar Agora
              </button>
            ) : (
              <button
                onClick={() => setActiveTicket(ticket)}
                className="w-full bg-slate-900 py-4 rounded-xl text-white font-black text-sm active:scale-95 transition-all"
              >
                🛠️ Gerenciar Execução
              </button>
            )}
          </div>
        ))}
        {myTickets.length === 0 && (
          <div className="py-16 text-center opacity-40">
             <div className="text-4xl mb-2">🍹</div>
             <p className="text-sm font-bold">Sem tarefas pendentes.</p>
          </div>
        )}
      </div>

      {/* Modal Execução - Full Screen Mobile */}
      {activeTicket && (
        <div className="fixed inset-0 bg-white md:bg-slate-900/60 md:backdrop-blur-md z-[60] overflow-y-auto flex items-center justify-center">
          <div className="w-full md:max-w-2xl bg-white md:rounded-[40px] md:shadow-2xl min-h-screen md:min-h-0 flex flex-col">
            <header className="px-6 py-5 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
               <div className="flex flex-col">
                  <h3 className="text-base font-black text-slate-900">{activeTicket.id} - Execução</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Iniciado há {activeTicket.startedAt ? formatTimeDiff(activeTicket.startedAt) : '--'}</p>
               </div>
               <button onClick={() => setActiveTicket(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 text-lg">✕</button>
            </header>

            <div className="p-6 space-y-8 flex-1">
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleAction(activeTicket.id, { status: Status.AWAITING_MATERIAL, history: [...activeTicket.history, { timestamp: new Date(), action: 'Aguardando material', user: workerName }] })}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 active:scale-95 transition-all"
                  >
                    <span className="text-xl">📦</span>
                    <span className="text-[10px] font-black uppercase">Falta Material</span>
                  </button>
                  <button 
                    onClick={() => handleAction(activeTicket.id, { status: Status.BLOCKED, history: [...activeTicket.history, { timestamp: new Date(), action: 'Atendimento bloqueado', user: workerName }] })}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 active:scale-95 transition-all"
                  >
                    <span className="text-xl">🚫</span>
                    <span className="text-[10px] font-black uppercase">Impedido</span>
                  </button>
               </div>

               <div className="space-y-4 border-t pt-8">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-[2px]">Baixa do Chamado</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">📸 Foto da Conclusão</label>
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden">
                      {closingPhoto ? (
                        <img src={closingPhoto} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <span className="text-2xl mb-2 block">📷</span>
                          <p className="text-[10px] font-bold text-slate-500">Toque para anexar prova</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const r = new FileReader();
                           r.onloadend = () => setClosingPhoto(r.result as string);
                           r.readAsDataURL(file);
                         }
                      }} className="hidden" />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Parecer Técnico</label>
                    <textarea
                      rows={3}
                      placeholder="Descreva a solução aplicada..."
                      value={technicalNote}
                      onChange={e => setTechnicalNote(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if(!closingPhoto) return alert('Anexe a foto da conclusão.');
                      handleAction(activeTicket.id, {
                        status: Status.FINALIZED,
                        finishedAt: new Date(),
                        photoClose: closingPhoto,
                        technicalNote: technicalNote,
                        history: [...activeTicket.history, { timestamp: new Date(), action: 'Finalizou o serviço', user: workerName }]
                      });
                    }}
                    className="w-full btn-primary text-white font-black py-5 rounded-2xl shadow-xl active:scale-[0.98] transition-all"
                  >
                    Confirmar Finalização
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDemands;
