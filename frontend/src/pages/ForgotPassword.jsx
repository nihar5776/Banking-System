import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Building2, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { requestPasswordResetOtp } from "@/services/api";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await requestPasswordResetOtp({ email: data.email });
      setSubmittedEmail(data.email);
      setSent(true);
      toast({
        variant: "success",
        title: "OTP sent",
        description: "Check your inbox for the reset code.",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to send OTP. Please try again.";
      toast({ variant: "destructive", title: "Error", description: msg });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Backend Ledger</span>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              {sent
                ? `We sent a reset code to ${submittedEmail}. Use it on the next page.`
                : "Enter the email address linked to your account and we'll send you a one-time reset code."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              /* Success state */
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <Mail className="h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-sm text-green-800">
                    OTP sent to <span className="font-medium">{submittedEmail}</span>. It expires in 5 minutes.
                  </p>
                </div>
                <Button
                  id="go-to-reset-btn"
                  className="w-full"
                  onClick={() =>
                    navigate("/reset-password", {
                      state: { email: submittedEmail },
                    })
                  }
                >
                  Enter OTP &amp; Reset Password
                </Button>
                <Button
                  id="resend-forgot-btn"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setSent(false)}
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              /* Form state */
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    className="mt-1.5"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                  />
                  <FieldError message={errors.email?.message} />
                </div>

                <Button
                  id="send-otp-btn"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    "Send Reset OTP"
                  )}
                </Button>

                <div className="flex items-center justify-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
