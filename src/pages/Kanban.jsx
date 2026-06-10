import { useMemo, useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, Clock, Bell, CheckCircle2, ShoppingCart, Send, RefreshCw, Plus, Minus, Package } from "lucide-react";
import AlertKPIBar from "@/components/kanban/AlertKPIBar";

const ease = [0.25, 0.1, 0.25, 1];
const SEEN_KEY = "nemak_seen_triggers";
function getSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
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

const critColor = { HIGH: "#FF3B30", MEDIUM: "#FF9F0A", LOW: "#0071E3" };
const colCfg = {
  unassigned:  { title: "Pendiente",   color: "#FF3B30" },
  in_progress: { title: "En Progreso", color: "#FF9F0A" },
  resolved:    { title: "Resuelto",    color: "#34C759" },
};

function TriggerCard({ trigger, index }) {
  const [elapsed, setElapsed] = useState(0);
  const isResolved = trigger.status === "resolved";
  const color = critColor[trigger.criticality] || critColor.LOW;

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
            background: "#FFFFFF",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderLeft: `3px solid ${color}`,
            borderRadius: "0 10px 10px 0",
            padding: "14px 16px",
            marginBottom: 8,
            cursor: "grab",
            boxShadow: snapshot.isDragging ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#86868B", margin: 0 }}>
              {trigger.production_line}
            </p>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
              background: `${color}0D`, border: `1px solid ${color}22`, color, borderRadius: 6, padding: "2px 8px",
            }}>
              {trigger.criticality}
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3", margin: "0 0 8px" }}>
            {trigger.part_number}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <span style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#86868B" }}>
              {new Date(trigger.triggered_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} style={{ color: "#86868B" }} />
              <span style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: isResolved ? "#34C759" : "#86868B" }}>
                {formatElapsed(elapsed)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ columnId, triggers, index }) {
  const cfg = colCfg[columnId];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.05 * index, ease }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: 9999, background: cfg.color, flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>
          {cfg.title}
        </p>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#86868B", background: "rgba(0,0,0,0.04)", borderRadius: 9999, padding: "1px 8px" }}>
          {triggers.length}
        </span>
      </div>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              minHeight: 180, borderRadius: 10, padding: 8,
              background: snapshot.isDraggingOver ? `${cfg.color}0A` : "rgba(0,0,0,0.02)",
              border: snapshot.isDraggingOver ? `1px dashed ${cfg.color}44` : "1px dashed transparent",
              transition: "all 150ms ease",
            }}
          >
            {triggers.length === 0 && !snapshot.isDraggingOver && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80 }}>
                <p style={{ fontSize: 13, color: "#AEAEB2" }}>Sin elementos</p>
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

