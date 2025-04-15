
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function AdminAccessFixer() {
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const fixAdminAccess = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User email not found',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setFixing(true);
      
      // Call the fix_admin_access edge function
      const { data, error } = await supabase.functions.invoke('fix_admin_access', {
        body: {
          email: user.email,
          user_id: user.id,
          name: user.name || user.email.split('@')[0]
        }
      });
      
      console.log("Fix admin access response:", data, error);
      
      if (error) {
        throw new Error(`Error fixing admin access: ${error.message}`);
      }
      
      toast({
        title: 'Success',
        description: 'Admin access has been fixed. Please log out and log back in.',
      });
      
      // Wait a second before redirecting
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      console.error('Error fixing admin access:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix admin access: ' + (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setFixing(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
          <p className="text-center mt-4">Loading user data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Fix Admin Access</CardTitle>
        <CardDescription>
          Use this utility to fix admin access for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start space-x-4">
              <div className="w-full">
                <div className="font-medium mb-2">User Info</div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div><strong>ID:</strong> {user?.id}</div>
                  <div><strong>Email:</strong> {user?.email}</div>
                  <div><strong>Name:</strong> {user?.name || 'Not set'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
        <Button onClick={fixAdminAccess} disabled={fixing}>
          {fixing ? 'Fixing...' : 'Fix Admin Access'}
        </Button>
      </CardFooter>
    </Card>
  );
}
