import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Factory, CheckCircle2, Clock, RefreshCw, Play, Package, AlertTriangle, TrendingUp } from "lucide-react";

const statusConfig = {
  pending:       { label: "Pendiente",    color: "#FF9500", bg: "rgba(255,149,0,0.15)", border: "rgba(255,149,0,0.3)", icon: Clock },
  in_production: { label: "Produciendo",  color: "#007AFF", bg: "rgba(0,122,255,0.15)", border: "rgba(0,122,255,0.3)", icon: Play },
  ready:         { label: "Listo",        color: "#30D158", bg: "rgba(48,209,88,0.15)", border: "rgba(48,209,88,0.3)", icon: CheckCircle2 },
  delivered:     { label: "Entregado",    color: "#8E8E93", bg: "rgba(142,142,147,0.15)", border: "rgba(142,142,147,0.2)", icon: Package },
};

function OrderCard({ order, onAdvance, isAdvancing }) {
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const Icon = cfg.icon;
  const nextStatus = { pending: "in_production", in_production: "ready", ready: "delivered" }[order.status];
  const nextLabel  = { pending: "Iniciar producción", in_production: "Marcar listo", ready: "Confirmar entrega" }[order.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">{order.requested_carts} carrito{order.requested_carts !== 1 ? "s" : ""}</p>
            <p className="text-[11px]" style={{ color: cfg.color }}>{cfg.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/30">Solicitado</p>
          <p className="text-[11px] text-white/50 font-mono">
            {new Date(order.requested_at).toLocaleDateString("es-MX", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {order.notes && (
        <p className="text-[12px] text-white/30 mb-4 leading-relaxed">{order.notes}</p>
      )}

      {nextStatus && (
        <button
          onClick={() => onAdvance(order, nextStatus)}
          disabled={isAdvancing}
          className="w-full h-10 rounded-xl text-[12px] font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
        >
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

  const { data: orders = [] } = useQuery({
    queryKey: ["productionOrders"],
    queryFn: () => base44.entities.ProductionOrder.list("-requested_at", 50),
    refetchInterval: 8000,
  });

  const { data: inventories = [] } = useQuery({
    queryKey: ["cartInventory"],
    queryFn: () => base44.entities.CartInventory.list(),
    refetchInterval: 8000,
  });

  const kanbanInv = inventories.find((i) => i.zone === "kanban");
  const sopladroaInv = inventories.find((i) => i.zone === "sopladora");

  const advanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductionOrder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productionOrders"] }),
  });

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

  const urgentCount = pending.length + inProduction.length;
  const kanbanIsLow = kanbanInv && kanbanInv.current_carts <= kanbanInv.reorder_point;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B3E 50%, #0A1628 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #007AFF 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FF9500 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 pb-24 lg:pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">Control de Producción</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[30px] font-black text-white tracking-[-0.4px] leading-none">Sopladora 1</h1>
              <p className="text-[14px] text-white/50 mt-2">Producción de corazones misceláneos</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: urgentCount > 0 ? "rgba(255,149,0,0.15)" : "rgba(48,209,88,0.12)", border: urgentCount > 0 ? "1px solid rgba(255,149,0,0.25)" : "1px solid rgba(48,209,88,0.2)" }}>
              <motion.div animate={{ opacity: urgentCount > 0 ? [1, 0.3, 1] : 1 }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full" style={{ backgroundColor: urgentCount > 0 ? "#FF9500" : "#30D158" }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: urgentCount > 0 ? "#FF9500" : "#30D158" }}>
                {urgentCount > 0 ? `${urgentCount} en cola` : "Sin pendientes"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Alert banner when kanban is low */}
        <AnimatePresence>
          {kanbanIsLow && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{ background: "rgba(255,149,0,0.1)", border: "1px solid rgba(255,149,0,0.25)", backdropFilter: "blur(20px)" }}
            >
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <AlertTriangle className="w-5 h-5 text-[#FF9500]" />
              </motion.div>
              <div>
                <p className="text-[13px] font-bold text-[#FF9500]">Zona Kanban requiere reposición</p>
                <p className="text-[11px] text-white/40 mt-0.5">Stock actual: {kanbanInv?.current_carts}/{kanbanInv?.max_capacity} — debajo del punto de reorden</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Solicitudes", value: pending.length, color: "#FF9500", icon: Clock },
            { label: "Produciendo", value: inProduction.length, color: "#007AFF", icon: Factory },
            { label: "Listos",      value: ready.length,      color: "#30D158", icon: CheckCircle2 },
            { label: "Entregados",  value: orders.filter(o => o.status === "delivered").length, color: "#8E8E93", icon: Package },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl px-5 py-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
            >
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">{kpi.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-[32px] font-black tabular-nums leading-none" style={{ color: kpi.color }}>{kpi.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {[
            { title: "⏳ Por producir", orders: pending, color: "#FF9500" },
            { title: "⚙️ En producción", orders: inProduction, color: "#007AFF" },
            { title: "✅ Listos",        orders: ready,         color: "#30D158" },
            { title: "📦 Entregados",    orders: delivered,     color: "#8E8E93" },
          ].map((col) => (
            <div key={col.title}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-[13px] font-semibold text-white/70">{col.title}</h3>
                <span className="ml-auto text-[12px] font-bold" style={{ color: col.color }}>{col.orders.length}</span>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {col.orders.length === 0 ? (
                    <div className="rounded-2xl px-4 py-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                      <p className="text-[12px] text-white/20">Sin órdenes</p>
                    </div>
                  ) : (
                    col.orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAdvance={handleAdvance}
                        isAdvancing={advancingId === order.id}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}