import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  role?: string;
}

export function ProtectedRoute({
  path,
  component: Component,
  role
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }
  
        if (!user) {
          return <Redirect to="/auth" />;
        }
  
        // Check if user has the required role
        if (role && user.role !== role) {
          return <Redirect to="/" />;
        }
  
        return <Component />;
      }}
    </Route>
  );
}
