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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, listClients, listStaff, todayISO } from "@/lib/api";
import { toast } from "sonner";

const initial = {
  client_id: "",
  assigned_staff_id: "",
  task_name: "",
  category: "General",
  priority: "medium",
  due_date: todayISO(),
  remarks: "",
};

export default function NewTaskDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(initial);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([listClients(), listStaff()]).then(([c, s]) => {
      setClients(c);
      setStaff(s);
    });
    setForm(initial);
  }, [open]);

  const submit = async () => {
    if (!form.client_id || !form.task_name) {
      toast.error("Client and task name are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assigned_staff_id: form.assigned_staff_id || null,
      };
      await createTask(payload);
      toast.success("Task created");
      onCreated?.();
      window.dispatchEvent(new CustomEvent("ledgerflow:refresh"));
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-lg" data-testid="new-task-dialog">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Client *</Label>
            <Select
              value={form.client_id}
              onValueChange={(v) => setForm({ ...form, client_id: v })}
            >
              <SelectTrigger data-testid="task-client-select">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
                {clients.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-500">
                    No clients yet. Add clients first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Task Name *</Label>
            <Input
              value={form.task_name}
              onChange={(e) => setForm({ ...form, task_name: e.target.value })}
              placeholder="e.g. GSTR-1 Filing"
              data-testid="task-name-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                data-testid="task-category-input"
              />
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger data-testid="task-priority-select">
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
              <Label className="text-xs">Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                data-testid="task-due-date-input"
              />
            </div>
            <div>
              <Label className="text-xs">Assigned Staff</Label>
              <Select
                value={form.assigned_staff_id}
                onValueChange={(v) => setForm({ ...form, assigned_staff_id: v })}
              >
                <SelectTrigger data-testid="task-staff-select">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Remarks</Label>
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional notes"
              data-testid="task-remarks-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="task-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            data-testid="task-save-btn"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            {saving ? "Saving..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
