import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(searchParams).get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const result = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(result.message);
        } else {
          setStatus("error");
          setMessage(result.message || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    }

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            {status === "loading" && (
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === "error" && (
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <Button
              className="w-full"
              onClick={() => setLocation("/login")}
            >
              Continue to Login
            </Button>
          )}
          {status === "error" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/register")}
            >
              Back to Registration
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
