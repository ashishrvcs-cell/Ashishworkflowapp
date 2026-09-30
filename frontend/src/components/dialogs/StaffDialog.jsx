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
import { listStaff, createStaff, updateStaff, deleteStaff } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";

export default function StaffDialog({ open, onOpenChange }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: "", role: "Associate", initials: "", active: true });
  const [editing, setEditing] = useState(null);

  const load = () => listStaff().then(setStaff);

  useEffect(() => {
    if (open) load();
  }, [open]);

  const save = async () => {
    if (!form.name) return toast.error("Name is required");
    try {
      if (editing) await updateStaff(editing, form);
      else await createStaff(form);
      toast.success(editing ? "Staff updated" : "Staff added");
      setForm({ name: "", role: "Associate", initials: "", active: true });
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to save staff");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this staff member?")) return;
    await deleteStaff(id);
    toast.success("Staff removed");
    load();
  };

  const startEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, role: s.role, initials: s.initials || "", active: s.active });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-xl" data-testid="staff-dialog">
        <DialogHeader>
          <DialogTitle>Manage Staff</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <Label className="text-xs">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="staff-name-input"
            />
          </div>
          <div className="col-span-4">
            <Label className="text-xs">Role</Label>
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              data-testid="staff-role-input"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Initials</Label>
            <Input
              value={form.initials}
              onChange={(e) => setForm({ ...form, initials: e.target.value.toUpperCase() })}
              maxLength={3}
              placeholder="AB"
            />
          </div>
          <div className="col-span-2">
            <Button
              onClick={save}
              className="w-full bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
              data-testid="staff-save-btn"
            >
              {editing ? "Update" : "Add"}
            </Button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden mt-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="th-caps text-left px-3 py-2">Name</th>
                <th className="th-caps text-left px-3 py-2">Role</th>
                <th className="th-caps text-left px-3 py-2">Initials</th>
                <th className="th-caps text-left px-3 py-2">Active</th>
                <th className="th-caps text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 text-xs py-6">
                    No staff yet.
                  </td>
                </tr>
              )}
              {staff.map((s) => (
                <tr key={s.id} className="border-t tr-hover" data-testid={`staff-row-${s.id}`}>
                  <td className="px-3 py-2 text-slate-800">{s.name}</td>
                  <td className="px-3 py-2 text-slate-600">{s.role}</td>
                  <td className="px-3 py-2 text-slate-600">{s.initials}</td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={s.active}
                      onCheckedChange={async (v) => {
                        await updateStaff(s.id, { ...s, active: v });
                        load();
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-slate-500 hover:text-slate-800 mr-2"
                      onClick={() => startEdit(s)}
                      data-testid={`staff-edit-${s.id}`}
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => remove(s.id)}
                      data-testid={`staff-delete-${s.id}`}
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
