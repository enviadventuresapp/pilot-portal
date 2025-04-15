
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <p className="text-muted-foreground">
              General settings will be implemented in a future update.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
