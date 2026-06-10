import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, Send, RefreshCw, CheckCircle2, AlertTriangle, Package } from "lucide-react";

function CartSlotKanban({ index, filled, isDelivering, onDeliver }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => filled && onDeliver(index)}
      disabled={!filled || isDelivering}
      className="relative flex flex-col items-center justify-center rounded-2xl aspect-square transition-all duration-300 group"
      style={
        filled
          ? {
              background: "linear-gradient(145deg, rgba(48,209,88,0.25) 0%, rgba(48,209,88,0.12) 100%)",
              border: "1px solid rgba(48,209,88,0.4)",
              boxShadow: "0 0 20px rgba(48,209,88,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
              cursor: "pointer",
            }
          : {
              background: "rgba(255,255,255,0.03)",
              border: "1.5px dashed rgba(255,255,255,0.1)",
              cursor: "default",
            }
      }
      whileHover={filled ? { scale: 1.04, transition: { duration: 0.2 } } : {}}
      whileTap={filled ? { scale: 0.96 } : {}}
    >
      {filled ? (
        <div className="flex flex-col items-center gap-1.5">
          <ShoppingCart className="w-8 h-8 text-[#30D158] drop-shadow" />
          <span className="text-[9px] font-bold text-[#30D158]/70 uppercase tracking-widest">Disponible</span>
          <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Entregar →</span>
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-white/15 font-medium">Vacío</span>
      )}
    </motion.button>
  );
}

