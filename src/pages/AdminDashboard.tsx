import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafetyReportsAdmin } from '@/components/admin/SafetyReportsAdmin';
import { FlightsAdmin } from '@/components/admin/FlightsAdmin';
import { Toaster } from '@/components/ui/toaster';

const AdminDashboard = () => {
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
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          
          <Tabs defaultValue="safety" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="safety">Safety Reports</TabsTrigger>
              <TabsTrigger value="flights">Flights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="safety">
              <SafetyReportsAdmin />
            </TabsContent>
            
            <TabsContent value="flights">
              <FlightsAdmin />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default AdminDashboard;
