import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  History, 
  Bell, 
  FileSpreadsheet, 
  Settings, 
  LogOut,
  Activity,
  UserPlus,
  Users
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();

  // roles array controls who sees each nav item
  const navItems = [
    { name: 'SCADA Dashboard',  path: '/',         icon: LayoutDashboard, roles: ['admin', 'engineer', 'viewer'] },
    { name: 'Bridges',          path: '/bridges',  icon: Layers,          roles: ['admin', 'engineer', 'viewer'] },
    { name: 'IoT Devices',      path: '/devices',  icon: Cpu,             roles: ['admin', 'engineer', 'viewer'] },
    { name: 'Historical Logs',  path: '/logs',     icon: History,         roles: ['admin', 'engineer', 'viewer'] },
    { name: 'Alarms & Alerts',  path: '/alerts',   icon: Bell,            roles: ['admin', 'engineer', 'viewer'] },
    { name: 'PDF Reports',      path: '/reports',  icon: FileSpreadsheet, roles: ['admin', 'engineer'] },
    { name: 'System Settings',  path: '/settings', icon: Settings,        roles: ['admin'] },
    { name: 'Register User',    path: '/register', icon: UserPlus,        roles: ['admin'] },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 glass-panel border-r border-slate-200/50 dark:border-industrial-800/50 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200/50 dark:border-industrial-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500 rounded-lg animate-pulse-cyan">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold font-sans text-lg tracking-wide text-slate-800 dark:text-slate-100">
                BridgeSense <span className="text-cyan-500 font-medium">AI</span>
              </h1>
              <p className="text-[10px] uppercase font-mono text-slate-400 dark:text-cyan-400/80 tracking-widest font-semibold">
                SHM SCADA v1.0
              </p>
            </div>
          </div>
        </div>

        {/* User Card (Quick Context) */}
        <div className="p-4 mx-3 my-4 bg-slate-100/50 dark:bg-industrial-950/40 border border-slate-200/20 dark:border-slate-800/40 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-500">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{user?.username}</p>
              <span className="inline-block text-[9px] uppercase font-mono px-2 py-0.5 mt-0.5 rounded bg-slate-200/60 dark:bg-industrial-800 text-slate-600 dark:text-cyan-400 font-bold border border-slate-300/10">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (user && !item.roles.includes(user.role)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-500 pl-3 shadow-[inset_4px_0_0_0_rgba(6,182,212,0.1)]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/30 dark:hover:bg-industrial-900/50 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-200/50 dark:border-industrial-800/50">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all duration-150"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
