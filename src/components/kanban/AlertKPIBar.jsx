import { motion } from "framer-motion";
import { AlertTriangle, Activity, CheckCircle2, TrendingDown } from "lucide-react";

function KPI({ icon: Icon, label, value, iconColor, accentBg, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -3,
        boxShadow: "0 12px 30px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      }}
      className="bg-white rounded-xl border border-[#E5E5EA] px-5 py-4 flex items-center gap-4"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div className={`p-2.5 rounded-[10px] ${accentBg}`}>
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-[0.06em] leading-none mb-1.5">
          {label}
        </p>
        <motion.p
          key={value}
          initial={{ opacity: 0.5, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[26px] font-bold text-[#1C1C1E] leading-none tracking-tight"
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function AlertKPIBar({ triggers }) {
  const pending       = triggers.filter((t) => t.status === "unassigned").length;
  const active        = triggers.filter((t) => t.status === "in_progress").length;
  const highRisk      = triggers.filter((t) => t.criticality === "HIGH" && t.status !== "resolved").length;
  const resolvedToday = triggers.filter((t) => {
    if (t.status !== "resolved" || !t.resolved_at) return false;
    return new Date(t.resolved_at).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <KPI icon={TrendingDown}  label="Pending Alerts"  value={pending}       iconColor="text-[#FF3B30]" accentBg="bg-[#FFE2E1]" delay={0}    />
      <KPI icon={Activity}      label="In Progress"     value={active}        iconColor="text-[#FF9500]" accentBg="bg-[#FFEED6]" delay={0.06} />
      <KPI icon={AlertTriangle} label="High Risk"       value={highRisk}      iconColor="text-[#FF3B30]" accentBg="bg-[#FFE2E1]" delay={0.12} />
      <KPI icon={CheckCircle2}  label="Resolved Today"  value={resolvedToday} iconColor="text-[#30D158]" accentBg="bg-[#E3F9EA]" delay={0.18} />
    </div>
  );
}