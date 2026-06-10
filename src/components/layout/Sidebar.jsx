import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, LogOut, ShoppingCart, Factory } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NEMAK_LOGO = "https://media.base44.com/images/public/6a25d4acd913cf2dc74e56fc/b2f52ad75_image.png";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/",           icon: AlertTriangle,   label: "Trigger Portal" },
    { path: "/kanban",     icon: LayoutDashboard, label: "Kanban" },
    { path: "/inventario", icon: ShoppingCart,    label: "Inventario" },
    { path: "/sopladora1", icon: Factory,         label: "Sopladora 12 Línea C" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[220px] flex flex-col z-50"
      style={{
        background: "#F5F5F7",
        borderRight: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <img
          src={NEMAK_LOGO}
          alt="Nemak"
          className="h-8 w-auto object-contain"
          style={{ maxWidth: "140px" }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-2.5 px-3 h-9 rounded-[8px] text-[13px] transition-all duration-[120ms]"
              style={{
                background: active ? "rgba(0,0,0,0.06)" : "transparent",
                color: active ? "#1D1D1F" : "#6E6E73",
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <item.icon size={16} strokeWidth={active ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px" }}>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-2.5 px-3 h-9 rounded-[8px] w-full text-[13px] transition-all duration-[120ms] text-left"
          style={{ color: "#6E6E73", fontWeight: 400 }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <LogOut size={16} strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}