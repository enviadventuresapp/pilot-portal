
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafetyReportsAdmin } from './SafetyReportsAdmin';
import { FlightsAdmin } from './FlightsAdmin';
import { MaintenanceAdmin } from './MaintenanceAdmin';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AdminDashboardTabs() {
  const [activeTab, setActiveTab] = useState('safety');
  
  return (
    <div className="space-y-4">
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Access</AlertTitle>
        <AlertDescription>
          You have administrative privileges. Changes made here will be immediately reflected in the system.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="safety" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="safety">Safety Reports</TabsTrigger>
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="safety" className="space-y-4">
          <SafetyReportsAdmin />
        </TabsContent>
        
        <TabsContent value="flights" className="space-y-4">
          <FlightsAdmin />
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
