import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Factory, CheckCircle2, Clock, RefreshCw, Play, Package, AlertTriangle, Bell } from "lucide-react";

const SEEN_ORDERS_KEY = "nemak_seen_orders";
function getSeenOrders() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_ORDERS_KEY) || "[]")); } catch { return new Set(); }
}
function markOrderSeen(id) {
  const s = getSeenOrders(); s.add(id);
  localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...s]));
}

const ease = [0.25, 0.1, 0.25, 1];

const statusCfg = {
  pending:       { label: "Pendiente",   color: "#FF9F0A", bg: "rgba(255,159,10,0.08)",  border: "rgba(255,159,10,0.20)", icon: Clock },
  in_production: { label: "Produciendo", color: "#0071E3", bg: "rgba(0,113,227,0.08)",   border: "rgba(0,113,227,0.20)", icon: Play },
  ready:         { label: "Listo",       color: "#34C759", bg: "rgba(52,199,89,0.08)",   border: "rgba(52,199,89,0.20)", icon: CheckCircle2 },
  shipped:       { label: "Enviado",     color: "#6366F1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.20)", icon: Package },
  delivered:     { label: "Recibido",    color: "#AEAEB2", bg: "rgba(174,174,178,0.08)", border: "rgba(174,174,178,0.20)", icon: Package },
};

// Sopladora 12 solo avanza hasta "shipped" (enviado). Kanban confirma recibido.
const nextStatusMap  = { pending: "in_production", in_production: "ready", ready: "shipped" };
const nextLabelMap   = { pending: "Iniciar producción", in_production: "Marcar listo", ready: "Marcar enviado" };

