import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-industrial-950 flex transition-colors duration-250">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Viewport Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav setSidebarOpen={setSidebarOpen} />
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scada-grid dark:scada-grid">
          <div className="max-w-7xl mx-auto fade-in-slide">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default Layout;
