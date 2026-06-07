import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import AlertKPIBar from "@/components/kanban/AlertKPIBar";
import AlertColumn from "@/components/kanban/AlertColumn";

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: triggers = [], isLoading } = useQuery({
    queryKey: ["triggers"],
    queryFn: () => base44.entities.Trigger.list("-triggered_at", 200),
    refetchInterval: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Trigger.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["triggers"] }),
  });

  const columns = useMemo(() => {
    const grouped = { unassigned: [], in_progress: [], resolved: [] };
    triggers.forEach((t) => {
      if (grouped[t.status]) grouped[t.status].push(t);
    });
    return grouped;
  }, [triggers]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const trigger = triggers.find((t) => t.id === draggableId);
    if (!trigger || trigger.status === newStatus) return;

    const updateData = { status: newStatus };
    if (newStatus === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    } else {
      updateData.resolved_at = null;
    }
    updateMutation.mutate({ id: draggableId, data: updateData });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="w-6 h-6 border-[2.5px] border-[#E5E5EA] border-t-[#002F6C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10">

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mb-6"
      >
        <h1 className="text-[26px] font-bold text-[#1C1C1E] tracking-[-0.3px] leading-tight">
          Inventory Alert Board
        </h1>
        <p className="text-[13px] text-[#8E8E93] mt-0.5">
          Drag cards between columns to update the status of each shortage alert.
        </p>
      </motion.div>

      {/* KPI Bar */}
      <AlertKPIBar triggers={triggers} />

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E5E5EA] p-5 sm:p-6"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        {/* Board Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1C1C1E]">Alert Pipeline</h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">{triggers.length} total alerts</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
            <span className="text-[11px] text-[#8E8E93] font-medium">Live</span>
          </div>
        </div>

        {/* Columns */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <AlertColumn columnId="unassigned" triggers={columns.unassigned} />
            <AlertColumn columnId="in_progress" triggers={columns.in_progress} />
            <AlertColumn columnId="resolved" triggers={columns.resolved} />
          </div>
        </DragDropContext>
      </motion.div>
    </div>
  );
}