import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import { ProfileInfoForm } from '@/components/profile/ProfileInfoForm';
import { PasswordSection } from '@/components/profile/PasswordSection';

const Profile = () => {
  const { user, isLoading, logout } = useAuthContext();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState<{name: string, email: string, user_id: string} | null>(null);
  
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        user_id: user.id || user.user_id || ''
      });
    }
  }, [user]);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { success, error } = await logout();
      
      if (success) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out"
        });
      } else {
        toast({
          title: "Logout failed",
          description: error?.message || "Failed to log out",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className={`pt-24 pb-16 px-4 sm:px-6 transition-all duration-300 ${
        isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20'
      }`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Your Profile</h1>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              {isLoggingOut ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </>
              )}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid gap-6">
              {userData && <ProfileInfoForm userData={userData} />}
              <PasswordSection />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
