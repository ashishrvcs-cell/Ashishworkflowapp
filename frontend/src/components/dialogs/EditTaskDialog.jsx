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
import SearchableSelect from "@/components/SearchableSelect";
import { updateTask, listClients, listStaff } from "@/lib/api";
import { toast } from "sonner";

const UNASSIGNED = "__unassigned__";

export default function EditTaskDialog({ task, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    Promise.all([listClients(), listStaff()]).then(([c, s]) => {
      setClients(c);
      setStaff(s);
    });
    setForm({
      client_id: task.client_id,
      task_name: task.task_name,
      category: task.category || "",
      priority: task.priority,
      due_date: task.due_date,
      assigned_staff_id: task.assigned_staff_id || UNASSIGNED,
      remarks: task.remarks || "",
    });
  }, [task]);

  const submit = async () => {
    if (!form.client_id || !form.task_name.trim()) {
      toast.error("Client and task name are required");
      return;
    }
    setSaving(true);
    try {
      await updateTask(task.id, {
        client_id: form.client_id,
        task_name: form.task_name.trim(),
        category: form.category || "General",
        priority: form.priority,
        due_date: form.due_date,
        assigned_staff_id: form.assigned_staff_id === UNASSIGNED ? null : form.assigned_staff_id,
        remarks: form.remarks || null,
      });
      toast.success("Task updated");
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error("Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white sm:max-w-lg" data-testid="edit-task-dialog">
        <DialogHeader>
          <DialogTitle>Edit One-time Task</DialogTitle>
        </DialogHeader>
        {form && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Client *</Label>
              <SearchableSelect
                value={form.client_id}
                onChange={(v) => setForm({ ...form, client_id: v })}
                placeholder="Select client"
                searchPlaceholder="Type client name or code..."
                testId="edit-task-client"
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.code + " - " + c.name,
                  sortKey: c.name,
                }))}
              />
            </div>
            <div>
              <Label className="text-xs">Task Name *</Label>
              <Input
                value={form.task_name}
                onChange={(e) => setForm({ ...form, task_name: e.target.value })}
                data-testid="edit-task-name"
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
                  <SelectTrigger data-testid="edit-task-priority">
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
                  data-testid="edit-task-due"
                />
              </div>
              <div>
                <Label className="text-xs">Assigned Staff</Label>
                <Select
                  value={form.assigned_staff_id}
                  onValueChange={(v) => setForm({ ...form, assigned_staff_id: v })}
                >
                  <SelectTrigger data-testid="edit-task-staff">
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
            </div>
            <div>
              <Label className="text-xs">Remarks</Label>
              <Textarea
                rows={2}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving || !form}
            data-testid="edit-task-save"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
