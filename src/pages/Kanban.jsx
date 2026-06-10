import { useMemo, useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, Package, Clock, Bell, CheckCircle2, ShoppingCart, Send, RefreshCw, Plus } from "lucide-react";
import AlertKPIBar from "@/components/kanban/AlertKPIBar";

// ─── helpers ───────────────────────────────────────────────────
const SEEN_KEY = "nemak_seen_triggers";
function getSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
  catch { return new Set(); }
}
function markSeen(id) {
  const s = getSeenIds(); s.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
}

function formatElapsed(ms) {
  if (!ms || ms <= 0) return "—";
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m`; return `${s}s`;
}

const critCfg = {
  HIGH:   { badge: "bg-red-100 text-red-600",    bar: "bg-red-500",    glow: true },
  MEDIUM: { badge: "bg-amber-100 text-amber-600", bar: "bg-amber-400",  glow: false },
  LOW:    { badge: "bg-blue-100 text-blue-600",   bar: "bg-blue-400",   glow: false },
};
const colCfg = {
  unassigned:  { title: "Pendiente",   sub: "Nuevas alertas",          dot: "bg-red-400",   accent: "#EF4444" },
  in_progress: { title: "En Progreso", sub: "En atención activa",      dot: "bg-amber-400", accent: "#F59E0B" },
  resolved:    { title: "Resuelto",    sub: "Incidentes cerrados",      dot: "bg-green-500", accent: "#22C55E" },
};

// ─── Trigger Card ───────────────────────────────────────────────
function TriggerCard({ trigger, index }) {
  const [elapsed, setElapsed] = useState(0);
  const cfg = critCfg[trigger.criticality] || critCfg.LOW;
  const isResolved = trigger.status === "resolved";

  useEffect(() => {
    if (isResolved) {
      if (trigger.resolved_at && trigger.triggered_at)
        setElapsed(new Date(trigger.resolved_at) - new Date(trigger.triggered_at));
      return;
    }
    if (!trigger.triggered_at) return;
    const up = () => setElapsed(Date.now() - new Date(trigger.triggered_at).getTime());
    up(); const iv = setInterval(up, 1000); return () => clearInterval(iv);
  }, [trigger.triggered_at, trigger.resolved_at, isResolved]);

  return (
    <Draggable draggableId={trigger.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.9 : 1,
            transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} rotate(2deg)` : provided.draggableProps.style?.transform,
          }}
          className="rounded-xl bg-white border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing select-none mb-2 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className={`h-0.5 w-full ${cfg.bar}`} />
          <div className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 truncate mr-2">{trigger.production_line}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                {trigger.criticality}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[13px] font-semibold text-slate-800 font-mono truncate">{trigger.part_number}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">
                {new Date(trigger.triggered_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <div className={`flex items-center gap-1 text-[10px] font-mono ${isResolved ? "text-green-600" : trigger.criticality === "HIGH" ? "text-red-500" : "text-slate-400"}`}>
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsed)}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────
function KanbanColumn({ columnId, triggers, index }) {
  const cfg = colCfg[columnId];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
      className="flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <h3 className="text-[13px] font-semibold text-slate-700">{cfg.title}</h3>
        <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{triggers.length}</span>
      </div>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 rounded-xl min-h-[200px] p-2 transition-colors duration-150"
            style={{
              background: snapshot.isDraggingOver ? `${cfg.accent}0D` : "rgba(248,250,252,0.8)",
              border: snapshot.isDraggingOver ? `2px dashed ${cfg.accent}66` : "2px dashed transparent",
            }}
          >
            {triggers.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24">
                <p className="text-[11px] text-slate-300">Sin elementos</p>
              </div>
            )}
            {triggers.map((t, i) => <TriggerCard key={t.id} trigger={t} index={i} />)}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </motion.div>
  );
}

