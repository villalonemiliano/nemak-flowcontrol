import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, Zap, ShoppingCart, Factory } from "lucide-react";

export default function MobileNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-slate-900 font-bold text-sm tracking-tight">NEMAK</h1>
        <span className="text-slate-400 text-[9px] font-medium tracking-[0.15em] uppercase">SCM</span>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        {[
          { path: "/",           icon: AlertTriangle,   label: "Alerta" },
          { path: "/kanban",     icon: LayoutDashboard, label: "Kanban" },
          { path: "/inventario", icon: ShoppingCart,    label: "Inventario" },
          { path: "/sopladora1", icon: Factory,         label: "Sopladora" },
        ].map((item) => (
          <Link key={item.path} to={item.path}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${isActive(item.path) ? "text-slate-900" : "text-slate-400"}`}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}