export default function ZonaKanban() {
  const queryClient = useQueryClient();
  const [delivering, setDelivering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);

  const { data: inventories = [] } = useQuery({
    queryKey: ["cartInventory"],
    queryFn: () => base44.entities.CartInventory.list(),
    refetchInterval: 6000,
  });

  const kanbanInv = inventories.find((i) => i.zone === "kanban");
  const sopladroaInv = inventories.find((i) => i.zone === "sopladora");

  const updateKanban = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CartInventory.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cartInventory"] }),
  });

  const createOrder = useMutation({
    mutationFn: (data) => base44.entities.ProductionOrder.create(data),
  });

  const handleDeliver = async () => {
    if (!kanbanInv || kanbanInv.current_carts === 0) return;
    setDelivering(true);
    await updateKanban.mutateAsync({
      id: kanbanInv.id,
      data: { current_carts: kanbanInv.current_carts - 1 },
    });
    setShowConfirm(false);
    setDelivering(false);
  };

  const handleRequestReorder = async () => {
    await createOrder.mutateAsync({
      requested_carts: kanbanInv?.max_capacity - kanbanInv?.current_carts || 1,
      status: "pending",
      requested_at: new Date().toISOString(),
      notes: "Solicitud automática desde Zona Kanban",
    });
    setShowReorderModal(false);
  };

  const current = kanbanInv?.current_carts ?? 0;
  const max = kanbanInv?.max_capacity ?? 6;
  const reorder = kanbanInv?.reorder_point ?? 2;
  const isLow = current <= reorder;
  const isEmpty = current === 0;
  const pct = max > 0 ? current / max : 0;
  const statusColor = isEmpty ? "#FF3B30" : isLow ? "#FF9500" : "#30D158";

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B3E 50%, #0A1628 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #30D158 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #002F6C 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 pb-24 lg:pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">Gestión de Stock</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[30px] font-black text-white tracking-[-0.4px] leading-none">Zona Kanban</h1>
              <p className="text-[14px] text-white/50 mt-2">Centro de distribución de carritos misceláneos</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${statusColor}22`, border: `1px solid ${statusColor}33` }}>
              <motion.div animate={{ opacity: isLow ? [1, 0.3, 1] : 1 }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: statusColor }}>
                {isEmpty ? "Sin stock" : isLow ? "Stock bajo" : "Operacional"}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main cart grid panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-3xl p-6 sm:p-8"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[17px] font-bold text-white">Espacios de Carritos</h2>
                <p className="text-[12px] text-white/40 mt-0.5">{current} de {max} disponibles · Toca para entregar</p>
              </div>
              <div className="text-[40px] font-black text-white tabular-nums leading-none">{current}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {Array.from({ length: max }).map((_, i) => (
                <CartSlotKanban
                  key={i}
                  index={i}
                  filled={i < current}
                  isDelivering={delivering}
                  onDeliver={() => setShowConfirm(true)}
                />
              ))}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-white/30 uppercase tracking-widest">Nivel de inventario</span>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: statusColor }}>{Math.round(pct * 100)}%</span>
              </div>
              <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${statusColor}80, ${statusColor})` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/20">0</span>
                <span className="text-[10px] text-white/30">Reorden: {reorder}</span>
                <span className="text-[10px] text-white/20">{max}</span>
              </div>
            </div>
          </motion.div>

          {/* Actions panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Deliver cart */}
            <div
              className="rounded-3xl p-6 flex-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,59,48,0.15)", border: "1px solid rgba(255,59,48,0.25)" }}>
                <Send className="w-5 h-5 text-[#FF3B30]" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1">Entregar Carrito</h3>
              <p className="text-[12px] text-white/40 mb-5 leading-relaxed">Registra la salida de un carrito de la zona kanban hacia la línea de producción.</p>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={current === 0 || delivering}
                className="w-full h-11 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-30"
                style={{ background: "rgba(255,59,48,0.2)", border: "1px solid rgba(255,59,48,0.3)", color: "#FF3B30" }}
              >
                − Entregar 1 carrito
              </button>
            </div>

            {/* Request reorder */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: isLow ? "rgba(255,149,0,0.06)" : "rgba(255,255,255,0.04)",
                border: isLow ? "1px solid rgba(255,149,0,0.2)" : "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,149,0,0.15)", border: "1px solid rgba(255,149,0,0.25)" }}>
                <RefreshCw className="w-5 h-5 text-[#FF9500]" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1">Solicitar Reposición</h3>
              <p className="text-[12px] text-white/40 mb-5 leading-relaxed">Pide más carritos a la Sopladora 1 cuando el stock esté bajo.</p>
              <button
                onClick={() => setShowReorderModal(true)}
                disabled={createOrder.isPending}
                className="w-full h-11 rounded-2xl text-[13px] font-bold transition-all duration-200 flex items-center justify-center gap-2"
                style={{ background: "rgba(255,149,0,0.2)", border: "1px solid rgba(255,149,0,0.3)", color: "#FF9500" }}
              >
                {createOrder.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Solicitar a Sopladora 1
              </button>
            </div>

            {/* Sopladora stock ref */}
            {sopladroaInv && (
              <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Stock en Sopladora</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {Array.from({ length: sopladroaInv.max_capacity }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-lg flex items-center justify-center" style={i < sopladroaInv.current_carts ? { background: "rgba(0,122,255,0.3)", border: "1px solid rgba(0,122,255,0.4)" } : { background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                        {i < sopladroaInv.current_carts && <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />}
                      </div>
                    ))}
                  </div>
                  <span className="text-[13px] font-bold text-white/60">{sopladroaInv.current_carts}/{sopladroaInv.max_capacity}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Deliver confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => !delivering && setShowConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="w-full max-w-sm rounded-3xl p-7" style={{ background: "linear-gradient(145deg, rgba(20,30,50,0.95) 0%, rgba(10,15,30,0.98) 100%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", backdropFilter: "blur(40px)" }}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(48,209,88,0.15)", border: "1px solid rgba(48,209,88,0.3)" }}>
                    <CheckCircle2 className="w-6 h-6 text-[#30D158]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-white">Confirmar Entrega</p>
                    <p className="text-[12px] text-white/40 mt-0.5">Se descontará 1 carrito del stock</p>
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 mb-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-white/40">Stock actual</span><span className="text-[14px] font-bold text-white">{current} carritos</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[12px] text-white/40">Después de entrega</span><span className="text-[14px] font-bold" style={{ color: (current - 1) <= reorder ? "#FF9500" : "#30D158" }}>{current - 1} carritos</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} disabled={delivering} className="flex-1 h-11 rounded-2xl text-[13px] font-semibold text-white/50 hover:text-white/80 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    Cancelar
                  </button>
                  <button onClick={handleDeliver} disabled={delivering} className="flex-1 h-11 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2" style={{ background: "rgba(48,209,88,0.2)", border: "1px solid rgba(48,209,88,0.35)", color: "#30D158" }}>
                    {delivering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reorder modal */}
      <AnimatePresence>
        {showReorderModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowReorderModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="w-full max-w-sm rounded-3xl p-7" style={{ background: "linear-gradient(145deg, rgba(20,30,50,0.95) 0%, rgba(10,15,30,0.98) 100%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", backdropFilter: "blur(40px)" }}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,149,0,0.15)", border: "1px solid rgba(255,149,0,0.3)" }}>
                    <Package className="w-6 h-6 text-[#FF9500]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-white">Solicitar a Sopladora 1</p>
                    <p className="text-[12px] text-white/40 mt-0.5">Orden de reposición de carritos</p>
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 mb-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[12px] text-white/40 mb-1">Carritos a solicitar</p>
                  <p className="text-[24px] font-black text-white">{max - current} <span className="text-[14px] font-normal text-white/30">para llenar al máximo</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReorderModal(false)} className="flex-1 h-11 rounded-2xl text-[13px] font-semibold text-white/50" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
                  <button onClick={handleRequestReorder} disabled={createOrder.isPending} className="flex-1 h-11 rounded-2xl text-[13px] font-bold" style={{ background: "rgba(255,149,0,0.2)", border: "1px solid rgba(255,149,0,0.35)", color: "#FF9500" }}>
                    Enviar solicitud
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}