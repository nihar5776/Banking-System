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
import { login } from "@/services/api";
import api from "@/services/api";

// Probe the system-only endpoint to detect user role without backend changes.
// System user  → auth passes → 400 (missing body fields)
// Normal user  → auth fails  → 403 (not a System User)
async function probeSystemUser() {
  try {
    await api.post("/transactions/system/initial-funds", {});
    return true; // shouldn't happen but treat as system
  } catch (err) {
    const status = err?.response?.status;
    if (status === 403) return false; // normal user
    if (status === 400) return true;  // system user — passed auth, failed body validation
    return false; // fallback
  }
}

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const res = await login({ email: data.email, password: data.password });
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.token) sessionStorage.setItem("token", res.data.token);
      if (data.rememberMe) {
        localStorage.setItem("rememberedEmail", data.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Detect role by probing the system-only endpoint
      const isSystemUser = await probeSystemUser();
      sessionStorage.setItem("isSystemUser", isSystemUser ? "true" : "false");

      navigate(isSystemUser ? "/admin-dashboard" : "/dashboard");
    } catch (err) {
      setServerError(
        err?.response?.data?.message || "Invalid email or password."
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
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to access your account.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  className="mt-1.5"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                <FieldError message={errors.email?.message} />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                    {...register("password")}
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                  {...register("rememberMe")}
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  Remember me for 30 days
                </Label>
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-800">{serverError}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                id="login-submit-btn"
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
