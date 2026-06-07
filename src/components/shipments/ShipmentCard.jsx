import { useState, useEffect } from "react";
import { Truck, MapPin, Package, Clock, Calendar } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { format, isPast, parseISO } from "date-fns";

const criticalityConfig = {
  HIGH: {
    badge: "bg-[#FF3B30]/10 text-[#FF3B30]",
    dot: "bg-[#FF3B30]",
    label: "High",
  },
  MEDIUM: {
    badge: "bg-[#FF9500]/10 text-[#FF9500]",
    dot: "bg-[#FF9500]",
    label: "Medium",
  },
  LOW: {
    badge: "bg-[#007AFF]/10 text-[#007AFF]",
    dot: "bg-[#007AFF]",
    label: "Low",
  },
};

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default function ShipmentCard({ shipment, index }) {
  const [elapsed, setElapsed] = useState(0);
  const cfg = criticalityConfig[shipment.criticality] || criticalityConfig.LOW;
  const isArrived = shipment.stage === "arrived";

  useEffect(() => {
    if (isArrived) {
      if (shipment.arrived_at && shipment.dispatched_at) {
        setElapsed(new Date(shipment.arrived_at) - new Date(shipment.dispatched_at));
      }
      return;
    }
    if (!shipment.dispatched_at) return;
    const update = () => setElapsed(Date.now() - new Date(shipment.dispatched_at).getTime());
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [shipment.dispatched_at, shipment.arrived_at, isArrived]);

  const etaDate = shipment.eta ? parseISO(shipment.eta) : null;
  const isOverdue = etaDate && isPast(etaDate) && !isArrived;

  return (
    <Draggable draggableId={shipment.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? "0 12px 32px rgba(0,0,0,0.12)"
              : "0 1px 4px rgba(0,0,0,0.06)",
          }}
          className={`bg-white rounded-xl p-4 border border-[#E5E5EA] cursor-grab active:cursor-grabbing transition-transform duration-150 ${
            snapshot.isDragging ? "scale-[1.02] rotate-[0.5deg]" : "hover:-translate-y-0.5"
          }`}
        >
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-semibold text-[#8E8E93] tracking-wide">
              {shipment.shipment_id}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>

          {/* Supplier */}
          <p className="text-[15px] font-semibold text-[#1C1C1E] leading-snug mb-1 truncate">
            {shipment.supplier}
          </p>

          {/* Route */}
          <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{shipment.origin}</span>
            <span className="mx-0.5">→</span>
            <span className="truncate font-medium text-[#3C3C43]">{shipment.destination}</span>
          </div>

          {/* Part */}
          <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] mb-3">
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono">{shipment.part_number}</span>
            {shipment.quantity && (
              <span className="text-[#3C3C43] font-medium ml-auto">× {shipment.quantity.toLocaleString()}</span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F2F2F7]">
            {etaDate ? (
              <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? "text-[#FF3B30]" : "text-[#8E8E93]"}`}>
                <Calendar className="w-3 h-3" />
                {isOverdue ? "Overdue · " : "ETA · "}
                {format(etaDate, "MMM d")}
              </div>
            ) : (
              <div />
            )}

            {shipment.dispatched_at && (
              <div className={`flex items-center gap-1 text-[11px] font-mono tabular-nums ${
                isArrived ? "text-[#30D158]" : shipment.criticality === "HIGH" ? "text-[#FF3B30]" : "text-[#8E8E93]"
              }`}>
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsed)}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}