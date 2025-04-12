import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

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
  // We'll handle role checking when the Component renders
  return (
    <Route path={path} component={Component} />
  );
}
