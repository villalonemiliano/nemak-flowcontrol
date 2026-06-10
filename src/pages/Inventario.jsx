import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from "lucide-react";

function CartSlot({ filled, index, color, glow }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-500 aspect-square ${
        filled
          ? `border-transparent ${color}`
          : "border-dashed border-white/20 bg-white/5"
      }`}
      style={
        filled && glow
          ? { boxShadow: `0 0 24px 4px ${glow}33, inset 0 1px 0 rgba(255,255,255,0.15)` }
          : {}
      }
    >
      {filled ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.07 + 0.1, type: "spring", stiffness: 400, damping: 20 }}
          className="flex flex-col items-center gap-1"
        >
          <ShoppingCart className="w-7 h-7 text-white drop-shadow-sm" />
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">Cart</span>
        </motion.div>
      ) : (
        <span className="text-white/20 text-[11px] font-medium">Empty</span>
      )}
    </motion.div>
  );
}

function ZoneVSM({ title, subtitle, inventory, color, glowColor, icon: Icon, onDecrease, onIncrease, decreaseLabel, increaseLabel, isUpdating }) {
  if (!inventory) return null;
  const { current_carts, max_capacity, reorder_point } = inventory;
  const pct = max_capacity > 0 ? current_carts / max_capacity : 0;
  const isLow = current_carts <= reorder_point;
  const isCritical = current_carts === 0;

  const statusColor = isCritical ? "#FF3B30" : isLow ? "#FF9500" : "#30D158";
  const statusLabel = isCritical ? "CRÍTICO — SIN STOCK" : isLow ? "ALERTA — REORDEN" : "NORMAL";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Status alert bar */}
      <AnimatePresence>
        {isLow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-2.5 flex items-center gap-2"
            style={{ backgroundColor: `${statusColor}22`, borderBottom: `1px solid ${statusColor}33` }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}22`, border: `1px solid ${color}33` }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-white tracking-tight">{title}</h2>
              <p className="text-[12px] text-white/50 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[40px] font-black text-white leading-none tabular-nums">{current_carts}</div>
            <div className="text-[12px] text-white/40 mt-1">de {max_capacity} carritos</div>
          </div>
        </div>

        {/* Cart Grid */}
        <div
          className="grid gap-3 mb-8"
          style={{ gridTemplateColumns: `repeat(${max_capacity}, 1fr)` }}
        >
          {Array.from({ length: max_capacity }).map((_, i) => (
            <CartSlot
              key={i}
              index={i}
              filled={i < current_carts}
              color={i < current_carts ? (isLow ? "bg-[#FF9500]/80" : isCritical ? "bg-[#FF3B30]/80" : "bg-[#30D158]/70") : ""}
              glow={i < current_carts ? (isLow ? "#FF9500" : "#30D158") : null}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-white/40 font-medium uppercase tracking-widest">Nivel de Stock</span>
            <span className="text-[11px] font-bold" style={{ color: statusColor }}>{Math.round(pct * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${statusColor}99, ${statusColor})` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-white/25">0</span>
            <span className="text-[10px] text-white/40">Punto reorden: {reorder_point}</span>
            <span className="text-[10px] text-white/25">{max_capacity}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onDecrease && (
            <button
              onClick={onDecrease}
              disabled={isUpdating || current_carts === 0}
              className="flex-1 h-11 rounded-2xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-30 flex items-center justify-center gap-2"
              style={{
                background: "rgba(255,59,48,0.15)",
                border: "1px solid rgba(255,59,48,0.25)",
                color: "#FF3B30",
              }}
            >
              {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : decreaseLabel}
            </button>
          )}
          {onIncrease && (
            <button
              onClick={onIncrease}
              disabled={isUpdating || current_carts >= max_capacity}
              className="flex-1 h-11 rounded-2xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-30 flex items-center justify-center gap-2"
              style={{
                background: "rgba(48,209,88,0.15)",
                border: "1px solid rgba(48,209,88,0.25)",
                color: "#30D158",
              }}
            >
              {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : increaseLabel}
            </button>
          )}
        </div>
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

  const sopladroaInv = inventories.find((i) => i.zone === "sopladora");
  const kanbanInv   = inventories.find((i) => i.zone === "kanban");

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

  const totalCarts = (sopladroaInv?.current_carts ?? 0) + (kanbanInv?.current_carts ?? 0);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B3E 50%, #0A1628 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #002F6C 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #30D158 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 pb-24 lg:pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">Sistema de Inventario</p>
              <h1 className="text-[32px] font-black text-white tracking-[-0.5px] leading-none">VSM de Carritos</h1>
              <p className="text-[14px] text-white/50 mt-2">Nivel de stock en tiempo real · Sopladora & Kanban</p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-white/30 uppercase tracking-widest mb-1">Total en Sistema</div>
              <div className="text-[44px] font-black text-white leading-none tabular-nums">{totalCarts}</div>
              <div className="text-[12px] text-white/30">carritos totales</div>
            </div>
          </div>
        </motion.div>

        {/* VSM Flow Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden lg:flex items-center gap-4 mb-6 px-2"
        >
          <div className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Sopladora 25 Línea F</div>
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-white/5" />
            <div className="text-white/20 text-lg">→</div>
            <div className="flex-1 h-px bg-gradient-to-r from-white/5 to-white/20" />
          </div>
          <div className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Zona Kanban</div>
        </motion.div>

        {/* Zones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ZoneVSM
            title="Sopladora 25 — Línea F"
            subtitle="Capacidad: 3 carritos · Reorden: 1 carrito"
            inventory={sopladroaInv}
            color="#007AFF"
            icon={ShoppingCart}
            onDecrease={() => adjust(sopladroaInv, -1)}
            onIncrease={() => adjust(sopladroaInv, +1)}
            decreaseLabel="− Entregar carrito"
            increaseLabel="+ Recibir carrito"
            isUpdating={updatingZone === "sopladora"}
          />
          <ZoneVSM
            title="Zona Kanban"
            subtitle="Capacidad: 6 carritos · Distribución de misceláneos"
            inventory={kanbanInv}
            color="#30D158"
            icon={TrendingUp}
            onDecrease={() => adjust(kanbanInv, -1)}
            onIncrease={() => adjust(kanbanInv, +1)}
            decreaseLabel="− Entregar carrito"
            increaseLabel="+ Reponer carrito"
            isUpdating={updatingZone === "kanban"}
          />
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center gap-6 px-1"
        >
          {[
            { color: "#30D158", label: "Stock normal" },
            { color: "#FF9500", label: "Nivel de reorden — solicitar más" },
            { color: "#FF3B30", label: "Sin stock — acción inmediata" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-white/40">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}