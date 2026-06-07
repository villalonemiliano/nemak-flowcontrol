import { motion } from "framer-motion";
import { Truck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

function KPI({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white rounded-xl border border-[#E5E5EA] px-5 py-4 flex items-center gap-4"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className={`p-2 rounded-[10px] ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider leading-none mb-1">
          {label}
        </p>
        <p className="text-[22px] font-bold text-[#1C1C1E] leading-none tracking-tight">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

export default function ShipmentKPIBar({ shipments }) {
  const inTransit = shipments.filter((s) => s.stage === "in_transit").length;
  const inCustoms = shipments.filter((s) => s.stage === "customs").length;
  const highPriority = shipments.filter((s) => s.criticality === "HIGH" && s.stage !== "arrived").length;
  const arrivedToday = shipments.filter((s) => {
    if (s.stage !== "arrived" || !s.arrived_at) return false;
    return new Date(s.arrived_at).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <KPI icon={Truck} label="In Transit" value={inTransit} color="bg-[#007AFF]" delay={0} />
      <KPI icon={Clock} label="In Customs" value={inCustoms} color="bg-[#FF9500]" delay={0.05} />
      <KPI icon={AlertTriangle} label="High Priority" value={highPriority} color="bg-[#FF3B30]" delay={0.1} />
      <KPI icon={CheckCircle2} label="Arrived Today" value={arrivedToday} color="bg-[#30D158]" delay={0.15} />
    </div>
  );
}