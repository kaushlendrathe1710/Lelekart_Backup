import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
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

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has the required role
  if (role && user.role !== role) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