function CartSlot({ index, filled, color, onDeliver }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.18, ease }}
      onClick={() => filled && onDeliver()}
      disabled={!filled}
      whileHover={filled ? { scale: 1.04 } : {}}
      whileTap={filled ? { scale: 0.97 } : {}}
      style={{
        aspectRatio: "1", borderRadius: 10,
        border: filled ? `1px solid ${color}33` : "1px dashed rgba(0,0,0,0.10)",
        background: filled ? `${color}0D` : "rgba(0,0,0,0.02)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        cursor: filled ? "pointer" : "default",
        transition: "all 120ms ease",
      }}
    >
      {filled
        ? <ShoppingCart size={16} style={{ color }} />
        : <span style={{ fontSize: 10, color: "#AEAEB2" }}>—</span>
      }
      {filled && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: `${color}99` }}>Listo</span>}
    </motion.button>
  );
}

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

  const kanbanInv    = inventories.find((i) => i.zone === "kanban");
  const { data: orders = [] } = useQuery({
    queryKey: ["productionOrders"],
    queryFn: () => base44.entities.ProductionOrder.list("-requested_at", 50),
    refetchInterval: 5000,
  });
  const shippedOrders = orders.filter((o) => o.status === "shipped");

  const updateTrigger = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Trigger.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["triggers"] }),
  });
  const updateKanban = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CartInventory.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cartInventory"] }),
  });
  const updateOrder = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductionOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
      queryClient.invalidateQueries({ queryKey: ["cartInventory"] });
    },
  });
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);

  const handleConfirmReceived = async (order) => {
    setConfirmingOrderId(order.id);
    // Incrementar inventario Kanban
    if (kanbanInv) {
      const newCount = Math.min(kanbanInv.current_carts + order.requested_carts, kanbanInv.max_capacity);
      await updateKanban.mutateAsync({ id: kanbanInv.id, data: { current_carts: newCount } });
    }
    await updateOrder.mutateAsync({ id: order.id, data: { status: "delivered", completed_at: new Date().toISOString() } });
    setConfirmingOrderId(null);
  };

  const shownRef = useRef(false);
  useEffect(() => {
    if (shownRef.current || triggers.length === 0) return;
    const seen = getSeenIds();
    const unseen = triggers.find((t) => t.status === "unassigned" && !seen.has(t.id));
    if (unseen) { shownRef.current = true; setNewTriggerAlert(unseen); }
  }, [triggers]);

  const handleAlertOK = async () => {
    if (!newTriggerAlert) return;
    markSeen(newTriggerAlert.id);
    await updateTrigger.mutateAsync({ id: newTriggerAlert.id, data: { status: "in_progress" } });
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
  const stockColor = current === 0 ? "#FF3B30" : isLow ? "#FF9F0A" : "#34C759";

  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ background: "#FFFFFF" }}>

      {/* ── New Trigger Alert Modal ── */}
      <AnimatePresence>
        {newTriggerAlert && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(12px)" }} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }} transition={{ duration: 0.24, ease }}
              className="fixed inset-0 z-50 flex items-center justify-center px-5">
              <div style={{ width: "100%", maxWidth: 420, background: "#FFFFFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.24)" }}>
                {/* Barra animada roja */}
                <motion.div
                  animate={{ scaleX: [1, 0.96, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ height: 4, background: "linear-gradient(90deg, #FF3B30, #FF6B00)", transformOrigin: "left" }}
                />
                <div style={{ padding: "36px 32px 28px", textAlign: "center" }}>
                  {/* Icono con doble pulso */}
                  <div style={{ position: "relative", display: "inline-flex", marginBottom: 24 }}>
                    <motion.div
                      animate={{ scale: [1, 1.7, 1], opacity: [0.35, 0, 0.35] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                      style={{ position: "absolute", inset: 0, borderRadius: 9999, background: "rgba(255,59,48,0.18)" }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.25 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 9999, background: "rgba(255,59,48,0.14)" }}
                    />
                    <div style={{ width: 72, height: 72, borderRadius: 9999, background: "rgba(255,59,48,0.10)", border: "2px solid rgba(255,59,48,0.25)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <Bell size={28} style={{ color: "#FF3B30" }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FF3B30", marginBottom: 10 }}>
                    ALERTA DE ESCASEZ
                  </p>
                  <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", margin: "0 0 8px", lineHeight: 1.1 }}>
                    Nueva Alerta<br />de Material
                  </h2>
                  <p style={{ fontSize: 15, color: "#6E6E73", margin: 0 }}>Se ha activado una solicitud desde producción</p>
                </div>
                <div style={{ margin: "0 32px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#86868B" }}>Línea</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F" }}>{newTriggerAlert.production_line}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#86868B" }}>Material</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1D1D1F" }}>{newTriggerAlert.part_number}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#86868B" }}>Hora</span>
                    <span style={{ fontSize: 13, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#1D1D1F" }}>
                      {new Date(newTriggerAlert.triggered_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "0 32px 32px" }}>
                  <motion.button onClick={handleAlertOK} whileTap={{ scale: 0.97 }}
                    style={{ width: "100%", height: 52, borderRadius: 10, background: "#1D1D1F", color: "#FFFFFF", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "-0.01em" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2D2D2F"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}>
                    <CheckCircle2 size={16} />
                    Atender — Tomando acción
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
          Sistema de Control
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F", margin: 0 }}>
            Kanban
          </h1>
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, background: "transparent", border: "1px solid rgba(0,0,0,0.10)", fontSize: 13, fontWeight: 400, color: "#FF3B30", cursor: "pointer", transition: "background 120ms ease" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,59,48,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Trash2 size={13} />
            Limpiar todo
          </button>
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div style={{ padding: "24px 40px 0" }}>
        <AlertKPIBar triggers={triggers} />
      </div>

      {/* ── Pipeline ── */}
      <div style={{ padding: "32px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>
            Pipeline de Alertas
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <motion.div style={{ width: 8, height: 8, borderRadius: 9999, background: "#34C759" }}
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#86868B" }}>
              En vivo · {triggers.length} alertas
            </span>
          </div>
        </div>

        <AnimatePresence>
          {lastMoved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease }}
              style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.15)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 9999, background: "#34C759" }} />
              <span style={{ fontSize: 13, color: "#1D1D1F" }}>
                <span style={{ fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3" }}>{lastMoved.part}</span>
                <span style={{ color: "#86868B", margin: "0 6px" }}>→</span>
                <span style={{ fontWeight: 500 }}>{colCfg[lastMoved.to]?.title}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {["unassigned", "in_progress", "resolved"].map((col, i) => (
              <KanbanColumn key={col} columnId={col} triggers={columns[col]} index={i} />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* ── Envíos pendientes de confirmar ── */}
      <AnimatePresence>
        {shippedOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.24, ease }}
            style={{ padding: "32px 40px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <motion.div style={{ width: 8, height: 8, borderRadius: 9999, background: "#6366F1" }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>
                Envíos pendientes de recibir
              </p>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6366F1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.20)", borderRadius: 9999, padding: "1px 8px" }}>
                {shippedOrders.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {shippedOrders.map((order) => (
                <div key={order.id} style={{ border: "1px solid rgba(99,102,241,0.20)", borderLeft: "3px solid #6366F1", borderRadius: "0 10px 10px 0", padding: "14px 16px", background: "rgba(99,102,241,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>
                      {order.requested_carts} carrito{order.requested_carts !== 1 ? "s" : ""} de Sopladora 12 Línea C
                    </p>
                    <p style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#86868B", marginTop: 4 }}>
                      Enviado · {new Date(order.requested_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfirmReceived(order)}
                    disabled={confirmingOrderId === order.id}
                    style={{ flexShrink: 0, height: 36, padding: "0 16px", borderRadius: 10, background: "#1D1D1F", color: "white", fontSize: 13, fontWeight: 500, border: "none", cursor: confirmingOrderId === order.id ? "not-allowed" : "pointer", opacity: confirmingOrderId === order.id ? 0.4 : 1, display: "flex", alignItems: "center", gap: 6, transition: "background 120ms ease" }}
                    onMouseEnter={e => { if (confirmingOrderId !== order.id) e.currentTarget.style.background = "#2D2D2F"; }}
                    onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}
                  >
                    {confirmingOrderId === order.id ? <RefreshCw size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <CheckCircle2 size={13} />}
                    Confirmar recibido
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Kanban Stock ── */}
      <div style={{ padding: "40px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>
            Zona Kanban — Stock de Carritos
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${stockColor}0D`, border: `1px solid ${stockColor}22`, borderRadius: 9999, padding: "4px 10px" }}>
            <motion.div style={{ width: 8, height: 8, borderRadius: 9999, background: stockColor }}
              animate={{ opacity: isLow ? [1, 0.3, 1] : 1 }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: stockColor, letterSpacing: "0.04em" }}>
              {current === 0 ? "Sin stock" : isLow ? "Stock bajo" : "Operacional"}
            </span>
          </div>
        </div>

        <div style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 24, background: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 15, color: "#1D1D1F", margin: 0 }}>{current} de {max} carritos</p>
              <p style={{ fontSize: 12, color: "#86868B", marginTop: 4 }}>Toca un slot para registrar entrega</p>
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: stockColor, fontVariantNumeric: "tabular-nums" }}>{current}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${max}, 1fr)`, gap: 8, marginBottom: 20 }}>
            {Array.from({ length: max }).map((_, i) => (
              <CartSlot key={i} index={i} filled={i < current} color={stockColor} onDeliver={() => setShowDeliverConfirm(true)} />
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73" }}>Nivel</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: stockColor, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 9999, overflow: "hidden" }}>
              <motion.div animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.7, ease }}
                style={{ height: "100%", background: stockColor, borderRadius: 9999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#AEAEB2" }}>0</span>
              <span style={{ fontSize: 11, color: "#86868B" }}>Reorden: {reorder}</span>
              <span style={{ fontSize: 11, color: "#AEAEB2" }}>{max}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowDeliverConfirm(true)}
              disabled={current === 0}
              style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", background: "transparent", fontSize: 13, fontWeight: 400, color: "#1D1D1F", cursor: current === 0 ? "not-allowed" : "pointer", opacity: current === 0 ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 120ms ease" }}
              onMouseEnter={e => { if (current > 0) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Minus size={14} />
              Entrega manual
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "#1D1D1F", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 150ms ease" }}
              onMouseEnter={e => e.currentTarget.style.background = "#2D2D2F"}
              onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}
            >
              <Plus size={14} />
              Solicitar a Sopladora 1
            </button>
          </div>
        </div>
      </div>

      {/* ── Deliver Confirm ── */}
      <AnimatePresence>
        {showDeliverConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)" }}
              onClick={() => !delivering && setShowDeliverConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }} transition={{ duration: 0.24, ease }}
              className="fixed inset-0 z-50 flex items-center justify-center px-5">
              <div style={{ width: "100%", maxWidth: 340, background: "#FFFFFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
                <div style={{ padding: "24px 24px 16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", marginBottom: 6 }}>Confirmar entrega</p>
                  <h3 style={{ fontSize: 17, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>Se descontará 1 carrito</h3>
                </div>
                <div style={{ padding: "0 24px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: 13, color: "#6E6E73" }}>Stock actual</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1D1D1F" }}>{current} carritos</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: 13, color: "#6E6E73" }}>Después</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: (current - 1) <= reorder ? "#FF9F0A" : "#34C759" }}>{current - 1} carritos</span>
                  </div>
                </div>
                <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
                  <button onClick={() => setShowDeliverConfirm(false)} disabled={delivering}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", background: "transparent", fontSize: 13, color: "#1D1D1F", cursor: "pointer", transition: "background 120ms ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    Cancelar
                  </button>
                  <button onClick={handleDeliver} disabled={delivering}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "#1D1D1F", fontSize: 13, fontWeight: 500, color: "white", cursor: delivering ? "not-allowed" : "pointer", opacity: delivering ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 150ms ease" }}
                    onMouseEnter={e => { if (!delivering) e.currentTarget.style.background = "#2D2D2F"; }}
                    onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}>
                    {delivering ? <RefreshCw size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <CheckCircle2 size={14} />}
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Request Sopladora Modal ── */}
      <AnimatePresence>
        {showRequestModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)" }}
              onClick={() => !requesting && setShowRequestModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }} transition={{ duration: 0.24, ease }}
              className="fixed inset-0 z-50 flex items-center justify-center px-5">
              <div style={{ width: "100%", maxWidth: 340, background: "#FFFFFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
                <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", marginBottom: 6 }}>Solicitud de Producción</p>
                  <h3 style={{ fontSize: 17, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>Pedir carritos a Sopladora 12 Línea C</h3>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", marginBottom: 10 }}>Cantidad de carritos</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: "10px 16px", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <button onClick={() => setRequestQty(q => Math.max(1, q - 1))}
                      style={{ width: 32, height: 32, borderRadius: 9999, background: "white", border: "1px solid rgba(0,0,0,0.10)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#1D1D1F" }}>
                      −
                    </button>
                    <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", fontVariantNumeric: "tabular-nums" }}>{requestQty}</span>
                    <button onClick={() => setRequestQty(q => Math.min(max, q + 1))}
                      style={{ width: 32, height: 32, borderRadius: 9999, background: "white", border: "1px solid rgba(0,0,0,0.10)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#1D1D1F" }}>
                      +
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "#86868B", marginTop: 8 }}>
                    Stock actual: {current} de {max} carritos.
                  </p>
                </div>
                <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
                  <button onClick={() => setShowRequestModal(false)} disabled={requesting}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", background: "transparent", fontSize: 13, color: "#1D1D1F", cursor: "pointer", transition: "background 120ms ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    Cancelar
                  </button>
                  <button onClick={handleRequestSopladora} disabled={requesting}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "#1D1D1F", fontSize: 13, fontWeight: 500, color: "white", cursor: requesting ? "not-allowed" : "pointer", opacity: requesting ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 150ms ease" }}
                    onMouseEnter={e => { if (!requesting) e.currentTarget.style.background = "#2D2D2F"; }}
                    onMouseLeave={e => e.currentTarget.style.background = "#1D1D1F"}>
                    {requesting ? <RefreshCw size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Send size={14} />}
                    Enviar solicitud
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Clear All Confirm ── */}
      <AnimatePresence>
        {showClearConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)" }}
              onClick={() => !clearing && setShowClearConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }} transition={{ duration: 0.24, ease }}
              className="fixed inset-0 z-50 flex items-center justify-center px-5">
              <div style={{ width: "100%", maxWidth: 340, background: "#FFFFFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
                <div style={{ padding: "24px 24px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlertTriangle size={16} style={{ color: "#FF3B30" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>Limpiar todas las alertas</p>
                      <p style={{ fontSize: 12, color: "#86868B", marginTop: 2 }}>{triggers.length} alertas eliminadas permanentemente</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
                  <button onClick={() => setShowClearConfirm(false)} disabled={clearing}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", background: "transparent", fontSize: 13, color: "#1D1D1F", cursor: "pointer", transition: "background 120ms ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    Cancelar
                  </button>
                  <button onClick={handleClearAll} disabled={clearing}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(255,59,48,0.25)", background: "rgba(255,59,48,0.08)", fontSize: 13, fontWeight: 500, color: "#FF3B30", cursor: clearing ? "not-allowed" : "pointer", opacity: clearing ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 120ms ease" }}>
                    {clearing ? <RefreshCw size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Trash2 size={14} />}
                    Eliminar todo
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}