import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/SearchableSelect";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAssignment,
  updateAssignment,
  listTemplates,
  listClients,
  listStaff,
} from "@/lib/api";
import { toast } from "sonner";

const UNASSIGNED = "__unassigned__";
const DEFAULT_PRIO = "__default__";

const empty = {
  client_id: "",
  template_id: "",
  assigned_staff_id: "",
  priority: "",
  active: true,
};

export default function NewAssignmentDialog({
  open,
  onOpenChange,
  editAssignment,
  presetClientId,
  onSaved,
}) {
  const [form, setForm] = useState(empty);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([listClients(), listTemplates(), listStaff()]).then(([c, t, s]) => {
      setClients(c);
      setTemplates(t);
      setStaff(s);
    });
    setForm(
      editAssignment
        ? { ...empty, ...editAssignment }
        : { ...empty, client_id: presetClientId || "" }
    );
  }, [open, editAssignment, presetClientId]);

  const submit = async () => {
    if (!form.client_id || !form.template_id) {
      toast.error("Client and template are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assigned_staff_id:
          form.assigned_staff_id === UNASSIGNED ? null : form.assigned_staff_id || null,
        priority: form.priority === DEFAULT_PRIO || !form.priority ? null : form.priority,
      };
      if (editAssignment) await updateAssignment(editAssignment.id, payload);
      else await createAssignment(payload);
      toast.success(editAssignment ? "Assignment updated" : "Template attached to client");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-lg" data-testid="assignment-dialog">
        <DialogHeader>
          <DialogTitle>
            {editAssignment ? "Edit Assignment" : "Attach Template to Client"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Client *</Label>
            <SearchableSelect value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} disabled={!!editAssignment || !!presetClientId} placeholder="Select client" searchPlaceholder="Type client name or code..." testId="assignment-client-select" options={clients.map((c) => ({ value: c.id, label: c.code + " - " + c.name, sortKey: c.name }))} />
          </div>
          <div>
            <Label className="text-xs">Task Template *</Label>
            <SearchableSelect value={form.template_id} onChange={(v) => setForm({ ...form, template_id: v })} disabled={!!editAssignment} placeholder="Select task template" searchPlaceholder="Type task name..." testId="assignment-template-select" options={templates.map((t) => ({ value: t.id, label: t.task_name + " - " + t.frequency, sortKey: t.task_name }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Assigned Staff</Label>
              <Select
                value={form.assigned_staff_id || UNASSIGNED}
                onValueChange={(v) => setForm({ ...form, assigned_staff_id: v })}
              >
                <SelectTrigger data-testid="assignment-staff-select">
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
              <Label className="text-xs">Priority Override</Label>
              <Select
                value={form.priority || DEFAULT_PRIO}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger data-testid="assignment-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_PRIO}>Use template default</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Active</Label>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              data-testid="assignment-active-switch"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving}
            data-testid="assignment-save-btn"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
