
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuthContext } from '@/contexts/AuthContext';
import { Spinner } from "@/components/ui/spinner";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, isLoggedIn, isLoading } = useAuthContext();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Retry mechanism for context initialization
  const [retryCount, setRetryCount] = useState(0);
  const [contextInitialized, setContextInitialized] = useState(false);
  
  // Check if context is initialized with retry mechanism
  useEffect(() => {
    const checkContext = setTimeout(() => {
      if (isLoading && retryCount < 5) {
        setRetryCount(prev => prev + 1);
      } else {
        setContextInitialized(true);
      }
    }, 500);
    
    return () => clearTimeout(checkContext);
  }, [isLoading, retryCount]);
  
  // If user is already logged in, redirect to dashboard or origin page
  useEffect(() => {
    if (isLoggedIn) {
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
    }
  }, [isLoggedIn, navigate, location.state]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!contextInitialized) {
      toast({
        title: "System Initializing",
        description: "Please wait a moment while the authentication system initializes",
        variant: "destructive"
      });
      setErrorMessage("Authentication system is still initializing. Please wait a moment and try again.");
      return;
    }
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      setErrorMessage("Please enter both email and password");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Attempting login with:", loginEmail);
      const result = await login(loginEmail, loginPassword);
      
      if (result.success) {
        toast({
          title: "Login successful",
          description: "Welcome back to Pilot Portal",
        });
      } else {
        console.error("Login error:", result.error);
        setErrorMessage(result.error?.message || "Invalid email or password. Please try again.");
        toast({
          title: "Login failed",
          description: result.error?.message || "Invalid email or password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state if auth context is still initializing
  if (isLoading && !contextInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="w-full max-w-md p-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <img 
              src="/lovable-uploads/a3418b2a-f9be-4db1-b4e3-fc25d496bc71.png" 
              alt="Pilot Portal Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold">Pilot Portal</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {errorMessage}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your.email@example.com" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password"
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Logging in...
                  </>
                ) : 'Log In'}
              </Button>
              
              <div className="text-center text-sm text-gray-500">
                This is a shared company login. Contact your administrator for access.
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
