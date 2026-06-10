import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Factory, CheckCircle2, Clock, RefreshCw, Play, Package, AlertTriangle, Bell } from "lucide-react";

// ─── one-timer key per order ────────────────────────────────────
const SEEN_ORDERS_KEY = "nemak_seen_orders";
function getSeenOrders() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_ORDERS_KEY) || "[]")); }
  catch { return new Set(); }
}
function markOrderSeen(id) {
  const s = getSeenOrders(); s.add(id);
  localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...s]));
}

const statusConfig = {
  pending:       { label: "Pendiente",   color: "#F59E0B", bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700", icon: Clock },
  in_production: { label: "Produciendo", color: "#3B82F6", bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",  icon: Play },
  ready:         { label: "Listo",       color: "#22C55E", bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700", icon: CheckCircle2 },
  delivered:     { label: "Entregado",   color: "#94A3B8", bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500", icon: Package },
};

function OrderCard({ order, onAdvance, isAdvancing }) {
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const Icon = cfg.icon;
  const nextStatus = { pending: "in_production", in_production: "ready", ready: "delivered" }[order.status];
  const nextLabel  = { pending: "Iniciar producción", in_production: "Marcar listo", ready: "Confirmar entrega" }[order.status];

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl p-4 border ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{order.requested_carts} carrito{order.requested_carts !== 1 ? "s" : ""}</p>
            <p className={`text-[11px] font-semibold ${cfg.text}`}>{cfg.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Solicitado</p>
          <p className="text-[11px] text-slate-500 font-mono">
            {new Date(order.requested_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      {order.notes && <p className="text-xs text-slate-400 mb-3">{order.notes}</p>}
      {nextStatus && (
        <button onClick={() => onAdvance(order, nextStatus)} disabled={isAdvancing}
          className="w-full h-9 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
          {isAdvancing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
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

  // One-timer per order: show fullscreen alert for first unseen pending order
  useEffect(() => {
    if (shownRef.current || orders.length === 0) return;
    const seen = getSeenOrders();
    const unseen = orders.find((o) => o.status === "pending" && !seen.has(o.id));
    if (unseen) {
      shownRef.current = true;
      setPendingOrderAlert(unseen);
    }
  }, [orders]);

  const handleOrderAlertOK = () => {
    if (!pendingOrderAlert) return;
    markOrderSeen(pendingOrderAlert.id);
    setPendingOrderAlert(null);
  };

  const handleAdvance = async (order, nextStatus) => {
    setAdvancingId(order.id);
    const updateData = { status: nextStatus };
    if (nextStatus === "delivered") updateData.completed_at = new Date().toISOString();
    await advanceMutation.mutateAsync({ id: order.id, data: updateData });
    setAdvancingId(null);
  };

  const pending       = orders.filter((o) => o.status === "pending");
  const inProduction  = orders.filter((o) => o.status === "in_production");
  const ready         = orders.filter((o) => o.status === "ready");
  const delivered     = orders.filter((o) => o.status === "delivered").slice(0, 5);
  const urgentCount   = pending.length + inProduction.length;
  const kanbanIsLow   = kanbanInv && kanbanInv.current_carts <= kanbanInv.reorder_point;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">

      {/* ── Fullscreen Order Alert ──────────────────────────── */}
      <AnimatePresence>
        {pendingOrderAlert && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center px-5">
              <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-100 px-6 pt-8 pb-6 text-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-amber-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">¡Nueva Solicitud de Carritos!</h2>
                  <p className="text-sm text-slate-500">La Zona Kanban requiere producción</p>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Carritos solicitados</span>
                    <span className="text-lg font-black text-amber-600">{pendingOrderAlert.requested_carts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Hora de solicitud</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(pendingOrderAlert.requested_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                  {pendingOrderAlert.notes && (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Nota</span>
                      <span className="text-xs text-slate-600 text-right max-w-[180px]">{pendingOrderAlert.notes}</span>
                    </div>
                  )}
                </div>
                <div className="px-6 pb-6">
                  <button onClick={handleOrderAlertOK}
                    className="w-full h-12 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    OK — Solicitud recibida
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Control de Producción</p>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sopladora 1</h1>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${urgentCount > 0 ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
            <motion.div animate={{ opacity: urgentCount > 0 ? [1, 0.3, 1] : 1 }} transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${urgentCount > 0 ? "bg-amber-400" : "bg-green-500"}`} />
            {urgentCount > 0 ? `${urgentCount} en cola` : "Sin pendientes"}
          </div>
        </div>
      </div>

      {/* ── Kanban low alert ─────────────────────────────────── */}
      <AnimatePresence>
        {kanbanIsLow && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mx-6 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 bg-amber-50 border border-amber-200">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Zona Kanban requiere reposición</p>
              <p className="text-xs text-amber-600/70">Stock: {kanbanInv?.current_carts}/{kanbanInv?.max_capacity} — bajo el punto de reorden</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Strip ────────────────────────────────────────── */}
      <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Solicitudes", value: pending.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock },
          { label: "Produciendo", value: inProduction.length, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: Factory },
          { label: "Listos",      value: ready.length,        color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
          { label: "Entregados",  value: orders.filter(o => o.status === "delivered").length, color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: Package },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-2xl px-4 py-3.5 border ${kpi.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              </div>
              <span className={`text-3xl font-black tabular-nums ${kpi.color}`}>{kpi.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* ── Order Columns ─────────────────────────────────────── */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { title: "Por producir", orders: pending,      color: "#F59E0B", dot: "bg-amber-400" },
          { title: "En producción", orders: inProduction, color: "#3B82F6", dot: "bg-blue-400" },
          { title: "Listos",        orders: ready,        color: "#22C55E", dot: "bg-green-500" },
          { title: "Entregados",    orders: delivered,    color: "#94A3B8", dot: "bg-slate-300" },
        ].map((col) => (
          <div key={col.title}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <h3 className="text-xs font-semibold text-slate-600">{col.title}</h3>
              <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{col.orders.length}</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {col.orders.length === 0 ? (
                  <div className="rounded-2xl px-4 py-8 text-center bg-white border border-dashed border-slate-200">
                    <p className="text-xs text-slate-300">Sin órdenes</p>
                  </div>
                ) : col.orders.map((order) => (
                  <OrderCard key={order.id} order={order} onAdvance={handleAdvance} isAdvancing={advancingId === order.id} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}