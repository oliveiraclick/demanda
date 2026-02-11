
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  userRole: string;
  userName: string;
  currentView: string;
  onNavigate: (view: string) => void;
  onRoleSwitch: (role: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, userName, currentView, onNavigate, onRoleSwitch }) => {
  const menuItems = [
    { id: 'new-demand', label: 'Nova', roles: ['REQUESTER', 'ADMIN'], icon: '➕' },
    { id: 'supervisor', label: 'Triagem', roles: ['SUPERVISOR', 'ADMIN'], icon: '🔍' },
    { id: 'worker', label: 'Tarefas', roles: ['WORKER', 'ADMIN', 'DIRECTORATE'], icon: '🛠️' },
    { id: 'admin', label: 'Painel', roles: ['ADMIN', 'DIRECTORATE', 'SUPERVISOR'], icon: '📊' },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] pb-20 md:pb-0">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 sidebar-gradient text-white flex-col shrink-0 shadow-2xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
              G
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-tight">
                Gestão de <span className="text-blue-400">Demanda</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[2px] font-bold">Condomínio Pro</p>
            </div>
          </div>

          <div className="py-4 px-4 bg-white/5 rounded-2xl border border-white/10 mb-8">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Operador</p>
            <p className="text-sm font-semibold truncate">{userName}</p>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md mt-2 inline-block">
              {userRole === 'DIRECTORATE' ? 'DIRETORIA' : userRole}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {visibleItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 px-2">Simular Perfil</p>
            <div className="grid grid-cols-2 gap-2">
              {['REQUESTER', 'SUPERVISOR', 'WORKER', 'ADMIN', 'DIRECTORATE'].map(role => (
                <button
                  key={role}
                  onClick={() => onRoleSwitch(role)}
                  className={`text-[9px] py-2 rounded-lg font-bold border transition-all ${
                    userRole === role 
                    ? 'bg-white text-slate-900 border-white' 
                    : 'border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {role === 'DIRECTORATE' ? 'DIRETORIA' : role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 px-4 py-3 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentView === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span className={`text-xl p-2 rounded-xl transition-all ${currentView === item.id ? 'bg-blue-50' : ''}`}>{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">G</div>
            <h2 className="font-bold text-slate-800 text-sm">Gestão de Demanda</h2>
          </div>
          <h2 className="hidden md:block font-bold text-slate-800 text-lg capitalize">{currentView.replace('-', ' ')}</h2>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">🔔</div>
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden shrink-0">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=dbeafe&color=2563eb`} alt="avatar" />
             </div>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
