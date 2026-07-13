import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit2, X, Check, ChevronRight,
  Factory, AlertTriangle, Mail, Clock, RefreshCw
} from "lucide-react";

const ease = [0.25, 0.1, 0.25, 1];

const SIGNAL_CFG = {
  green:  { label: "Verde",    color: "#34C759", bg: "rgba(52,199,89,0.08)",  border: "rgba(52,199,89,0.25)" },
  yellow: { label: "Amarillo", color: "#FF9F0A", bg: "rgba(255,159,10,0.08)", border: "rgba(255,159,10,0.25)" },
  red:    { label: "Rojo",     color: "#FF3B30", bg: "rgba(255,59,48,0.08)",  border: "rgba(255,59,48,0.25)" },
};

// ── Small reusable components ──────────────────────────────────────────────

function SectionHeader({ label, title, action }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>{title}</h2>
        {action}
      </div>
    </div>
  );
}

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
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", height: 40, borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)", background: "#FAFAFA",
        fontSize: 14, color: "#1D1D1F", padding: "0 14px",
        outline: "none", boxSizing: "border-box",
        fontFamily: "inherit",
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", height: 40, borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)", background: "#FAFAFA",
        fontSize: 14, color: "#1D1D1F", padding: "0 14px",
        outline: "none", boxSizing: "border-box",
        fontFamily: "inherit", cursor: "pointer",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function PrimaryBtn({ onClick, disabled, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        height: 40, padding: "0 18px", borderRadius: 10,
        background: (disabled || loading) ? "rgba(29,29,31,0.25)" : "#1D1D1F",
        color: "#FFFFFF", fontSize: 13, fontWeight: 500,
        border: "none", cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
        transition: "background 150ms ease", flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.background = "#2D2D2F"; }}
      onMouseLeave={e => { if (!disabled && !loading) e.currentTarget.style.background = "#1D1D1F"; }}
    >
      {loading ? <RefreshCw size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : children}
    </button>
  );
}

