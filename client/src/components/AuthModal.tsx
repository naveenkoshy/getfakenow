import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Mail, Chrome, Facebook, ArrowLeft, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "login" | "signup";
}

export function AuthModal({ open, onOpenChange, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "providers">(defaultMode === "login" ? "providers" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      utils.auth.me.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast({ title: "Account created!", description: "Welcome to Fake by Freetown." });
      utils.auth.me.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast({ title: "Reset link sent", description: "Check your email for password reset instructions." });
      setMode("login");
    },
    onError: (error) => {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRememberMe(false);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email, password, rememberMe });
      } else if (mode === "signup") {
        if (!name.trim()) {
          toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
          setLoading(false);
          return;
        }
        await registerMutation.mutateAsync({ email, password, name });
      } else if (mode === "reset") {
        await resetPasswordMutation.mutateAsync({ email });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook" | "manus") => {
    if (provider === "manus") {
      const loginUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
      if (loginUrl) {
        window.location.href = `${loginUrl}?app_id=${import.meta.env.VITE_APP_ID}`;
      }
    } else {
      window.location.href = `/api/auth/${provider}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setMode(defaultMode === "login" ? "providers" : "signup"); resetForm(); } }}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-0">
        {/* Header */}
        <div className="bg-red-600 px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold tracking-wide">
              {mode === "providers" && "Sign In"}
              {mode === "login" && "Sign In with Email"}
              {mode === "signup" && "Create Account"}
              {mode === "reset" && "Reset Password"}
            </DialogTitle>
            <p className="text-red-100 text-sm mt-1">
              {mode === "providers" && "Choose how you'd like to continue"}
              {mode === "login" && "Enter your email and password"}
              {mode === "signup" && "Join Fake by Freetown"}
              {mode === "reset" && "We'll send you a reset link"}
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Provider Selection Screen */}
          {mode === "providers" && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 justify-start gap-3 text-sm font-medium border-gray-200 hover:bg-gray-50"
                onClick={() => handleSocialLogin("google")}
              >
                <Chrome className="h-5 w-5 text-[#4285F4]" />
                Continue with Google
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 justify-start gap-3 text-sm font-medium border-gray-200 hover:bg-gray-50"
                onClick={() => handleSocialLogin("facebook")}
              >
                <Facebook className="h-5 w-5 text-[#1877F2]" />
                Continue with Facebook
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 justify-start gap-3 text-sm font-medium border-gray-200 hover:bg-gray-50"
                onClick={() => setMode("login")}
              >
                <Mail className="h-5 w-5 text-gray-600" />
                Continue with Email
              </Button>

              <div className="text-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-red-600 hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {/* Email Login Form */}
          {mode === "login" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setMode("providers")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> All sign-in options
              </button>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-sm text-red-600 hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-red-600 hover:underline font-medium" disabled={loading}>
                  Sign up
                </button>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {mode === "signup" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setMode("providers")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> All sign-in options
              </button>

              {/* Social signup buttons */}
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 gap-2 text-xs border-gray-200"
                  onClick={() => handleSocialLogin("google")}
                >
                  <Chrome className="h-4 w-4 text-[#4285F4]" /> Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 gap-2 text-xs border-gray-200"
                  onClick={() => handleSocialLogin("facebook")}
                >
                  <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500">or sign up with email</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">At least 8 characters with uppercase, lowercase, and number</p>
              </div>

              <Button type="submit" className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>

              <div className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("providers")} className="text-red-600 hover:underline font-medium" disabled={loading}>
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Password Reset Form */}
          {mode === "reset" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>

              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
