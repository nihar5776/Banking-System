import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
  Wallet,
  ShieldCheck,
  Hash,
  User,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getUserAccount, getAccountBalance, createTransaction } from "@/services/api";

/* ─── constants ──────────────────────────────────────────────────────────── */

const DAILY_LIMIT = 100000; // placeholder — no backend field yet

/* ─── helpers ──────────────────────────────────────────────────────────── */

function formatCurrency(amount, currency = "INR") {
  const localeMap = { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB" };
  return new Intl.NumberFormat(localeMap[currency] || "en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

function maskAccountId(id = "") {
  if (!id) return "—";
  const upper = id.toUpperCase();
  return `••••  ••••  ${upper.slice(-8, -4)}  ${upper.slice(-4)}`;
}

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getStatusVariant(status) {
  if (status === "Active") return "success";
  if (status === "Frozen") return "warning";
  return "secondary";
}

/* ─── Zod schema ─────────────────────────────────────────────────────────── */

const schema = z.object({
  toAccount: z
    .string()
    .min(1, "Recipient account number is required")
    .regex(/^[a-f\d]{24}$/i, "Enter a valid 24-character account ID"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Amount must be greater than 0",
    }),
});

/* ─── Validation Banner ──────────────────────────────────────────────────── */

function ValidationBanner({ checks }) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
      {failed.map((c) => (
        <div key={c.label} className="flex items-center gap-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          {c.message}
        </div>
      ))}
    </div>
  );
}

/* ─── Sender Account Summary ─────────────────────────────────────────────── */

