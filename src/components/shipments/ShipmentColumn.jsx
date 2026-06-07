import { Droppable } from "@hello-pangea/dnd";
import ShipmentCard from "./ShipmentCard";

const stageConfig = {
  in_transit: {
    title: "In Transit",
    icon: "🚢",
    accentColor: "bg-[#007AFF]",
    emptyText: "No shipments in transit",
  },
  customs: {
    title: "Customs",
    icon: "🛃",
    accentColor: "bg-[#FF9500]",
    emptyText: "No shipments in customs",
  },
  arrived: {
    title: "Arrived",
    icon: "✅",
    accentColor: "bg-[#30D158]",
    emptyText: "No arrived shipments",
  },
};

export default function ShipmentColumn({ stageId, shipments }) {
  const cfg = stageConfig[stageId];

  return (
    <div className="flex flex-col min-w-0">
      {/* Column Header */}
      <div className="flex items-center gap-2.5 px-1 mb-3">
        <span className="text-base">{cfg.icon}</span>
        <h3 className="text-[15px] font-semibold text-[#1C1C1E]">{cfg.title}</h3>
        <span className="ml-auto min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-[#F2F2F7] text-[11px] font-bold text-[#3C3C43]">
          {shipments.length}
        </span>
      </div>

      {/* Accent line */}
      <div className={`h-[3px] rounded-full ${cfg.accentColor} mb-3 mx-1 opacity-80`} />

      <Droppable droppableId={stageId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-xl min-h-[260px] p-2 space-y-2.5 transition-colors duration-200 ${
              snapshot.isDraggingOver
                ? "bg-[#007AFF]/5 ring-2 ring-inset ring-[#007AFF]/20"
                : "bg-[#F2F2F7]/60"
            }`}
          >
            {shipments.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center h-24 gap-1.5">
                <span className="text-2xl opacity-30">{cfg.icon}</span>
                <p className="text-xs text-[#8E8E93]">{cfg.emptyText}</p>
              </div>
            )}

            {shipments.map((shipment, index) => (
              <ShipmentCard key={shipment.id} shipment={shipment} index={index} />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}