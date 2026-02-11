
import React, { useState } from 'react';
import { Ticket, Status, JustificationStatus } from '../types';
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
  const [tempJustification, setTempJustification] = useState('');
  const [tempProposedDate, setTempProposedDate] = useState('');

  const myTickets = tickets
    .filter(t => t.assignedTo === workerName && t.status !== Status.FINALIZED)
    .sort((a, b) => (a.priority === 'ALTA' && b.priority !== 'ALTA' ? -1 : 1));

  const overdueTickets = myTickets.filter(t => 
    new Date() > t.slaLimit && 
    (!t.justificationStatus || t.justificationStatus === JustificationStatus.NONE || t.justificationStatus === JustificationStatus.REJECTED)
  );

  const handleAction = (ticketId: string, updates: Partial<Ticket>) => {
    onUpdateTicket(ticketId, updates);
    setActiveTicket(null);
    setClosingPhoto(null);
    setTechnicalNote('');
    setTempJustification('');
    setTempProposedDate('');
  };

  const submitJustification = (ticket: Ticket) => {
    if (!tempJustification) return alert('Por favor, descreva o motivo do atraso.');
    if (!tempProposedDate) return alert('Por favor, sugira uma nova data de conclusão.');
    
    handleAction(ticket.id, {
      delayJustification: tempJustification,
      proposedNewLimit: new Date(tempProposedDate),
      justificationStatus: JustificationStatus.PENDING,
      history: [
        ...ticket.history,
        { 
          timestamp: new Date(), 
          action: 'Enviou justificativa de atraso', 
          user: workerName, 
          comment: `Motivo: ${tempJustification} | Sugestão: ${new Date(tempProposedDate).toLocaleString()}` 
        }
      ]
    });
    alert('Justificativa enviada para análise do supervisor.');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Minha Escala</h2>
        <p className="text-sm md:text-base text-slate-500 font-medium italic">Chamados atribuídos para execução imediata.</p>
      </header>

      {overdueTickets.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-[24px] shadow-xl shadow-rose-500/10">
           <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                 <h4 className="text-rose-900 font-black text-sm uppercase tracking-wider">Atenção: SLA Expirado</h4>
                 <p className="text-rose-700 text-xs font-bold mt-1">
                   Você possui chamados fora do prazo. Justifique o atraso para que possamos atualizar o cronograma.
                 </p>
              </div>
           </div>
        </div>
      )}

      <div className="grid gap-4">
        {myTickets.map(ticket => {
          const isOverdue = new Date() > ticket.slaLimit;
          const needsJustification = isOverdue && (!ticket.justificationStatus || ticket.justificationStatus === JustificationStatus.NONE || ticket.justificationStatus === JustificationStatus.REJECTED);

          return (
            <div key={ticket.id} className={`glass-card rounded-[24px] p-5 flex flex-col gap-4 border-l-8 ${isOverdue ? 'border-l-rose-500' : 'border-l-blue-500 shadow-sm'}`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{ticket.id}</span>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 truncate">{ticket.title}</h4>
                </div>
                <StatusBadge status={ticket.status} />
              </div>

              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <div className="text-center flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Status do Prazo</p>
                  <p className={`text-xs font-black ${getSLAAura(ticket.slaLimit, ticket.status)}`}>
                    {isOverdue ? `ATRASADO` : `Entrega em ${formatTimeDiff(new Date(), ticket.slaLimit)}`}
                  </p>
                </div>
              </div>

              {needsJustification && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-4">
                   <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Justificativa de Atraso</p>
                   
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Nova Data Sugerida</label>
                      <input 
                        type="datetime-local"
                        className="w-full p-2 rounded-lg border border-rose-200 text-xs font-bold outline-none"
                        value={tempProposedDate}
                        onChange={e => setTempProposedDate(e.target.value)}
                      />
                   </div>

                   <textarea 
                    className="w-full p-3 rounded-xl border border-rose-200 text-xs font-medium outline-none"
                    placeholder="Descreva o motivo técnico do atraso..."
                    value={tempJustification}
                    onChange={e => setTempJustification(e.target.value)}
                   />
                   
                   <button 
                    onClick={() => submitJustification(ticket)}
                    className="w-full bg-rose-600 text-white py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
                   >
                     Enviar Justificativa
                   </button>
                </div>
              )}

              {!needsJustification && (
                <button
                  onClick={() => ticket.status === Status.QUEUED ? handleAction(ticket.id, { status: Status.IN_PROGRESS, startedAt: new Date() }) : setActiveTicket(ticket)}
                  className={`w-full py-4 rounded-xl text-white font-black text-sm active:scale-95 transition-all ${ticket.status === Status.QUEUED ? 'btn-primary' : 'bg-slate-900 shadow-xl'}`}
                >
                  {ticket.status === Status.QUEUED ? '▶️ Iniciar Atendimento' : '🛠️ Executar Tarefa'}
                </button>
              )}
            </div>
          );
        })}

        {/* ESTADO VAZIO: GARANTE QUE O USUÁRIO SAIBA QUE NÃO HÁ NADA */}
        {myTickets.length === 0 && (
          <div className="py-24 text-center glass-card rounded-[40px] border-dashed border-2 border-slate-200 m-2 opacity-60">
             <div className="text-6xl mb-6 grayscale">📦</div>
             <h4 className="text-xl font-black text-slate-800">Tudo em ordem!</h4>
             <p className="text-sm text-slate-400 font-medium px-10">Você não possui chamados atribuídos no momento. Aproveite para atualizar seus relatórios.</p>
          </div>
        )}
      </div>

      {activeTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <header className="p-6 border-b flex justify-between items-center">
               <div>
                  <h3 className="text-lg font-black text-slate-900">{activeTicket.id}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalização de Chamado</p>
               </div>
               <button onClick={() => setActiveTicket(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
            </header>
            <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">📸 Evidência de Conclusão (Obrigatório)</label>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:bg-slate-50 transition-all overflow-hidden">
                    {closingPhoto ? (
                      <img src={closingPhoto} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-2xl">📷</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Tirar Foto</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const r = new FileReader();
                         r.onloadend = () => setClosingPhoto(r.result as string);
                         r.readAsDataURL(file);
                       }
                    }} />
                  </label>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase">📝 Notas Técnicas / Materiais</label>
                   <textarea rows={3} placeholder="Descreva o que foi feito e quais materiais foram utilizados..." value={technicalNote} onChange={e => setTechnicalNote(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium" />
                </div>
                <button onClick={() => {
                      if(!closingPhoto) return alert('Por favor, anexe a foto de conclusão.');
                      handleAction(activeTicket.id, {
                        status: Status.FINALIZED,
                        finishedAt: new Date(),
                        photoClose: closingPhoto,
                        technicalNote: technicalNote,
                        history: [...activeTicket.history, { timestamp: new Date(), action: 'Chamado Finalizado pelo Técnico', user: workerName }]
                      });
                    }} className="w-full btn-primary text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-500/20" > Finalizar Entrega </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDemands;