function GhostBtn({ onClick, icon: Icon, color = "#FF3B30" }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32, borderRadius: 8, border: "none",
        background: "transparent", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center",
        transition: "background 120ms ease",
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}15`}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <Icon size={14} style={{ color }} />
    </button>
  );
}

// ── Slide-in Drawer ────────────────────────────────────────────────────────

function Drawer({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)", zIndex: 40 }}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 100vw)",
              background: "#FFFFFF", zIndex: 50,
              boxShadow: "-20px 0 60px rgba(0,0,0,0.15)",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>{title}</h3>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9999, border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} style={{ color: "#6E6E73" }} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Section: Rutas (Equipos) ───────────────────────────────────────────────

function RoutesSection({ configs, onSave, onDelete, saving }) {
  const routes = configs.filter(c => c.config_type === "route");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", role: "consumer", machine_id: "", material: "Carrito Misceláneo: LIQUID JACKET", linked_producer: "", is_active: true });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", role: "consumer", machine_id: "", material: "Carrito Misceláneo: LIQUID JACKET", linked_producer: "", is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name, role: r.role || "consumer", machine_id: r.machine_id || "", material: r.material || "", linked_producer: r.linked_producer || "", is_active: r.is_active !== false });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    onSave({ ...form, config_type: "route" }, editing?.id);
    setDrawerOpen(false);
  };

  const producers = routes.filter(r => r.role === "producer");

  return (
    <div>
      <SectionHeader
        label="Configuración"
        title="Rutas de Equipos"
        action={
          <PrimaryBtn onClick={openNew}>
            <Plus size={13} /> Agregar equipo
          </PrimaryBtn>
        }
      />

      {routes.length === 0 ? (
        <div style={{ border: "1px dashed rgba(0,0,0,0.10)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#AEAEB2", margin: 0 }}>Sin rutas configuradas. Agrega un equipo productor o consumidor.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {routes.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease }}
              style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderLeft: `3px solid ${r.role === "producer" ? "#0071E3" : "#6366F1"}`, borderRadius: "0 12px 12px 0", padding: "14px 16px", background: "#FFFFFF", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: r.role === "producer" ? "rgba(0,113,227,0.08)" : "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Factory size={16} style={{ color: r.role === "producer" ? "#0071E3" : "#6366F1" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>{r.name}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: r.role === "producer" ? "#0071E3" : "#6366F1", background: r.role === "producer" ? "rgba(0,113,227,0.08)" : "rgba(99,102,241,0.08)", borderRadius: 6, padding: "2px 7px" }}>
                    {r.role === "producer" ? "Productor" : "Consumidor"}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#86868B", margin: "3px 0 0", fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>
                  {r.machine_id} {r.linked_producer ? `← ${r.linked_producer}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                <GhostBtn onClick={() => openEdit(r)} icon={Edit2} color="#0071E3" />
                <GhostBtn onClick={() => onDelete(r.id)} icon={Trash2} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Editar equipo" : "Nuevo equipo"}>
        <FieldRow label="Nombre">
          <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ej. Máquina 5" />
        </FieldRow>
        <FieldRow label="Rol">
          <Select value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={[
            { value: "producer", label: "Productor" },
            { value: "consumer", label: "Consumidor" },
          ]} />
        </FieldRow>
        <FieldRow label="ID de Máquina / Zona">
          <Input value={form.machine_id} onChange={v => setForm(f => ({ ...f, machine_id: v }))} placeholder="Ej. sopladora5, kanban" />
        </FieldRow>
        <FieldRow label="Material">
          <Input value={form.material} onChange={v => setForm(f => ({ ...f, material: v }))} placeholder="Ej. Carrito Misceláneo: LIQUID JACKET" />
        </FieldRow>
        {form.role === "consumer" && (
          <FieldRow label="Productor vinculado (ID)">
            <Select value={form.linked_producer} onChange={v => setForm(f => ({ ...f, linked_producer: v }))}
              options={[{ value: "", label: "— Seleccionar —" }, ...producers.map(p => ({ value: p.machine_id || p.name, label: p.name }))]}
            />
          </FieldRow>
        )}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <PrimaryBtn onClick={handleSave} disabled={!form.name || !form.machine_id} loading={saving}>
            <Check size={13} /> Guardar
          </PrimaryBtn>
        </div>
      </Drawer>
    </div>
  );
}

// ── Section: Escalamientos ─────────────────────────────────────────────────

