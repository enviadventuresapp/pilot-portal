
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { User, Mail } from 'lucide-react';
import * as authService from '@/services/authService';

interface ProfileInfoFormProps {
  userData: {
    name: string;
    email: string;
    user_id: string;
  };
}

export function ProfileInfoForm({ userData }: ProfileInfoFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fix: Only update state when userData changes, not on every render
  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setEmail(userData.email || '');
    }
  }, [userData]);
  
  const handleUpdateProfile = async () => {
    if (!userData?.user_id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await authService.updateProfile(userData.user_id, {
        name,
        email
      });
      
      if (error) {
        toast({
          title: "Update failed",
          description: error.message || "Failed to update profile",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Manage your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              placeholder="Enter your full name"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="Enter your email address"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpdateProfile} 
          disabled={isUpdating}
        >
          {isUpdating ? (
            <div className="flex items-center">
              <Spinner size="sm" className="mr-2" />
              <span>Updating...</span>
            </div>
          ) : "Update Profile"}
        </Button>
      </CardFooter>
    </Card>
  );
}
