import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTemplate, updateTemplate } from "@/lib/api";
import { toast } from "sonner";

const empty = {
  task_name: "",
  category: "General",
  frequency: "monthly",
  day_of_period: 1,
  default_priority: "medium",
  sla_notes: "",
  active: true,
};

const dayLabel = (freq) => {
  if (freq === "weekly") return "Day of Week (0=Mon, 6=Sun)";
  if (freq === "daily") return "N/A for daily";
  return "Day of Month (1-31)";
};

export default function NewTemplateDialog({ open, onOpenChange, editTemplate, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editTemplate ? { ...empty, ...editTemplate } : empty);
  }, [open, editTemplate]);

  const submit = async () => {
    if (!form.task_name) {
      toast.error("Task name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        day_of_period: parseInt(form.day_of_period) || 1,
      };
      if (editTemplate) await updateTemplate(editTemplate.id, payload);
      else await createTemplate(payload);
      toast.success(editTemplate ? "Template updated" : "Template added");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-lg" data-testid="template-dialog">
        <DialogHeader>
          <DialogTitle>{editTemplate ? "Edit Template" : "New Task Template"}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-500 -mt-2">
          Global, client-agnostic. Attach to clients from the Client Assignments menu.
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Task Name *</Label>
            <Input
              value={form.task_name}
              onChange={(e) => setForm({ ...form, task_name: e.target.value })}
              placeholder="e.g. GSTR-1 Filing"
              data-testid="template-task-name-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                data-testid="template-category-input"
              />
            </div>
            <div>
              <Label className="text-xs">Default Priority</Label>
              <Select
                value={form.default_priority}
                onValueChange={(v) => setForm({ ...form, default_priority: v })}
              >
                <SelectTrigger data-testid="template-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
              >
                <SelectTrigger data-testid="template-frequency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (Mon-Fri)</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{dayLabel(form.frequency)}</Label>
              <Input
                type="number"
                min="0"
                max="31"
                value={form.day_of_period}
                onChange={(e) => setForm({ ...form, day_of_period: e.target.value })}
                disabled={form.frequency === "daily"}
                data-testid="template-day-input"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">SLA Notes</Label>
            <Input
              value={form.sla_notes || ""}
              onChange={(e) => setForm({ ...form, sla_notes: e.target.value })}
              placeholder="e.g. Same day EOD"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Active</Label>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              data-testid="template-active-switch"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving}
            data-testid="template-save-btn"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
