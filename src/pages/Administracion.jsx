import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit2, X, Check,
  Factory, AlertTriangle, Mail, Clock, RefreshCw,
  ChevronRight, ChevronDown, ArrowRight, Settings
} from "lucide-react";

const ease = [0.25, 0.1, 0.25, 1];

const SIGNAL_CFG = {
  green:  { label: "Verde",    color: "#34C759", bg: "rgba(52,199,89,0.08)",  border: "rgba(52,199,89,0.25)" },
  yellow: { label: "Amarillo", color: "#FF9F0A", bg: "rgba(255,159,10,0.08)", border: "rgba(255,159,10,0.25)" },
  red:    { label: "Rojo",     color: "#FF3B30", bg: "rgba(255,59,48,0.08)",  border: "rgba(255,59,48,0.25)" },
};

// ── Primitives ─────────────────────────────────────────────────────────────

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#FAFAFA", fontSize: 14, color: "#1D1D1F", padding: "0 14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
    />
  );
}

function PrimaryBtn({ onClick, disabled, loading, children, small }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ height: small ? 34 : 40, padding: small ? "0 14px" : "0 18px", borderRadius: 10, background: (disabled || loading) ? "rgba(29,29,31,0.25)" : "#1D1D1F", color: "#FFFFFF", fontSize: small ? 12 : 13, fontWeight: 500, border: "none", cursor: (disabled || loading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "background 150ms ease", flexShrink: 0 }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.background = "#2D2D2F"; }}
      onMouseLeave={e => { if (!disabled && !loading) e.currentTarget.style.background = "#1D1D1F"; }}
    >
      {loading ? <RefreshCw size={12} style={{ animation: "spin 0.7s linear infinite" }} /> : children}
    </button>
  );
}

function GhostBtn({ onClick, icon: Icon, color = "#FF3B30", size = 14 }) {
  return (
    <button onClick={onClick}
      style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 120ms ease" }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}15`}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <Icon size={size} style={{ color }} />
    </button>
  );
}

