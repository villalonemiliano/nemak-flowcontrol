import { Droppable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import AlertCard from "./AlertCard";

const columnConfig = {
  unassigned: {
    title: "Pending",
    subtitle: "New alerts awaiting assignment",
    accentClass: "bg-[#FF3B30]",
    accentColor: "#FF3B30",
  },
  in_progress: {
    title: "In Progress",
    subtitle: "Actively being resolved",
    accentClass: "bg-[#FF9500]",
    accentColor: "#FF9500",
  },
  resolved: {
    title: "Resolved",
    subtitle: "Confirmed closed incidents",
    accentClass: "bg-[#30D158]",
    accentColor: "#30D158",
  },
};

export default function AlertColumn({ columnId, triggers, index }) {
  const cfg = columnConfig[columnId];

  return (
    <motion.div
      className="flex flex-col min-w-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * (index ?? 0), ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="px-1 mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <div className={`w-2 h-2 rounded-full ${cfg.accentClass}`} />
          <h3 className="text-[14px] font-semibold text-white tracking-[-0.1px]">
            {cfg.title}
          </h3>
          <motion.span
            key={triggers.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold px-1.5"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            {triggers.length}
          </motion.span>
        </div>
        <p className="text-[11px] text-white/30 pl-4">{cfg.subtitle}</p>
      </div>

      {/* Divider accent */}
      <div
        className={`h-px rounded-full ${cfg.accentClass} mb-3 mx-1`}
        style={{ opacity: 0.5 }}
      />

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 rounded-xl min-h-[280px] p-2 space-y-2"
            style={{
              backgroundColor: snapshot.isDraggingOver ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
              outline: snapshot.isDraggingOver ? `2px dashed ${cfg.accentColor}55` : "2px solid transparent",
              transition: "background-color 0.2s ease, outline 0.2s ease",
            }}
          >
            {triggers.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-28">
                <p className="text-[12px] text-white/20">No items</p>
              </div>
            )}

            {triggers.map((trigger, i) => (
              <AlertCard key={trigger.id} trigger={trigger} index={i} />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </motion.div>
  );
}