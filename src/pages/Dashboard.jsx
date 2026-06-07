import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { AlertTriangle, Clock, MapPin, Activity } from "lucide-react";
import { motion } from "framer-motion";
import KPICard from "@/components/dashboard/KPICard";
import KanbanColumn from "@/components/dashboard/KanbanColumn";

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: triggers = [], isLoading } = useQuery({
    queryKey: ["triggers"],
    queryFn: () => base44.entities.Trigger.list("-created_date", 200),
    refetchInterval: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Trigger.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["triggers"] }),
  });

  // Group triggers by status
  const columns = useMemo(() => {
    const grouped = { unassigned: [], in_progress: [], resolved: [] };
    triggers.forEach((t) => {
      if (grouped[t.status]) grouped[t.status].push(t);
    });
    return grouped;
  }, [triggers]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const active = triggers.filter((t) => t.status !== "resolved");
    const highCount = active.filter((t) => t.criticality === "HIGH").length;

    // Average resolution time
    const resolved = triggers.filter((t) => t.status === "resolved" && t.resolved_at && t.triggered_at);
    let avgTime = "—";
    if (resolved.length > 0) {
      const totalMs = resolved.reduce((sum, t) => sum + (new Date(t.resolved_at) - new Date(t.triggered_at)), 0);
      const avgMs = totalMs / resolved.length;
      const avgMin = Math.round(avgMs / 60000);
      avgTime = avgMin >= 60 ? `${(avgMin / 60).toFixed(1)}h` : `${avgMin}m`;
    }

    // Top bottleneck
    const lineCounts = {};
    active.forEach((t) => {
      lineCounts[t.production_line] = (lineCounts[t.production_line] || 0) + 1;
    });
    const topLine = Object.entries(lineCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      totalActive: active.length,
      highCount,
      avgTime,
      topLine: topLine ? topLine[0] : "—",
      topLineCount: topLine ? topLine[1] : 0,
    };
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
    }
    if (newStatus !== "resolved") {
      updateData.resolved_at = null;
    }
    updateMutation.mutate({ id: draggableId, data: updateData });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-[#002F6C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#002F6C]/10">
            <Activity className="w-5 h-5 text-[#002F6C]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {"Supply Chain Pipeline & KPI Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time operational control center for material shortage incidents.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Active Starving Incidents"
          value={kpis.totalActive}
          subtitle={`${kpis.highCount} HIGH criticality`}
          icon={AlertTriangle}
          accent="text-red-600"
          delay={0}
        />
        <KPICard
          title="Avg Response Time (MTTR)"
          value={kpis.avgTime}
          subtitle="Mean time to resolution"
          icon={Clock}
          delay={0.05}
        />
        <KPICard
          title="Top Bottleneck Area"
          value={kpis.topLine}
          subtitle={kpis.topLineCount > 0 ? `${kpis.topLineCount} active trigger${kpis.topLineCount > 1 ? "s" : ""}` : "No active triggers"}
          icon={MapPin}
          delay={0.1}
        />
        <KPICard
          title="Total Resolved Today"
          value={triggers.filter((t) => {
            if (t.status !== "resolved" || !t.resolved_at) return false;
            const today = new Date();
            const resolved = new Date(t.resolved_at);
            return resolved.toDateString() === today.toDateString();
          }).length}
          subtitle="Closed incidents today"
          icon={Activity}
          accent="text-emerald-600"
          delay={0.15}
        />
      </div>

      {/* Kanban Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-lg font-bold text-foreground">Incident Pipeline</h2>
          <span className="text-xs text-muted-foreground">(drag cards to update status)</span>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <KanbanColumn columnId="unassigned" triggers={columns.unassigned} />
            <KanbanColumn columnId="in_progress" triggers={columns.in_progress} />
            <KanbanColumn columnId="resolved" triggers={columns.resolved} />
          </div>
        </DragDropContext>
      </motion.div>
    </div>
  );
}