// ─── Cart Slot ──────────────────────────────────────────────────
function CartSlot({ index, filled, onDeliver }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => filled && onDeliver()}
      disabled={!filled}
      className="relative flex flex-col items-center justify-center rounded-xl aspect-square transition-all duration-200 group"
      style={filled ? {
        background: "linear-gradient(145deg, #D1FAE5, #A7F3D0)",
        border: "1.5px solid #34D399",
        boxShadow: "0 2px 8px rgba(52,211,153,0.2)",
        cursor: "pointer",
      } : {
        background: "#F8FAFC",
        border: "1.5px dashed #CBD5E1",
        cursor: "default",
      }}
      whileHover={filled ? { scale: 1.04 } : {}}
      whileTap={filled ? { scale: 0.96 } : {}}
    >
      {filled ? (
        <div className="flex flex-col items-center gap-1">
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <span className="text-[8px] font-bold text-green-600/70 uppercase tracking-widest">Listo</span>
          <div className="absolute inset-0 rounded-xl bg-green-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1.5">
            <span className="text-[8px] font-bold text-green-800 uppercase">Entregar</span>
          </div>
        </div>
      ) : (
        <span className="text-[9px] text-slate-300 font-medium">Vacío</span>
      )}
    </motion.button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function Kanban() {
  const queryClient = useQueryClient();
  const [lastMoved, setLastMoved] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [newTriggerAlert, setNewTriggerAlert] = useState(null);
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestQty, setRequestQty] = useState(1);
  const [requesting, setRequesting] = useState(false);

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers"],
    queryFn: () => base44.entities.Trigger.list("-triggered_at", 200),
    refetchInterval: 5000,
  });

  const { data: inventories = [] } = useQuery({
    queryKey: ["cartInventory"],
    queryFn: () => base44.entities.CartInventory.list(),
    refetchInterval: 6000,
  });

  const kanbanInv = inventories.find((i) => i.zone === "kanban");

  const updateTrigger = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Trigger.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["triggers"] }),
  });

  const updateKanban = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CartInventory.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cartInventory"] }),
  });

  // One-timer: show fullscreen alert for first unseen unassigned trigger
  const shownRef = useRef(false);
  useEffect(() => {
    if (shownRef.current || triggers.length === 0) return;
    const seen = getSeenIds();
    const unseen = triggers.find((t) => t.status === "unassigned" && !seen.has(t.id));
    if (unseen) {
      shownRef.current = true;
      setNewTriggerAlert(unseen);
    }
  }, [triggers]);

  const handleAlertOK = async () => {
    if (!newTriggerAlert) return;
    markSeen(newTriggerAlert.id);
    await updateTrigger.mutateAsync({
      id: newTriggerAlert.id,
      data: { status: "in_progress" },
    });
    setNewTriggerAlert(null);
  };

  const columns = useMemo(() => {
    const g = { unassigned: [], in_progress: [], resolved: [] };
    triggers.forEach((t) => { if (g[t.status]) g[t.status].push(t); });
    return g;
  }, [triggers]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    const newStatus = destination.droppableId;
    const trigger = triggers.find((t) => t.id === draggableId);
    if (!trigger || trigger.status === newStatus) return;

    const updateData = { status: newStatus };
    if (newStatus === "resolved") updateData.resolved_at = new Date().toISOString();
    else updateData.resolved_at = null;

    setLastMoved({ id: draggableId, from: source.droppableId, to: newStatus, part: trigger.part_number });
    setTimeout(() => setLastMoved(null), 2500);

    updateTrigger.mutate({ id: draggableId, data: updateData });

    // Auto-descuento en inventario Kanban cuando se resuelve
    if (newStatus === "resolved" && kanbanInv && kanbanInv.current_carts > 0) {
      updateKanban.mutate({ id: kanbanInv.id, data: { current_carts: kanbanInv.current_carts - 1 } });
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    await Promise.all(triggers.map((t) => base44.entities.Trigger.delete(t.id)));
    queryClient.invalidateQueries({ queryKey: ["triggers"] });
    setClearing(false);
    setShowClearConfirm(false);
  };

  const handleRequestSopladora = async () => {
    setRequesting(true);
    await base44.entities.ProductionOrder.create({
      requested_carts: requestQty,
      status: "pending",
      requested_at: new Date().toISOString(),
      notes: "Solicitud desde Zona Kanban",
    });
    setRequesting(false);
    setShowRequestModal(false);
    setRequestQty(1);
  };

  const handleDeliver = async () => {
    if (!kanbanInv || kanbanInv.current_carts === 0) return;
    setDelivering(true);
    await updateKanban.mutateAsync({ id: kanbanInv.id, data: { current_carts: kanbanInv.current_carts - 1 } });
    setShowDeliverConfirm(false);
    setDelivering(false);
  };

  const current = kanbanInv?.current_carts ?? 0;
  const max = kanbanInv?.max_capacity ?? 6;
  const reorder = kanbanInv?.reorder_point ?? 2;
  const isLow = current <= reorder;
  const pct = max > 0 ? current / max : 0;
  const stockColor = current === 0 ? "#EF4444" : isLow ? "#F59E0B" : "#22C55E";

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">

      {/* ── Fullscreen New Trigger Alert ─────────────────────── */}
      <AnimatePresence>
        {newTriggerAlert && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center px-5">
              <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-red-50 border-b border-red-100 px-6 pt-8 pb-6 text-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-red-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Nueva Alerta de Escasez</h2>
                  <p className="text-sm text-slate-500">Se ha activado una solicitud de material</p>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Línea</span>
                    <span className="text-sm font-semibold text-slate-700">{newTriggerAlert.production_line}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Material</span>
                    <span className="text-sm font-mono font-semibold text-slate-700">{newTriggerAlert.part_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Hora</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(newTriggerAlert.triggered_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Criticidad</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">HIGH</span>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button onClick={handleAlertOK}
                    className="w-full h-12 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    OK — Entendido, tomando atención
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Sistema de Control</p>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kanban</h1>
          <button onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      {/* ── KPI Bar ──────────────────────────────────────────── */}
      <div className="px-6 mb-6">
        <AlertKPIBar triggers={triggers} />
      </div>

      {/* ── Pipeline ─────────────────────────────────────────── */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Pipeline de Alertas</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-slate-400">En vivo · {triggers.length} alertas</span>
          </div>
        </div>

        <AnimatePresence>
          {lastMoved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white border border-slate-200 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-600">
                <span className="font-mono font-semibold text-slate-800">{lastMoved.part}</span>
                {" → "}
                <span className="font-semibold">{colCfg[lastMoved.to]?.title}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {["unassigned", "in_progress", "resolved"].map((col, i) => (
              <KanbanColumn key={col} columnId={col} triggers={columns[col]} index={i} />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* ── Zona Kanban Inventory ─────────────────────────────── */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Zona Kanban — Stock de Carritos</h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: `${stockColor}15`, color: stockColor, border: `1px solid ${stockColor}33` }}>
            <motion.div animate={{ opacity: isLow ? [1, 0.3, 1] : 1 }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stockColor }} />
            {current === 0 ? "Sin stock" : isLow ? "Stock bajo" : "Operacional"}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">{current} de {max} carritos disponibles</p>
              <p className="text-xs text-slate-400 mt-0.5">Toca un slot lleno para registrar entrega</p>
            </div>
            <div className="text-3xl font-black tabular-nums" style={{ color: stockColor }}>{current}</div>
          </div>

          <div className="grid grid-cols-6 gap-2.5 mb-4">
            {Array.from({ length: max }).map((_, i) => (
              <CartSlot key={i} index={i} filled={i < current} onDeliver={() => setShowDeliverConfirm(true)} />
            ))}
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Nivel</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: stockColor }}>{Math.round(pct * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${stockColor}80, ${stockColor})` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-300">0</span>
              <span className="text-[10px] text-slate-400">Reorden: {reorder}</span>
              <span className="text-[10px] text-slate-300">{max}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowDeliverConfirm(true)} disabled={current === 0}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-medium border transition-colors duration-150 disabled:opacity-30 flex items-center justify-center gap-2"
              style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.12)", color: "#1D1D1F" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Send className="w-3.5 h-3.5" />
              Entrega manual
            </button>
            <button onClick={() => setShowRequestModal(true)}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-medium text-white transition-colors duration-150 flex items-center justify-center gap-2"
              style={{ background: "#1D1D1F" }}
              onMouseEnter={e => e.currentTarget.style.background = "#2D2D2F"}
              onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}>
              <Plus className="w-3.5 h-3.5" />
              Solicitar a Sopladora 1
            </button>
          </div>
        </div>
      </div>

      {/* ── Deliver Confirm ──────────────────────────────────── */}
      <AnimatePresence>
        {showDeliverConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => !delivering && setShowDeliverConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">Confirmar Entrega</p>
                    <p className="text-xs text-slate-500 mt-0.5">Se descontará 1 carrito del stock</p>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 mb-5 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Stock actual</span>
                    <span className="text-sm font-bold text-slate-800">{current} carritos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Después</span>
                    <span className="text-sm font-bold" style={{ color: (current - 1) <= reorder ? "#F59E0B" : "#22C55E" }}>{current - 1} carritos</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeliverConfirm(false)} disabled={delivering}
                    className="flex-1 h-11 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button onClick={handleDeliver} disabled={delivering}
                    className="flex-1 h-11 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    {delivering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Request Sopladora Modal ───────────────────────────── */}
      <AnimatePresence>
        {showRequestModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => !requesting && setShowRequestModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }} transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-0 flex items-center justify-center z-50 px-5">
              <div className="w-full max-w-xs bg-white rounded-[14px] overflow-hidden shadow-xl" style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>
                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "#6E6E73" }}>Solicitud de Producción</p>
                  <h3 className="text-[17px] font-medium" style={{ color: "#1D1D1F" }}>Pedir carritos a Sopladora 1</h3>
                </div>

                {/* Quantity selector */}
                <div className="px-6 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "#6E6E73" }}>Cantidad de carritos</p>
                  <div className="flex items-center justify-between rounded-[10px] px-4 py-3" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <button
                      onClick={() => setRequestQty(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium transition-colors"
                      style={{ color: "#1D1D1F", background: "white", border: "1px solid rgba(0,0,0,0.10)" }}
                    >−</button>
                    <span className="text-[28px] font-bold tabular-nums" style={{ color: "#1D1D1F" }}>{requestQty}</span>
                    <button
                      onClick={() => setRequestQty(q => Math.min(max, q + 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium transition-colors"
                      style={{ color: "#1D1D1F", background: "white", border: "1px solid rgba(0,0,0,0.10)" }}
                    >+</button>
                  </div>
                  <p className="text-[12px] mt-2" style={{ color: "#86868B" }}>
                    Zona Kanban tiene {current} de {max} carritos actualmente.
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-2">
                  <button onClick={() => setShowRequestModal(false)} disabled={requesting}
                    className="flex-1 h-10 rounded-[10px] text-[13px] font-medium transition-colors duration-150"
                    style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.12)", color: "#1D1D1F" }}>
                    Cancelar
                  </button>
                  <button onClick={handleRequestSopladora} disabled={requesting}
                    className="flex-1 h-10 rounded-[10px] text-[13px] font-medium text-white flex items-center justify-center gap-2 transition-colors duration-150"
                    style={{ background: "#1D1D1F", opacity: requesting ? 0.35 : 1 }}>
                    {requesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Enviar solicitud
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Clear All Confirm ─────────────────────────────────── */}
      <AnimatePresence>
        {showClearConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => !clearing && setShowClearConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">Limpiar todas las alertas</p>
                    <p className="text-xs text-slate-500 mt-0.5">{triggers.length} alertas serán eliminadas permanentemente</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowClearConfirm(false)} disabled={clearing}
                    className="flex-1 h-11 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-100">Cancelar</button>
                  <button onClick={handleClearAll} disabled={clearing}
                    className="flex-1 h-11 rounded-2xl text-sm font-bold text-red-600 bg-red-50 border border-red-200 flex items-center justify-center gap-2">
                    {clearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Eliminar todo
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