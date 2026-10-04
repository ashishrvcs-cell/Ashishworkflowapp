import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAssignment,
  listAssignments,
  listTemplates,
  listClients,
  listStaff,
} from "@/lib/api";
import { toast } from "sonner";

const UNASSIGNED = "__unassigned__";
const DEFAULT_PRIO = "__default__";
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const newRow = () => ({
  key: Math.random().toString(36).slice(2),
  client_id: "",
  assigned_staff_id: "",
  priority: "",
});

function cadence(t) {
  if (!t) return "-";
  const d = t.day_of_period;
  if (t.frequency === "daily") return "Daily";
  if (t.frequency === "weekly") return "Weekly - " + DOW[Math.max(0, Math.min(6, d))];
  if (t.frequency === "monthly") return "Monthly - day " + d;
  if (t.frequency === "quarterly") return "Quarterly - day " + d;
  return t.frequency;
}

export default function BulkClientsDialog({ open, onOpenChange, onSaved }) {
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [rows, setRows] = useState([newRow()]);
  const [existing, setExisting] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([listClients(), listTemplates(), listStaff()]).then(([c, t, s]) => {
      setClients(c);
      setTemplates(t);
      setStaff(s);
    });
    setTemplateId("");
    setRows([newRow()]);
    setExisting([]);
  }, [open]);

  useEffect(() => {
    if (!templateId) {
      setExisting([]);
      return;
    }
    listAssignments({ template_id: templateId }).then((a) =>
      setExisting(a.map((x) => x.client_id))
    );
  }, [templateId]);

  const template = templates.find((t) => t.id === templateId);
  const updateRow = (key, patch) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.key !== key)));

  const submit = async () => {
    if (!templateId) {
      toast.error("Select a task template");
      return;
    }
    const filled = rows.filter((r) => r.client_id);
    if (filled.length === 0) {
      toast.error("Add at least one client");
      return;
    }
    setSaving(true);
    const failed = [];
    let ok = 0;
    for (const r of filled) {
      try {
        await createAssignment({
          client_id: r.client_id,
          template_id: templateId,
          assigned_staff_id:
            !r.assigned_staff_id || r.assigned_staff_id === UNASSIGNED
              ? null
              : r.assigned_staff_id,
          priority: !r.priority || r.priority === DEFAULT_PRIO ? null : r.priority,
          active: true,
        });
        ok += 1;
      } catch (e) {
        failed.push(r);
      }
    }
    setSaving(false);
    if (ok) {
      toast.success("Template attached to " + ok + " client(s)");
      onSaved?.();
    }
    if (failed.length) {
      toast.error(failed.length + " could not be saved - kept in the list");
      setRows(failed);
      listAssignments({ template_id: templateId }).then((a) =>
        setExisting(a.map((x) => x.client_id))
      );
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-3xl" data-testid="bulk-clients-dialog">
        <DialogHeader>
          <DialogTitle>Attach One Task Template to Multiple Clients</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Task Template *</Label>
            <SearchableSelect value={templateId} onChange={setTemplateId} placeholder="Select task template" searchPlaceholder="Type task name..." testId="bulkc-template-select" options={templates.map((t) => ({ value: t.id, label: t.task_name + " - " + cadence(t), sortKey: t.task_name }))} />
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_32px] gap-2 bg-slate-50/70 px-3 py-2">
              <span className="th-caps">Client Name</span>
              <span className="th-caps">Assign to</span>
              <span className="th-caps">Frequency</span>
              <span className="th-caps">Priority</span>
              <span />
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
              {rows.map((r, i) => {
                const usedElsewhere = rows
                  .filter((x) => x.key !== r.key)
                  .map((x) => x.client_id);
                return (
                  <div
                    key={r.key}
                    className="grid grid-cols-[1.6fr_1fr_1fr_1fr_32px] gap-2 items-center px-3 py-2"
                    data-testid={"bulkc-row-" + i}
                  >
                    <SearchableSelect value={r.client_id} onChange={(v) => updateRow(r.key, { client_id: v })} placeholder="Select client" searchPlaceholder="Type client name or code..." testId={"bulkc-client-" + i} options={clients.map((c) => ({ value: c.id, label: c.code + " - " + c.name + (existing.includes(c.id) ? " (already attached)" : ""), sortKey: c.name, disabled: existing.includes(c.id) || usedElsewhere.includes(c.id) }))} />
                    <Select
                      value={r.assigned_staff_id || UNASSIGNED}
                      onValueChange={(v) => updateRow(r.key, { assigned_staff_id: v })}
                    >
                      <SelectTrigger className="h-9 text-xs" data-testid={"bulkc-staff-" + i}>
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
                    <div className="text-xs text-slate-600">{cadence(template)}</div>
                    <Select
                      value={r.priority || DEFAULT_PRIO}
                      onValueChange={(v) => updateRow(r.key, { priority: v })}
                    >
                      <SelectTrigger className="h-9 text-xs" data-testid={"bulkc-priority-" + i}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_PRIO}>Template default</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      className="text-red-500 hover:text-red-700 disabled:opacity-30"
                      disabled={rows.length === 1}
                      onClick={() => removeRow(r.key)}
                      data-testid={"bulkc-remove-" + i}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRows((rs) => [...rs, newRow()])}
                data-testid="bulkc-add-row"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Client
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving}
            data-testid="bulkc-save-btn"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            {saving ? "Saving..." : "Attach All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
