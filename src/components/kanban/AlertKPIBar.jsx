import { motion } from "framer-motion";
import { AlertTriangle, Activity, CheckCircle2, TrendingDown } from "lucide-react";

function KPI({ icon: Icon, label, value, iconColor, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl border border-[#E5E5EA] px-5 py-4 flex items-center gap-4"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div className={`p-2 rounded-[10px] bg-[#F2F2F7]`}>
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-[0.04em] leading-none mb-1.5">
          {label}
        </p>
        <p className="text-[24px] font-bold text-[#1C1C1E] leading-none tracking-tight">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

export default function AlertKPIBar({ triggers }) {
  const pending   = triggers.filter((t) => t.status === "unassigned").length;
  const active    = triggers.filter((t) => t.status === "in_progress").length;
  const highRisk  = triggers.filter((t) => t.criticality === "HIGH" && t.status !== "resolved").length;
  const resolvedToday = triggers.filter((t) => {
    if (t.status !== "resolved" || !t.resolved_at) return false;
    return new Date(t.resolved_at).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <KPI icon={TrendingDown}   label="Pending Alerts"   value={pending}       iconColor="text-[#FF3B30]"  delay={0}    />
      <KPI icon={Activity}       label="In Progress"      value={active}        iconColor="text-[#FF9500]"  delay={0.05} />
      <KPI icon={AlertTriangle}  label="High Risk"        value={highRisk}      iconColor="text-[#FF3B30]"  delay={0.1}  />
      <KPI icon={CheckCircle2}   label="Resolved Today"   value={resolvedToday} iconColor="text-[#30D158]"  delay={0.15} />
    </div>
  );
}