function SenderSummary({ account, balance, loading }) {
  const user = getUser();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-48">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-2 py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No account found.</p>
            <p className="text-xs text-muted-foreground">
              Create a bank account before transferring.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rows = [
    {
      icon: User,
      label: "Account Holder",
      value: user?.name ?? "—",
    },
    {
      icon: Hash,
      label: "Account Number",
      value: maskAccountId(account._id),
      mono: true,
    },
    {
      icon: Wallet,
      label: "Available Balance",
      value:
        balance !== null
          ? formatCurrency(balance, account.currency)
          : "—",
      highlight: true,
    },
    {
      icon: ShieldCheck,
      label: "Account Status",
      value: (
        <Badge variant={getStatusVariant(account.status)}>
          {account.status ?? "—"}
        </Badge>
      ),
    },
    {
      icon: ArrowRight,
      label: "Daily Transfer Limit",
      value: formatCurrency(DAILY_LIMIT, account.currency),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Your Account</CardTitle>
        <CardDescription>Funds will be debited from this account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pb-6">
        {rows.map(({ icon: Icon, label, value, mono, highlight }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{label}</span>
            </div>
            <span
              className={[
                "text-sm font-medium text-right truncate",
                mono ? "font-mono text-xs" : "",
                highlight ? "text-primary font-semibold" : "text-foreground",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Confirmation Dialog ───────────────────────────────────────────────── */

function ConfirmDialog({ open, onOpenChange, data, onConfirm, confirming }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Transfer</DialogTitle>
          <DialogDescription>
            Please review the details before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <div className="rounded-lg border border-border divide-y divide-border">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-muted-foreground">Recipient</span>
              <span className="text-sm font-mono font-medium text-foreground text-right max-w-[160px] truncate">
                {data?.toAccount}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-base font-bold text-foreground">
                {data?.formattedAmount}
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            This action cannot be undone. The amount will be debited immediately.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            id="cancel-transfer-btn"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancel
          </Button>
          <Button
            id="confirm-transfer-btn"
            className="w-full sm:w-auto"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirm Transfer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Field Error ────────────────────────────────────────────────────────── */

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

/* ─── Transfer Page ─────────────────────────────────────────────────────── */

export default function Transfer() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);

  const [validating, setValidating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const watchedAmount = watch("amount");

  /* Fetch sender account on mount */
  const fetchAccount = useCallback(async () => {
    setAccountLoading(true);
    try {
      const res = await getUserAccount();
      const acc = res.data.accounts;
      if (acc) {
        setAccount(acc);
        const balRes = await getAccountBalance(acc._id);
        setBalance(balRes.data.balance ?? 0);
      }
    } catch (err) {
      if (err?.response?.status === 401) navigate("/login");
    } finally {
      setAccountLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  /* Pre-transfer checks */
  const getValidationChecks = (amount) => [
    {
      label: "account_exists",
      pass: !!account,
      message: "You must have a bank account to transfer funds.",
    },
    {
      label: "account_active",
      pass: account?.status === "Active",
      message: `Your account is ${account?.status ?? "unavailable"} and cannot send funds.`,
    },
    {
      label: "sufficient_balance",
      pass: balance !== null && Number(amount) <= balance,
      message: `Insufficient balance. Available: ${formatCurrency(balance, account?.currency)}.`,
    },
    {
      label: "amount_positive",
      pass: Number(amount) > 0,
      message: "Transfer amount must be greater than 0.",
    },
  ];

  /* On form submit — validate then open confirm dialog */
  const onSubmit = async (data) => {
    setValidating(true);

    // Simulate a brief validation delay for UX
    await new Promise((r) => setTimeout(r, 600));

    const checks = getValidationChecks(data.amount);
    const failed = checks.filter((c) => !c.pass);

    setValidating(false);

    if (failed.length > 0) {
      failed.forEach((c) => {
        toast({ variant: "destructive", title: "Transfer blocked", description: c.message });
      });
      return;
    }

    // All checks passed — open confirmation dialog
    setPendingData({
      fromAccount: account._id,
      toAccount: data.toAccount.trim(),
      amount: Number(data.amount),
      formattedAmount: formatCurrency(Number(data.amount), account?.currency),
    });
    setConfirmOpen(true);
  };

  /* Execute transfer after confirm */
  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await createTransaction({
        fromAccount: pendingData.fromAccount,
        toAccount: pendingData.toAccount,
        amount: pendingData.amount,
      });

      toast({
        variant: "success",
        title: "Transfer successful",
        description: `${pendingData.formattedAmount} sent successfully.`,
      });

      setConfirmOpen(false);
      reset();

      // Refresh balance after transfer
      const balRes = await getAccountBalance(account._id);
      setBalance(balRes.data.balance ?? 0);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Transfer failed. Please check the recipient account and try again.";
      toast({ variant: "destructive", title: "Transfer failed", description: msg });
      setConfirmOpen(false);
    } finally {
      setConfirming(false);
    }
  };

  /* Live checks shown while user is typing */
  const liveChecks = account
    ? getValidationChecks(watchedAmount ?? 0).filter((c) => !c.pass)
    : [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Transfer Money</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send funds instantly to any Backend Ledger account.
          </p>
        </div>

        {/* Account-level blocking alert */}
        {!accountLoading && account && account.status !== "Active" && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Account unavailable</p>
              <p className="text-xs text-red-700 mt-0.5">
                Your account is <strong>{account.status}</strong>. Transfers are disabled.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── Left: Transfer Form ── */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Send Money</CardTitle>
                <CardDescription>
                  Enter the recipient's account ID and the amount to transfer.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form
                  id="transfer-form"
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="space-y-5"
                >
                  {/* Recipient Account */}
                  <div>
                    <Label htmlFor="toAccount">Recipient Account Number</Label>
                    <Input
                      id="toAccount"
                      type="text"
                      placeholder="Recipient Account ID"
                      className="mt-1.5 font-mono text-sm"
                      {...register("toAccount")}
                      aria-invalid={!!errors.toAccount}
                    />
                    <FieldError message={errors.toAccount?.message} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ask the recipient to share their full Account ID from their dashboard.
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <Label htmlFor="amount">Amount ({account?.currency ?? "INR"})</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm font-medium">
                        {account?.currency === "USD"
                          ? "$"
                          : account?.currency === "EUR"
                          ? "€"
                          : account?.currency === "GBP"
                          ? "£"
                          : "₹"}
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        {...register("amount")}
                        aria-invalid={!!errors.amount}
                      />
                    </div>
                    <FieldError message={errors.amount?.message} />
                    {balance !== null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Available:{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(balance, account?.currency)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Live validation banner (only shows when there's an issue) */}
                  {watchedAmount && liveChecks.length > 0 && (
                    <ValidationBanner checks={liveChecks} />
                  )}

                  {/* Submit */}
                  <Button
                    id="send-money-btn"
                    type="submit"
                    className="w-full"
                    disabled={
                      validating ||
                      accountLoading ||
                      !account ||
                      account.status !== "Active"
                    }
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validating…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Money
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Sender Summary ── */}
          <div className="lg:col-span-2">
            <SenderSummary
              account={account}
              balance={balance}
              loading={accountLoading}
            />

            {/* Transfer tips */}
            {!accountLoading && account && (
              <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">Before you transfer</p>
                {[
                  "Double-check the recipient's account ID.",
                  "Transfers are instant and cannot be reversed.",
                  "You'll receive an email confirmation.",
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        data={pendingData}
        onConfirm={handleConfirm}
        confirming={confirming}
      />
    </AppLayout>
  );
}
