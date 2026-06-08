import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle } from "lucide-react";
import AlertKPIBar from "@/components/kanban/AlertKPIBar";
import AlertColumn from "@/components/kanban/AlertColumn";

const columnLabel = { unassigned: "Pending", in_progress: "In Progress", resolved: "Resolved" };

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [lastMoved, setLastMoved] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

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
    const { draggableId, source, destination } = result;
    const newStatus = destination.droppableId;
    const trigger = triggers.find((t) => t.id === draggableId);
    if (!trigger || trigger.status === newStatus) return;

    const updateData = { status: newStatus };
    if (newStatus === "resolved") updateData.resolved_at = new Date().toISOString();
    else updateData.resolved_at = null;

    setLastMoved({ id: draggableId, from: source.droppableId, to: newStatus, part: trigger.part_number });
    setTimeout(() => setLastMoved(null), 2800);

    updateMutation.mutate({ id: draggableId, data: updateData });
  };

  const handleClearAll = async () => {
    setClearing(true);
    await Promise.all(triggers.map((t) => base44.entities.Trigger.delete(t.id)));
    queryClient.invalidateQueries({ queryKey: ["triggers"] });
    setClearing(false);
    setShowClearConfirm(false);
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
        className="flex items-start justify-between mb-5"
      >
        <div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-[-0.4px] leading-tight">
            Inventory Alert Board
          </h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">
            Drag cards to update the pipeline status.
          </p>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-[#FF3B30] bg-[#FFF1F0] border border-[#FF3B30]/15 hover:bg-[#FFE2E1] transition-colors duration-150"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All
        </button>
      </motion.div>

      {/* KPI Bar */}
      <AlertKPIBar triggers={triggers} />

      {/* Move Toast */}
      <AnimatePresence>
        {lastMoved && (
          <motion.div
            key={lastMoved.id + lastMoved.to}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 flex items-center gap-3 bg-white border border-[#E5E5EA] rounded-xl px-4 py-3"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}
          >
            <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse shrink-0" />
            <span className="text-[13px] font-medium text-[#1C1C1E]">
              <span className="font-mono text-[#002F6C]">{lastMoved.part}</span>
              {" · "}
              <span className="text-[#8E8E93]">{columnLabel[lastMoved.from]}</span>
              <span className="text-[#C7C7CC] mx-1.5">→</span>
              <span className="font-semibold">{columnLabel[lastMoved.to]}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E5E5EA] p-5 sm:p-6"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
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

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <AlertColumn columnId="unassigned"  triggers={columns.unassigned}  index={0} />
            <AlertColumn columnId="in_progress" triggers={columns.in_progress} index={1} />
            <AlertColumn columnId="resolved"    triggers={columns.resolved}    index={2} />
          </div>
        </DragDropContext>
      </motion.div>

      {/* Clear All Confirm Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
              onClick={() => !clearing && setShowClearConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
            >
              <div
                className="bg-white rounded-2xl border border-[#E5E5EA] p-6 max-w-sm w-full"
                style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.14)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FFF1F0] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-[#FF3B30]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1C1C1E]">Clear All Alerts?</p>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5">This will permanently delete all {triggers.length} alerts from the pipeline.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    disabled={clearing}
                    className="flex-1 h-10 rounded-xl text-[13px] font-semibold bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA] transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="flex-1 h-10 rounded-xl text-[13px] font-semibold bg-[#FF3B30] text-white hover:bg-[#E0352A] transition-colors duration-150 flex items-center justify-center gap-2"
                  >
                    {clearing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}