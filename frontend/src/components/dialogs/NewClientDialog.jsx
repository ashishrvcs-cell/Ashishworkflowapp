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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient, updateClient, listStaff } from "@/lib/api";
import { toast } from "sonner";

const UNASSIGNED = "__unassigned__";

const empty = {
  code: "",
  name: "",
  category: "General",
  main_staff_id: "",
  backup_staff_id: "",
  notes: "",
  active: true,
};

export default function NewClientDialog({ open, onOpenChange, editClient, onSaved }) {
  const [form, setForm] = useState(empty);
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    listStaff().then(setStaff);
    setForm(editClient ? { ...empty, ...editClient } : empty);
  }, [open, editClient]);

  const submit = async () => {
    if (!form.code || !form.name) {
      toast.error("Client code and name required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        main_staff_id: form.main_staff_id === UNASSIGNED ? null : form.main_staff_id || null,
        backup_staff_id: form.backup_staff_id === UNASSIGNED ? null : form.backup_staff_id || null,
      };
      if (editClient) await updateClient(editClient.id, payload);
      else await createClient(payload);
      toast.success(editClient ? "Client updated" : "Client added");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-lg" data-testid="client-dialog">
        <DialogHeader>
          <DialogTitle>{editClient ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="C001"
                data-testid="client-code-input"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Manufacturing"
                data-testid="client-category-input"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Client Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ABC Pvt Ltd"
              data-testid="client-name-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Main Staff</Label>
              <Select
                value={form.main_staff_id || UNASSIGNED}
                onValueChange={(v) => setForm({ ...form, main_staff_id: v })}
              >
                <SelectTrigger data-testid="client-main-staff-select">
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
              <Label className="text-xs">Backup Staff</Label>
              <Select
                value={form.backup_staff_id || UNASSIGNED}
                onValueChange={(v) => setForm({ ...form, backup_staff_id: v })}
              >
                <SelectTrigger data-testid="client-backup-staff-select">
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
            <Label className="text-xs">Notes</Label>
            <Textarea
              rows={2}
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              data-testid="client-notes-input"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Active</Label>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              data-testid="client-active-switch"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving}
            data-testid="client-save-btn"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
