import { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Package, Clock } from "lucide-react";
import { motion } from "framer-motion";

const criticalityConfig = {
  HIGH:   { badge: "bg-[#FFE2E1] text-[#FF3B30]", label: "High",   indicator: "bg-[#FF3B30]", glow: true },
  MEDIUM: { badge: "bg-[#FFEED6] text-[#FF9500]", label: "Medium", indicator: "bg-[#FF9500]", glow: false },
  LOW:    { badge: "bg-[#E1F0FF] text-[#007AFF]", label: "Low",    indicator: "bg-[#007AFF]", glow: false },
};

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default function AlertCard({ trigger, index }) {
  const [elapsed, setElapsed] = useState(0);
  const cfg = criticalityConfig[trigger.criticality] || criticalityConfig.LOW;
  const isResolved = trigger.status === "resolved";

  useEffect(() => {
    if (isResolved) {
      if (trigger.resolved_at && trigger.triggered_at) {
        setElapsed(new Date(trigger.resolved_at) - new Date(trigger.triggered_at));
      }
      return;
    }
    if (!trigger.triggered_at) return;
    const update = () => setElapsed(Date.now() - new Date(trigger.triggered_at).getTime());
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [trigger.triggered_at, trigger.resolved_at, isResolved]);

  return (
    <Draggable draggableId={trigger.id} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          whileHover={!snapshot.isDragging ? {
            y: -3,
            scale: 1.005,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
            transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
          } : {}}
          whileTap={{ scale: 0.97, transition: { duration: 0.12, ease: [0.25, 1, 0.5, 1] } }}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? "0 20px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)"
              : cfg.glow
              ? undefined
              : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            animation: cfg.glow && !snapshot.isDragging && !isResolved ? "highGlow 3s ease-in-out infinite" : undefined,
            opacity: snapshot.isDragging ? 0.88 : 1,
            rotate: snapshot.isDragging ? "2deg" : "0deg",
          }}
          className="rounded-xl cursor-grab active:cursor-grabbing select-none"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
        >
          {/* Criticality top bar */}
          <div className={`h-[3px] rounded-t-xl ${cfg.indicator}`} />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-white/40 tracking-wider truncate mr-2">
                {trigger.production_line}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            {/* Part number */}
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <span className="text-[14px] font-semibold text-white font-mono truncate">
                {trigger.part_number}
              </span>
            </div>

            {/* Description */}
            {trigger.description && (
              <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2 mb-3">
                {trigger.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/8">
              <div className="text-[11px] text-white/30">
                {new Date(trigger.triggered_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div
                className={`flex items-center gap-1 text-[11px] font-mono tabular-nums ${
                  isResolved
                    ? "text-[#30D158]"
                    : trigger.criticality === "HIGH"
                    ? "text-[#FF3B30]"
                    : "text-white/40"
                }`}
              >
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsed)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Draggable>
  );
}