import { useMemo, useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, Clock, Bell, CheckCircle2, Send, RefreshCw, Plus, Minus } from "lucide-react";
import WaterJacketIcon from "@/components/WaterJacketIcon";
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px" }}>
            {trigger.part_number?.toLowerCase().includes("water jacket") && (
              <img
                src="https://media.base44.com/images/public/6a25d4acd913cf2dc74e56fc/2cee4b677_image.png"
                alt="Water Jacket"
                style={{ width: 28, height: "auto", objectFit: "contain", opacity: 0.85 }}
              />
            )}
            <p style={{ fontSize: 13, fontWeight: 500, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3", margin: 0 }}>
              {trigger.part_number}
            </p>
          </div>
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
      <img
        src="https://media.base44.com/images/public/6a25d4acd913cf2dc74e56fc/2cee4b677_image.png"
        alt="Water Jacket"
        style={{ width: "70%", height: "auto", objectFit: "contain", opacity: filled ? 0.9 : 0.15, filter: filled ? "none" : "grayscale(1)" }}
      />
      {filled && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: `${color}99` }}>WJ</span>}
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

      {/* ── New Trigger Alert Modal ── INMERSIVO */}
      <AnimatePresence>
        {newTriggerAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.90, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.90, y: 32 }}
              transition={{ duration: 0.30, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: 440,
                borderRadius: 20,
                overflow: "hidden",
                background: "linear-gradient(145deg, #c0392b 0%, #922b21 40%, #7b241c 100%)",
                boxShadow: "0 0 0 1.5px rgba(255,80,60,0.55), 0 0 40px rgba(255,59,48,0.40), 0 40px 80px rgba(0,0,0,0.50)",
                willChange: "transform, opacity",
                animation: "neonFlicker 4s infinite",
              }}
            >
              {/* Top accent bar */}
              <motion.div
                animate={{ opacity: [1, 0.6, 1, 0.8, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                style={{ height: 3, background: "linear-gradient(90deg, #FF6B35, #FF3B30, #FF8C00)", willChange: "opacity" }}
              />

              <div style={{ padding: "36px 32px 28px" }}>
                {/* Icon row */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <motion.div
                      animate={{ scale: [1, 1.9, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      style={{ position: "absolute", inset: -8, borderRadius: 9999, background: "rgba(255,200,100,0.25)", willChange: "transform, opacity" }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                      style={{ position: "absolute", inset: -4, borderRadius: 9999, background: "rgba(255,200,100,0.20)", willChange: "transform, opacity" }}
                    />
                    <motion.div
                      animate={{ rotate: [0, -4, 4, -3, 3, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.30)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                    >
                      <AlertTriangle size={26} style={{ color: "#FFDD57" }} />
                    </motion.div>
                  </div>
                  <div>
                    <motion.p
                      animate={{ opacity: [1, 0.65, 1, 0.75, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,220,100,0.90)", margin: "0 0 4px", willChange: "opacity" }}
                    >
                      ALERTA CRÍTICA — ESCASEZ
                    </motion.p>
                    <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#FFFFFF", margin: 0, lineHeight: 1.15, textShadow: "0 0 20px rgba(255,200,80,0.35)" }}>
                      MATERIAL FALTANTE<br />EN PRODUCCIÓN
                    </h2>
                  </div>
                </div>

                {/* Data rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 28 }}>
                  {[
                    { label: "LÍNEA", value: newTriggerAlert.production_line },
                    { label: "MATERIAL", value: newTriggerAlert.part_number },
                    { label: "HORA", value: new Date(newTriggerAlert.triggered_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(0,0,0,0.18)", borderRadius: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", fontFamily: row.label === "HORA" ? "'SF Mono','JetBrains Mono',monospace" : "inherit" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  onClick={handleAlertOK}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", height: 52, borderRadius: 12,
                    background: "#FFFFFF", color: "#922B21",
                    fontSize: 14, fontWeight: 800, letterSpacing: "0.04em",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    textTransform: "uppercase",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                    transition: "background 150ms ease, transform 100ms ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F5F5F7"}
                  onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
                >
                  <CheckCircle2 size={17} />
                  ATENDER — TOMANDO ACCIÓN
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
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

      {/* ── Kanban Stock — LED Grid ── */}
      <div style={{ padding: "40px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>
            Zona Kanban — Stock de Carritos
          </p>
          <motion.div
            animate={isLow ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: `${stockColor}12`, border: `1px solid ${stockColor}35`, borderRadius: 9999, padding: "5px 12px" }}
          >
            <div style={{ width: 7, height: 7, borderRadius: 9999, background: stockColor, boxShadow: `0 0 6px ${stockColor}` }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: stockColor, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {current === 0 ? "SIN STOCK" : isLow ? "STOCK BAJO" : "OPERACIONAL"}
            </span>
          </motion.div>
        </div>

        <div style={{
          borderRadius: 16,
          overflow: "hidden",
          background: "#0F1117",
          boxShadow: "0 8px 32px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.06)",
          border: `1px solid ${isLow ? "rgba(255,159,10,0.30)" : "rgba(255,255,255,0.06)"}`,
        }}>
          {/* Header inside dark card */}
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", margin: "0 0 4px" }}>STOCK EN TIEMPO REAL</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.80)", margin: 0 }}>Toca un slot para registrar entrega</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <motion.span
                key={current}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", color: stockColor, fontVariantNumeric: "tabular-nums", lineHeight: 1, display: "block", textShadow: `0 0 20px ${stockColor}60` }}
              >
                {current}
              </motion.span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums" }}>/ {max}</span>
            </div>
          </div>

          {/* LED Cart Grid */}
          <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: `repeat(${max}, 1fr)`, gap: 10 }}>
            {Array.from({ length: max }).map((_, i) => {
              const isFilled = i < current;
              const ledColor = isFilled ? stockColor : "rgba(255,255,255,0.06)";
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => isFilled && setShowDeliverConfirm(true)}
                  disabled={!isFilled}
                  whileHover={isFilled ? { scale: 1.08 } : {}}
                  whileTap={isFilled ? { scale: 0.93 } : {}}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 12,
                    border: isFilled ? `1px solid ${stockColor}50` : "1px solid rgba(255,255,255,0.08)",
                    background: isFilled ? `${stockColor}18` : "rgba(255,255,255,0.03)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    cursor: isFilled ? "pointer" : "default",
                    boxShadow: isFilled ? `0 0 16px ${stockColor}30, inset 0 1px 0 rgba(255,255,255,0.10)` : "none",
                    willChange: "transform",
                    transition: "box-shadow 200ms ease, border 200ms ease",
                  }}
                >
                  <img
                    src="https://media.base44.com/images/public/6a25d4acd913cf2dc74e56fc/2cee4b677_image.png"
                    alt="Water Jacket"
                    style={{
                      width: "70%", height: "auto", objectFit: "contain",
                      opacity: isFilled ? 1 : 0.15,
                      filter: isFilled ? `drop-shadow(0 0 5px ${stockColor}80)` : "grayscale(1)",
                      transition: "opacity 200ms ease, filter 200ms ease",
                    }}
                  />
                  {isFilled && (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
                      style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: `${stockColor}CC` }}
                    >
                      WJ
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Low stock warning banner inside dark card */}
          <AnimatePresence>
            {isLow && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ margin: "0 24px", marginTop: -4 }}
              >
                <motion.div
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ background: "rgba(255,159,10,0.12)", border: "1px solid rgba(255,159,10,0.30)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}
                >
                  <AlertTriangle size={14} style={{ color: "#FF9F0A", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FF9F0A", margin: 0 }}>
                      ZONA KANBAN REQUIERE REPOSICIÓN
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,159,10,0.70)", marginTop: 2 }}>
                      STOCK CRÍTICO: {current}/{max} — POR DEBAJO DEL PUNTO DE REORDEN
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <div style={{ padding: "0 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Nivel de stock</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: stockColor, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${pct * 100}%` }}
                transition={{ duration: 0.8, ease }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${stockColor}99, ${stockColor})`, borderRadius: 9999, boxShadow: `0 0 8px ${stockColor}60` }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.20)" }}>0</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Reorden: {reorder}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.20)" }}>{max}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowDeliverConfirm(true)}
              disabled={current === 0}
              style={{ flex: 1, height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 500, color: current === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.80)", cursor: current === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 150ms ease" }}
              onMouseEnter={e => { if (current > 0) e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >
              <Minus size={14} />
              Entrega manual
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: "#FFFFFF", fontSize: 13, fontWeight: 700, color: "#0F1117", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 150ms ease, opacity 150ms ease", letterSpacing: "0.02em" }}
              onMouseEnter={e => e.currentTarget.style.background = "#E8E8ED"}
              onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
            >
              <Plus size={14} />
              Solicitar a Sopladora 12
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes neonFlicker {
          0%, 100% { box-shadow: 0 0 0 1.5px rgba(255,80,60,0.55), 0 0 40px rgba(255,59,48,0.40), 0 40px 80px rgba(0,0,0,0.50); }
          25%       { box-shadow: 0 0 0 1.5px rgba(255,80,60,0.30), 0 0 20px rgba(255,59,48,0.20), 0 40px 80px rgba(0,0,0,0.50); }
          30%       { box-shadow: 0 0 0 1.5px rgba(255,80,60,0.60), 0 0 48px rgba(255,59,48,0.50), 0 40px 80px rgba(0,0,0,0.50); }
          75%       { box-shadow: 0 0 0 1.5px rgba(255,80,60,0.50), 0 0 36px rgba(255,59,48,0.35), 0 40px 80px rgba(0,0,0,0.50); }
          80%       { box-shadow: 0 0 0 1.5px rgba(255,80,60,0.25), 0 0 14px rgba(255,59,48,0.15), 0 40px 80px rgba(0,0,0,0.50); }
        }
      `}</style>
    </div>
  );
}