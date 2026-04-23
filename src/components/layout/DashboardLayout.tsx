import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Route, 
  CreditCard, 
  Bell, 
  FileText,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const navigation = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.users", href: "/users", icon: Users },
  { key: "nav.admins", href: "/admins", icon: Users },
  { key: "nav.createAccount", href: "/create-account", icon: Users },
  { key: "nav.caregivers", href: "/caregivers", icon: Car },
  { key: "nav.trips", href: "/trips", icon: Route },
  { key: "nav.payments", href: "/payments", icon: CreditCard },
  { key: "nav.withdrawals", href: "/withdrawals", icon: DollarSign },
  { key: "nav.reports", href: "/reports", icon: FileText },
  { key: "nav.settings", href: "/settings", icon: SettingsIcon },
  { key: "nav.settingsHistory", href: "/settings/history", icon: HistoryIcon },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const applyTheme = (dark: boolean) => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
    setIsDark(dark);
  };

  if (typeof window !== "undefined") {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark"); else root.classList.remove("dark");
  }

  const handleLogout = () => {
    // Mock logout - redirect to login
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 sidebar-surface border-r border-sidebar-border transition-transform duration-300",
          isSidebarOpen ? "translate-x-0 animate-slide-in-left" : "-translate-x-full"
        )}
        aria-hidden={!isSidebarOpen}
        aria-label="Sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <img src="/brand/safe-path-logo.svg" alt="Safe Path" className="h-7 w-7 rounded-sm object-contain" />
              <h1 className="text-xl font-bold text-sidebar-foreground">{t("brand.adminPanel")}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item, idx) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors animate-fade-right",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>{t("actions.logout")}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "transition-[padding] duration-300",
          isSidebarOpen ? "lg:pl-64" : "pl-0"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              {/* Mobile open button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              {/* Desktop toggle button */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setIsSidebarOpen((v) => !v)}
                aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyTheme(!isDark)}
                aria-label={isDark ? "Switch to light" : "Switch to dark"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant={i18n.language === "th" ? "default" : "outline"}
                size="sm"
                onClick={() => i18n.changeLanguage("th")}
              >
                TH
              </Button>
              <Button
                variant={i18n.language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => i18n.changeLanguage("en")}
              >
                EN
              </Button>
              <Link to="/profile" className="text-sm ml-2 hover:underline">
                {t("user.adminUser")}
              </Link>
              <div className="h-4 w-px bg-border mx-2" />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                {t("actions.logout")}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