function Drawer({ open, onClose, title, subtitle, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)", zIndex: 40 }} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", background: "#FFFFFF", zIndex: 50, boxShadow: "-20px 0 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>{title}</h3>
                  {subtitle && <p style={{ fontSize: 13, color: "#6E6E73", marginTop: 4 }}>{subtitle}</p>}
                </div>
                <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9999, border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={14} style={{ color: "#6E6E73" }} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Route diagram chip ─────────────────────────────────────────────────────

function RouteFlow({ route }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: "#0071E3", background: "rgba(0,113,227,0.08)", border: "1px solid rgba(0,113,227,0.15)", borderRadius: 7, padding: "3px 9px" }}>
        {route.producer_name || route.producer_id || "—"}
      </span>
      <ArrowRight size={12} style={{ color: "#AEAEB2", flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: "#6366F1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 7, padding: "3px 9px" }}>
        {route.kanban_name || route.kanban_id || "Kanban"}
      </span>
      <ArrowRight size={12} style={{ color: "#AEAEB2", flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {(route.consumers || []).map((c, i) => (
          <span key={i} style={{ fontSize: 12, fontWeight: 500, color: "#FF9F0A", background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.20)", borderRadius: 7, padding: "3px 9px" }}>
            {c.name || c.machine_id}
          </span>
        ))}
        {(!route.consumers || route.consumers.length === 0) && (
          <span style={{ fontSize: 12, color: "#AEAEB2" }}>Sin consumidores</span>
        )}
      </div>
    </div>
  );
}

// ── Semaphore display ──────────────────────────────────────────────────────

function SemaphoreBar({ escalations }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {["green", "yellow", "red"].map(level => {
        const sig = SIGNAL_CFG[level];
        const match = escalations.find(e => e.escalation_level === level);
        return (
          <div key={level} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 9999, background: match ? sig.bg : "rgba(0,0,0,0.03)", border: `1px solid ${match ? sig.border : "rgba(0,0,0,0.06)"}` }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: match ? sig.color : "#D1D1D6", boxShadow: match ? `0 0 6px ${sig.color}` : "none" }} />
            <span style={{ fontSize: 11, color: match ? sig.color : "#AEAEB2", fontWeight: 500, whiteSpace: "nowrap" }}>
              {match ? `${match.trigger_minutes} min` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Route Card (expandable) ────────────────────────────────────────────────

function RouteCard({ route, escalations, onEditRoute, onDeleteRoute, onAddEscalation, onEditEscalation, onDeleteEscalation }) {
  const [expanded, setExpanded] = useState(false);
  const routeEscalations = escalations
    .filter(e => e.route_id === route.id)
    .sort((a, b) => (a.trigger_minutes || 0) - (b.trigger_minutes || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease }}
      style={{ border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 14, overflow: "hidden", background: "#FFFFFF" }}>

      {/* Header row */}
      <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,113,227,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Factory size={16} style={{ color: "#0071E3" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 6px" }}>{route.name}</p>
          <RouteFlow route={route} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <SemaphoreBar escalations={routeEscalations} />
          <div style={{ display: "flex", gap: 0 }}>
            <GhostBtn onClick={e => { e.stopPropagation(); onEditRoute(route); }} icon={Edit2} color="#0071E3" />
            <GhostBtn onClick={e => { e.stopPropagation(); onDeleteRoute(route.id); }} icon={Trash2} />
          </div>
          {expanded ? <ChevronDown size={14} style={{ color: "#AEAEB2" }} /> : <ChevronRight size={14} style={{ color: "#AEAEB2" }} />}
        </div>
      </div>

      {/* Expanded: escalations */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }} style={{ overflow: "hidden" }}>
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", margin: 0 }}>
                  Escalamientos de esta ruta
                </p>
                <PrimaryBtn small onClick={() => onAddEscalation(route)}>
                  <Plus size={11} /> Agregar nivel
                </PrimaryBtn>
              </div>

              {routeEscalations.length === 0 ? (
                <div style={{ border: "1px dashed rgba(0,0,0,0.08)", borderRadius: 10, padding: "20px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#AEAEB2", margin: 0 }}>Sin escalamientos. Agrega verde, amarillo y rojo.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {routeEscalations.map(esc => {
                    const sig = SIGNAL_CFG[esc.escalation_level] || SIGNAL_CFG.yellow;
                    return (
                      <div key={esc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: sig.bg, border: `1px solid ${sig.border}`, borderLeft: `3px solid ${sig.color}`, borderRadius: "0 10px 10px 0" }}>
                        <div style={{ width: 14, height: 14, borderRadius: 9999, background: sig.color, boxShadow: `0 0 8px ${sig.color}88`, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#1D1D1F" }}>{esc.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: sig.color }}>{sig.label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                            <Clock size={10} style={{ color: "#86868B" }} />
                            <span style={{ fontSize: 11, color: "#86868B", fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>
                              Se activa a los {esc.trigger_minutes} min
                            </span>
                          </div>
                          {esc.escalation_description && <p style={{ fontSize: 11, color: "#6E6E73", margin: "3px 0 0" }}>{esc.escalation_description}</p>}
                        </div>
                        <div style={{ display: "flex", gap: 0 }}>
                          <GhostBtn onClick={() => onEditEscalation(esc, route)} icon={Edit2} color="#0071E3" size={13} />
                          <GhostBtn onClick={() => onDeleteEscalation(esc.id)} icon={Trash2} size={13} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Route Form (inside Drawer) ─────────────────────────────────────────────

function RouteForm({ initial, onSave, saving }) {
  const empty = { name: "", producer_name: "", producer_id: "", kanban_name: "Zona Kanban", kanban_id: "kanban", consumers: [], material: "Carrito Misceláneo: LIQUID JACKET" };
  const [form, setForm] = useState(initial || empty);
  const [consumerInput, setConsumerInput] = useState({ name: "", machine_id: "" });

  const addConsumer = () => {
    if (!consumerInput.name || !consumerInput.machine_id) return;
    setForm(f => ({ ...f, consumers: [...(f.consumers || []), { ...consumerInput }] }));
    setConsumerInput({ name: "", machine_id: "" });
  };

  const removeConsumer = (idx) => setForm(f => ({ ...f, consumers: f.consumers.filter((_, i) => i !== idx) }));

  const isValid = form.name && form.producer_name && form.producer_id && form.kanban_id && (form.consumers || []).length > 0;

  return (
    <div>
      <FieldRow label="Nombre de la ruta">
        <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ej. Ruta Principal Liquid Jacket" />
      </FieldRow>

      {/* Producer */}
      <div style={{ marginBottom: 14, padding: "14px 16px", background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.12)", borderRadius: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0071E3", marginBottom: 10 }}>Productor</p>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "#6E6E73", marginBottom: 4 }}>Nombre</p>
            <Input value={form.producer_name} onChange={v => setForm(f => ({ ...f, producer_name: v }))} placeholder="Ej. Máquina 12 Línea C" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "#6E6E73", marginBottom: 4 }}>ID / Zona</p>
            <Input value={form.producer_id} onChange={v => setForm(f => ({ ...f, producer_id: v }))} placeholder="sopladora12c" />
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div style={{ marginBottom: 14, padding: "14px 16px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6366F1", marginBottom: 10 }}>Kanban / Buffer</p>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "#6E6E73", marginBottom: 4 }}>Nombre</p>
            <Input value={form.kanban_name} onChange={v => setForm(f => ({ ...f, kanban_name: v }))} placeholder="Zona Kanban" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "#6E6E73", marginBottom: 4 }}>ID / Zona</p>
            <Input value={form.kanban_id} onChange={v => setForm(f => ({ ...f, kanban_id: v }))} placeholder="kanban" />
          </div>
        </div>
      </div>

      {/* Consumers */}
      <div style={{ marginBottom: 14, padding: "14px 16px", background: "rgba(255,159,10,0.04)", border: "1px solid rgba(255,159,10,0.15)", borderRadius: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FF9F0A", marginBottom: 10 }}>Consumidores</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "#6E6E73", marginBottom: 4 }}>Nombre</p>
            <Input value={consumerInput.name} onChange={v => setConsumerInput(c => ({ ...c, name: v }))} placeholder="Ej. Máquina 3" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "#6E6E73", marginBottom: 4 }}>ID / Zona</p>
            <Input value={consumerInput.machine_id} onChange={v => setConsumerInput(c => ({ ...c, machine_id: v }))} placeholder="sopladora3" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={addConsumer} disabled={!consumerInput.name || !consumerInput.machine_id}
              style={{ height: 40, width: 40, borderRadius: 10, background: "rgba(255,159,10,0.12)", border: "1px solid rgba(255,159,10,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Plus size={14} style={{ color: "#FF9F0A" }} />
            </button>
          </div>
        </div>
        {(form.consumers || []).length === 0 ? (
          <p style={{ fontSize: 12, color: "#AEAEB2", margin: 0 }}>Agrega al menos un consumidor.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {form.consumers.map((c, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,159,10,0.06)", border: "1px solid rgba(255,159,10,0.18)", borderRadius: 8, padding: "8px 12px" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1D1D1F" }}>{c.name}</span>
                  <span style={{ fontSize: 11, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#86868B", marginLeft: 8 }}>{c.machine_id}</span>
                </div>
                <button onClick={() => removeConsumer(idx)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                  <X size={13} style={{ color: "#86868B" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FieldRow label="Material">
        <Input value={form.material} onChange={v => setForm(f => ({ ...f, material: v }))} placeholder="Carrito Misceláneo: LIQUID JACKET" />
      </FieldRow>

      {!isValid && (
        <p style={{ fontSize: 12, color: "#FF9F0A", marginBottom: 12 }}>
          Completa productor, kanban y al menos un consumidor.
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryBtn onClick={() => onSave(form)} disabled={!isValid} loading={saving}>
          <Check size={13} /> Guardar ruta
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ── Escalation Form (inside Drawer) ───────────────────────────────────────

function EscalationForm({ initial, routeName, onSave, saving }) {
  const [form, setForm] = useState(initial || { name: "", escalation_level: "yellow", trigger_minutes: 15, escalation_description: "" });

  return (
    <div>
      <FieldRow label="Nombre del nivel">
        <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ej. Alerta inicial, Crítico" />
      </FieldRow>
      <FieldRow label="Nivel de señal">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {["green", "yellow", "red"].map(level => {
            const sig = SIGNAL_CFG[level];
            const active = form.escalation_level === level;
            return (
              <button key={level} onClick={() => setForm(f => ({ ...f, escalation_level: level }))}
                style={{ height: 52, borderRadius: 10, border: `2px solid ${active ? sig.color : "rgba(0,0,0,0.10)"}`, background: active ? sig.bg : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 120ms ease" }}>
                <div style={{ width: 16, height: 16, borderRadius: 9999, background: sig.color, boxShadow: active ? `0 0 10px ${sig.color}` : "none" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? sig.color : "#86868B" }}>{sig.label}</span>
              </button>
            );
          })}
        </div>
      </FieldRow>
      <FieldRow label="Tiempo de activación (minutos)">
        <Input type="number" value={form.trigger_minutes} onChange={v => setForm(f => ({ ...f, trigger_minutes: v }))} placeholder="15" />
      </FieldRow>
      <FieldRow label="Descripción (opcional)">
        <textarea value={form.escalation_description} onChange={e => setForm(f => ({ ...f, escalation_description: e.target.value }))}
          placeholder="Qué acción se toma en este nivel..."
          rows={3}
          style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#FAFAFA", fontSize: 14, color: "#1D1D1F", padding: "10px 14px", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
      </FieldRow>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryBtn onClick={() => onSave(form)} disabled={!form.name || !form.trigger_minutes} loading={saving}>
          <Check size={13} /> Guardar
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ── Notifications Section ──────────────────────────────────────────────────

function NotificationsSection({ configs, onSave, onDelete, saving }) {
  const notifications = configs.filter(c => c.config_type === "notification");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", notification_level: "all", notification_emails: [], is_active: true });
  const [emailInput, setEmailInput] = useState("");

  const openNew = () => { setEditing(null); setForm({ name: "", notification_level: "all", notification_emails: [], is_active: true }); setEmailInput(""); setDrawerOpen(true); };
  const openEdit = (n) => { setEditing(n); setForm({ name: n.name, notification_level: n.notification_level || "all", notification_emails: n.notification_emails || [], is_active: n.is_active !== false }); setEmailInput(""); setDrawerOpen(true); };
  const addEmail = () => { const e = emailInput.trim(); if (!e || !e.includes("@")) return; setForm(f => ({ ...f, notification_emails: [...(f.notification_emails || []), e] })); setEmailInput(""); };
  const removeEmail = (idx) => setForm(f => ({ ...f, notification_emails: f.notification_emails.filter((_, i) => i !== idx) }));
  const handleSave = () => { onSave({ ...form, config_type: "notification" }, editing?.id); setDrawerOpen(false); };
  const levelLabel = { green: "Verde", yellow: "Amarillo", red: "Rojo", all: "Todos" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 4 }}>Alertas por Correo</p>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>Notificaciones</h2>
        </div>
        <PrimaryBtn onClick={openNew}><Plus size={13} /> Agregar grupo</PrimaryBtn>
      </div>

      {notifications.length === 0 ? (
        <div style={{ border: "1px dashed rgba(0,0,0,0.10)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#AEAEB2", margin: 0 }}>Sin grupos de notificación definidos.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n, i) => {
            const level = n.notification_level || "all";
            const sig = level !== "all" ? SIGNAL_CFG[level] : null;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.18, ease }}
                style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderLeft: `3px solid ${sig ? sig.color : "#86868B"}`, borderRadius: "0 12px 12px 0", padding: "14px 16px", background: "#FFFFFF", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <Mail size={16} style={{ color: sig ? sig.color : "#86868B" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>{n.name}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: sig ? sig.color : "#86868B", background: sig ? sig.bg : "rgba(0,0,0,0.04)", borderRadius: 6, padding: "2px 7px" }}>{levelLabel[level] || "—"}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(n.notification_emails || []).map(email => (
                      <span key={email} style={{ fontSize: 11, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3", background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.15)", borderRadius: 6, padding: "2px 8px" }}>{email}</span>
                    ))}
                    {(!n.notification_emails || n.notification_emails.length === 0) && <span style={{ fontSize: 12, color: "#AEAEB2" }}>Sin correos</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
                  <GhostBtn onClick={() => openEdit(n)} icon={Edit2} color="#0071E3" />
                  <GhostBtn onClick={() => onDelete(n.id)} icon={Trash2} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Editar grupo" : "Nuevo grupo de notificación"}>
        <FieldRow label="Nombre del grupo">
          <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ej. Supervisores, Gerencia" />
        </FieldRow>
        <FieldRow label="Nivel que activa la notificación">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ value: "all", label: "Todos" }, ...Object.entries(SIGNAL_CFG).map(([k, v]) => ({ value: k, label: v.label }))].map(opt => {
              const active = form.notification_level === opt.value;
              const sig = SIGNAL_CFG[opt.value];
              return (
                <button key={opt.value} onClick={() => setForm(f => ({ ...f, notification_level: opt.value }))}
                  style={{ height: 40, borderRadius: 10, border: `2px solid ${active ? (sig?.color || "#1D1D1F") : "rgba(0,0,0,0.10)"}`, background: active ? (sig?.bg || "rgba(0,0,0,0.04)") : "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: active ? (sig?.color || "#1D1D1F") : "#6E6E73", transition: "all 120ms ease" }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FieldRow>
        <FieldRow label="Correos">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addEmail()} placeholder="correo@empresa.com"
              style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#FAFAFA", fontSize: 14, color: "#1D1D1F", padding: "0 14px", outline: "none", fontFamily: "inherit" }} />
            <button onClick={addEmail} style={{ height: 40, padding: "0 14px", borderRadius: 10, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)", cursor: "pointer" }}>
              <Plus size={14} style={{ color: "#1D1D1F" }} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(form.notification_emails || []).map((email, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.15)", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 13, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3" }}>{email}</span>
                <button onClick={() => removeEmail(idx)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={13} style={{ color: "#86868B" }} /></button>
              </div>
            ))}
          </div>
        </FieldRow>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <PrimaryBtn onClick={handleSave} disabled={!form.name} loading={saving}><Check size={13} /> Guardar</PrimaryBtn>
        </div>
      </Drawer>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "escalations",   label: "Rutas y Escalamientos", icon: AlertTriangle },
  { id: "notifications", label: "Notificaciones",         icon: Mail },
];

export default function Administracion() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("escalations");
  const [saving, setSaving] = useState(false);

  // Drawer state for routes
  const [routeDrawer, setRouteDrawer] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // Drawer state for escalations
  const [escDrawer, setEscDrawer] = useState(false);
  const [editingEsc, setEditingEsc] = useState(null);
  const [escTargetRoute, setEscTargetRoute] = useState(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["adminConfig"],
    queryFn: () => base44.entities.AdminConfig.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AdminConfig.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminConfig"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdminConfig.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminConfig"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminConfig"] }),
  });

  const doSave = async (data, id) => {
    setSaving(true);
    if (id) await updateMutation.mutateAsync({ id, data });
    else await createMutation.mutateAsync(data);
    setSaving(false);
  };

  const routes = configs.filter(c => c.config_type === "route");
  const escalations = configs.filter(c => c.config_type === "escalation");

  const handleSaveRoute = async (form) => {
    await doSave({ ...form, config_type: "route", is_active: true }, editingRoute?.id);
    setRouteDrawer(false);
    setEditingRoute(null);
  };

  const handleSaveEscalation = async (form) => {
    await doSave({ ...form, trigger_minutes: Number(form.trigger_minutes), config_type: "escalation", route_id: escTargetRoute?.id, is_active: true }, editingEsc?.id);
    setEscDrawer(false);
    setEditingEsc(null);
    setEscTargetRoute(null);
  };

  const handleSaveNotification = async (data, id) => doSave(data, id);

  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ background: "#FFFFFF" }}>

      <div style={{ padding: "40px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 8 }}>Sistema de Control</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F", margin: 0 }}>Administración</h1>
        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 6 }}>Configura rutas, escalamientos y notificaciones del sistema.</p>
      </div>

      {/* Tab bar */}
      <div style={{ padding: "24px 40px 0" }}>
        <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.04)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: active ? "#FFFFFF" : "transparent", fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "#1D1D1F" : "#6E6E73", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "all 120ms ease" }}>
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "28px 40px 0" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <RefreshCw size={20} style={{ color: "#AEAEB2", animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease }}>

              {activeTab === "escalations" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 4 }}>Productor → Kanban → Consumidores</p>
                      <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>Rutas y Escalamientos</h2>
                    </div>
                    <PrimaryBtn onClick={() => { setEditingRoute(null); setRouteDrawer(true); }}>
                      <Plus size={13} /> Nueva ruta
                    </PrimaryBtn>
                  </div>

                  {routes.length === 0 ? (
                    <div style={{ border: "1px dashed rgba(0,0,0,0.10)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                      <Factory size={28} style={{ color: "#D1D1D6", marginBottom: 12 }} />
                      <p style={{ fontSize: 14, color: "#AEAEB2", margin: 0 }}>Sin rutas. Crea la primera para configurar sus escalamientos.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {routes.map(route => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          escalations={escalations}
                          onEditRoute={(r) => { setEditingRoute(r); setRouteDrawer(true); }}
                          onDeleteRoute={(id) => deleteMutation.mutate(id)}
                          onAddEscalation={(r) => { setEscTargetRoute(r); setEditingEsc(null); setEscDrawer(true); }}
                          onEditEscalation={(esc, r) => { setEditingEsc(esc); setEscTargetRoute(r); setEscDrawer(true); }}
                          onDeleteEscalation={(id) => deleteMutation.mutate(id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notifications" && (
                <NotificationsSection configs={configs} onSave={handleSaveNotification} onDelete={(id) => deleteMutation.mutate(id)} saving={saving} />
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Route Drawer */}
      <Drawer open={routeDrawer} onClose={() => { setRouteDrawer(false); setEditingRoute(null); }}
        title={editingRoute ? "Editar ruta" : "Nueva ruta"}
        subtitle="Requiere un productor, un buffer kanban y al menos un consumidor.">
        <RouteForm initial={editingRoute} onSave={handleSaveRoute} saving={saving} />
      </Drawer>

      {/* Escalation Drawer */}
      <Drawer open={escDrawer} onClose={() => { setEscDrawer(false); setEditingEsc(null); setEscTargetRoute(null); }}
        title={editingEsc ? "Editar escalamiento" : "Nuevo escalamiento"}
        subtitle={escTargetRoute ? `Ruta: ${escTargetRoute.name}` : ""}>
        {escDrawer && (
          <EscalationForm initial={editingEsc} routeName={escTargetRoute?.name} onSave={handleSaveEscalation} saving={saving} />
        )}
      </Drawer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}