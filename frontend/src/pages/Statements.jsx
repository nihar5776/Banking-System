import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  Download,
  Loader2,
  Building2,
  CheckCircle2,
  FileText,
  Calendar,
} from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { getUserAccount, downloadStatement } from "@/services/api";

function maskId(id = "") {
  if (!id) return "—";
  const str = id.toString().toUpperCase();
  return `••••  ••••  ${str.slice(-8, -4)}  ${str.slice(-4)}`;
}

export default function Statements() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [account, setAccount] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const accRes = await getUserAccount();
      const acc = accRes.data.accounts;
      if (acc) setAccount(acc);
    } catch (err) {
      if (err?.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownload = async () => {
    if (!account?._id) return;
    setDownloading(true);
    try {
      const response = await downloadStatement(account._id);

      // Create blob download link
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `account_statement_${account._id.slice(-6)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        variant: "success",
        title: "Statement Downloaded",
        description: "Your Excel account statement has been downloaded.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Unable to generate statement. Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Account Statements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Download official Excel statements for accounting, tax, or record-keeping purposes.
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
              Create an account from the dashboard to download statements.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Download Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Export Account Statement</CardTitle>
                    <CardDescription className="mt-0.5">
                      Generate complete transaction history as an Excel workbook (.xlsx)
                    </CardDescription>
                  </div>
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Account Number</span>
                    <span className="font-mono font-medium text-foreground">{maskId(account._id)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Currency</span>
                    <span className="font-medium text-foreground">{account.currency || "INR"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>File Format</span>
                    <Badge variant="outline" className="font-mono text-[10px]">Microsoft Excel (.xlsx)</Badge>
                  </div>
                </div>

                <Button
                  id="download-statement-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full gap-2"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Excel Statement…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Excel Statement
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Included in Statement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-muted-foreground">
                  {[
                    "Date & Time of every transaction",
                    "Unique Transaction ID",
                    "Sender & Recipient Accounts",
                    "Debit & Credit breakdown",
                    "Final Transaction Status",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
