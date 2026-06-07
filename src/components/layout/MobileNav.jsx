import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, Zap } from "lucide-react";

export default function MobileNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#002F6C] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-white font-bold text-base tracking-tight">NEMAK</h1>
        <span className="text-blue-200/50 text-[9px] font-medium tracking-[0.15em] uppercase">SCM</span>
      </div>
      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex">
        <Link
          to="/"
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
            isActive("/") ? "text-[#002F6C]" : "text-muted-foreground"
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          Trigger
        </Link>
        <Link
          to="/dashboard"
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
            isActive("/dashboard") ? "text-[#002F6C]" : "text-muted-foreground"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
      </div>
    </>
  );
}