import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";

function CartSlot({ filled, index, isLow, isCritical }) {
  const color = isCritical ? "#EF4444" : isLow ? "#F59E0B" : "#22C55E";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center justify-center rounded-xl border-2 aspect-square transition-all duration-300"
      style={filled ? {
        borderColor: `${color}66`,
        backgroundColor: `${color}12`,
        boxShadow: isLow ? `0 0 12px ${color}22` : undefined,
      } : {
        borderColor: "#E2E8F0",
        borderStyle: "dashed",
        backgroundColor: "#F8FAFC",
      }}
    >
      {filled ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: index * 0.06 + 0.1, type: "spring", stiffness: 400, damping: 20 }}
          className="flex flex-col items-center gap-1">
          <ShoppingCart className="w-6 h-6" style={{ color }} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${color}99` }}>Cart</span>
        </motion.div>
      ) : (
        <span className="text-slate-300 text-[10px] font-medium">Vacío</span>
      )}
    </motion.div>
  );
}

function ZoneCard({ title, subtitle, inventory, icon: Icon, accentColor, onDecrease, onIncrease, decreaseLabel, increaseLabel, isUpdating }) {
  if (!inventory) return null;
  const { current_carts, max_capacity, reorder_point } = inventory;
  const pct = max_capacity > 0 ? current_carts / max_capacity : 0;
  const isLow = current_carts <= reorder_point;
  const isCritical = current_carts === 0;
  const statusColor = isCritical ? "#EF4444" : isLow ? "#F59E0B" : "#22C55E";
  const statusLabel = isCritical ? "Sin stock" : isLow ? "Nivel bajo" : "Normal";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      {/* Status badge */}
      <AnimatePresence>
        {isLow && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
            style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}30` }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: statusColor }}>{statusLabel}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}>
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-slate-900 leading-none tabular-nums">{current_carts}</div>
          <div className="text-xs text-slate-400 mt-0.5">de {max_capacity}</div>
        </div>
      </div>

      {/* Cart Grid */}
      <div className="grid gap-2.5 mb-5" style={{ gridTemplateColumns: `repeat(${max_capacity}, 1fr)` }}>
        {Array.from({ length: max_capacity }).map((_, i) => (
          <CartSlot key={i} index={i} filled={i < current_carts} isLow={isLow} isCritical={isCritical} />
        ))}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Nivel de stock</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: statusColor }}>{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${statusColor}80, ${statusColor})` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-300">0</span>
          <span className="text-[10px] text-slate-400">Reorden: {reorder_point}</span>
          <span className="text-[10px] text-slate-300">{max_capacity}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        {onDecrease && (
          <button onClick={onDecrease} disabled={isUpdating || current_carts === 0}
            className="flex-1 h-10 rounded-xl text-xs font-semibold disabled:opacity-30 flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
            {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            {decreaseLabel}
          </button>
        )}
        {onIncrease && (
          <button onClick={onIncrease} disabled={isUpdating || current_carts >= max_capacity}
            className="flex-1 h-10 rounded-xl text-xs font-semibold disabled:opacity-30 flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors">
            {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            {increaseLabel}
          </button>
        )}
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

  const totalCarts = (sopladroaInv?.current_carts ?? 0) + (kanbanInv?.current_carts ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Sistema de Inventario</p>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventario</h1>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Total en sistema</div>
            <div className="text-3xl font-black text-slate-900 tabular-nums">{totalCarts}</div>
          </div>
        </div>
      </div>

      {/* VSM Flow arrow */}
      <div className="hidden lg:flex items-center gap-4 px-6 mb-6">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Sopladora 25 Línea F</span>
        <div className="flex-1 flex items-center gap-1">
          <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-slate-100" />
          <span className="text-slate-300 text-sm">→</span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-100 to-slate-300" />
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Zona Kanban</span>
      </div>

      {/* Zones */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ZoneCard
          title="Sopladora 25 — Línea F"
          subtitle="Capacidad: 3 carritos · Punto de reorden: 1"
          inventory={sopladroaInv}
          icon={ShoppingCart}
          accentColor="#3B82F6"
          onDecrease={() => adjust(sopladroaInv, -1)}
          onIncrease={() => adjust(sopladroaInv, +1)}
          decreaseLabel="− Entregar"
          increaseLabel="+ Recibir"
          isUpdating={updatingZone === "sopladora"}
        />
        <ZoneCard
          title="Zona Kanban"
          subtitle="Capacidad: 6 carritos · Distribución misceláneos"
          inventory={kanbanInv}
          icon={TrendingUp}
          accentColor="#22C55E"
          onDecrease={() => adjust(kanbanInv, -1)}
          onIncrease={() => adjust(kanbanInv, +1)}
          decreaseLabel="− Entregar"
          increaseLabel="+ Reponer"
          isUpdating={updatingZone === "kanban"}
        />
      </div>

      {/* Legend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-8 px-6 flex flex-wrap items-center gap-5">
        {[
          { color: "#22C55E", label: "Stock normal" },
          { color: "#F59E0B", label: "Nivel de reorden — solicitar más" },
          { color: "#EF4444", label: "Sin stock — acción inmediata" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-slate-400">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}