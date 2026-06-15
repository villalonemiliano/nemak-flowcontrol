import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, ShoppingCart, Factory, Lightbulb } from "lucide-react";

export default function MobileNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div
        className="sticky top-0 z-40 px-5 py-3 flex items-center"
        style={{
          background: "rgba(245,245,247,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.06em", color: "#1D1D1F" }}>MGMT</span>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: "rgba(245,245,247,0.92)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {[
          { path: "/",           icon: AlertTriangle,   label: "Alerta" },
          { path: "/kanban",     icon: LayoutDashboard, label: "Kanban" },
          { path: "/inventario", icon: ShoppingCart,    label: "Inventario" },
          { path: "/sopladora1", icon: Factory,         label: "Máq. 12C" },
          { path: "/torretas",   icon: Lightbulb,       label: "Torretas" },
        ].map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-[120ms]"
              style={{ color: active ? "#1D1D1F" : "#86868B" }}
            >
              <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}