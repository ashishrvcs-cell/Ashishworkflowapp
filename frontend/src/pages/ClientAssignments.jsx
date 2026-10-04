import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Network, Search, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import NewAssignmentDialog from "@/components/dialogs/NewAssignmentDialog";
import BulkAttachDialog from "@/components/dialogs/BulkAttachDialog";
import BulkClientsDialog from "@/components/dialogs/BulkClientsDialog";
import EditTaskDialog from "@/components/dialogs/EditTaskDialog";
import { PriorityBadge, StatusPill } from "@/components/StatusPill";
import StaffAvatar from "@/components/StaffAvatar";
import {
  listAssignments,
  listClients,
  listTemplates,
  listStaff,
  deleteAssignment,
  updateAssignment,
  listTasks,
  deleteTask,
} from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ALL = "__all__";
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatCadence(t) {
  if (!t) return "—";
  const f = t.frequency;
  const d = t.day_of_period;
  if (f === "daily") return "Daily";
  if (f === "weekly") return `Weekly · ${DOW[Math.max(0, Math.min(6, d))]}`;
  if (f === "monthly") return `Monthly · day ${d}`;
  if (f === "quarterly") return `Quarterly · day ${d}`;
  return f;
}

export default function ClientAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [clients, setClients] = useState({});
  const [templates, setTemplates] = useState({});
  const [staff, setStaff] = useState({});
  const [clientFilter, setClientFilter] = useState(ALL);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkClientsOpen, setBulkClientsOpen] = useState(false);
  const [oneTime, setOneTime] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  const load = async () => {
    const [a, c, t, s, tk] = await Promise.all([
      listAssignments(),
      listClients(),
      listTemplates(),
      listStaff(),
      listTasks(),
    ]);
    setAssignments(a);
    setOneTime(tk.filter((x) => !x.assignment_id && !x.template_id));
    setClients(Object.fromEntries(c.map((x) => [x.id, x])));
    setTemplates(Object.fromEntries(t.map((x) => [x.id, x])));
    setStaff(Object.fromEntries(s.map((x) => [x.id, x])));
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("ledgerflow:refresh", handler);
    return () => window.removeEventListener("ledgerflow:refresh", handler);
  }, []);

  const clientList = useMemo(() => Object.values(clients), [clients]);
  const templateList = useMemo(() => Object.values(templates), [templates]);

  const filtered = assignments.filter((a) => {
    if (clientFilter !== ALL && a.client_id !== clientFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const c = clients[a.client_id];
      const t = templates[a.template_id];
      if (
        !(c?.name.toLowerCase().includes(q)) &&
        !(c?.code.toLowerCase().includes(q)) &&
        !(t?.task_name.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  const filteredOneTime = oneTime
    .filter((t) => {
      if (clientFilter !== ALL && t.client_id !== clientFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const c = clients[t.client_id];
        if (
          !(c?.name.toLowerCase().includes(q)) &&
          !(c?.code.toLowerCase().includes(q)) &&
          !t.task_name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const removeTask = async (t) => {
    if (!confirm("Delete this one-time task?")) return;
    await deleteTask(t.id);
    toast.success("Task deleted");
    load();
  };

  const remove = async (a) => {
    if (!confirm("Remove this assignment?")) return;
    await deleteAssignment(a.id);
    toast.success("Assignment removed");
    load();
  };

  const canCreate = clientList.length > 0 && templateList.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            Automation Engine · Per Client
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Client Assignments
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Attach standard templates to specific clients and assign responsible staff. Only
            active assignments spawn tasks on <span className="font-medium">Generate Today&apos;s Work</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!canCreate}
          onClick={() => setBulkOpen(true)}
          data-testid="btn-bulk-assignment"
        >
          <ListPlus className="w-3.5 h-3.5 mr-1.5" />
          Bulk Attach
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!canCreate}
          onClick={() => setBulkClientsOpen(true)}
          data-testid="btn-bulk-clients"
        >
          <ListPlus className="w-3.5 h-3.5 mr-1.5" />
          Bulk Add Clients
        </Button>
        <Button
          size="sm"
          disabled={!canCreate}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          data-testid="btn-add-assignment"
          className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Attach Template
        </Button>
        </div>
      </div>

      {!canCreate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-900">
          You need at least one <Link to="/clients" className="underline font-medium">client</Link>{" "}
          and one <Link to="/templates" className="underline font-medium">template</Link> before
          creating an assignment.
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search by client or template…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="assignments-search-input"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="h-9 w-[220px] text-xs" data-testid="assignments-client-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Clients</SelectItem>
            {clientList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Network}
          title={assignments.length === 0 ? "No assignments yet" : "No matches"}
          description={
            assignments.length === 0
              ? "Attach a task template to a client to start generating recurring work."
              : "Adjust your filters."
          }
          testId="empty-assignments"
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th-caps text-left px-4 py-2">Client</th>
                <th className="th-caps text-left px-3 py-2">Template</th>
                <th className="th-caps text-left px-3 py-2">Cadence</th>
                <th className="th-caps text-left px-3 py-2">Staff</th>
                <th className="th-caps text-left px-3 py-2">Priority</th>
                <th className="th-caps text-left px-3 py-2">Active</th>
                <th className="th-caps text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const c = clients[a.client_id];
                const t = templates[a.template_id];
                const s = staff[a.assigned_staff_id];
                const eff = a.priority || t?.default_priority || "medium";
                return (
                  <tr
                    key={a.id}
                    data-testid={`assignment-row-${a.id}`}
                    className="border-t border-slate-100 tr-hover"
                  >
                    <td className="px-4 py-3">
                      <div className="text-slate-900 font-medium">{c?.name || "—"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c?.code}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-slate-800">{t?.task_name || "—"}</div>
                      <div className="text-[11px] text-slate-500">{t?.category}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700 text-xs">{formatCadence(t)}</td>
                    <td className="px-3 py-3">
                      <StaffAvatar staff={s} />
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={eff} />
                      {a.priority && (
                        <div className="text-[10px] text-slate-400 mt-0.5">override</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Switch
                        checked={a.active}
                        onCheckedChange={async (v) => {
                          await updateAssignment(a.id, { ...a, active: v });
                          load();
                        }}
                        data-testid={`assignment-active-toggle-${a.id}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        className="text-slate-500 hover:text-slate-800 mr-2"
                        onClick={() => {
                          setEditing(a);
                          setDialogOpen(true);
                        }}
                        data-testid={`assignment-edit-${a.id}`}
                      >
                        <Pencil className="w-4 h-4 inline" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => remove(a)}
                        data-testid={`assignment-delete-${a.id}`}
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredOneTime.length > 0 && (
        <div className="space-y-2" data-testid="onetime-tasks-section">
          <div>
            <h3 className="text-sm font-bold text-slate-900">One-time Tasks</h3>
            <p className="text-xs text-slate-500">
              Tasks created with New Task for a single client. They show in Today&apos;s Work from
              the day they are created until completed.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th-caps text-left px-4 py-2">Client</th>
                  <th className="th-caps text-left px-3 py-2">Task</th>
                  <th className="th-caps text-left px-3 py-2">Due</th>
                  <th className="th-caps text-left px-3 py-2">Staff</th>
                  <th className="th-caps text-left px-3 py-2">Priority</th>
                  <th className="th-caps text-left px-3 py-2">Status</th>
                  <th className="th-caps text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOneTime.map((t) => {
                  const c = clients[t.client_id];
                  return (
                    <tr
                      key={t.id}
                      data-testid={"onetime-row-" + t.id}
                      className="border-t border-slate-100 tr-hover"
                    >
                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium">{c?.name || "-"}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c?.code}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-slate-800">{t.task_name}</div>
                        <div className="text-[11px] text-slate-500">{t.category}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                        {t.due_date}
                      </td>
                      <td className="px-3 py-3">
                        <StaffAvatar staff={staff[t.assigned_staff_id]} />
                      </td>
                      <td className="px-3 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          className="text-slate-500 hover:text-slate-800 mr-2"
                          onClick={() => setEditingTask(t)}
                          data-testid={"onetime-edit-" + t.id}
                        >
                          <Pencil className="w-4 h-4 inline" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeTask(t)}
                          data-testid={"onetime-delete-" + t.id}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditTaskDialog task={editingTask} onClose={() => setEditingTask(null)} onSaved={load} />
      <BulkAttachDialog open={bulkOpen} onOpenChange={setBulkOpen} onSaved={load} />
      <BulkClientsDialog open={bulkClientsOpen} onOpenChange={setBulkClientsOpen} onSaved={load} />
      <NewAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editAssignment={editing}
        onSaved={load}
      />
    </div>
  );
}
