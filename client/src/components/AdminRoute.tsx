import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for admin-only routes.
 * Uses the separate admin session (adminAuthRouter.me) instead of customer auth.
 * Redirects to /admin/login if no valid admin session exists.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { data: adminUser, isLoading } = trpc.adminAuthRouter.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
    // Re-check every 5 minutes to catch session expiry
    refetchInterval: 5 * 60 * 1000,
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !adminUser) {
      setLocation("/admin/login");
    }
  }, [adminUser, isLoading, setLocation]);

  // Show loading state while checking admin session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  // No admin session — will redirect
  if (!adminUser) {
    return null;
  }

  // Valid admin session — render children
  return <>{children}</>;
}
