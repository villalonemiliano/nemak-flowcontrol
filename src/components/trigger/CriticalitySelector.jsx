import { AlertTriangle, Clock, Info } from "lucide-react";
import { motion } from "framer-motion";

const levels = [
  {
    value: "HIGH",
    label: "High Priority",
    sublabel: "Active line stoppage",
    icon: AlertTriangle,
    bgActive: "bg-red-50 border-red-300 ring-2 ring-red-200",
    bgInactive: "bg-white border-border hover:border-red-200 hover:bg-red-50/30",
    iconColor: "text-red-600",
    dotColor: "bg-red-500",
  },
  {
    value: "MEDIUM",
    label: "Medium Priority",
    sublabel: "Risk within 2 hours",
    icon: Clock,
    bgActive: "bg-amber-50 border-amber-300 ring-2 ring-amber-200",
    bgInactive: "bg-white border-border hover:border-amber-200 hover:bg-amber-50/30",
    iconColor: "text-amber-600",
    dotColor: "bg-amber-500",
  },
  {
    value: "LOW",
    label: "Low Priority",
    sublabel: "General replenishment",
    icon: Info,
    bgActive: "bg-blue-50 border-blue-300 ring-2 ring-blue-200",
    bgInactive: "bg-white border-border hover:border-blue-200 hover:bg-blue-50/30",
    iconColor: "text-blue-600",
    dotColor: "bg-blue-500",
  },
];

export default function CriticalitySelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {levels.map((level) => {
        const isSelected = value === level.value;
        const Icon = level.icon;
        return (
          <motion.button
            key={level.value}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(level.value)}
            className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left ${
              isSelected ? level.bgActive : level.bgInactive
            }`}
          >
            <div className={`mt-0.5 p-2 rounded-lg ${isSelected ? "bg-white shadow-sm" : "bg-muted"}`}>
              <Icon className={`w-4 h-4 ${level.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${level.dotColor}`} />
                <span className="text-sm font-semibold text-foreground">{level.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{level.sublabel}</p>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-foreground flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}