function EscalationsSection({ configs, onSave, onDelete, saving }) {
  const escalations = configs.filter(c => c.config_type === "escalation")
    .sort((a, b) => (a.trigger_minutes || 0) - (b.trigger_minutes || 0));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", escalation_level: "yellow", trigger_minutes: 15, escalation_description: "", is_active: true });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", escalation_level: "yellow", trigger_minutes: 15, escalation_description: "", is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ name: e.name, escalation_level: e.escalation_level || "yellow", trigger_minutes: e.trigger_minutes || 15, escalation_description: e.escalation_description || "", is_active: e.is_active !== false });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    onSave({ ...form, trigger_minutes: Number(form.trigger_minutes), config_type: "escalation" }, editing?.id);
    setDrawerOpen(false);
  };

  return (
    <div>
      <SectionHeader
        label="Semáforo de Alertas"
        title="Escalamientos"
        action={
          <PrimaryBtn onClick={openNew}>
            <Plus size={13} /> Agregar nivel
          </PrimaryBtn>
        }
      />

      {escalations.length === 0 ? (
        <div style={{ border: "1px dashed rgba(0,0,0,0.10)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#AEAEB2", margin: 0 }}>Sin escalamientos definidos.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {escalations.map((e, i) => {
            const sig = SIGNAL_CFG[e.escalation_level] || SIGNAL_CFG.yellow;
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.18, ease }}
                style={{ border: `1px solid ${sig.border}`, borderLeft: `3px solid ${sig.color}`, borderRadius: "0 12px 12px 0", padding: "14px 16px", background: sig.bg, display: "flex", alignItems: "center", gap: 12 }}>
                {/* Traffic light dot */}
                <div style={{ width: 18, height: 18, borderRadius: 9999, background: sig.color, boxShadow: `0 0 10px ${sig.color}88`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>{e.name}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: sig.color }}>
                      {sig.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <Clock size={11} style={{ color: "#86868B" }} />
                    <span style={{ fontSize: 12, color: "#86868B", fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>
                      Se activa a los {e.trigger_minutes} min
                    </span>
                  </div>
                  {e.escalation_description && (
                    <p style={{ fontSize: 12, color: "#6E6E73", margin: "4px 0 0" }}>{e.escalation_description}</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <GhostBtn onClick={() => openEdit(e)} icon={Edit2} color="#0071E3" />
                  <GhostBtn onClick={() => onDelete(e.id)} icon={Trash2} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Visual semaphore */}
      {escalations.length > 0 && (
        <div style={{ marginTop: 20, padding: "16px 20px", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, background: "#F5F5F7", display: "flex", alignItems: "center", gap: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", margin: 0, flexShrink: 0 }}>Semáforo</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, overflowX: "auto" }}>
            {["green", "yellow", "red"].map((level) => {
              const sig = SIGNAL_CFG[level];
              const match = escalations.filter(e => e.escalation_level === level);
              return (
                <div key={level} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9999, background: match.length ? sig.bg : "rgba(0,0,0,0.03)", border: `1px solid ${match.length ? sig.border : "rgba(0,0,0,0.06)"}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: 9999, background: match.length ? sig.color : "#D1D1D6" }} />
                  <span style={{ fontSize: 12, color: match.length ? sig.color : "#AEAEB2", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {sig.label} · {match.length > 0 ? `${match[0].trigger_minutes} min` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Editar escalamiento" : "Nuevo escalamiento"}>
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
                  style={{ height: 44, borderRadius: 10, border: `2px solid ${active ? sig.color : "rgba(0,0,0,0.10)"}`, background: active ? sig.bg : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 120ms ease" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 9999, background: sig.color, boxShadow: active ? `0 0 8px ${sig.color}` : "none" }} />
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
          <textarea
            value={form.escalation_description}
            onChange={e => setForm(f => ({ ...f, escalation_description: e.target.value }))}
            placeholder="Qué acción se toma en este nivel..."
            rows={3}
            style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#FAFAFA", fontSize: 14, color: "#1D1D1F", padding: "10px 14px", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </FieldRow>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <PrimaryBtn onClick={handleSave} disabled={!form.name || !form.trigger_minutes} loading={saving}>
            <Check size={13} /> Guardar
          </PrimaryBtn>
        </div>
      </Drawer>
    </div>
  );
}

// ── Section: Notificaciones ────────────────────────────────────────────────

function NotificationsSection({ configs, onSave, onDelete, saving }) {
  const notifications = configs.filter(c => c.config_type === "notification");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", notification_level: "all", notification_emails: [], is_active: true });
  const [emailInput, setEmailInput] = useState("");

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", notification_level: "all", notification_emails: [], is_active: true });
    setEmailInput("");
    setDrawerOpen(true);
  };

  const openEdit = (n) => {
    setEditing(n);
    setForm({ name: n.name, notification_level: n.notification_level || "all", notification_emails: n.notification_emails || [], is_active: n.is_active !== false });
    setEmailInput("");
    setDrawerOpen(true);
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) return;
    setForm(f => ({ ...f, notification_emails: [...(f.notification_emails || []), email] }));
    setEmailInput("");
  };

  const removeEmail = (idx) => {
    setForm(f => ({ ...f, notification_emails: f.notification_emails.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    onSave({ ...form, config_type: "notification" }, editing?.id);
    setDrawerOpen(false);
  };

  const levelLabel = { green: "Verde", yellow: "Amarillo", red: "Rojo", all: "Todos los niveles" };

  return (
    <div>
      <SectionHeader
        label="Alertas por Correo"
        title="Notificaciones"
        action={
          <PrimaryBtn onClick={openNew}>
            <Plus size={13} /> Agregar grupo
          </PrimaryBtn>
        }
      />

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
              <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.18, ease }}
                style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderLeft: `3px solid ${sig ? sig.color : "#86868B"}`, borderRadius: "0 12px 12px 0", padding: "14px 16px", background: "#FFFFFF", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <Mail size={16} style={{ color: sig ? sig.color : "#86868B" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>{n.name}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: sig ? sig.color : "#86868B", background: sig ? sig.bg : "rgba(0,0,0,0.04)", borderRadius: 6, padding: "2px 7px" }}>
                      {levelLabel[level] || "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(n.notification_emails || []).map(email => (
                      <span key={email} style={{ fontSize: 11, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3", background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.15)", borderRadius: 6, padding: "2px 8px" }}>{email}</span>
                    ))}
                    {(!n.notification_emails || n.notification_emails.length === 0) && (
                      <span style={{ fontSize: 12, color: "#AEAEB2" }}>Sin correos</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
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
        <FieldRow label="Nivel de alerta que activa la notificación">
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
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addEmail()}
              placeholder="correo@empresa.com"
              style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#FAFAFA", fontSize: 14, color: "#1D1D1F", padding: "0 14px", outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={addEmail} style={{ height: 40, padding: "0 14px", borderRadius: 10, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)", cursor: "pointer", fontSize: 13, color: "#1D1D1F" }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(form.notification_emails || []).map((email, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.15)", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 13, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3" }}>{email}</span>
                <button onClick={() => removeEmail(idx)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                  <X size={13} style={{ color: "#86868B" }} />
                </button>
              </div>
            ))}
          </div>
        </FieldRow>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <PrimaryBtn onClick={handleSave} disabled={!form.name} loading={saving}>
            <Check size={13} /> Guardar
          </PrimaryBtn>
        </div>
      </Drawer>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "routes",        label: "Equipos",          icon: Factory },
  { id: "escalations",   label: "Escalamientos",    icon: AlertTriangle },
  { id: "notifications", label: "Notificaciones",   icon: Mail },
];

export default function Administracion() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("routes");
  const [saving, setSaving] = useState(false);

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

  const handleSave = async (data, id) => {
    setSaving(true);
    if (id) await updateMutation.mutateAsync({ id, data });
    else await createMutation.mutateAsync(data);
    setSaving(false);
  };

  const handleDelete = (id) => deleteMutation.mutate(id);

  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ background: "#FFFFFF" }}>

      {/* Header */}
      <div style={{ padding: "40px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 8 }}>
          Sistema de Control
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F", margin: 0 }}>
          Administración
        </h1>
        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 6 }}>
          Configura rutas, escalamientos y notificaciones del sistema.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ padding: "24px 40px 0" }}>
        <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.04)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  height: 36, padding: "0 16px", borderRadius: 9, border: "none",
                  background: active ? "#FFFFFF" : "transparent",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? "#1D1D1F" : "#6E6E73",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  transition: "all 120ms ease",
                }}>
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 40px 0" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <RefreshCw size={20} style={{ color: "#AEAEB2", animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease }}>
              {activeTab === "routes"        && <RoutesSection        configs={configs} onSave={handleSave} onDelete={handleDelete} saving={saving} />}
              {activeTab === "escalations"   && <EscalationsSection   configs={configs} onSave={handleSave} onDelete={handleDelete} saving={saving} />}
              {activeTab === "notifications" && <NotificationsSection configs={configs} onSave={handleSave} onDelete={handleDelete} saving={saving} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}