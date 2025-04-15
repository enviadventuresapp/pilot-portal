import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { PilotRecord } from '@/types';

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<PilotRecord | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilots')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Map DB fields to application model
      return data.map(user => ({
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
        isHidden: user.is_hidden,
        created_at: user.created_at,
        updated_at: user.updated_at
      } as PilotRecord));
    }
  });

  // Update user role
  const updateRole = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => {
      const { error } = await supabase
        .from('pilots')
        .update({ is_admin: isAdmin })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user role', {
        description: error.message
      });
    }
  });

  // Fixed function to handle user_id correctly from data
  const handleLinkUserAccount = async (pilot: PilotRecord) => {
    try {
      if (!selectedUser) {
        toast.error("Please select a user first.");
        return;
      }

      setIsLinking(true);
      
      // Update to access id instead of non-existent user_id
      const { error } = await supabase
        .from('pilots')
        .update({ user_id: selectedUser.id })
        .eq('id', pilot.id);

      if (error) throw error;

      toast.success(`Successfully linked ${pilot.name} to user account.`);
      fetchUsers();
    } catch (error) {
      console.error('Error linking account:', error);
      toast.error('Failed to link user account');
    } finally {
      setIsLinking(false);
      setSelectedUser(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users?.map((user) => (
                    <tr key={user.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isAdmin ? 'Admin' : 'User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateRole.mutate({
                              userId: user.user_id,
                              isAdmin: !user.isAdmin
                            });
                          }}
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
