import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const emptyForm = {
  shipment_id: "",
  supplier: "",
  origin: "",
  destination: "",
  part_number: "",
  quantity: "",
  stage: "in_transit",
  criticality: "MEDIUM",
  eta: "",
  notes: "",
};

export default function AddShipmentModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(emptyForm);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      dispatched_at: new Date().toISOString(),
    });
    setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg rounded-2xl border border-[#E5E5EA] p-0 overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#F2F2F7]">
          <DialogTitle className="text-[17px] font-semibold text-[#1C1C1E]">
            New Shipment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Shipment ID *">
                <Input
                  required
                  placeholder="e.g. SHP-20241"
                  value={form.shipment_id}
                  onChange={(e) => set("shipment_id", e.target.value)}
                  className="h-10 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
                />
              </Field>
              <Field label="Supplier *">
                <Input
                  required
                  placeholder="Supplier name"
                  value={form.supplier}
                  onChange={(e) => set("supplier", e.target.value)}
                  className="h-10 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
                />
              </Field>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Origin *">
                <Input
                  required
                  placeholder="e.g. Shanghai, CN"
                  value={form.origin}
                  onChange={(e) => set("origin", e.target.value)}
                  className="h-10 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
                />
              </Field>
              <Field label="Destination *">
                <Input
                  required
                  placeholder="e.g. Monterrey Plant"
                  value={form.destination}
                  onChange={(e) => set("destination", e.target.value)}
                  className="h-10 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
                />
              </Field>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Part Number *">
                <Input
                  required
                  placeholder="e.g. NMK-AL-4021"
                  value={form.part_number}
                  onChange={(e) => set("part_number", e.target.value)}
                  className="h-10 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
                />
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  placeholder="Units"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  className="h-10 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
                />
              </Field>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Stage">
                <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                  <SelectTrigger className="h-10 bg-[#F2F2F7] border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="customs">Customs</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Criticality">
                <Select value={form.criticality} onValueChange={(v) => set("criticality", v)}>
                  <SelectTrigger className="h-10 bg-[#F2F2F7] border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ETA">
                <Input
                  type="date"
                  value={form.eta}
                  onChange={(e) => set("eta", e.target.value)}
                  className="h-10 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
                />
              </Field>
            </div>

            <Field label="Notes">
              <Textarea
                placeholder="Optional notes or customs details..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="resize-none h-20 bg-[#F2F2F7] border-transparent focus:bg-white focus:border-[#002F6C] focus:ring-[#002F6C]/20 text-sm"
              />
            </Field>
          </div>

          <div className="px-6 py-4 border-t border-[#F2F2F7] flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4 text-sm text-[#8E8E93] hover:text-[#1C1C1E]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-5 bg-[#002F6C] hover:bg-[#001F4C] text-white text-sm font-semibold rounded-[10px]"
            >
              {loading ? "Creating..." : "Add Shipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#8E8E93]">{label}</Label>
      {children}
    </div>
  );
}