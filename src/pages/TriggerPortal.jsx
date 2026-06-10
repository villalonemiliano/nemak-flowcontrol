import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, CheckCircle2, Package, Activity } from "lucide-react";

const PRODUCTION_LINE = "Sopladora 3 Línea H2";
const PART_NUMBER = "Carrito Misceláneo: WATER JACKET";

const ease = [0.25, 0.1, 0.25, 1];

export default function TriggerPortal() {
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers"],
    queryFn: () => base44.entities.Trigger.list("-triggered_at", 10),
    refetchInterval: 6000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Trigger.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triggers"] });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    },
  });

  const handleTrigger = () => {
    createMutation.mutate({
      production_line: PRODUCTION_LINE,
      part_number: PART_NUMBER,
      criticality: "HIGH",
      status: "unassigned",
      triggered_at: new Date().toISOString(),
    });
  };

  const lastTrigger = triggers[0];
  const isBeingWorked = lastTrigger?.status === "in_progress";
  const isResolved = lastTrigger?.status === "resolved";

  const statusBg    = isResolved ? "rgba(52,199,89,0.08)"  : isBeingWorked ? "rgba(255,159,10,0.08)"  : "rgba(255,59,48,0.08)";
  const statusBord  = isResolved ? "rgba(52,199,89,0.20)"  : isBeingWorked ? "rgba(255,159,10,0.20)"  : "rgba(255,59,48,0.20)";
  const statusColor = isResolved ? "#34C759" : isBeingWorked ? "#FF9F0A" : "#FF3B30";
  const statusText  = isResolved ? "#1D5C2E" : isBeingWorked ? "#7A4700" : "#7A1010";

  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ background: "#FFFFFF" }}>

      {/* ── Header ── */}
      <div style={{ padding: "40px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 8 }}>
          Material Shortage
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F", margin: 0 }}>
          Alert Portal
        </h1>
        <p style={{ fontSize: 15, color: "#6E6E73", marginTop: 8 }}>
          Notifica al equipo de Supply Chain de una escasez activa.
        </p>
      </div>

      <div style={{ padding: "32px 40px 0" }}>

        {/* ── Status feedback from last trigger ── */}
        <AnimatePresence>
          {lastTrigger && !submitted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease }}
              style={{
                background: statusBg,
                border: `1px solid ${statusBord}`,
                borderLeft: `3px solid ${statusColor}`,
                borderRadius: "0 14px 14px 0",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {isResolved
                ? <CheckCircle2 size={16} style={{ color: statusColor, flexShrink: 0 }} />
                : isBeingWorked
                  ? <Activity size={16} style={{ color: statusColor, flexShrink: 0 }} />
                  : <AlertTriangle size={16} style={{ color: statusColor, flexShrink: 0 }} />
              }
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: statusText, margin: 0 }}>
                  {isResolved
                    ? "Alerta resuelta — gracias"
                    : isBeingWorked
                      ? "Supply Chain ya está atendiendo tu solicitud"
                      : "Alerta activa — en espera de atención"}
                </p>
                <p style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#86868B", marginTop: 2 }}>
                  {new Date(lastTrigger.triggered_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main card ── */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.24, ease }}
              style={{
                background: "rgba(52,199,89,0.08)",
                border: "1px solid rgba(52,199,89,0.20)",
                borderRadius: 14,
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 24 }}
                style={{ width: 56, height: 56, borderRadius: 9999, background: "rgba(52,199,89,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}
              >
                <CheckCircle2 size={24} style={{ color: "#34C759" }} />
              </motion.div>
              <h2 style={{ fontSize: 17, fontWeight: 500, color: "#1D1D1F", margin: "0 0 8px" }}>Alerta Activada</h2>
              <p style={{ fontSize: 15, color: "#6E6E73", maxWidth: 280, margin: "0 auto", lineHeight: 1.5 }}>
                El equipo de Supply Chain ha sido notificado.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease }}
            >
              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>

                {/* Production line */}
                <div style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "16px 20px", background: "#FFFFFF" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 6 }}>
                    Línea de Producción
                  </p>
                  <p style={{ fontSize: 15, color: "#1D1D1F", margin: 0 }}>{PRODUCTION_LINE}</p>
                </div>

                {/* Part number */}
                <div style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "16px 20px", background: "#FFFFFF", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={16} style={{ color: "#FF3B30" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 4 }}>
                      Material
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1D1D1F", margin: 0 }}>
                      {PART_NUMBER}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary CTA */}
              <motion.button
                onClick={handleTrigger}
                disabled={createMutation.isPending}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 10,
                  background: createMutation.isPending ? "rgba(29,29,31,0.35)" : "#1D1D1F",
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 500,
                  border: "none",
                  cursor: createMutation.isPending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 150ms ease",
                }}
                onMouseEnter={e => { if (!createMutation.isPending) e.currentTarget.style.background = "#2D2D2F"; }}
                onMouseLeave={e => { if (!createMutation.isPending) e.currentTarget.style.background = "#1D1D1F"; }}
              >
                {createMutation.isPending ? (
                  <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: 9999, animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <>
                    <Send size={16} />
                    Activar Alerta de Escasez
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}