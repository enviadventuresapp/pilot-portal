
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { ShieldAlert, ArrowLeft, Wrench } from 'lucide-react';

export default function Unauthorized() {
  const { user, isAdmin } = useAuthContext();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
        
        <p className="text-lg text-gray-600">
          You don't have permission to access this page.
        </p>
        
        {user && (
          <div className="bg-gray-50 rounded-lg p-4 border mt-4">
            <p className="text-sm text-gray-600 mb-2">
              Current User: <span className="font-medium">{user.email}</span>
            </p>
            <p className="text-sm text-gray-600">
              Admin Status: <span className={`font-medium ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {isAdmin ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
        )}
        
        <div className="mt-8 space-y-4">
          <Link to="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          {user && !isAdmin && (
            <Link to="/admin/access-fix">
              <Button variant="default" className="w-full">
                <Wrench className="mr-2 h-4 w-4" />
                Troubleshoot Admin Access
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
