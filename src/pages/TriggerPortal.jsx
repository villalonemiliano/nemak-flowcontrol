import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, CheckCircle2, Zap } from "lucide-react";
import CriticalitySelector from "@/components/trigger/CriticalitySelector";

const productionLines = [
  "HPDC Line 1",
  "HPDC Line 2",
  "HPDC Line 3",
  "Machining Center 1",
  "Machining Center 2",
  "Machining Center 3",
  "Melting Furnace A",
  "Melting Furnace B",
  "CNC Station Alpha",
  "Assembly Line 1",
];

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
  const [form, setForm] = useState({
    production_line: "",
    part_number: "",
    criticality: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Trigger.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triggers"] });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ production_line: "", part_number: "", criticality: "", description: "" });
      }, 3000);
    },
    onError: () => {
      toast.error("Failed to activate alert. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.production_line || !form.part_number || !form.criticality) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createMutation.mutate({
      ...form,
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
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Production Line / Area <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.production_line} onValueChange={(v) => setForm({ ...form, production_line: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select production line" />
                    </SelectTrigger>
                    <SelectContent>
                      {productionLines.map((line) => (
                        <SelectItem key={line} value={line}>{line}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Missing Part / Component <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.part_number} onValueChange={(v) => setForm({ ...form, part_number: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select part number" />
                    </SelectTrigger>
                    <SelectContent>
                      {partNumbers.map((pn) => (
                        <SelectItem key={pn} value={pn}>{pn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Criticality Level <span className="text-red-500">*</span>
                  </Label>
                  <CriticalitySelector value={form.criticality} onChange={(v) => setForm({ ...form, criticality: v })} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    {"Description / Comments "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Briefly describe the situation..."
                    className="resize-none h-24"
                  />
                </div>
              </div>

              <div className="px-6 sm:px-8 py-5 bg-muted/50 border-t border-border">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full h-12 bg-[#002F6C] hover:bg-[#001F4C] text-white font-semibold text-sm tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
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