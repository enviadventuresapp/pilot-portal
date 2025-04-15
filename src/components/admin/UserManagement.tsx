
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as pilotService from '@/services/pilotService';
import { PilotRecord } from '@/types';
import { Loader2, UserPlus, Trash2, Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';

export function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState<PilotRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    isAdmin: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const result = await pilotService.getAllPilots();
      if (result.success) {
        setUsers(result.pilots);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update to use createPilot with the correct parameter structure
      const result = await pilotService.createPilot({
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin
      });
      
      if (result.success) {
        setUsers([...users, result.pilot]);
        setNewUser({
          name: '',
          email: '',
          isAdmin: false
        });
        toast({
          title: 'Success',
          description: 'User created successfully'
        });
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: 'Error',
        description: 'You cannot delete your own account',
        variant: 'destructive'
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const result = await pilotService.deletePilot(userId);
        
        if (result.success) {
          setUsers(users.filter(u => u.id !== userId));
          toast({
            title: 'Success',
            description: 'User deleted successfully'
          });
        } else {
          throw new Error('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete user. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (userId === currentUser?.id) {
      toast({
        title: 'Error',
        description: 'You cannot modify your own admin status',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await pilotService.updatePilot(userId, { isAdmin: !currentIsAdmin });
      
      if (result.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u
        ));
        toast({
          title: 'Success',
          description: `User ${!currentIsAdmin ? 'promoted to' : 'removed from'} admin`
        });
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <Button onClick={() => setNewUser({ 
          name: '', 
          email: '', 
          isAdmin: false
        })}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {newUser.name === '' && (
        <form onSubmit={handleCreateUser} className="glass-card rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAdmin"
              checked={newUser.isAdmin}
              onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
            />
            <Label htmlFor="isAdmin">Admin Access</Label>
          </div>
          <Button type="submit">Create User</Button>
        </form>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/70">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 text-sm">{user.name}</td>
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                      disabled={user.id === currentUser?.id}
                    >
                      {user.isAdmin ? (
                        <ShieldOff className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.id === currentUser?.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
