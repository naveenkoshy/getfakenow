import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Loader2, Mail, ArrowLeft, Shield, Store, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.adminAuthRouter.forgotPassword.useMutation({
    onSuccess: (data) => {
      setSent(true);
      toast.success("Check your email for the reset link");
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    forgotMutation.mutate({ email });
  };

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

        {/* Card */}
        <Card className="bg-white border-gray-200 shadow-xl">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-lg font-semibold text-gray-900 text-center">
              {sent ? "Check Your Email" : "Forgot Password"}
            </h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              {sent
                ? "We've sent a password reset link to your email address."
                : "Enter your admin email and we'll send you a reset link."}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">
                  If an admin account exists with <strong>{email}</strong>, you'll receive
                  an email with instructions to reset your password.
                </p>
                <p className="text-xs text-gray-400">
                  The link expires in 1 hour. Check your spam folder if you don't see it.
                </p>
                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setSent(false); setEmail(""); }}
                  >
                    Try a different email
                  </Button>
                  <a href="/admin/login" className="block">
                    <Button variant="ghost" className="w-full text-gray-500">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Enter the email address associated with your admin account.
                  </p>
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
                      disabled={forgotMutation.isPending}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <a href="/admin/login" className="block">
                  <Button variant="ghost" className="w-full text-gray-500">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </a>
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
