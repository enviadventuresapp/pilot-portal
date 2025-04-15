import { Menu, X, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Header({ toggleSidebar, isSidebarOpen }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAdmin } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    const { success } = await logout();
    
    if (success) {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <img 
              src="/lovable-uploads/a3418b2a-f9be-4db1-b4e3-fc25d496bc71.png" 
              alt="Pilot Portal Logo" 
              className="h-5 w-5 object-contain"
            />
          </div>
          <span className="font-medium text-lg hidden sm:inline-block">Pilot Portal</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="glass-effect px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground animate-pulse-soft mr-2">
          {isAdmin ? 'Admin Account' : 'Connected to Supabase'}
        </div>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full" aria-label="User menu">
                <span className="sr-only">Open user menu</span>
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="rounded-full h-8 w-8 bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">Profile</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">Settings</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
