import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Loader2, Shield, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AdminSetup() {
  const search = useSearch();
  const token = useMemo(() => new URLSearchParams(search).get("token") || "", [search]);
  const [, navigate] = useLocation();

  const { data: validation, isLoading: validating } = trpc.admin.acceptInvite.validate.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const acceptMut = trpc.admin.acceptInvite.accept.useMutation({
    onSuccess: () => {
      toast.success("Admin account created! Redirecting to login...");
      setTimeout(() => navigate("/admin/login"), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = useMemo(() => ({
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    match: password === confirmPassword && password.length > 0,
  }), [password, confirmPassword]);

  const allValid = Object.values(passwordChecks).every(Boolean) && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;
    acceptMut.mutate({ token, name: name.trim(), password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-500">This invite link is missing a token. Please check the link from your email.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (validation && !validation.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Invalid</h2>
            <p className="text-gray-500">{validation.error}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/login")}>
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Logo className="h-10" />
          </div>
          <CardTitle className="text-xl">Set Up Admin Account</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            You've been invited as an admin for <strong>{validation?.email}</strong>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
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

            <div>
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="mt-1"
              />
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-medium text-gray-600 mb-2">Password Requirements:</p>
              {[
                { key: "length", label: "At least 12 characters" },
                { key: "uppercase", label: "One uppercase letter" },
                { key: "lowercase", label: "One lowercase letter" },
                { key: "number", label: "One number" },
                { key: "special", label: "One special character" },
                { key: "match", label: "Passwords match" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  {passwordChecks[key as keyof typeof passwordChecks] ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-xs ${passwordChecks[key as keyof typeof passwordChecks] ? "text-green-700" : "text-gray-500"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={!allValid || acceptMut.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {acceptMut.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating Account...</>
              ) : (
                <><Shield className="h-4 w-4 mr-2" /> Create Admin Account</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
