import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, CheckCircle2, Package } from "lucide-react";

const PRODUCTION_LINE = "Sopladora 25 Línea F";
const PART_NUMBER     = "NMK-MISC-CART-001";

export default function TriggerPortal() {
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

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

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B3E 50%, #0A1628 100%)" }}
    >
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #FF3B30 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #002F6C 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-3">Material Shortage</p>
          <h1 className="text-[32px] font-black text-white tracking-[-0.5px] leading-none mb-3">Alert Portal</h1>
          <p className="text-[14px] text-white/40 leading-relaxed">
            Notifica al equipo de Supply Chain de una escasez activa de material misceláneo.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl p-10 text-center"
              style={{
                background: "linear-gradient(145deg, rgba(48,209,88,0.1) 0%, rgba(48,209,88,0.04) 100%)",
                border: "1px solid rgba(48,209,88,0.25)",
                backdropFilter: "blur(40px)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 0 60px rgba(48,209,88,0.1)",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(48,209,88,0.15)", border: "1px solid rgba(48,209,88,0.3)" }}
              >
                <CheckCircle2 className="w-8 h-8 text-[#30D158]" />
              </motion.div>
              <h2 className="text-[22px] font-bold text-white mb-2">Alerta Activada</h2>
              <p className="text-[13px] text-white/50 leading-relaxed max-w-xs mx-auto">
                El equipo de Supply Chain ha sido notificado. El temporizador está activo en el pipeline.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(40px)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <div className="p-8">
                {/* Material info */}
                <div className="space-y-4 mb-8">
                  <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] mb-1.5">Línea de Producción</p>
                    <p className="text-[15px] font-bold text-white">{PRODUCTION_LINE}</p>
                  </div>

                  <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] mb-1.5">Material</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,59,48,0.15)", border: "1px solid rgba(255,59,48,0.25)" }}>
                        <Package className="w-4 h-4 text-[#FF3B30]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-white font-mono">{PART_NUMBER}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">Carrito misceláneo</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)" }}>
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />
                    </motion.div>
                    <div>
                      <p className="text-[12px] font-bold text-[#FF3B30]">Criticidad: ALTA</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Impacto directo en producción</p>
                    </div>
                  </div>
                </div>

                {/* Trigger button */}
                <motion.button
                  onClick={handleTrigger}
                  disabled={createMutation.isPending}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-14 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #FF3B30 0%, #D70015 100%)",
                    boxShadow: createMutation.isPending ? "none" : "0 8px 32px rgba(255,59,48,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  {createMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Activar Alerta de Escasez
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}