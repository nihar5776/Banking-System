import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Loader2,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Copy,
  Check,
  Building2,
  Filter,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { getUserAccount, getTransactionHistory } from "@/services/api";

/* ─── Helpers ──────────────────────────────────────────────────────────── */

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

function maskId(id = "") {
  if (!id) return "—";
  const str = id.toString().toUpperCase();
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

function getStatusBadge(status) {
  switch (status) {
    case "Completed":
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge>;
    case "Pending":
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "Failed":
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    case "Reversed":
      return <Badge variant="secondary" className="gap-1"><RotateCcw className="h-3 w-3" />Reversed</Badge>;
    default:
      return <Badge variant="outline">{status || "Unknown"}</Badge>;
  }
}

/* ─── Detail Modal ───────────────────────────────────────────────────────── */

function TransactionDetailModal({ entry, currentAccountId, currency, open, onOpenChange }) {
  const [copiedId, setCopiedId] = useState(false);
  if (!entry) return null;

  const t = entry.transaction || {};
  const isCredit = entry.type === "Credit";
  const counterpartyAccount = isCredit ? t.fromAccount : t.toAccount;

  const copyTxId = () => {
    navigator.clipboard.writeText(t._id || entry._id || "");
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCredit ? (
              <span className="text-green-600 flex items-center gap-1.5">
                <ArrowDownLeft className="h-5 w-5" /> Money Received
              </span>
            ) : (
              <span className="text-foreground flex items-center gap-1.5">
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" /> Money Sent
              </span>
            )}
          </DialogTitle>
          <DialogDescription>Transaction details and audit record</DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
          {/* Amount Display */}
          <div className="text-center py-4 bg-muted/40 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-1">Amount</p>
            <p className={`text-3xl font-bold tracking-tight ${isCredit ? "text-green-600" : "text-foreground"}`}>
              {isCredit ? "+" : "-"}{formatCurrency(t.amount || entry.amount, currency)}
            </p>
            <div className="mt-2 flex justify-center">
              {getStatusBadge(t.status)}
            </div>
          </div>

          {/* Details Table */}
          <div className="rounded-lg border border-border divide-y divide-border text-sm">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-muted-foreground">Transaction ID</span>
              <button
                onClick={copyTxId}
                className="flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-primary transition-colors"
              >
                {t._id || entry._id}
                {copiedId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-muted-foreground">Entry Type</span>
              <span className="font-semibold text-foreground">{entry.type}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-muted-foreground">{isCredit ? "From Account" : "To Account"}</span>
              <span className="font-mono text-xs text-foreground">{counterpartyAccount || "System / Initial"}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="text-xs text-foreground">{formatDate(t.createdAt || entry.createdAt)}</span>
            </div>
            {t.idempotencyKey && (
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-muted-foreground">Idempotency Key</span>
                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[180px]">
                  {t.idempotencyKey}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function Transactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [rawEntries, setRawEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, Credit, Debit
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, Completed, Pending, Failed

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const accRes = await getUserAccount();
      const acc = accRes.data.accounts;
      if (acc) {
        setAccount(acc);
        const txRes = await getTransactionHistory(acc._id);
        setRawEntries(txRes.data.transactions || []);
      }
    } catch (err) {
      if (err?.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived filtered entries
  const filteredEntries = useMemo(() => {
    return rawEntries.filter((entry) => {
      const t = entry.transaction || {};
      const txId = (t._id || entry._id || "").toString().toLowerCase();
      const fromAcc = (t.fromAccount || "").toString().toLowerCase();
      const toAcc = (t.toAccount || "").toString().toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      // Search match
      const matchesSearch =
        !query ||
        txId.includes(query) ||
        fromAcc.includes(query) ||
        toAcc.includes(query);

      // Type match
      const matchesType =
        typeFilter === "ALL" || entry.type === typeFilter;

      // Status match
      const matchesStatus =
        statusFilter === "ALL" || (t.status || "Completed") === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rawEntries, searchQuery, typeFilter, statusFilter]);

  // Stat summary calculations
  const stats = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    rawEntries.forEach((entry) => {
      const amt = entry.transaction?.amount || entry.amount || 0;
      if (entry.type === "Credit") totalCredit += amt;
      if (entry.type === "Debit") totalDebit += amt;
    });
    return {
      count: rawEntries.length,
      totalCredit,
      totalDebit,
    };
  }, [rawEntries]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and search all debits, credits, and ledger entries associated with your account.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !account ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-12 w-12 rounded-xl border border-border bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No Bank Account</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Create an account from the dashboard to start transacting.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Transactions</p>
                    <p className="text-xl font-semibold text-foreground mt-0.5">{stats.count}</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <History className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Received</p>
                    <p className="text-xl font-semibold text-green-600 mt-0.5">
                      +{formatCurrency(stats.totalCredit, account.currency)}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Sent</p>
                    <p className="text-xl font-semibold text-foreground mt-0.5">
                      -{formatCurrency(stats.totalDebit, account.currency)}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card>
              <CardContent className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filter:</span>
                  </div>

                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="ALL">All Types</option>
                    <option value="Credit">Credit (Received)</option>
                    <option value="Debit">Debit (Sent)</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Reversed">Reversed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table / Card List */}
            <Card>
              <CardContent className="p-0">
                {filteredEntries.length === 0 ? (
                  <div className="py-16 text-center">
                    <History className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">No transactions found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rawEntries.length === 0
                        ? "You haven't made or received any transactions yet."
                        : "Try clearing your search filters."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border overflow-x-auto">
                    {/* Header Row */}
                    <div className="hidden sm:grid grid-cols-12 px-6 py-3 bg-muted/30 text-xs font-medium text-muted-foreground">
                      <div className="col-span-4">Transaction / Account</div>
                      <div className="col-span-3">Date & Time</div>
                      <div className="col-span-2 text-center">Status</div>
                      <div className="col-span-3 text-right">Amount</div>
                    </div>

                    {/* Data Rows */}
                    {filteredEntries.map((entry) => {
                      const t = entry.transaction || {};
                      const isCredit = entry.type === "Credit";
                      const counterparty = isCredit ? t.fromAccount : t.toAccount;
                      const amount = t.amount || entry.amount;

                      return (
                        <div
                          key={entry._id}
                          onClick={() => setSelectedEntry(entry)}
                          className="flex flex-col sm:grid sm:grid-cols-12 px-6 py-4 items-center hover:bg-muted/40 cursor-pointer transition-colors gap-2 sm:gap-0"
                        >
                          {/* Column 1: Icon + Type + Counterparty */}
                          <div className="col-span-4 flex items-center gap-3 w-full sm:w-auto">
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isCredit ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">
                                {isCredit ? "Received Funds" : "Sent Funds"}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground truncate max-w-[160px] mt-0.5">
                                {isCredit ? `From: ${maskId(counterparty)}` : `To: ${maskId(counterparty)}`}
                              </p>
                            </div>
                          </div>

                          {/* Column 2: Date */}
                          <div className="col-span-3 text-xs text-muted-foreground w-full sm:w-auto">
                            {formatDate(t.createdAt || entry.createdAt)}
                          </div>

                          {/* Column 3: Status */}
                          <div className="col-span-2 flex sm:justify-center w-full sm:w-auto">
                            {getStatusBadge(t.status)}
                          </div>

                          {/* Column 4: Amount */}
                          <div className="col-span-3 text-right w-full sm:w-auto">
                            <p
                              className={`text-sm font-semibold tabular-nums ${
                                isCredit ? "text-green-600" : "text-foreground"
                              }`}
                            >
                              {isCredit ? "+" : "-"}{formatCurrency(amount, account.currency)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <TransactionDetailModal
        entry={selectedEntry}
        currentAccountId={account?._id}
        currency={account?.currency}
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      />
    </AppLayout>
  );
}
