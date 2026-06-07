import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, LogOut, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: AlertTriangle, label: "Trigger Portal" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Pipeline Dashboard" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#002F6C] flex flex-col z-50">
      {/* Branding */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight leading-none">NEMAK</h1>
            <p className="text-blue-200/60 text-[10px] font-medium tracking-[0.2em] uppercase mt-0.5">
              Supply Chain Ops
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(item.path)
                ? "bg-white/15 text-white shadow-sm"
                : "text-blue-100/70 hover:bg-white/8 hover:text-white"
            }`}
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-100/50 hover:bg-white/8 hover:text-white transition-all w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}