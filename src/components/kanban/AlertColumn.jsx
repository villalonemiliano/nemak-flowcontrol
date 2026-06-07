import { Droppable } from "@hello-pangea/dnd";
import AlertCard from "./AlertCard";

const columnConfig = {
  unassigned: {
    title: "Pending",
    subtitle: "New alerts awaiting assignment",
    accent: "bg-[#FF3B30]",
    dropHighlight: "ring-[#FF3B30]/20 bg-[#FF3B30]/3",
  },
  in_progress: {
    title: "In Progress",
    subtitle: "Actively being resolved",
    accent: "bg-[#FF9500]",
    dropHighlight: "ring-[#FF9500]/20 bg-[#FF9500]/3",
  },
  resolved: {
    title: "Resolved",
    subtitle: "Confirmed closed incidents",
    accent: "bg-[#30D158]",
    dropHighlight: "ring-[#30D158]/20 bg-[#30D158]/3",
  },
};

export default function AlertColumn({ columnId, triggers }) {
  const cfg = columnConfig[columnId];

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className="px-1 mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <div className={`w-2 h-2 rounded-full ${cfg.accent}`} />
          <h3 className="text-[14px] font-semibold text-[#1C1C1E] tracking-[-0.1px]">
            {cfg.title}
          </h3>
          <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[11px] font-bold text-[#3C3C43] px-1.5">
            {triggers.length}
          </span>
        </div>
        <p className="text-[11px] text-[#8E8E93] pl-4">{cfg.subtitle}</p>
      </div>

      {/* Divider accent */}
      <div className={`h-px rounded-full ${cfg.accent} mb-3 mx-1 opacity-60`} />

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-xl min-h-[280px] p-2 space-y-2 transition-all duration-200 ${
              snapshot.isDraggingOver
                ? `ring-2 ring-inset ${cfg.dropHighlight}`
                : "bg-[#F2F2F7]/50"
            }`}
          >
            {triggers.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-28">
                <p className="text-[12px] text-[#C7C7CC]">No items</p>
              </div>
            )}

            {triggers.map((trigger, index) => (
              <AlertCard key={trigger.id} trigger={trigger} index={index} />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}