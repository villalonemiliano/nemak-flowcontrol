import { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { MapPin, Package, Clock } from "lucide-react";

const criticalityConfig = {
  HIGH:   { badge: "bg-[#FF3B30]/8 text-[#FF3B30]",  label: "High",   indicator: "bg-[#FF3B30]" },
  MEDIUM: { badge: "bg-[#FF9500]/10 text-[#FF9500]", label: "Medium", indicator: "bg-[#FF9500]" },
  LOW:    { badge: "bg-[#007AFF]/8 text-[#007AFF]",  label: "Low",    indicator: "bg-[#007AFF]" },
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
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? "0 16px 40px rgba(0,0,0,0.10)"
              : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
          className={`bg-white rounded-xl border border-[#E5E5EA] cursor-grab active:cursor-grabbing select-none transition-transform duration-150 ${
            snapshot.isDragging ? "scale-[1.02]" : "hover:-translate-y-px"
          }`}
        >
          {/* Criticality top bar */}
          <div className={`h-[3px] rounded-t-xl ${cfg.indicator}`} />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-[#8E8E93] tracking-wider">
                {trigger.production_line}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            {/* Part number */}
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />
              <span className="text-[14px] font-semibold text-[#1C1C1E] font-mono truncate">
                {trigger.part_number}
              </span>
            </div>

            {/* Description */}
            {trigger.description && (
              <p className="text-[12px] text-[#8E8E93] leading-relaxed line-clamp-2 mb-3">
                {trigger.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F2F2F7]">
              <div className="text-[11px] text-[#8E8E93]">
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
                    : "text-[#8E8E93]"
                }`}
              >
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