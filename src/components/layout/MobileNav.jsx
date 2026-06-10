import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, Zap, ShoppingCart, GitBranch, Factory } from "lucide-react";

export default function MobileNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="sticky top-0 z-40 bg-[#002F6C] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-white font-bold text-base tracking-tight">NEMAK</h1>
        <span className="text-blue-200/50 text-[9px] font-medium tracking-[0.15em] uppercase">SCM</span>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1E] border-t border-white/10 flex">
        {[
          { path: "/", icon: AlertTriangle, label: "Alerta" },
          { path: "/dashboard", icon: LayoutDashboard, label: "Pipeline" },
          { path: "/inventario", icon: ShoppingCart, label: "Inventario" },
          { path: "/kanban", icon: GitBranch, label: "Kanban" },
          { path: "/sopladora1", icon: Factory, label: "Sopladora" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              isActive(item.path) ? "text-white" : "text-white/30"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}