import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { FuelAnalysisContent } from '@/components/fuel/FuelAnalysisContent';

const FuelAnalysis = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className={`pt-24 pb-16 px-4 sm:px-6 transition-all duration-300 ${
        isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20'
      }`}>
        <div className="max-w-7xl mx-auto">
          <FuelAnalysisContent />
        </div>
      </main>
    </div>
  );
};

export default FuelAnalysis;
