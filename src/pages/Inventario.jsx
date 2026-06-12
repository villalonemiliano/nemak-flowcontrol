import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { RefreshCw, Minus, Plus, AlertTriangle } from "lucide-react";

const ease = [0.25, 0.1, 0.25, 1];
const WJ_IMG = "https://media.base44.com/images/public/6a25d4acd913cf2dc74e56fc/2cee4b677_image.png";

function statusColor(current, reorder) {
  if (current === 0) return "#FF3B30";
  if (current <= reorder) return "#FF9F0A";
  return "#34C759";
}

function CartSlot({ filled, index, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        aspectRatio: "1",
        borderRadius: 10,
        border: filled ? `1px solid ${color}40` : "1px dashed rgba(0,0,0,0.10)",
        background: filled ? `${color}0D` : "rgba(0,0,0,0.02)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        boxShadow: filled ? `0 2px 10px ${color}20` : "none",
        willChange: "transform",
      }}
    >
      <img
        src={WJ_IMG}
        alt="Water Jacket"
        style={{
          width: "70%", height: "auto", objectFit: "contain",
          opacity: filled ? 1 : 0.15,
          filter: filled ? "none" : "grayscale(1)",
          transition: "opacity 200ms ease, filter 200ms ease",
        }}
      />
      {filled && (
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: `${color}AA` }}
        >
          WJ
        </motion.span>
      )}
    </motion.div>
  );
}

function ZoneCard({ title, subtitle, inventory, onDecrease, onIncrease, isUpdating }) {
  if (!inventory) return (
    <div style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 24, background: "#FFFFFF" }}>
      <p style={{ fontSize: 13, color: "#86868B" }}>Sin datos de inventario</p>
    </div>
  );

  const { current_carts: current, max_capacity: max, reorder_point: reorder } = inventory;
  const color = statusColor(current, reorder);
  const pct = max > 0 ? current / max : 0;
  const isLow = current <= reorder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease }}
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "#FFFFFF",
        border: `1px solid ${isLow ? `${color}35` : "rgba(0,0,0,0.07)"}`,
        boxShadow: isLow
          ? `0 0 0 1px ${color}15, 0 4px 20px rgba(0,0,0,0.06)`
          : "0 2px 16px rgba(0,0,0,0.05)",
      }}
    >
      {/* Title row */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#AEAEB2", textTransform: "uppercase", marginBottom: 3 }}>Zona de Inventario</p>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 11, color: "#86868B", marginTop: 2 }}>{subtitle}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <motion.span
            key={current}
            initial={{ scale: 0.75, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", color, lineHeight: 1, fontVariantNumeric: "tabular-nums", display: "block" }}
          >
            {current}
          </motion.span>
          <span style={{ fontSize: 11, color: "#AEAEB2", fontVariantNumeric: "tabular-nums" }}>/ {max}</span>
        </div>
      </div>

      {/* Low stock banner */}
      <AnimatePresence>
        {isLow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease }}
            style={{ padding: "10px 20px 0" }}
          >
            <motion.div
              animate={{ opacity: [1, 0.65, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: `${color}0F`, border: `1px solid ${color}30`, borderRadius: 10, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10 }}
            >
              <AlertTriangle size={13} style={{ color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, margin: 0 }}>
                  REQUIERE REPOSICIÓN
                </p>
                <p style={{ fontSize: 10, color: `${color}99`, marginTop: 1 }}>
                  {current}/{max} — por debajo del punto de reorden
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart grid */}
      <div style={{ padding: "14px 20px 0", display: "grid", gridTemplateColumns: `repeat(${max}, 1fr)`, gap: 8, marginBottom: 16 }}>
        {Array.from({ length: max }).map((_, i) => (
          <CartSlot key={i} index={i} filled={i < current} color={color} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#AEAEB2" }}>Nivel de stock</span>
          <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</span>
        </div>
        <div style={{ height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 9999, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.8, ease }}
            style={{ height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 9999 }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "#AEAEB2" }}>0</span>
          <span style={{ fontSize: 10, color: "#AEAEB2" }}>Reorden: {reorder}</span>
          <span style={{ fontSize: 10, color: "#AEAEB2" }}>{max}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 20px 20px", display: "flex", gap: 8 }}>
        <button
          onClick={onDecrease}
          disabled={isUpdating || current === 0}
          style={{
            flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(0,0,0,0.03)", fontSize: 13, fontWeight: 500,
            color: (isUpdating || current === 0) ? "#AEAEB2" : "#1D1D1F",
            cursor: (isUpdating || current === 0) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 150ms ease",
          }}
          onMouseEnter={e => { if (!isUpdating && current > 0) e.currentTarget.style.background = "rgba(0,0,0,0.07)"; }}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
        >
          {isUpdating ? <RefreshCw size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Minus size={14} />}
          Entregar
        </button>
        <button
          onClick={onIncrease}
          disabled={isUpdating || current >= max}
          style={{
            flex: 1, height: 40, borderRadius: 10, border: "none",
            background: "#1D1D1F", fontSize: 13, fontWeight: 600, color: "#FFFFFF",
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

const ZONE_CONFIG = [
  { zone: "sopladora",  title: "Sopladora 3 — Línea H2",  subtitle: "Cap. 3 carritos · Reorden: 1",  defaultMax: 3 },
  { zone: "sopladora1", title: "Sopladora 1 — Línea H2",  subtitle: "Cap. 4 carritos · Reorden: 1",  defaultMax: 4 },
  { zone: "sopladora2", title: "Sopladora 2 — Línea H2",  subtitle: "Cap. 4 carritos · Reorden: 1",  defaultMax: 4 },
  { zone: "sopladora4", title: "Sopladora 4 — Línea H2",  subtitle: "Cap. 4 carritos · Reorden: 1",  defaultMax: 4 },
  { zone: "kanban",     title: "Zona Kanban",              subtitle: "Cap. 6 carritos · Distribución misceláneos", defaultMax: 6 },
];

export default function Inventario() {
  const queryClient = useQueryClient();
  const [updatingZone, setUpdatingZone] = useState(null);

  const { data: inventories = [] } = useQuery({
    queryKey: ["cartInventory"],
    queryFn: () => base44.entities.CartInventory.list(),
    refetchInterval: 8000,
  });

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

  const totalCarts = inventories.reduce((sum, i) => sum + (i.current_carts ?? 0), 0);

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

      {/* Zone cards */}
      <div style={{ padding: "24px 40px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {ZONE_CONFIG.map(({ zone, title, subtitle }) => {
          const inv = inventories.find((i) => i.zone === zone);
          return (
            <ZoneCard
              key={zone}
              title={title}
              subtitle={subtitle}
              inventory={inv}
              onDecrease={() => adjust(inv, -1)}
              onIncrease={() => adjust(inv, +1)}
              isUpdating={updatingZone === zone}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: "24px 40px 0", display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
        {[
          { color: "#34C759", label: "Stock normal" },
          { color: "#FF9F0A", label: "Nivel de reorden" },
          { color: "#FF3B30", label: "Sin stock — acción inmediata" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: 9999, background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#86868B" }}>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}