
import { Key } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PasswordSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Manage your account password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          To change your password, you'll need to log out and use the reset password feature on the login page.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" disabled>
          <Key className="h-4 w-4 mr-2" />
          <span>Reset Password</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
