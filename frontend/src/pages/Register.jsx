import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react";

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
import { register } from "@/services/api";

const schema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(60, "Full name is too long"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register: reg,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate("/verify", { state: { email: data.email } });
    } catch (err) {
      setServerError(
        err?.response?.data?.message || "Registration failed. Please try again."
      );
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
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Enter your details to get started with Backend Ledger.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="mt-1.5"
                  {...reg("name")}
                  aria-invalid={!!errors.name}
                />
                <FieldError message={errors.name?.message} />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="mt-1.5"
                  {...reg("email")}
                  aria-invalid={!!errors.email}
                />
                <FieldError message={errors.email?.message} />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                    {...reg("password")}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={errors.password?.message} />
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                    {...reg("confirmPassword")}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={errors.confirmPassword?.message} />
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-800">{serverError}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                id="register-submit-btn"
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
