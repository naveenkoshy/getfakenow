import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertTriangle, Mail, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface EmailVerificationBannerProps {
  /** Visual variant: 'inline' renders inside a container, 'sticky' renders fixed at top */
  variant?: "inline" | "sticky";
}

export function EmailVerificationBanner({ variant = "inline" }: EmailVerificationBannerProps) {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  const sendVerification = trpc.auth.sendVerificationEmail.useMutation({
    onSuccess: () => {
      setSent(true);
      toast.success("Verification email sent! Check your inbox.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Don't show if not authenticated, already verified, or dismissed
  if (!isAuthenticated || !user || (user as any).emailVerified || dismissed) {
    return null;
  }

  const handleResend = () => {
    sendVerification.mutate();
  };

  if (variant === "sticky") {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Verify your email</span>
                <span className="hidden sm:inline"> to complete purchases. Check your inbox for a verification link.</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {sent ? (
                <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sent
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={sendVerification.isPending}
                  className="inline-flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 text-xs font-semibold rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {sendVerification.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  {sendVerification.isPending ? "Sending..." : "Resend"}
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-amber-500 hover:text-amber-700 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (for account/profile pages)
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-800">Email not verified</h3>
          <p className="text-sm text-amber-700 mt-1">
            Please verify your email address ({user.email}) to place orders and access all features.
            Check your inbox for a verification link, or click below to resend.
          </p>
          <div className="mt-3 flex items-center gap-3">
            {sent ? (
              <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Verification email sent! Check your inbox.
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={sendVerification.isPending}
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 text-sm font-semibold rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {sendVerification.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {sendVerification.isPending ? "Sending..." : "Resend Verification Email"}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
