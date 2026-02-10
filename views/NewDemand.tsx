
import React, { useState } from 'react';
import { Category, Priority, Ticket, Status } from '../types';
import { calculateSLA } from '../utils';

interface NewDemandProps {
  onSubmit: (ticket: Ticket) => void;
  userName: string;
}

const NewDemand: React.FC<NewDemandProps> = ({ onSubmit, userName }) => {
  const [form, setForm] = useState({
    title: '',
    category: Category.ELECTRICAL,
    location: '',
    priority: Priority.MEDIUM,
    description: '',
    photo: null as string | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) return alert('Por favor, anexe uma foto da ocorrência.');

    const now = new Date();
    const newTicket: Ticket = {
      id: `CH-${Math.floor(Math.random() * 900 + 100)}`,
      title: form.title,
      category: form.category,
      location: form.location,
      priority: form.priority,
      description: form.description,
      photoOpen: form.photo,
      requester: userName,
      createdAt: now,
      slaLimit: calculateSLA(form.priority, now),
      status: Status.OPEN,
      materials: [],
      history: [{ timestamp: now, action: 'Abertura do chamado', user: userName }]
    };

    onSubmit(newTicket);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass-card rounded-[32px] overflow-hidden">
        <div className="p-8 md:p-12">
          <header className="mb-10">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Registrar Ocorrência</h3>
            <p className="text-slate-500 font-medium">Informe os detalhes para que nossa equipe possa atuar rapidamente.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">O que aconteceu?</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Lâmpada do hall piscando"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 font-medium"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none font-medium appearance-none"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                >
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Onde?</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Bloco B, 4º Andar"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none font-medium"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Prioridade Sugerida</label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  {Object.values(Priority).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                        form.priority === p 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
              <textarea
                required
                rows={3}
                placeholder="Conte-nos mais detalhes..."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none font-medium"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Evidência Visual</label>
              <div className="relative group">
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer bg-slate-50/50 group-hover:bg-slate-50 transition-all overflow-hidden">
                  {form.photo ? (
                    <img src={form.photo} className="h-full w-full object-cover" alt="preview" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform">📸</div>
                      <p className="text-sm font-bold text-slate-700">Clique para capturar ou anexar</p>
                      <p className="text-xs text-slate-400 mt-1">Imagens ajudam no diagnóstico rápido</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                {form.photo && (
                  <button onClick={() => setForm(f => ({...f, photo: null}))} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg">✕</button>
                )}
              </div>
            </div>

            <button type="submit" className="w-full btn-primary text-white font-extrabold py-5 rounded-[24px] shadow-xl text-lg mt-4 active:scale-[0.98]">
              Enviar Chamado
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewDemand;
