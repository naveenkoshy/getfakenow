import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Check, X } from "lucide-react";
import { toast } from "sonner";

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-gray-300 shrink-0" />
      )}
      <span className={met ? "text-green-600" : "text-gray-400"}>{label}</span>
    </div>
  );
}

export default function ResetPassword() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, setLocation] = useLocation();

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isValid = hasUpperCase && hasLowerCase && hasNumber && hasMinLength && passwordsMatch;

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Password reset successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please meet all password requirements");
      return;
    }
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Card className="bg-white border-gray-200 shadow-xl">
            <CardContent className="py-12 px-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Invalid Reset Link</h2>
              <p className="text-sm text-gray-500 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="space-y-2">
                <a href="/admin/forgot-password" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Request New Reset Link
                  </Button>
                </a>
                <a href="/admin/login" className="block">
                  <Button variant="ghost" className="w-full text-gray-500">
                    Back to Sign In
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Logo size="md" variant="dark" />
          </div>
        </div>

        {/* Card */}
        <Card className="bg-white border-gray-200 shadow-xl">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-lg font-semibold text-gray-900 text-center">
              {success ? "Password Reset!" : "Set New Password"}
            </h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              {success
                ? "Your password has been updated successfully."
                : "Create a strong password for your account."}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">
                  You can now sign in with your new password.
                </p>
                <a href="/admin/login" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Sign In
                  </Button>
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      autoFocus
                      disabled={resetMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password requirements */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1 p-3 bg-gray-50 rounded-lg">
                      <PasswordRequirement met={hasMinLength} label="At least 8 characters" />
                      <PasswordRequirement met={hasUpperCase} label="One uppercase letter" />
                      <PasswordRequirement met={hasLowerCase} label="One lowercase letter" />
                      <PasswordRequirement met={hasNumber} label="One number" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      disabled={resetMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={resetMutation.isPending || !isValid}
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700 inline-block"
          >
            &larr; Back to storefront
          </a>
        </div>
      </div>
    </div>
  );
}
