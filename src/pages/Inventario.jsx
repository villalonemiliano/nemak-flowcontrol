import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, TrendingUp, RefreshCw, Minus, Plus } from "lucide-react";

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
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease }}
      style={{
        aspectRatio: "1",
        borderRadius: 10,
        border: filled ? `1px solid ${color}33` : "1px dashed rgba(0,0,0,0.10)",
        background: filled ? `${color}0D` : "rgba(0,0,0,0.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {filled
        ? <ShoppingCart size={16} style={{ color }} />
        : <span style={{ fontSize: 10, color: "#AEAEB2" }}>—</span>
      }
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
      style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 24, background: "#FFFFFF" }}
    >
      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 4 }}>Zona</p>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 12, color: "#86868B", marginTop: 4 }}>{subtitle}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {current}
          </span>
          <p style={{ fontSize: 12, color: "#86868B", margin: "2px 0 0" }}>de {max}</p>
        </div>
      </div>

      {/* Status banner — only when low */}
      <AnimatePresence>
        {isLow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease }}
            style={{
              background: `${color}0D`,
              border: `1px solid ${color}22`,
              borderLeft: `3px solid ${color}`,
              borderRadius: "0 10px 10px 0",
              padding: "10px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <motion.div style={{ width: 8, height: 8, borderRadius: 9999, background: color, flexShrink: 0 }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color }}>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${max}, 1fr)`, gap: 6, marginBottom: 20 }}>
        {Array.from({ length: max }).map((_, i) => (
          <CartSlot key={i} index={i} filled={i < current} color={color} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase" }}>Nivel de stock</span>
          <span style={{ fontSize: 11, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</span>
        </div>
        <div style={{ height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 9999, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.7, ease }}
            style={{ height: "100%", background: color, borderRadius: 9999 }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "#AEAEB2" }}>0</span>
          <span style={{ fontSize: 11, color: "#86868B" }}>Reorden: {reorder}</span>
          <span style={{ fontSize: 11, color: "#AEAEB2" }}>{max}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onDecrease}
          disabled={isUpdating || current === 0}
          style={{
            flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)",
            background: "transparent", fontSize: 13, fontWeight: 400, color: "#1D1D1F",
            cursor: (isUpdating || current === 0) ? "not-allowed" : "pointer",
            opacity: (isUpdating || current === 0) ? 0.35 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 120ms ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {isUpdating ? <RefreshCw size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Minus size={14} />}
          Entregar
        </button>
        <button
          onClick={onIncrease}
          disabled={isUpdating || current >= max}
          style={{
            flex: 1, height: 40, borderRadius: 10, border: "none",
            background: "#1D1D1F", fontSize: 13, fontWeight: 500, color: "#FFFFFF",
            cursor: (isUpdating || current >= max) ? "not-allowed" : "pointer",
            opacity: (isUpdating || current >= max) ? 0.35 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 150ms ease",
          }}
          onMouseEnter={e => { if (!isUpdating && current < max) e.currentTarget.style.background = "#2D2D2F"; }}
          onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}
        >
          {isUpdating ? <RefreshCw size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Plus size={14} />}
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
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#AEAEB2", textTransform: "uppercase", whiteSpace: "nowrap" }}>Sopladora 25</span>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        <span style={{ fontSize: 11, color: "#AEAEB2" }}>→</span>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#AEAEB2", textTransform: "uppercase", whiteSpace: "nowrap" }}>Zona Kanban</span>
      </div>

      {/* Zone cards */}
      <div style={{ padding: "24px 40px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <ZoneCard
          title="Sopladora 25 — Línea F"
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
      <div style={{ padding: "32px 40px 0", display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
        {[
          { color: "#34C759", label: "Stock normal" },
          { color: "#FF9F0A", label: "Nivel de reorden — solicitar más" },
          { color: "#FF3B30", label: "Sin stock — acción inmediata" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#86868B" }}>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}