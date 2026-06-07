import { Droppable, Draggable } from "@hello-pangea/dnd";
import TriggerCard from "./TriggerCard";

const columnConfig = {
  unassigned: { title: "Unassigned / Alert Active", dot: "bg-red-500", emptyText: "No active alerts" },
  in_progress: { title: "In Progress / Dispatched", dot: "bg-amber-500", emptyText: "No items in progress" },
  resolved: { title: "Resolved / Closed", dot: "bg-emerald-500", emptyText: "No resolved items" },
};

export default function KanbanColumn({ columnId, triggers }) {
  const config = columnConfig[columnId];

  return (
    <div className="flex flex-col min-h-0">
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-1 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
        <h3 className="text-sm font-semibold text-foreground">{config.title}</h3>
        <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted rounded-full w-6 h-6 flex items-center justify-center">
          {triggers.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/20" : "bg-muted/50 border-2 border-transparent"
            }`}
          >
            {triggers.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                {config.emptyText}
              </div>
            )}
            {triggers.map((trigger, index) => (
              <Draggable key={trigger.id} draggableId={trigger.id} index={index}>
                {(provided, snapshot) => (
                  <TriggerCard trigger={trigger} provided={provided} snapshot={snapshot} />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}