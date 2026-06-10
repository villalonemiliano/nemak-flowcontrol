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

function KPI({ icon: Icon, label, value, sub, iconColor, bgClass, borderClass, delay, highlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -1, transition: { duration: 0.2 } }}
      className={`rounded-2xl px-3.5 py-3 flex items-center gap-3 border ${bgClass} ${borderClass}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white`}
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Icon className="w-[15px] h-[15px]" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.08em] leading-none mb-1 truncate">
          {label}
        </p>
        <motion.p
          key={String(value)}
          initial={{ opacity: 0.4, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[18px] font-black text-slate-900 leading-none tracking-tight tabular-nums"
        >
          {value}
        </motion.p>
        {sub && <p className="text-[9px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AlertKPIBar({ triggers }) {
  const pending    = triggers.filter((t) => t.status === "unassigned").length;
  const active     = triggers.filter((t) => t.status === "in_progress").length;
  const highRisk   = triggers.filter((t) => t.criticality === "HIGH" && t.status !== "resolved").length;

  const resolvedToday = triggers.filter((t) => {
    if (t.status !== "resolved" || !t.resolved_at) return false;
    return new Date(t.resolved_at).toDateString() === new Date().toDateString();
  }).length;

  const resolvedWithTimes = triggers.filter(
    (t) => t.status === "resolved" && t.triggered_at && t.resolved_at
  );
  const avgResolutionMs = resolvedWithTimes.length
    ? resolvedWithTimes.reduce((acc, t) => acc + (new Date(t.resolved_at) - new Date(t.triggered_at)), 0) / resolvedWithTimes.length
    : null;

  const openTriggers = triggers.filter((t) => t.status !== "resolved" && t.triggered_at);
  const longestOpenMs = openTriggers.length
    ? Math.max(...openTriggers.map((t) => Date.now() - new Date(t.triggered_at).getTime()))
    : null;

  const total    = triggers.length;
  const resolved = triggers.filter((t) => t.status === "resolved").length;
  const resRate  = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const last24h = triggers.filter((t) => {
    if (!t.triggered_at) return false;
    return Date.now() - new Date(t.triggered_at).getTime() < 86400000;
  }).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
      <KPI icon={TrendingDown}  label="Pendiente"        value={pending}       iconColor="#EF4444" bgClass={pending > 0 ? "bg-red-50" : "bg-white"} borderClass={pending > 0 ? "border-red-200" : "border-slate-200"} delay={0}    highlight={pending > 0} />
      <KPI icon={Activity}      label="En Progreso"      value={active}        iconColor="#F59E0B" bgClass="bg-white"     borderClass="border-slate-200" delay={0.04} />
      <KPI icon={AlertTriangle} label="Alto Riesgo"      value={highRisk}      iconColor="#EF4444" bgClass={highRisk > 0 ? "bg-red-50" : "bg-white"} borderClass={highRisk > 0 ? "border-red-200" : "border-slate-200"} delay={0.08} />
      <KPI icon={CheckCircle2}  label="Resueltos Hoy"   value={resolvedToday} iconColor="#22C55E" bgClass="bg-white"     borderClass="border-slate-200" delay={0.12} />
      <KPI icon={Clock}         label="Avg Resolución"  value={avgResolutionMs ? formatDuration(avgResolutionMs) : "—"} sub={resolvedWithTimes.length ? `${resolvedWithTimes.length} resueltos` : "Sin datos"} iconColor="#3B82F6" bgClass="bg-white" borderClass="border-slate-200" delay={0.16} />
      <KPI icon={Timer}         label="Más Tiempo Abierto" value={longestOpenMs ? formatDuration(longestOpenMs) : "—"} sub={longestOpenMs ? "alerta más vieja" : "Todo en orden"} iconColor="#F59E0B" bgClass="bg-white" borderClass="border-slate-200" delay={0.20} />
      <KPI icon={BarChart2}     label="Tasa Resolución" value={`${resRate}%`} sub={`${resolved} de ${total}`} iconColor="#22C55E" bgClass="bg-white" borderClass="border-slate-200" delay={0.24} />
      <KPI icon={Zap}           label="Últimas 24h"     value={last24h}       sub="nuevas alertas" iconColor="#6366F1" bgClass="bg-white" borderClass="border-slate-200" delay={0.28} />
    </div>
  );
}