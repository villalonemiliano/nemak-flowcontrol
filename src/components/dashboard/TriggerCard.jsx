import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Box, Clock } from "lucide-react";

const criticalityStyles = {
  HIGH: { border: "border-l-red-500", badge: "bg-red-100 text-red-700 border-red-200", label: "HIGH" },
  MEDIUM: { border: "border-l-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200", label: "MEDIUM" },
  LOW: { border: "border-l-blue-500", badge: "bg-blue-100 text-blue-700 border-blue-200", label: "LOW" },
};

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TriggerCard({ trigger, provided, snapshot }) {
  const [elapsed, setElapsed] = useState(0);
  const style = criticalityStyles[trigger.criticality] || criticalityStyles.LOW;
  const isResolved = trigger.status === "resolved";

  useEffect(() => {
    if (isResolved) {
      if (trigger.resolved_at && trigger.triggered_at) {
        setElapsed(new Date(trigger.resolved_at) - new Date(trigger.triggered_at));
      }
      return;
    }
    const update = () => setElapsed(Date.now() - new Date(trigger.triggered_at).getTime());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [trigger.triggered_at, trigger.resolved_at, isResolved]);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-card rounded-lg border border-border border-l-4 ${style.border} p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 rotate-1" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${style.badge}`}>
          {style.label}
        </Badge>
        <div className={`flex items-center gap-1 text-[11px] font-mono font-semibold tabular-nums ${
          isResolved ? "text-emerald-600" : trigger.criticality === "HIGH" ? "text-red-600" : "text-muted-foreground"
        }`}>
          <Clock className="w-3 h-3" />
          {formatElapsed(elapsed)}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">{trigger.production_line}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Box className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono truncate">{trigger.part_number}</span>
        </div>
      </div>

      {trigger.description && (
        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
          {trigger.description}
        </p>
      )}
    </div>
  );
}