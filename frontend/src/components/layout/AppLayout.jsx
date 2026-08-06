import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  History,
  FileText,
  LogOut,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/api";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Accounts", icon: Wallet, to: "/accounts" },
  { label: "Transfer", icon: ArrowLeftRight, to: "/transfer" },
  { label: "Transactions", icon: History, to: "/transactions" },
  { label: "Statements", icon: FileText, to: "/statements" },
];

function SidebarContent({ onClose }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">Backend Ledger</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 text-xs text-muted-foreground px-4 pb-4">
        Backend Ledger v1.0
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("isSystemUser");
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-56 bg-card border-r border-border z-50">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Right column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 gap-4">
          {/* Mobile hamburger */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title spacer */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{initials}</span>
            </div>

            {/* Name — hidden on small screens */}
            {user?.name && (
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {user.name}
              </span>
            )}

            {/* Logout */}
            <Button
              id="logout-btn"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
