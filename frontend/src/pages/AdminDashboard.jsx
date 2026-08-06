import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Hash,
  User,
  LogOut,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import api, { getUserAccount, getAccountBalance, getTransactionHistory, logout } from "@/services/api";

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
  try { return JSON.parse(sessionStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

/* ─── Zod schema ─────────────────────────────────────────────────────────── */

const schema = z.object({
  toAccount: z
    .string()
    .min(1, "Recipient account ID is required")
    .regex(/^[a-f\d]{24}$/i, "Must be a valid 24-character account ID"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Amount must be greater than 0",
    }),
});

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

/* ─── System Account Summary ─────────────────────────────────────────────── */

function SystemAccountCard({ account, balance, txCount }) {
  const user = getUser();
  const rows = [
    { icon: User,       label: "Account Holder", value: user?.name ?? "—" },
    { icon: Hash,       label: "Account Number", value: maskAccountId(account?._id), mono: true },
    { icon: Wallet,     label: "Current Balance", value: balance !== null ? formatCurrency(balance, account?.currency) : "—", highlight: true },
    { icon: ShieldCheck,label: "Account Status", value: <Badge variant={account?.status === "Active" ? "success" : "warning"}>{account?.status ?? "—"}</Badge> },
    { icon: ArrowRight, label: "Balance Limit", value: <span className="text-green-600 font-medium text-sm">Unlimited</span> },
    { icon: ArrowRight, label: "Total Transactions", value: txCount.toString() },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">System Account</CardTitle>
            <CardDescription>Administrative — no transfer limits</CardDescription>
          </div>
          <Badge variant="default" className="bg-primary/90">Admin</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pb-6">
        {rows.map(({ icon: Icon, label, value, mono, highlight }) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{label}</span>
            </div>
            <span className={[
              "text-sm font-medium text-right",
              mono ? "font-mono text-xs" : "",
              highlight ? "text-primary font-semibold" : "text-foreground",
            ].filter(Boolean).join(" ")}>
              {value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────── */

function ConfirmDialog({ open, onOpenChange, data, onConfirm, confirming }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Fund Disbursement</DialogTitle>
          <DialogDescription>Review before sending initial funds.</DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <div className="rounded-lg border border-border divide-y divide-border">
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">Recipient</span>
              <span className="text-sm font-mono font-medium text-foreground max-w-[160px] truncate">{data?.toAccount}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-base font-bold text-foreground">{data?.formattedAmount}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Funds will be credited to the recipient's account immediately.
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button id="cancel-disburse-btn" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={confirming}>
            Cancel
          </Button>
          <Button id="confirm-disburse-btn" className="w-full sm:w-auto" onClick={onConfirm} disabled={confirming}>
            {confirming ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : <><Send className="h-4 w-4" />Confirm & Send</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Admin Dashboard ────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getUser();

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [validating, setValidating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const accRes = await getUserAccount();
      const acc = accRes.data.accounts;
      if (acc) {
        setAccount(acc);
        const [balRes, txRes] = await Promise.all([
          getAccountBalance(acc._id),
          getTransactionHistory(acc._id),
        ]);
        setBalance(balRes.data.balance ?? 0);
        setTransactions(txRes.data.transactions ?? []);
      }
    } catch (err) {
      if (err?.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    try { await logout(); } catch {}
    sessionStorage.clear();
    navigate("/login");
  };

  const onSubmit = async (data) => {
    setValidating(true);
    await new Promise((r) => setTimeout(r, 500));
    setValidating(false);

    // System user has NO balance limit — only check account exists and amount > 0
    if (!account) {
      toast({ variant: "destructive", title: "No system account", description: "System account not found." });
      return;
    }
    if (account.status !== "Active") {
      toast({ variant: "destructive", title: "Account inactive", description: `System account is ${account.status}.` });
      return;
    }

    setPendingData({
      toAccount: data.toAccount.trim(),
      amount: Number(data.amount),
      formattedAmount: formatCurrency(Number(data.amount), account?.currency),
    });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      // System user uses the dedicated no-limit initial-funds endpoint
      await api.post("/transactions/system/initial-funds", {
        toAccount: pendingData.toAccount,
        amount: pendingData.amount,
      });
      toast({ variant: "success", title: "Funds disbursed", description: `${pendingData.formattedAmount} sent to recipient.` });
      setConfirmOpen(false);
      reset();
      const balRes = await getAccountBalance(account._id);
      setBalance(balRes.data.balance ?? 0);
    } catch (err) {
      const msg = err?.response?.data?.message || "Disbursement failed. Check recipient account ID.";
      toast({ variant: "destructive", title: "Failed", description: msg });
      setConfirmOpen(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Backend Ledger</span>
          <span className="ml-2 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "A"}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-foreground">{user?.name}</span>
          <Button id="admin-logout-btn" variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Disburse initial funds to user accounts. No transfer limit applies.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left: Fund Disbursement Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Disburse Funds</CardTitle>
                  <CardDescription>
                    Send initial funds to a user account. There is no balance limit on this account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                    {/* Recipient */}
                    <div>
                      <Label htmlFor="admin-toAccount">Recipient Account ID</Label>
                      <Input
                        id="admin-toAccount"
                        type="text"
                        placeholder="Recipient Account ID"
                        className="mt-1.5 font-mono text-sm"
                        {...register("toAccount")}
                        aria-invalid={!!errors.toAccount}
                      />
                      <FieldError message={errors.toAccount?.message} />
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor="admin-amount">Amount ({account?.currency ?? "INR"})</Label>
                      <div className="relative mt-1.5">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm font-medium">
                          {account?.currency === "USD" ? "$" : account?.currency === "EUR" ? "€" : "₹"}
                        </span>
                        <Input id="admin-amount" type="number" min="1" step="0.01" placeholder="0.00" className="pl-7" {...register("amount")} aria-invalid={!!errors.amount} />
                      </div>
                      <FieldError message={errors.amount?.message} />
                      <p className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        No balance limit — system account can disburse any amount
                      </p>
                    </div>

                    <Button id="disburse-btn" type="submit" className="w-full" disabled={validating || !account || account.status !== "Active"}>
                      {validating ? <><Loader2 className="h-4 w-4 animate-spin" />Validating…</> : <><Send className="h-4 w-4" />Disburse Funds</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: System Account Summary */}
            <div className="lg:col-span-2">
              <SystemAccountCard
                account={account}
                balance={balance}
                txCount={new Set(transactions.map((t) => t.transaction?._id || t.transaction).filter(Boolean)).size}
              />
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} data={pendingData} onConfirm={handleConfirm} confirming={confirming} />
    </div>
  );
}
