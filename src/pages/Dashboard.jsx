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
    <div className="min-h-screen relative overflow-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10" style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B3E 50%, #0A1628 100%)" }}>

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #FF3B30 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #002F6C 0%, transparent 70%)" }} />
      </div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative z-10 flex items-start justify-between mb-5"
      >
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-2">Alertas de Inventario</p>
          <h1 className="text-[28px] font-black text-white tracking-[-0.4px] leading-tight">
            Inventory Alert Board
          </h1>
          <p className="text-[13px] text-white/40 mt-1">
            Arrastra las tarjetas para actualizar el estado.
          </p>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors duration-150"
          style={{ background: "rgba(255,59,48,0.15)", border: "1px solid rgba(255,59,48,0.25)", color: "#FF3B30" }}
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
            className="relative z-10 mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}
          >
            <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse shrink-0" />
            <span className="text-[13px] font-medium text-white">
              <span className="font-mono text-[#007AFF]">{lastMoved.part}</span>
              {" · "}
              <span className="text-white/40">{columnLabel[lastMoved.from]}</span>
              <span className="text-white/20 mx-1.5">→</span>
              <span className="font-semibold text-white">{columnLabel[lastMoved.to]}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative z-10 rounded-3xl p-5 sm:p-6"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(40px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-white">Alert Pipeline</h2>
            <p className="text-[12px] text-white/40 mt-0.5">{triggers.length} total alerts</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
            <span className="text-[11px] text-white/40 font-medium">Live</span>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => !clearing && setShowClearConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="w-full max-w-sm rounded-3xl p-7" style={{ background: "linear-gradient(145deg, rgba(20,30,50,0.97) 0%, rgba(10,15,30,0.99) 100%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", backdropFilter: "blur(40px)" }}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,59,48,0.15)", border: "1px solid rgba(255,59,48,0.3)" }}>
                    <AlertTriangle className="w-6 h-6 text-[#FF3B30]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-white">Clear All Alerts?</p>
                    <p className="text-[12px] text-white/40 mt-0.5">Se eliminarán {triggers.length} alertas permanentemente.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowClearConfirm(false)} disabled={clearing} className="flex-1 h-11 rounded-2xl text-[13px] font-semibold text-white/50" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
                  <button onClick={handleClearAll} disabled={clearing} className="flex-1 h-11 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2" style={{ background: "rgba(255,59,48,0.2)", border: "1px solid rgba(255,59,48,0.35)", color: "#FF3B30" }}>
                    {clearing ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Clear All
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