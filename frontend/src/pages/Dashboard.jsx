import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Copy,
  Eye,
  EyeOff,
  Check,
  Loader2,
  PlusCircle,
  Wallet,
  ArrowLeftRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
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
import {
  getUserAccount,
  getAccountBalance,
  getTransactionHistory,
  createAccount,
} from "@/services/api";

/* ─── helpers ──────────────────────────────────────────────────────────── */

function formatCurrency(amount, currency = "INR") {
  const localeMap = { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB" };
  return new Intl.NumberFormat(localeMap[currency] || "en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskAccountId(id = "") {
  if (!id) return "—";
  const upper = id.toUpperCase();
  return `••••  ••••  ${upper.slice(-8, -4)}  ${upper.slice(-4)}`;
}

function getStatusVariant(status) {
  if (status === "Active") return "success";
  if (status === "Frozen") return "warning";
  return "secondary";
}

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold text-foreground truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */

function EmptyState({ onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-12 w-12 rounded-xl border border-border bg-muted flex items-center justify-center mb-4">
        <Building2 className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">No Bank Account</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        You haven't opened a bank account yet. Create one to start managing your
        finances.
      </p>
      <Button id="open-create-account-btn" onClick={onCreateClick}>
        <PlusCircle className="h-4 w-4" />
        Create Account
      </Button>
    </div>
  );
}

/* ─── Create Account Dialog ──────────────────────────────────────────────── */

function CreateAccountDialog({ open, onOpenChange, onCreated }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await createAccount();
      toast({
        variant: "success",
        title: "Account created",
        description: "Your bank account is now active.",
      });
      onOpenChange(false);
      onCreated(res.data.account);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to create account. You may already have one.";
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const user = getUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Bank Account</DialogTitle>
          <DialogDescription>
            A new account will be opened for{" "}
            <span className="font-medium text-foreground">{user?.name || "you"}</span>{" "}
            with a default currency of INR.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-3">
          <div className="rounded-lg border border-border bg-muted/50 divide-y divide-border">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-muted-foreground">Account Holder</span>
              <span className="text-sm font-medium text-foreground">{user?.name || "—"}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-muted-foreground">Currency</span>
              <span className="text-sm font-medium text-foreground">INR</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-muted-foreground">Initial Status</span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            id="create-account-btn"
            onClick={handleCreate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Open Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Account Card ───────────────────────────────────────────────────────── */

function AccountCard({ account, balance }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const user = getUser();

  const copyAccountId = () => {
    navigator.clipboard.writeText(account._id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Account Overview</CardTitle>
            <CardDescription className="mt-0.5">
              Opened {formatDate(account?.createdAt)}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(account?.status)}>
            {account?.status ?? "—"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Account Number</p>
            <p className="text-sm font-mono font-semibold tracking-widest text-foreground select-all">
              {maskAccountId(account?._id)}
            </p>
          </div>
          <button
            id="copy-account-btn"
            onClick={copyAccountId}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy full account ID"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Account Holder</p>
            <p className="text-sm font-medium text-foreground">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Currency</p>
            <p className="text-sm font-medium text-foreground">{account?.currency ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Email</p>
            <p className="text-sm font-medium text-foreground truncate">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Account Status</p>
            <p className="text-sm font-medium text-foreground">{account?.status ?? "—"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {balanceVisible
                ? formatCurrency(balance, account?.currency)
                : "••••••"}
            </p>
          </div>
          <button
            id="toggle-balance-btn"
            onClick={() => setBalanceVisible((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={balanceVisible ? "Hide balance" : "Show balance"}
          >
            {balanceVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Custom Tooltip for Recharts ────────────────────────────────────────── */

function CustomChartTooltip({ active, payload, label, currency }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span style={{ color: p.color }} className="font-medium">
              {p.name}:
            </span>
            <span className="font-mono text-foreground font-semibold">
              {formatCurrency(p.value, currency)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/* ─── Dashboard Page ────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const accountRes = await getUserAccount();
      const acc = accountRes.data.accounts;

      if (acc) {
        setAccount(acc);

        const [balRes, txRes] = await Promise.all([
          getAccountBalance(acc._id),
          getTransactionHistory(acc._id),
        ]);

        setBalance(balRes.data.balance ?? 0);
        setTransactions(txRes.data.transactions ?? []);
      } else {
        setAccount(null);
        setBalance(null);
        setTransactions([]);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const lastTxEntry = transactions[0];
  const lastTxDate = lastTxEntry?.transaction?.createdAt
    ? formatDate(lastTxEntry.transaction.createdAt)
    : lastTxEntry?.createdAt
    ? formatDate(lastTxEntry.createdAt)
    : "No transactions yet";

  const uniqueTxIds = new Set(
    transactions.map((t) => t.transaction?._id || t.transaction).filter(Boolean)
  );
  const totalTransactions = uniqueTxIds.size;

  const stats = [
    {
      icon: Wallet,
      label: "Current Balance",
      value: balance !== null ? formatCurrency(balance, account?.currency) : "—",
      sub: `${account?.currency ?? ""} account balance`,
    },
    {
      icon: ArrowLeftRight,
      label: "Total Transactions",
      value: totalTransactions.toString(),
      sub: totalTransactions === 1 ? "1 transaction" : `${totalTransactions} transactions`,
    },
    {
      icon: Clock,
      label: "Last Transaction",
      value: lastTxDate,
      sub: transactions.length > 0 ? "Most recent activity" : "No activity yet",
    },
    {
      icon: ShieldCheck,
      label: "Account Status",
      value: account?.status ?? "—",
      sub:
        account?.status === "Active"
          ? "Fully operational"
          : account?.status === "Frozen"
          ? "Account is frozen"
          : account?.status === "Closed"
          ? "Account is closed"
          : "—",
    },
  ];

  /* ─── Prepare Recharts Data ─────────────────────────────────────────────── */

  const areaChartData = useMemo(() => {
    const sorted = [...transactions].reverse();
    if (sorted.length === 0) {
      return [
        { name: "Day 1", Received: 0, Sent: 0 },
        { name: "Day 2", Received: 0, Sent: 0 },
      ];
    }
    return sorted.map((entry, idx) => {
      const t = entry.transaction || {};
      const amt = t.amount || entry.amount || 0;
      const dateLabel = t.createdAt
        ? new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
        : `Tx #${idx + 1}`;

      return {
        name: dateLabel,
        Received: entry.type === "Credit" ? amt : 0,
        Sent: entry.type === "Debit" ? amt : 0,
      };
    });
  }, [transactions]);

  const pieChartData = useMemo(() => {
    let received = 0;
    let sent = 0;
    transactions.forEach((entry) => {
      const amt = entry.transaction?.amount || entry.amount || 0;
      if (entry.type === "Credit") received += amt;
      if (entry.type === "Debit") sent += amt;
    });

    if (received === 0 && sent === 0) {
      return [
        { name: "No Activity", value: 1, color: "#cbd5e1" }
      ];
    }

    return [
      { name: "Received", value: received, color: "#22c55e" },
      { name: "Sent", value: sent, color: "#7c3aed" },
    ];
  }, [transactions]);

  return (
    <AppLayout>
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !account ? (
        <EmptyState onCreateClick={() => setDialogOpen(true)} />
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Overview of your account and cash flow analytics.
            </p>
          </div>

          <AccountCard account={account} balance={balance} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* ─── Analytics & Charts Section ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Flow Trend (Area Chart) */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Cash Flow Trend
                    </CardTitle>
                    <CardDescription>
                      Received vs Sent transaction activity over time
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Realtime</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomChartTooltip currency={account?.currency} />} />
                      <Area
                        type="monotone"
                        dataKey="Received"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorReceived)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Sent"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSent)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fund Distribution (Pie Chart) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Fund Distribution
                </CardTitle>
                <CardDescription>Ratio of received vs sent funds</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col items-center justify-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip currency={account?.currency} />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-medium text-foreground">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <CreateAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => fetchDashboard()}
      />
    </AppLayout>
  );
}
