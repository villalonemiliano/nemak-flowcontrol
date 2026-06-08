import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, CheckCircle2, Zap, Package } from "lucide-react";

const PRODUCTION_LINE = "Sopladora 25 Linea F";

const partNumbers = [
  "NMK-AL-4021",
  "NMK-CY-7834",
  "NMK-BL-1190",
  "NMK-HD-5562",
  "NMK-TR-3347",
  "NMK-CR-8871",
  "NMK-VL-2205",
  "NMK-PS-6614",
  "NMK-GK-9903",
  "NMK-FL-4458",
];

export default function TriggerPortal() {
  const [selectedPart, setSelectedPart] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Trigger.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triggers"] });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedPart("");
      }, 3000);
    },
    onError: () => {
      toast.error("Failed to activate alert. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPart) {
      toast.error("Please select a missing part.");
      return;
    }
    createMutation.mutate({
      production_line: PRODUCTION_LINE,
      part_number: selectedPart,
      criticality: "HIGH",
      status: "unassigned",
      triggered_at: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[#002F6C]/10">
              <AlertTriangle className="w-5 h-5 text-[#002F6C]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Material Shortage Alert Portal
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Log an active material shortage to notify the Supply Chain team immediately.
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-emerald-200 rounded-2xl p-10 text-center shadow-sm"
            >
              <div className="inline-flex p-4 rounded-full bg-emerald-50 mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Alert Activated Successfully</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                The Supply Chain team has been notified. Timer is now active in the pipeline dashboard.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-emerald-600 font-medium">
                <Zap className="w-3.5 h-3.5" />
                Timestamp recorded
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-6 sm:p-8 space-y-6">
                {/* Production Line — fixed, read-only */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Production Line / Area
                  </Label>
                  <div className="h-11 px-4 flex items-center rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] text-[14px] font-medium text-[#3C3C43]">
                    {PRODUCTION_LINE}
                  </div>
                </div>

                {/* Part number — button grid */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Missing Part / Component <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {partNumbers.map((pn) => {
                      const isSelected = selectedPart === pn;
                      return (
                        <motion.button
                          key={pn}
                          type="button"
                          onClick={() => setSelectedPart(pn)}
                          whileTap={{ scale: 0.96 }}
                          transition={{ duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left text-[13px] font-semibold transition-all duration-150 ${
                            isSelected
                              ? "bg-[#002F6C] border-[#002F6C] text-white shadow-md"
                              : "bg-white border-[#E5E5EA] text-[#1C1C1E] hover:border-[#002F6C] hover:bg-[#002F6C]/5"
                          }`}
                        >
                          <Package className={`w-4 h-4 shrink-0 ${isSelected ? "text-white/80" : "text-[#8E8E93]"}`} />
                          <span className="font-mono">{pn}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-5 bg-muted/50 border-t border-border">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !selectedPart}
                  className="w-full h-12 bg-[#002F6C] hover:bg-[#001F4C] text-white font-semibold text-sm tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40"
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {"Activate Alert & Notify Supply Chain"}
                    </div>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}