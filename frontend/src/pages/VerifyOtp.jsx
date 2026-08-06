import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Building2, CheckCircle2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { verifyOtp, resendOtp } from "@/services/api";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (index, value) => {
    // Only accept single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      toast({ variant: "destructive", title: "Incomplete OTP", description: "Please enter all 6 digits." });
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp({ email, otp: code });
      setSuccess(true);
      toast({ variant: "success", title: "Verified!", description: "Your account has been activated." });
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired OTP.";
      toast({ variant: "destructive", title: "Verification failed", description: msg });
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }, [otp, email, navigate, toast]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendOtp({ email });
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      toast({ variant: "success", title: "OTP resent", description: "A new code was sent to your email." });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to resend OTP.";
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setResending(false);
    }
  };

  const filled = otp.filter(Boolean).length;
  const isComplete = filled === OTP_LENGTH;

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
          <CardHeader className="pb-4 text-center">
            {success ? (
              <>
                <div className="flex justify-center mb-3">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <CardTitle>Account verified!</CardTitle>
                <CardDescription>Redirecting you to login…</CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{email || "your email"}</span>.
                  Enter it below to verify your account.
                </CardDescription>
              </>
            )}
          </CardHeader>

          {!success && (
            <CardContent className="space-y-6">
              {/* OTP Inputs */}
              <div>
                <div
                  className="flex items-center justify-center gap-2"
                  onPaste={handlePaste}
                  role="group"
                  aria-label="One-time password input"
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="h-12 w-11 rounded-lg border border-input bg-background text-center text-lg font-semibold tracking-widest ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 transition-colors"
                      aria-label={`OTP digit ${idx + 1}`}
                      disabled={verifying}
                    />
                  ))}
                </div>

                {/* Progress hint */}
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {filled === 0 && "Enter the code from your email"}
                  {filled > 0 && filled < OTP_LENGTH && `${filled} of ${OTP_LENGTH} digits entered`}
                  {isComplete && "All digits entered — ready to verify"}
                </p>
              </div>

              {/* Verify Button */}
              <Button
                id="verify-otp-btn"
                onClick={handleVerify}
                disabled={!isComplete || verifying}
                className="w-full"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify Account"
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">Didn't receive a code?</span>
                </div>
              </div>

              {/* Resend Section */}
              <div className="flex flex-col items-center gap-2">
                {cooldown > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Resend available in</span>
                    <span
                      id="resend-countdown"
                      className="font-semibold tabular-nums text-foreground"
                    >
                      {formatTime(cooldown)}
                    </span>
                  </div>
                ) : (
                  <Button
                    id="resend-otp-btn"
                    variant="outline"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending new code…
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Resend OTP
                      </>
                    )}
                  </Button>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Wrong email?{" "}
                <button
                  id="go-back-register"
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Go back
                </button>
              </p>
            </CardContent>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          The code expires after 5 minutes. Request a new one if it has expired.
        </p>
      </div>
    </div>
  );
}
