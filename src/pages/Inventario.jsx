import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, RefreshCw, Minus, Plus, AlertTriangle } from "lucide-react";

const ease = [0.25, 0.1, 0.25, 1];

function statusColor(current, reorder) {
  if (current === 0) return "#FF3B30";
  if (current <= reorder) return "#FF9F0A";
  return "#34C759";
}
function statusLabel(current, reorder) {
  if (current === 0) return "Sin stock";
  if (current <= reorder) return "Nivel de reorden";
  return "Normal";
}

function CartSlot({ filled, index, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        aspectRatio: "1",
        borderRadius: 12,
        border: filled ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.08)",
        background: filled ? `${color}18` : "rgba(255,255,255,0.03)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
        boxShadow: filled ? `0 0 14px ${color}28, inset 0 1px 0 rgba(255,255,255,0.08)` : "none",
        willChange: "transform",
      }}
    >
      <ShoppingCart size={16} style={{ color: filled ? color : "rgba(255,255,255,0.15)", filter: filled ? `drop-shadow(0 0 5px ${color})` : "none" }} />
      {filled && (
        <motion.span
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: `${color}BB` }}
        >
          OK
        </motion.span>
      )}
    </motion.div>
  );
}

function ZoneCard({ title, subtitle, inventory, onDecrease, onIncrease, isUpdating }) {
  if (!inventory) return (
    <div style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 24 }}>
      <p style={{ fontSize: 13, color: "#86868B" }}>Sin datos de inventario</p>
    </div>
  );

  const { current_carts: current, max_capacity: max, reorder_point: reorder } = inventory;
  const color = statusColor(current, reorder);
  const label = statusLabel(current, reorder);
  const pct = max > 0 ? current / max : 0;
  const isLow = current <= reorder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease }}
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "#0F1117",
        border: `1px solid ${isLow ? `${color}35` : "rgba(255,255,255,0.06)"}`,
        boxShadow: isLow
          ? `0 0 0 1px ${color}20, 0 8px 32px rgba(0,0,0,0.20)`
          : "0 8px 32px rgba(0,0,0,0.15)",
      }}
    >
      {/* Title row */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Zona de Inventario</p>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{subtitle}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <motion.span
            key={current}
            initial={{ scale: 0.75, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color, lineHeight: 1, fontVariantNumeric: "tabular-nums", display: "block", textShadow: `0 0 18px ${color}55` }}
          >
            {current}
          </motion.span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontVariantNumeric: "tabular-nums" }}>/ {max}</span>
        </div>
      </div>

      {/* Status banner — only when low */}
      <AnimatePresence>
        {isLow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease }}
            style={{ margin: "12px 24px 0" }}
          >
            <motion.div
              animate={{ opacity: [1, 0.65, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: `${color}14`, border: `1px solid ${color}35`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
            >
              <AlertTriangle size={13} style={{ color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", color, margin: 0 }}>
                  ZONA KANBAN REQUIERE REPOSICIÓN
                </p>
                <p style={{ fontSize: 10, color: `${color}99`, marginTop: 2 }}>
                  STOCK CRÍTICO: {current}/{max} — POR DEBAJO DEL PUNTO DE REORDEN
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart grid */}
      <div style={{ padding: "16px 24px 0", display: "grid", gridTemplateColumns: `repeat(${max}, 1fr)`, gap: 10, marginBottom: 20 }}>
        {Array.from({ length: max }).map((_, i) => (
          <CartSlot key={i} index={i} filled={i < current} color={color} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Nivel de stock</span>
          <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.8, ease }}
            style={{ height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 9999, boxShadow: `0 0 8px ${color}50` }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.20)" }}>0</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>Reorden: {reorder}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.20)" }}>{max}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
        <button
          onClick={onDecrease}
          disabled={isUpdating || current === 0}
          style={{
            flex: 1, height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 500,
            color: (isUpdating || current === 0) ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.80)",
            cursor: (isUpdating || current === 0) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 150ms ease",
          }}
          onMouseEnter={e => { if (!isUpdating && current > 0) e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
        >
          {isUpdating ? <RefreshCw size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Minus size={14} />}
          Entregar
        </button>
        <button
          onClick={onIncrease}
          disabled={isUpdating || current >= max}
          style={{
            flex: 1, height: 42, borderRadius: 10, border: "none",
            background: "#FFFFFF", fontSize: 13, fontWeight: 700, color: "#0F1117",
            cursor: (isUpdating || current >= max) ? "not-allowed" : "pointer",
            opacity: (isUpdating || current >= max) ? 0.35 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 150ms ease",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={e => { if (!isUpdating && current < max) e.currentTarget.style.background = "#E8E8ED"; }}
          onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
        >
          {isUpdating ? <RefreshCw size={14} style={{ animation: "spin 0.7s linear infinite", color: "#0F1117" }} /> : <Plus size={14} />}
          Reponer
        </button>
      </div>
    </motion.div>
  );
}

export default function Inventario() {
  const queryClient = useQueryClient();
  const [updatingZone, setUpdatingZone] = useState(null);

  const { data: inventories = [] } = useQuery({
    queryKey: ["cartInventory"],
    queryFn: () => base44.entities.CartInventory.list(),
    refetchInterval: 8000,
  });

  const sopladoraInv = inventories.find((i) => i.zone === "sopladora");
  const kanbanInv    = inventories.find((i) => i.zone === "kanban");

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CartInventory.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cartInventory"] }),
  });

  const adjust = async (inv, delta) => {
    if (!inv) return;
    const next = Math.max(0, Math.min(inv.max_capacity, inv.current_carts + delta));
    setUpdatingZone(inv.zone);
    await updateMutation.mutateAsync({ id: inv.id, data: { current_carts: next } });
    setUpdatingZone(null);
  };

  const totalCarts = (sopladoraInv?.current_carts ?? 0) + (kanbanInv?.current_carts ?? 0);

  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ background: "#FFFFFF" }}>

      {/* Header */}
      <div style={{ padding: "40px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 8 }}>
          Sistema de Inventario
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F", margin: 0 }}>
            Inventario
          </h1>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", margin: "0 0 2px" }}>Total en sistema</p>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", fontVariantNumeric: "tabular-nums" }}>{totalCarts}</span>
          </div>
        </div>
      </div>

      {/* VSM flow */}
      <div style={{ padding: "24px 40px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#AEAEB2", textTransform: "uppercase", whiteSpace: "nowrap" }}>Sopladora 3 Línea H2</span>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        <span style={{ fontSize: 11, color: "#AEAEB2" }}>→</span>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#AEAEB2", textTransform: "uppercase", whiteSpace: "nowrap" }}>Zona Kanban</span>
      </div>

      {/* Zone cards */}
      <div style={{ padding: "24px 40px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <ZoneCard
          title="Sopladora 3 — Línea H2"
          subtitle="Cap. 3 carritos · Reorden: 1"
          inventory={sopladoraInv}
          onDecrease={() => adjust(sopladoraInv, -1)}
          onIncrease={() => adjust(sopladoraInv, +1)}
          isUpdating={updatingZone === "sopladora"}
        />
        <ZoneCard
          title="Zona Kanban"
          subtitle="Cap. 6 carritos · Distribución misceláneos"
          inventory={kanbanInv}
          onDecrease={() => adjust(kanbanInv, -1)}
          onIncrease={() => adjust(kanbanInv, +1)}
          isUpdating={updatingZone === "kanban"}
        />
      </div>

      {/* Legend */}
      <div style={{ padding: "24px 40px 0", display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
        {[
          { color: "#34C759", label: "Stock normal" },
          { color: "#FF9F0A", label: "Nivel de reorden" },
          { color: "#FF3B30", label: "Sin stock — acción inmediata" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: 9999, background: item.color, flexShrink: 0, boxShadow: `0 0 5px ${item.color}` }} />
            <span style={{ fontSize: 12, color: "#86868B" }}>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}