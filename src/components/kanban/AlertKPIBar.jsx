import { motion } from "framer-motion";
import { AlertTriangle, Activity, CheckCircle2, TrendingDown, Clock, Timer, Zap, BarChart2 } from "lucide-react";

function formatDuration(ms) {
  if (!ms || ms <= 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(ms / 1000)}s`;
}

function KPI({ icon: Icon, label, value, sub, iconColor, accentBg, delay, highlight }) {
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
      className={`bg-white rounded-xl border px-4 py-4 flex items-center gap-3 ${highlight ? "border-[#FF3B30]/30" : "border-[#E5E5EA]"}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div className={`p-2.5 rounded-[10px] shrink-0 ${accentBg}`}>
        <Icon className={`w-[17px] h-[17px] ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-[0.06em] leading-none mb-1.5 truncate">
          {label}
        </p>
        <motion.p
          key={String(value)}
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[22px] font-bold text-[#1C1C1E] leading-none tracking-tight"
        >
          {value}
        </motion.p>
        {sub && <p className="text-[10px] text-[#8E8E93] mt-1 truncate">{sub}</p>}
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

  // Avg response time: unassigned → in_progress proxy = triggered_at to resolved_at for resolved items
  const resolvedWithTimes = triggers.filter(
    (t) => t.status === "resolved" && t.triggered_at && t.resolved_at
  );
  const avgResolutionMs = resolvedWithTimes.length
    ? resolvedWithTimes.reduce((acc, t) => acc + (new Date(t.resolved_at) - new Date(t.triggered_at)), 0) / resolvedWithTimes.length
    : null;

  // Longest open (unresolved) alert
  const openTriggers = triggers.filter((t) => t.status !== "resolved" && t.triggered_at);
  const longestOpenMs = openTriggers.length
    ? Math.max(...openTriggers.map((t) => Date.now() - new Date(t.triggered_at).getTime()))
    : null;

  // Resolution rate
  const total = triggers.length;
  const resolved = triggers.filter((t) => t.status === "resolved").length;
  const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Alerts in last 24h
  const last24h = triggers.filter((t) => {
    if (!t.triggered_at) return false;
    return Date.now() - new Date(t.triggered_at).getTime() < 86400000;
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
      <KPI icon={TrendingDown}  label="Pending"         value={pending}                    iconColor="text-[#FF3B30]" accentBg="bg-[#FFE2E1]" delay={0}    highlight={pending > 0} />
      <KPI icon={Activity}      label="In Progress"     value={active}                     iconColor="text-[#FF9500]" accentBg="bg-[#FFEED6]" delay={0.05} />
      <KPI icon={AlertTriangle} label="High Risk"       value={highRisk}                   iconColor="text-[#FF3B30]" accentBg="bg-[#FFE2E1]" delay={0.10} highlight={highRisk > 0} />
      <KPI icon={CheckCircle2}  label="Resolved Today"  value={resolvedToday}              iconColor="text-[#30D158]" accentBg="bg-[#E3F9EA]" delay={0.15} />
      <KPI icon={Clock}         label="Avg Resolution"  value={avgResolutionMs ? formatDuration(avgResolutionMs) : "—"} sub={resolvedWithTimes.length ? `${resolvedWithTimes.length} samples` : "No data yet"} iconColor="text-[#007AFF]" accentBg="bg-[#E1F0FF]" delay={0.20} />
      <KPI icon={Timer}         label="Longest Open"    value={longestOpenMs ? formatDuration(longestOpenMs) : "—"}    sub={longestOpenMs ? "Active alert" : "All clear"}   iconColor="text-[#FF9500]" accentBg="bg-[#FFEED6]" delay={0.25} />
      <KPI icon={BarChart2}     label="Resolution Rate" value={`${resRate}%`}              sub={`${resolved}/${total} total`} iconColor="text-[#30D158]" accentBg="bg-[#E3F9EA]" delay={0.30} />
      <KPI icon={Zap}           label="Last 24h"        value={last24h}                    sub="new alerts"           iconColor="text-[#002F6C]" accentBg="bg-[#E1EAFF]" delay={0.35} />
    </div>
  );
}