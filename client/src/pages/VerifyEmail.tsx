import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link, useSearch } from "wouter";

export default function VerifyEmail() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const { refresh } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Your email has been verified successfully!");
      refresh();
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Verification failed. The link may have expired.");
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setMessage("No verification token provided.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-red-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
            <p className="text-gray-500">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="bg-red-600 text-white px-8 py-3 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all rounded"
              >
                SHOP NOW
              </Link>
              <Link
                href="/account"
                className="border-2 border-gray-200 text-gray-700 px-8 py-3 text-sm font-semibold tracking-wider hover:border-gray-300 transition-all rounded"
              >
                MY ACCOUNT
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <Link
              href="/account"
              className="bg-red-600 text-white px-8 py-3 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all rounded inline-block"
            >
              GO TO ACCOUNT
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
