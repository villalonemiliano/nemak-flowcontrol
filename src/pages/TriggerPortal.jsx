import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, CheckCircle2, Package, Activity } from "lucide-react";

const PRODUCTION_LINE = "Sopladora 25 Línea F";
const PART_NUMBER     = "NMK-MISC-CART-001";

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
  const isResolved    = lastTrigger?.status === "resolved";

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Material Shortage</p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Alert Portal</h1>
        <p className="text-sm text-slate-500 mt-1">Notifica al equipo de Supply Chain de una escasez activa.</p>
      </div>

      {/* Status feedback from last trigger */}
      <AnimatePresence>
        {lastTrigger && !submitted && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-6 mb-5 rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{
              background: isResolved ? "#F0FDF4" : isBeingWorked ? "#FFFBEB" : "#FFF1F0",
              border: `1px solid ${isResolved ? "#BBF7D0" : isBeingWorked ? "#FDE68A" : "#FECACA"}`,
            }}>
            <motion.div animate={{ scale: isBeingWorked ? [1, 1.15, 1] : 1 }} transition={{ duration: 1.5, repeat: Infinity }}>
              {isResolved ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
               isBeingWorked ? <Activity className="w-4 h-4 text-amber-500" /> :
               <AlertTriangle className="w-4 h-4 text-red-400" />}
            </motion.div>
            <div>
              <p className={`text-sm font-semibold ${isResolved ? "text-green-800" : isBeingWorked ? "text-amber-800" : "text-red-800"}`}>
                {isResolved ? "Alerta resuelta — gracias" :
                 isBeingWorked ? "Supply Chain ya está atendiendo tu solicitud" :
                 "Alerta activa — en espera de atención"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: isResolved ? "#166534" : isBeingWorked ? "#92400E" : "#991B1B" }}>
                {new Date(lastTrigger.triggered_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main form */}
      <div className="px-6">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl p-10 text-center bg-green-50 border border-green-200">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Alerta Activada</h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                El equipo de Supply Chain ha sido notificado. El temporizador está activo en el pipeline.
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>

              {/* Info fields */}
              <div className="space-y-3 mb-6">
                <div className="rounded-2xl px-5 py-4 bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mb-1">Línea de Producción</p>
                  <p className="text-sm font-bold text-slate-900">{PRODUCTION_LINE}</p>
                </div>

                <div className="rounded-2xl px-5 py-4 bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mb-1.5">Material</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                      <Package className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 font-mono">{PART_NUMBER}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Carrito misceláneo</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl px-5 py-4 bg-red-50 border border-red-200 flex items-center gap-3">
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-red-700">Criticidad: ALTA</p>
                    <p className="text-[10px] text-red-500/70 mt-0.5">Impacto directo en producción</p>
                  </div>
                </div>
              </div>

              {/* Trigger button */}
              <motion.button onClick={handleTrigger} disabled={createMutation.isPending}
                whileTap={{ scale: 0.97 }}
                className="w-full h-14 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-slate-900/20">
                {createMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Activar Alerta de Escasez
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}