function OrderCard({ order, onAdvance, isAdvancing }) {
  const cfg = statusCfg[order.status] || statusCfg.pending;
  const Icon = cfg.icon;
  const next = nextStatusMap[order.status];
  const nextLabel = nextLabelMap[order.status];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease }}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: "0 10px 10px 0",
        padding: "16px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon size={16} style={{ color: cfg.color, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 15, color: "#1D1D1F", margin: 0 }}>
              {order.requested_carts} carrito{order.requested_carts !== 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: cfg.color, marginTop: 2 }}>
              {cfg.label}
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#86868B", margin: "0 0 2px" }}>Solicitado</p>
          <p style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#86868B" }}>
            {new Date(order.requested_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      {order.notes && (
        <p style={{ fontSize: 12, color: "#86868B", marginBottom: 12 }}>{order.notes}</p>
      )}
      {next && (
        <button
          onClick={() => onAdvance(order, next)}
          disabled={isAdvancing}
          style={{
            width: "100%", height: 36, borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.10)", background: "white",
            fontSize: 13, fontWeight: 400, color: "#1D1D1F",
            cursor: isAdvancing ? "not-allowed" : "pointer",
            opacity: isAdvancing ? 0.35 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 120ms ease",
          }}
          onMouseEnter={e => { if (!isAdvancing) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={e => e.currentTarget.style.background = "white"}
        >
          {isAdvancing ? <RefreshCw size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : null}
          {nextLabel}
        </button>
      )}
    </motion.div>
  );
}

export default function Sopladora1() {
  const queryClient = useQueryClient();
  const [advancingId, setAdvancingId] = useState(null);
  const [pendingOrderAlert, setPendingOrderAlert] = useState(null);
  const shownRef = useRef(false);

  const { data: orders = [] } = useQuery({
    queryKey: ["productionOrders"],
    queryFn: () => base44.entities.ProductionOrder.list("-requested_at", 50),
    refetchInterval: 5000,
  });

  const { data: inventories = [] } = useQuery({
    queryKey: ["cartInventory"],
    queryFn: () => base44.entities.CartInventory.list(),
    refetchInterval: 8000,
  });

  const kanbanInv = inventories.find((i) => i.zone === "kanban");

  const advanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductionOrder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productionOrders"] }),
  });

  useEffect(() => {
    if (shownRef.current || orders.length === 0) return;
    const seen = getSeenOrders();
    const unseen = orders.find((o) => o.status === "pending" && !seen.has(o.id));
    if (unseen) { shownRef.current = true; setPendingOrderAlert(unseen); }
  }, [orders]);

  const handleOrderAlertOK = () => {
    if (!pendingOrderAlert) return;
    markOrderSeen(pendingOrderAlert.id);
    setPendingOrderAlert(null);
  };

  const handleAdvance = async (order, nextStatus) => {
    setAdvancingId(order.id);
    const updateData = { status: nextStatus };
    // Solo Kanban confirma recibido — aquí solo marcamos "shipped"
    await advanceMutation.mutateAsync({ id: order.id, data: updateData });
    setAdvancingId(null);
  };

  const pending      = orders.filter((o) => o.status === "pending");
  const inProduction = orders.filter((o) => o.status === "in_production");
  const ready        = orders.filter((o) => o.status === "ready");
  const shipped      = orders.filter((o) => o.status === "shipped").slice(0, 5);
  const urgentCount  = pending.length + inProduction.length;
  const kanbanIsLow  = kanbanInv && kanbanInv.current_carts <= kanbanInv.reorder_point;

  const kpis = [
    { label: "Solicitudes", value: pending.length,      color: "#FF9F0A", icon: Clock },
    { label: "Produciendo", value: inProduction.length, color: "#0071E3", icon: Factory },
    { label: "Listos",      value: ready.length,        color: "#34C759", icon: CheckCircle2 },
    { label: "Enviados",    value: orders.filter(o => o.status === "shipped" || o.status === "delivered").length, color: "#6366F1", icon: Package },
  ];

  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ background: "#FFFFFF" }}>

      {/* ── Fullscreen Order Alert ── */}
      <AnimatePresence>
        {pendingOrderAlert && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(12px)" }} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }} transition={{ duration: 0.24, ease }}
              className="fixed inset-0 z-50 flex items-center justify-center px-5">
              <div style={{ width: "100%", maxWidth: 400, background: "#FFFFFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}>
                {/* Barra de alerta animada */}
                <motion.div
                  animate={{ scaleX: [1, 0.97, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{ height: 4, background: "linear-gradient(90deg, #FF9F0A, #FF6B00)", transformOrigin: "left" }}
                />
                <div style={{ padding: "36px 32px 28px", textAlign: "center" }}>
                  {/* Icono con pulso doble */}
                  <div style={{ position: "relative", display: "inline-flex", marginBottom: 24 }}>
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      style={{ position: "absolute", inset: 0, borderRadius: 9999, background: "rgba(255,159,10,0.20)" }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 9999, background: "rgba(255,159,10,0.15)" }}
                    />
                    <div style={{ width: 72, height: 72, borderRadius: 9999, background: "rgba(255,159,10,0.12)", border: "2px solid rgba(255,159,10,0.30)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <Bell size={28} style={{ color: "#FF9F0A" }} />
                    </div>
                  </div>

                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FF9F0A", marginBottom: 10 }}>
                    SOLICITUD ENTRANTE
                  </p>
                  <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", margin: "0 0 8px", lineHeight: 1.1 }}>
                    Nueva Solicitud<br />de Carritos
                  </h2>
                  <p style={{ fontSize: 15, color: "#6E6E73", margin: 0 }}>La Zona Kanban requiere producción inmediata</p>
                </div>

                <div style={{ margin: "0 32px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#86868B" }}>Carritos solicitados</span>
                    <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: "#1D1D1F", fontVariantNumeric: "tabular-nums" }}>{pendingOrderAlert.requested_carts}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#86868B" }}>Hora de solicitud</span>
                    <span style={{ fontSize: 13, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#1D1D1F" }}>
                      {new Date(pendingOrderAlert.requested_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                  {pendingOrderAlert.notes && (
                    <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: "10px 14px" }}>
                      <span style={{ fontSize: 12, color: "#86868B" }}>{pendingOrderAlert.notes}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: "0 32px 32px" }}>
                  <motion.button
                    onClick={handleOrderAlertOK}
                    whileTap={{ scale: 0.97 }}
                    style={{ width: "100%", height: 52, borderRadius: 10, background: "#1D1D1F", color: "#FFFFFF", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "-0.01em" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2D2D2F"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}
                  >
                    <CheckCircle2 size={16} />
                    Confirmar — Solicitud recibida
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ padding: "40px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 8 }}>
          Control de Producción
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F", margin: 0 }}>
            Máquina 12 Línea C
          </h1>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: urgentCount > 0 ? "rgba(255,159,10,0.08)" : "rgba(52,199,89,0.08)",
            border: `1px solid ${urgentCount > 0 ? "rgba(255,159,10,0.20)" : "rgba(52,199,89,0.20)"}`,
            borderRadius: 9999, padding: "5px 12px",
          }}>
            <motion.div
              style={{ width: 8, height: 8, borderRadius: 9999, background: urgentCount > 0 ? "#FF9F0A" : "#34C759", flexShrink: 0 }}
              animate={{ opacity: urgentCount > 0 ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: urgentCount > 0 ? "#7A4700" : "#1A5C2E" }}>
              {urgentCount > 0 ? `${urgentCount} en cola` : "Sin pendientes"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Kanban low alert ── */}
      <AnimatePresence>
        {kanbanIsLow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease }}
            style={{ margin: "20px 40px 0" }}
          >
            <div style={{
              background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.20)",
              borderLeft: "3px solid #FF9F0A", borderRadius: "0 10px 10px 0",
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <AlertTriangle size={15} style={{ color: "#FF9F0A", flexShrink: 0 }} />
              </motion.div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#7A4700", margin: 0 }}>Zona Kanban requiere reposición</p>
                <p style={{ fontSize: 12, color: "#86868B", marginTop: 2 }}>
                  Stock: {kanbanInv?.current_carts}/{kanbanInv?.max_capacity} — bajo el punto de reorden
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI strip ── */}
      <div style={{ padding: "24px 40px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2, ease }}
              style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "16px 20px", background: "#FFFFFF" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Icon size={14} style={{ color: kpi.color }} />
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>{kpi.label}</p>
              </div>
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* ── Order columns ── */}
      <div style={{ padding: "24px 40px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        {[
          { title: "Por producir",  orders: pending,      color: "#FF9F0A" },
          { title: "En producción", orders: inProduction, color: "#0071E3" },
          { title: "Listos",        orders: ready,        color: "#34C759" },
          { title: "Enviados",      orders: shipped,      color: "#6366F1" },
        ].map((col) => (
          <div key={col.title}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 9999, background: col.color, flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>{col.title}</p>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#86868B", background: "rgba(0,0,0,0.04)", borderRadius: 9999, padding: "1px 8px" }}>
                {col.orders.length}
              </span>
            </div>
            <AnimatePresence>
              {col.orders.length === 0 ? (
                <div style={{ border: "1px dashed rgba(0,0,0,0.08)", borderRadius: 10, padding: "32px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#AEAEB2", margin: 0 }}>Sin órdenes</p>
                </div>
              ) : (
                col.orders.map((order) => (
                  <OrderCard key={order.id} order={order} onAdvance={handleAdvance} isAdvancing={advancingId === order.id} />
                ))
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}