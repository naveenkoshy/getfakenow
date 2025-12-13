import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for admin-only routes
 * Redirects non-admin users to home page
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in - redirect to home
        toast({
          title: "Authentication Required",
          description: "Please log in to access the admin panel",
          variant: "destructive",
        });
        setLocation("/");
      } else if (user.role !== "admin") {
        // Logged in but not admin - redirect to home
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin panel",
          variant: "destructive",
        });
        setLocation("/");
      }
    }
  }, [user, loading, setLocation, toast]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show nothing if not authorized (will redirect)
  if (!user || user.role !== "admin") {
    return null;
  }

  // User is admin - render children
  return <>{children}</>;
}
