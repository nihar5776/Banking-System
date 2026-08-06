import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Building2, ArrowLeft, CheckCircle2 } from "lucide-react";

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
import { resetPassword } from "@/services/api";

const schema = z
  .object({
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d+$/, "OTP must contain only numbers"),
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

/* Password strength logic */
function getStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { label: "Too weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-orange-400" },
    { label: "Fair", color: "bg-yellow-400" },
    { label: "Good", color: "bg-blue-500" },
    { label: "Strong", color: "bg-green-500" },
  ];
  return { score, ...map[score] };
}

function StrengthBar({ password }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  );
}

const CRITERIA = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const email = location.state?.email || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data) => {
    try {
      await resetPassword({
        email,
        otp: data.otp,
        password: data.password,
      });
      setSuccess(true);
      toast({
        variant: "success",
        title: "Password reset",
        description: "Your password has been updated successfully.",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Reset failed. Check your OTP and try again.";
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
            {success ? (
              <>
                <div className="flex justify-center mb-3">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <CardTitle className="text-center">Password updated!</CardTitle>
                <CardDescription className="text-center">
                  Redirecting you to login…
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>
                  Enter the OTP sent to{" "}
                  <span className="font-medium text-foreground">
                    {email || "your email"}
                  </span>{" "}
                  and choose a new password.
                </CardDescription>
              </>
            )}
          </CardHeader>

          {!success && (
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                {/* OTP */}
                <div>
                  <Label htmlFor="reset-otp">One-Time Password (OTP)</Label>
                  <Input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="mt-1.5 tracking-widest font-semibold text-center"
                    {...register("otp")}
                    aria-invalid={!!errors.otp}
                  />
                  <FieldError message={errors.otp?.message} />
                </div>

                {/* New Password */}
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...register("password", {
                        onChange: (e) => setPasswordValue(e.target.value),
                      })}
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError message={errors.password?.message} />

                  {/* Strength bar */}
                  <StrengthBar password={watchedPassword} />

                  {/* Criteria checklist */}
                  {watchedPassword && (
                    <ul className="mt-2 space-y-1">
                      {CRITERIA.map(({ label, test }) => {
                        const passed = test(watchedPassword);
                        return (
                          <li
                            key={label}
                            className={`flex items-center gap-2 text-xs ${
                              passed ? "text-green-600" : "text-muted-foreground"
                            }`}
                          >
                            <CheckCircle2
                              className={`h-3.5 w-3.5 shrink-0 ${
                                passed ? "text-green-500" : "text-muted"
                              }`}
                            />
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...register("confirmPassword")}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError message={errors.confirmPassword?.message} />
                </div>

                {/* Submit */}
                <Button
                  id="reset-password-btn"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                <div className="flex items-center justify-center">
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Request a new OTP
                  </Link>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
