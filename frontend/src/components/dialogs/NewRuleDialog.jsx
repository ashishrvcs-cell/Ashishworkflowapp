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
import { createRule, updateRule, listClients, listStaff } from "@/lib/api";
import { toast } from "sonner";

const UNASSIGNED = "__unassigned__";

const empty = {
  client_id: "",
  task_name: "",
  category: "General",
  frequency: "monthly",
  day_of_period: 1,
  assigned_staff_id: "",
  priority: "medium",
  sla_notes: "",
  active: true,
};

const dayLabel = (freq) => {
  if (freq === "weekly") return "Day of Week (0=Mon, 6=Sun)";
  if (freq === "daily") return "N/A for daily";
  return "Day of Month (1-31)";
};

export default function NewRuleDialog({ open, onOpenChange, editRule, onSaved }) {
  const [form, setForm] = useState(empty);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([listClients(), listStaff()]).then(([c, s]) => {
      setClients(c);
      setStaff(s);
    });
    setForm(editRule ? { ...empty, ...editRule } : empty);
  }, [open, editRule]);

  const submit = async () => {
    if (!form.client_id || !form.task_name) {
      toast.error("Client and task name required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assigned_staff_id: form.assigned_staff_id === UNASSIGNED ? null : form.assigned_staff_id || null,
        day_of_period: parseInt(form.day_of_period) || 1,
      };
      if (editRule) await updateRule(editRule.id, payload);
      else await createRule(payload);
      toast.success(editRule ? "Rule updated" : "Rule added");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-lg" data-testid="rule-dialog">
        <DialogHeader>
          <DialogTitle>{editRule ? "Edit Rule" : "New Recurring Rule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Client *</Label>
            <Select
              value={form.client_id}
              onValueChange={(v) => setForm({ ...form, client_id: v })}
            >
              <SelectTrigger data-testid="rule-client-select">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Task Name *</Label>
            <Input
              value={form.task_name}
              onChange={(e) => setForm({ ...form, task_name: e.target.value })}
              placeholder="GSTR-1 Filing"
              data-testid="rule-task-name-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger>
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
                <SelectTrigger data-testid="rule-frequency-select">
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
                data-testid="rule-day-input"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Assigned Staff</Label>
            <Select
              value={form.assigned_staff_id || UNASSIGNED}
              onValueChange={(v) => setForm({ ...form, assigned_staff_id: v })}
            >
              <SelectTrigger data-testid="rule-staff-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              data-testid="rule-active-switch"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving}
            data-testid="rule-save-btn"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
