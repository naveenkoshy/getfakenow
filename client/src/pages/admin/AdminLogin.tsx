import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Loader2, Lock, Mail, Eye, EyeOff, Shield, Store } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();

  // Check if already logged in as admin
  const { data: adminUser, isLoading: checkingAuth } = trpc.adminAuthRouter.me.useQuery();

  const loginMutation = trpc.adminAuthRouter.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Seller Center");
      setLocation("/admin");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid credentials");
    },
  });

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (adminUser && !checkingAuth) {
      setLocation("/admin");
    }
  }, [adminUser, checkingAuth, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Logo size="md" variant="dark" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">
              Seller Center
            </span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white border-gray-200 shadow-xl">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-lg font-semibold text-gray-900 text-center">
              Admin Sign In
            </h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              Enter your admin credentials to continue
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    autoFocus
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Session expires after 30 minutes of inactivity
          </p>
          <a
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700 mt-2 inline-block"
          >
            &larr; Back to storefront
          </a>
        </div>
      </div>
    </div>
  );
}
