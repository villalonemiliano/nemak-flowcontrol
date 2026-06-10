import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, LogOut, Zap, ShoppingCart, GitBranch, Factory } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/",           icon: AlertTriangle,   label: "Trigger Portal" },
    { path: "/kanban",     icon: LayoutDashboard, label: "Kanban" },
    { path: "/inventario", icon: ShoppingCart,    label: "Inventario" },
    { path: "/sopladora1", icon: Factory,         label: "Sopladora 1" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-50"
      style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(24px) saturate(1.8)",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.05)",
      }}
    >
      {/* Branding */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-base tracking-tight leading-none">NEMAK</h1>
            <p className="text-slate-400 text-[10px] font-medium tracking-[0.15em] uppercase mt-0.5">Supply Chain</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive(item.path)
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <item.icon className="w-[17px] h-[17px] shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all w-full"
        >
          <LogOut className="w-[17px] h-[17px]" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}