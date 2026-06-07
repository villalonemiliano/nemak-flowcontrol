import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ShipmentKPIBar from "@/components/shipments/ShipmentKPIBar";
import ShipmentColumn from "@/components/shipments/ShipmentColumn";
import AddShipmentModal from "@/components/shipments/AddShipmentModal";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => base44.entities.Shipment.list("-created_date", 200),
    refetchInterval: 15000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shipment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      setShowModal(false);
    },
  });

  const columns = useMemo(() => {
    const grouped = { in_transit: [], customs: [], arrived: [] };
    shipments.forEach((s) => {
      if (grouped[s.stage]) grouped[s.stage].push(s);
    });
    return grouped;
  }, [shipments]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    const shipment = shipments.find((s) => s.id === draggableId);
    if (!shipment || shipment.stage === newStage) return;

    const updateData = { stage: newStage };
    if (newStage === "arrived") {
      updateData.arrived_at = new Date().toISOString();
    } else {
      updateData.arrived_at = null;
    }
    updateMutation.mutate({ id: draggableId, data: updateData });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="w-7 h-7 border-[3px] border-[#E5E5EA] border-t-[#002F6C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between mb-6 gap-4"
      >
        <div>
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight leading-tight">
            Shipment Pipeline
          </h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">
            Drag shipments across stages to update status in real-time.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-[#002F6C] hover:bg-[#001F4C] text-white text-sm font-semibold rounded-[10px] shrink-0 gap-1.5"
          style={{ boxShadow: "0 2px 8px rgba(0,47,108,0.25)" }}
        >
          <Plus className="w-4 h-4" />
          New Shipment
        </Button>
      </motion.div>

      {/* KPI Bar */}
      <ShipmentKPIBar shipments={shipments} />

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E5E5EA] p-4 sm:p-6"
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <ShipmentColumn stageId="in_transit" shipments={columns.in_transit} />
            <ShipmentColumn stageId="customs" shipments={columns.customs} />
            <ShipmentColumn stageId="arrived" shipments={columns.arrived} />
          </div>
        </DragDropContext>
      </motion.div>

      {/* Add Shipment Modal */}
      <AddShipmentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />
    </div>
  );
}