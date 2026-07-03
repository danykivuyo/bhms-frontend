import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, User, AlertTriangle, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

interface TopNavProps {
  setSidebarOpen: (open: boolean) => void;
}

interface AlertLog {
  id: number;
  device_id: string;
  bridge_name: string;
  level: 'warning' | 'critical';
  sensor_type: string;
  value: string;
  timestamp: string;
}

export const TopNav: React.FC<TopNavProps> = ({ setSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<AlertLog[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Poll for active alerts every 10 seconds for SCADA notification awareness
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      try {
        const response = await api.get('/alerts', { params: { status: 'active', limit: 5 } });
        if (response.data.status === 'success') {
          setActiveAlerts(response.data.data.alerts);
        }
      } catch (error) {
        console.error("Failed to load active notifications", error);
      }
    };

    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveQuick = async (id: number) => {
    try {
      await api.put(`/alerts/resolve/${id}`, { notes: "Quick resolved from notification dashboard" });
      setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Resolve notification alert failed", err);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-slate-200/50 dark:border-industrial-800/50 flex items-center justify-between px-6">
      
      {/* Left: Hamburger & Navigation Context */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden sm:block">
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500">
            SYSTEM STATUS
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              API Host Connected
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions (Theme, Notification Center, User Profile) */}
      <div className="flex items-center gap-3">
        
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded-lg transition-colors duration-150"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className={`p-2 rounded-lg transition-all duration-150 ${
              activeAlerts.length > 0
                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-industrial-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          {notificationOpen && (
            <>
              {/* Overlay Backdrop to Close */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setNotificationOpen(false)}
              />

              {/* Dropdown Card */}
              <div className="absolute right-0 mt-3 w-80 glass-panel border border-slate-200/50 dark:border-industrial-800/60 rounded-xl shadow-xl z-50 overflow-hidden fade-in-slide">
                <div className="px-4 py-3 bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200/50 dark:border-industrial-800/50 flex justify-between items-center">
                  <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    Alarms Buffer ({activeAlerts.length})
                  </span>
                  {activeAlerts.length > 0 && (
                    <span className="text-[10px] text-rose-500 font-bold animate-blink">
                      CRITICAL ALARMS
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-industrial-850">
                  {activeAlerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold">All systems nominal</p>
                      <p className="text-xs mt-1">No active warnings or critical events.</p>
                    </div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-3.5 flex gap-3 transition-colors duration-150 ${
                          alert.level === 'critical' 
                            ? 'bg-rose-500/5 hover:bg-rose-500/10' 
                            : 'bg-amber-500/5 hover:bg-amber-500/10'
                        }`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                          alert.level === 'critical' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                              {alert.sensor_type} alert
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {alert.bridge_name} - {alert.device_id}
                          </p>
                          <p className="text-xs font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                            Val: {parseFloat(alert.value).toFixed(2)}
                          </p>
                          
                          {/* Quick Resolve for Engineers/Admins */}
                          {user && (user.role === 'admin' || user.role === 'engineer') && (
                            <button
                              onClick={() => handleResolveQuick(alert.id)}
                              className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-200/50 dark:border-industrial-800/50 bg-slate-50 dark:bg-industrial-950/20 text-center">
                  <a 
                    href="/alerts"
                    onClick={(e) => {
                      e.preventDefault();
                      setNotificationOpen(false);
                      window.location.href = '/alerts';
                    }}
                    className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    View All Alarms Log
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <span className="w-px h-5 bg-slate-200 dark:bg-industrial-800" />

        {/* Profile Info */}
        <div className="flex items-center gap-2.5 pl-1.5">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-industrial-800 border border-slate-300/40 dark:border-industrial-750 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold leading-none text-slate-800 dark:text-slate-200">
              {user?.username}
            </p>
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-500 leading-none">
              {user?.role}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
export default TopNav;
